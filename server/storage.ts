import { 
  users, 
  resumes, 
  coverLetters, 
  jobAnalyses,
  type User, 
  type InsertUser,
  type Resume,
  type InsertResume,
  type CoverLetter,
  type InsertCoverLetter,
  type JobAnalysis,
  type InsertJobAnalysis
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Resumes
  getResume(id: number): Promise<Resume | undefined>;
  getUserResumes(userId: number): Promise<Resume[]>;
  createResume(resume: InsertResume): Promise<Resume>;
  updateResume(id: number, resume: Partial<InsertResume>): Promise<Resume | undefined>;
  deleteResume(id: number): Promise<boolean>;

  // Cover Letters
  getCoverLetter(id: number): Promise<CoverLetter | undefined>;
  getUserCoverLetters(userId: number): Promise<CoverLetter[]>;
  createCoverLetter(coverLetter: InsertCoverLetter): Promise<CoverLetter>;
  deleteCoverLetter(id: number): Promise<boolean>;

  // Job Analyses
  getJobAnalysis(id: number): Promise<JobAnalysis | undefined>;
  getUserJobAnalyses(userId: number): Promise<JobAnalysis[]>;
  createJobAnalysis(jobAnalysis: InsertJobAnalysis): Promise<JobAnalysis>;
  deleteJobAnalysis(id: number): Promise<boolean>;

  // Admin functions
  getAllUsers?(): Promise<User[]>;
  getAllResumes?(): Promise<Resume[]>;
  getAllCoverLetters?(): Promise<CoverLetter[]>;
  getAllJobAnalyses?(): Promise<JobAnalysis[]>;
  clearAllCoverLetters?(): Promise<void>;
  clearAllJobAnalyses?(): Promise<void>;
  clearAllResumes?(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private resumes: Map<number, Resume>;
  private coverLetters: Map<number, CoverLetter>;
  private jobAnalyses: Map<number, JobAnalysis>;
  private currentUserId: number;
  private currentResumeId: number;
  private currentCoverLetterId: number;
  private currentJobAnalysisId: number;

  constructor() {
    this.users = new Map();
    this.resumes = new Map();
    this.coverLetters = new Map();
    this.jobAnalyses = new Map();
    this.currentUserId = 1;
    this.currentResumeId = 1;
    this.currentCoverLetterId = 1;
    this.currentJobAnalysisId = 1;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.firebaseUid === firebaseUid);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Resumes
  async getResume(id: number): Promise<Resume | undefined> {
    console.log('Getting resume with ID:', id, 'Available resumes:', Array.from(this.resumes.keys()));
    return this.resumes.get(id);
  }

  async getUserResumes(userId: number): Promise<Resume[]> {
    return Array.from(this.resumes.values()).filter(resume => resume.userId === userId);
  }

  async createResume(insertResume: InsertResume): Promise<Resume> {
    const id = this.currentResumeId++;
    const now = new Date();
    const resume: Resume = {
      ...insertResume,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.resumes.set(id, resume);
    return resume;
  }

  async updateResume(id: number, updateData: Partial<InsertResume>): Promise<Resume | undefined> {
    const resume = this.resumes.get(id);
    if (!resume) return undefined;

    const updatedResume = { 
      ...resume, 
      ...updateData, 
      updatedAt: new Date() 
    };
    this.resumes.set(id, updatedResume);
    return updatedResume;
  }

  async deleteResume(id: number): Promise<boolean> {
    return this.resumes.delete(id);
  }

  // Cover Letters
  async getCoverLetter(id: number): Promise<CoverLetter | undefined> {
    return this.coverLetters.get(id);
  }

  async getUserCoverLetters(userId: number): Promise<CoverLetter[]> {
    return Array.from(this.coverLetters.values()).filter(letter => letter.userId === userId);
  }

  async createCoverLetter(insertCoverLetter: InsertCoverLetter): Promise<CoverLetter> {
    const id = this.currentCoverLetterId++;
    const coverLetter: CoverLetter = {
      ...insertCoverLetter,
      id,
      createdAt: new Date(),
    };
    this.coverLetters.set(id, coverLetter);
    return coverLetter;
  }

  async deleteCoverLetter(id: number): Promise<boolean> {
    return this.coverLetters.delete(id);
  }

  // Job Analyses
  async getJobAnalysis(id: number): Promise<JobAnalysis | undefined> {
    return this.jobAnalyses.get(id);
  }

  async getUserJobAnalyses(userId: number): Promise<JobAnalysis[]> {
    return Array.from(this.jobAnalyses.values()).filter(analysis => analysis.userId === userId);
  }

  async createJobAnalysis(insertJobAnalysis: InsertJobAnalysis): Promise<JobAnalysis> {
    const id = this.currentJobAnalysisId++;
    const jobAnalysis: JobAnalysis = {
      ...insertJobAnalysis,
      id,
      createdAt: new Date(),
    };
    this.jobAnalyses.set(id, jobAnalysis);
    return jobAnalysis;
  }

  async deleteJobAnalysis(id: number): Promise<boolean> {
    return this.jobAnalyses.delete(id);
  }

  // Admin functions
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllResumes(): Promise<Resume[]> {
    return Array.from(this.resumes.values());
  }

  async getAllCoverLetters(): Promise<CoverLetter[]> {
    return Array.from(this.coverLetters.values());
  }

  async getAllJobAnalyses(): Promise<JobAnalysis[]> {
    return Array.from(this.jobAnalyses.values());
  }

  async clearAllCoverLetters(): Promise<void> {
    this.coverLetters.clear();
  }

  async clearAllJobAnalyses(): Promise<void> {
    this.jobAnalyses.clear();
  }

  async clearAllResumes(): Promise<void> {
    this.resumes.clear();
  }
}

export const storage = new MemStorage();
