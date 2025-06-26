import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';
import { insertCoverLetterSchema } from '../shared/schema';
import { generateCoverLetter } from '../server/services/anthropic';

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
    if (req.method === 'POST' && req.url?.includes('/generate')) {
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
    } else if (req.method === 'GET') {
      const { userId } = req.query;
      if (userId) {
        const coverLetters = await storage.getUserCoverLetters(parseInt(userId as string));
        res.json(coverLetters);
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