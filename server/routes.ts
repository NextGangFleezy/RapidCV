import { Express, Request, Response, NextFunction } from "express";
import { createServer, Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertUserSchema, insertResumeSchema, insertCoverLetterSchema, insertJobAnalysisSchema } from "../shared/schema";
import { parseResumeWithAI, optimizeResumeForJob } from "./services/ai-parser";
import { generateCoverLetter, analyzeJobMatch } from "./services/anthropic";

// Configure multer for file uploads (50MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  }
});

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
      
      // Check if user can create a new resume (usage limits)
      const canCreate = await storage.canCreateResume(resumeData.userId);
      if (!canCreate) {
        const user = await storage.getUser(resumeData.userId);
        const remainingBuilds = user ? user.maxResumeBuilds - user.resumeBuildsUsed : 0;
        
        return res.status(403).json({ 
          message: "Resume build limit reached. Upgrade to Pro for unlimited resumes.",
          remainingBuilds,
          subscriptionTier: user?.subscriptionTier || "free"
        });
      }
      
      const resume = await storage.createResume(resumeData);
      
      // Increment usage counter for free users
      const user = await storage.getUser(resumeData.userId);
      if (user?.subscriptionTier === "free") {
        await storage.incrementResumeUsage(resumeData.userId);
      }
      
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

  // Resume parsing route with file upload support (no auth required for parsing)
  app.post("/api/resumes/parse", upload.single('file'), async (req: Request, res: Response) => {
    try {
      let resumeText = '';
      
      if (req.file) {
        // Handle file upload
        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname.toLowerCase();
        
        console.log(`Processing file: ${fileName}, size: ${fileBuffer.length} bytes`);
        
        if (fileName.endsWith('.pdf')) {
          // For now, we'll return a helpful message about PDF support
          // PDF parsing requires additional setup that's complex in this environment
          return res.status(400).json({ 
            message: "PDF upload is temporarily unavailable. Please copy and paste your resume text directly, or use the manual entry form below.",
            suggestion: "You can copy text from your PDF and paste it into the text area for AI parsing."
          });
        } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
          // For Word documents, we'll extract text using a simple approach
          // In production, you'd want to use a more robust library like mammoth
          resumeText = fileBuffer.toString('utf8').replace(/[^\x20-\x7E\n\r]/g, ' ');
          console.log(`Word document processed, extracted ${resumeText.length} characters`);
        } else {
          return res.status(400).json({ message: "Unsupported file type. Please upload PDF or Word documents." });
        }
      } else if (req.body.resumeText) {
        // Handle direct text input
        resumeText = req.body.resumeText;
      } else {
        return res.status(400).json({ message: "Either file upload or resume text is required" });
      }
      
      if (!resumeText || resumeText.trim().length < 20) {
        return res.status(400).json({ 
          message: "Resume content appears to be empty or too short. Please ensure your file contains readable text.",
          extractedLength: resumeText.length
        });
      }

      console.log('Parsing resume with AI...');
      const parsedData = await parseResumeWithAI(resumeText);
      console.log('Resume parsing completed successfully');
      
      res.json(parsedData);
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
      const { jobTitle, companyName, jobDescription, resumeId, userId } = req.body;
      
      if (!jobTitle || !companyName || !jobDescription || !userId) {
        return res.status(400).json({ message: "Job title, company name, job description, and user ID are required" });
      }

      // Check if user has Pro subscription for AI features (test account bypasses this)
      const user = await storage.getUser(userId);
      if (!user || (user.subscriptionTier !== "pro" && user.email !== "test@rapidcv.com")) {
        return res.status(403).json({ 
          message: "AI cover letter generation requires Pro subscription",
          feature: "cover-letter-generation",
          subscriptionTier: user?.subscriptionTier || "free"
        });
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
        resumeData
      });

      const coverLetterData = insertCoverLetterSchema.parse({
        userId,
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
      const { jobDescription, resumeData, userId } = req.body;
      
      if (!jobDescription || !resumeData || !userId) {
        return res.status(400).json({ message: "Job description, resume data, and user ID are required" });
      }

      // Check if user has Pro subscription for AI features (test account bypasses this)
      const user = await storage.getUser(userId);
      if (!user || (user.subscriptionTier !== "pro" && user.email !== "test@rapidcv.com")) {
        return res.status(403).json({ 
          message: "AI job analysis requires Pro subscription",
          feature: "job-analysis",
          subscriptionTier: user?.subscriptionTier || "free"
        });
      }

      const analysis = await analyzeJobMatch({
        jobDescription,
        resumeData
      });

      const jobAnalysisData = insertJobAnalysisSchema.parse({
        userId,
        jobDescription,
        matchScore: analysis.matchScore,
        recommendations: analysis.improvements
      });

      const jobAnalysis = await storage.createJobAnalysis(jobAnalysisData);
      res.status(201).json({
        ...jobAnalysis,
        matchScore: analysis.matchScore,
        missingSkills: analysis.missingSkills,
        strengths: analysis.strengths,
        improvements: analysis.improvements
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

  // User subscription status endpoint
  app.get("/api/users/:id/subscription", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const canCreateResume = await storage.canCreateResume(userId);
      const remainingBuilds = user.maxResumeBuilds - user.resumeBuildsUsed;
      
      res.json({
        subscriptionTier: user.subscriptionTier,
        resumeBuildsUsed: user.resumeBuildsUsed,
        maxResumeBuilds: user.maxResumeBuilds,
        remainingBuilds,
        canCreateResume,
        hasAIAccess: user.subscriptionTier === "pro"
      });
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