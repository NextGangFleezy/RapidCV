import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";

// Type declaration for pdf-parse
declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }
  function pdfParse(buffer: Buffer): Promise<PDFData>;
  export = pdfParse;
}
import { 
  insertUserSchema, 
  insertResumeSchema, 
  insertCoverLetterSchema, 
  insertJobAnalysisSchema 
} from "@shared/schema";
import { generateCoverLetter, analyzeJobMatch, generateResumeSuggestions } from "./services/anthropic";
import { parseResumeWithAI, optimizeResumeForJob } from "./services/ai-parser";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Users
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/firebase/:uid", async (req, res) => {
    try {
      const firebaseUid = req.params.uid;
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Resumes
  app.get("/api/resumes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const resume = await storage.getResume(id);
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      res.json(resume);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/:userId/resumes", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const resumes = await storage.getUserResumes(userId);
      res.json(resumes);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/resumes", async (req, res) => {
    try {
      const resumeData = insertResumeSchema.parse(req.body);
      const resume = await storage.createResume(resumeData);
      res.status(201).json(resume);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/resumes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertResumeSchema.partial().parse(req.body);
      const resume = await storage.updateResume(id, updateData);
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      res.json(resume);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/resumes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteResume(id);
      if (!success) {
        return res.status(404).json({ message: "Resume not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Cover Letters
  app.get("/api/users/:userId/cover-letters", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const coverLetters = await storage.getUserCoverLetters(userId);
      res.json(coverLetters);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/cover-letters/generate", async (req, res) => {
    try {
      const { jobTitle, companyName, jobDescription, resumeId } = req.body;
      
      if (!jobTitle || !companyName || !jobDescription || !resumeId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const resume = await storage.getResume(resumeId);
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      const content = await generateCoverLetter({
        jobTitle,
        companyName,
        jobDescription,
        resumeData: resume,
      });

      const coverLetterData = insertCoverLetterSchema.parse({
        userId: resume.userId,
        resumeId,
        jobTitle,
        companyName,
        jobDescription,
        content,
      });

      const coverLetter = await storage.createCoverLetter(coverLetterData);
      res.status(201).json(coverLetter);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/cover-letters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCoverLetter(id);
      if (!success) {
        return res.status(404).json({ message: "Cover letter not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Job Analysis
  app.get("/api/users/:userId/job-analyses", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const analyses = await storage.getUserJobAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/job-analyses", async (req, res) => {
    try {
      const { jobDescription, resumeId } = req.body;
      
      if (!jobDescription || !resumeId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const resume = await storage.getResume(resumeId);
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      const analysis = await analyzeJobMatch({
        jobDescription,
        resumeData: resume,
      });

      const jobAnalysisData = insertJobAnalysisSchema.parse({
        userId: resume.userId,
        resumeId,
        jobDescription,
        matchScore: analysis.matchScore,
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        missingSkills: analysis.missingSkills,
      });

      const jobAnalysis = await storage.createJobAnalysis(jobAnalysisData);
      res.status(201).json(jobAnalysis);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/job-analyses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteJobAnalysis(id);
      if (!success) {
        return res.status(404).json({ message: "Job analysis not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // AI Suggestions
  app.post("/api/resumes/:id/suggestions", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { targetRole } = req.body;
      
      const resume = await storage.getResume(id);
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      const suggestions = await generateResumeSuggestions({
        resumeData: resume,
        targetRole,
      });

      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // AI-powered resume parsing
  app.post("/api/ai/parse-resume", async (req, res) => {
    try {
      const { resumeText } = req.body;
      if (!resumeText || typeof resumeText !== 'string') {
        return res.status(400).json({ message: "Resume text is required" });
      }
      
      const parsedData = await parseResumeWithAI(resumeText);
      res.json(parsedData);
    } catch (error: unknown) {
      console.error("AI parsing error:", error);
      res.status(500).json({ 
        message: "Failed to parse resume with AI",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // AI-powered job optimization
  app.post("/api/ai/optimize-resume", async (req, res) => {
    try {
      const { resumeData, jobDescription } = req.body;
      if (!resumeData || !jobDescription) {
        return res.status(400).json({ message: "Resume data and job description are required" });
      }
      
      const optimization = await optimizeResumeForJob({ resumeData, jobDescription });
      res.json(optimization);
    } catch (error: unknown) {
      console.error("Resume optimization error:", error);
      res.status(500).json({ 
        message: "Failed to optimize resume",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // PDF text extraction endpoint
  app.post("/api/pdf/extract-text", upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No PDF file uploaded" });
      }

      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ message: "File must be a PDF" });
      }

      console.log("📄 EXTRACTING TEXT FROM PDF:", req.file.originalname, "Size:", req.file.size);
      
      // Extract text from PDF buffer
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(req.file.buffer);
      const extractedText = pdfData.text;
      
      console.log("✅ PDF TEXT EXTRACTED - Length:", extractedText.length);
      
      if (!extractedText || extractedText.trim().length < 50) {
        return res.status(400).json({ 
          message: "Could not extract readable text from PDF. The file may be image-based or corrupted.",
          text: "" 
        });
      }

      res.json({ 
        text: extractedText,
        pages: pdfData.numpages,
        info: pdfData.info
      });
    } catch (error: unknown) {
      console.error("❌ PDF EXTRACTION ERROR:", error);
      res.status(500).json({ 
        message: "Failed to extract text from PDF",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
