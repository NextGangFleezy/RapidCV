import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';
import { insertJobAnalysisSchema } from '../shared/schema';

export const config = {
  runtime: 'nodejs20.x',
};
import { analyzeJobMatch } from '../server/services/anthropic';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
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
    } else if (req.method === 'GET') {
      const { userId } = req.query;
      if (userId) {
        const analyses = await storage.getUserJobAnalyses(parseInt(userId as string));
        res.json(analyses);
      } else {
        res.status(400).json({ message: 'User ID required' });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}