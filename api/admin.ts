import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { method } = req;
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // Basic admin authentication check
    // In production, implement proper admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.includes('admin')) {
      // For now, allow all requests in development
      // return res.status(401).json({ error: 'Admin access required' });
    }

    if (method === 'GET' && pathSegments[2] === 'export') {
      const dataType = pathSegments[3];
      
      switch (dataType) {
        case 'users':
          // Get all users (in a real app, you'd paginate this)
          const users = await storage.getAllUsers?.() || [];
          return res.json({ type: 'users', data: users, count: users.length });
          
        case 'resumes':
          const resumes = await storage.getAllResumes?.() || [];
          return res.json({ type: 'resumes', data: resumes, count: resumes.length });
          
        case 'cover-letters':
          const coverLetters = await storage.getAllCoverLetters?.() || [];
          return res.json({ type: 'cover-letters', data: coverLetters, count: coverLetters.length });
          
        case 'job-analyses':
          const jobAnalyses = await storage.getAllJobAnalyses?.() || [];
          return res.json({ type: 'job-analyses', data: jobAnalyses, count: jobAnalyses.length });
          
        default:
          return res.status(400).json({ error: 'Invalid data type for export' });
      }
    }

    if (method === 'DELETE' && pathSegments[2] === 'clear') {
      const dataType = pathSegments[3];
      
      switch (dataType) {
        case 'cover-letters':
          await storage.clearAllCoverLetters?.();
          return res.json({ message: 'All cover letters cleared successfully' });
          
        case 'job-analyses':
          await storage.clearAllJobAnalyses?.();
          return res.json({ message: 'All job analyses cleared successfully' });
          
        case 'resumes':
          await storage.clearAllResumes?.();
          return res.json({ message: 'All resumes cleared successfully' });
          
        default:
          return res.status(400).json({ error: 'Invalid data type for clearing' });
      }
    }

    if (method === 'POST' && pathSegments[2] === 'sql') {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'SQL query is required' });
      }

      // For security, only allow SELECT statements in production
      const isSelectQuery = query.trim().toLowerCase().startsWith('select');
      if (!isSelectQuery) {
        return res.status(400).json({ error: 'Only SELECT queries are allowed' });
      }

      try {
        // In a real implementation, you'd execute this against your database
        // For now, return mock data since we're using in-memory storage
        const mockResult = {
          query: query,
          result: 'SQL execution not implemented with in-memory storage',
          message: 'Connect a real database to enable SQL console functionality'
        };
        
        return res.json(mockResult);
      } catch (error: any) {
        return res.status(500).json({ error: `SQL execution failed: ${error.message}` });
      }
    }

    return res.status(404).json({ error: 'Admin endpoint not found' });

  } catch (error: any) {
    console.error('Admin API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}