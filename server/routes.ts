import { Express, Request, Response, NextFunction } from "express";
import { createServer, Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertResumeSchema, insertCoverLetterSchema, insertJobAnalysisSchema } from "../shared/schema";
import { parseResumeWithAI, optimizeResumeForJob } from "./services/ai-parser";
import { generateCoverLetter, analyzeJobMatch } from "./services/anthropic";

export async function registerRoutes(app: Express): Promise<Server> {
  // Users routes
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/users/firebase/:uid", async (req: Request, res: Response) => {
    try {
      const firebaseUid = req.params.uid;
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Resumes routes
  app.get("/api/resumes", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      if (userId) {
        const resumes = await storage.getUserResumes(userId);
        res.json(resumes);
      } else {
        res.status(400).json({ message: "userId is required" });
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/resumes/:id", async (req: Request, res: Response) => {
    try {
      const resumeId = parseInt(req.params.id);
      const resume = await storage.getResume(resumeId);
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      res.json(resume);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/resumes", async (req: Request, res: Response) => {
    try {
      const resumeData = insertResumeSchema.parse(req.body);
      const resume = await storage.createResume(resumeData);
      res.status(201).json(resume);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/resumes/:id", async (req: Request, res: Response) => {
    try {
      const resumeId = parseInt(req.params.id);
      const updateData = req.body;
      const resume = await storage.updateResume(resumeId, updateData);
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      res.json(resume);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete("/api/resumes/:id", async (req: Request, res: Response) => {
    try {
      const resumeId = parseInt(req.params.id);
      const deleted = await storage.deleteResume(resumeId);
      if (!deleted) {
        return res.status(404).json({ message: "Resume not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Resume parsing route
  app.post("/api/resumes/parse", async (req: Request, res: Response) => {
    try {
      const { resumeText } = req.body;
      
      if (!resumeText || typeof resumeText !== 'string') {
        return res.status(400).json({ message: "Resume text is required" });
      }

      const parsedData = await parseResumeWithAI(resumeText);
      res.json({ data: parsedData });
    } catch (error) {
      console.error('Resume parsing error:', error);
      res.status(500).json({ 
        message: "Failed to parse resume",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Cover Letters routes
  app.get("/api/cover-letters", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      if (userId) {
        const coverLetters = await storage.getUserCoverLetters(userId);
        res.json(coverLetters);
      } else {
        res.status(400).json({ message: "userId is required" });
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/cover-letters", async (req: Request, res: Response) => {
    try {
      const { jobTitle, companyName, jobDescription, tone, resumeId } = req.body;
      
      if (!jobTitle || !companyName || !jobDescription) {
        return res.status(400).json({ message: "Job title, company name, and job description are required" });
      }

      // Get resume data if resumeId provided
      let resumeData = null;
      if (resumeId) {
        resumeData = await storage.getResume(resumeId);
      }

      const coverLetterContent = await generateCoverLetter({
        jobTitle,
        companyName, 
        jobDescription,
        tone: tone || 'professional',
        resumeData
      });

      const coverLetterData = insertCoverLetterSchema.parse({
        userId: 1, // Default user for demo
        jobTitle,
        companyName,
        content: coverLetterContent,
        resumeId: resumeId || null
      });

      const coverLetter = await storage.createCoverLetter(coverLetterData);
      res.status(201).json({ ...coverLetter, content: coverLetterContent });
    } catch (error) {
      console.error('Cover letter generation error:', error);
      res.status(500).json({ 
        message: "Failed to generate cover letter",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.delete("/api/cover-letters/:id", async (req: Request, res: Response) => {
    try {
      const coverLetterId = parseInt(req.params.id);
      const deleted = await storage.deleteCoverLetter(coverLetterId);
      if (!deleted) {
        return res.status(404).json({ message: "Cover letter not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Job Analyses routes
  app.get("/api/job-analyses", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      if (userId) {
        const jobAnalyses = await storage.getUserJobAnalyses(userId);
        res.json(jobAnalyses);
      } else {
        res.status(400).json({ message: "userId is required" });
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/job-analyses", async (req: Request, res: Response) => {
    try {
      const { jobDescription, resumeData } = req.body;
      
      if (!jobDescription || !resumeData) {
        return res.status(400).json({ message: "Job description and resume data are required" });
      }

      const analysis = await analyzeJobMatch({
        jobDescription,
        resumeData
      });

      const jobAnalysisData = insertJobAnalysisSchema.parse({
        userId: 1, // Default user for demo
        jobDescription,
        matchScore: analysis.matchScore,
        recommendations: analysis.improvements,
        optimizedSummary: analysis.optimizedSummary
      });

      const jobAnalysis = await storage.createJobAnalysis(jobAnalysisData);
      res.status(201).json({
        ...jobAnalysis,
        matchScore: analysis.matchScore,
        keySkills: analysis.keySkills,
        missingSkills: analysis.missingSkills,
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        keywords: analysis.keywords,
        optimizedSummary: analysis.optimizedSummary
      });
    } catch (error) {
      console.error('Job analysis error:', error);
      res.status(500).json({ 
        message: "Failed to analyze job match",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.delete("/api/job-analyses/:id", async (req: Request, res: Response) => {
    try {
      const jobAnalysisId = parseInt(req.params.id);
      const deleted = await storage.deleteJobAnalysis(jobAnalysisId);
      if (!deleted) {
        return res.status(404).json({ message: "Job analysis not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Admin routes for debugging
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      if (storage.getAllUsers) {
        const users = await storage.getAllUsers();
        res.json(users);
      } else {
        res.status(501).json({ message: "Admin functionality not available" });
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}