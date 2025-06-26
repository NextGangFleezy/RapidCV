import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, FileText, Briefcase, Mail, Upload, Download, Plus, Minus, Edit, Trash2, Target, Zap } from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';
import { AuthUser } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { generateResumePDF } from '@/lib/pdf-generator';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface UnifiedWorkspaceProps {
  user: AuthUser | null;
}

interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  achievements: string[];
}

interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  honors?: string;
}

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  startDate?: string;
  endDate?: string;
}

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

interface ResumeData {
  title: string;
  personalInfo: PersonalInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  projects: ProjectItem[];
  templateId: string;
}

interface JobAnalysis {
  matchScore: number;
  keySkills: string[];
  missingSkills: string[];
  strengths: string[];
  improvements: string[];
  optimizedSummary?: string;
  keywords: string[];
}

interface CoverLetterData {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  tone: 'professional' | 'casual' | 'persuasive' | 'enthusiastic';
  content: string;
  resumeId?: number;
}

const defaultResumeData: ResumeData = {
  title: "My Resume",
  personalInfo: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    github: ""
  },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  projects: [],
  templateId: "classic"
};

export default function UnifiedWorkspace({ user }: UnifiedWorkspaceProps) {
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  const [jobDescription, setJobDescription] = useState('');
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null);
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData>({
    jobTitle: '',
    companyName: '',
    jobDescription: '',
    tone: 'professional',
    content: '',
    resumeId: undefined
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Save resume mutation
  const saveResumeMutation = useMutation({
    mutationFn: async (data: ResumeData) => {
      const response = await apiRequest('/api/resumes', 'POST', {
        title: data.title,
        personalInfo: data.personalInfo,
        summary: data.summary,
        experience: data.experience,
        education: data.education,
        skills: data.skills,
        projects: data.projects,
        templateId: data.templateId
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Resume saved successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
    },
    onError: () => {
      toast({ title: "Failed to save resume", variant: "destructive" });
    }
  });

  // Job analysis mutation
  const analyzeMutation = useMutation({
    mutationFn: async ({ jobDesc, resume }: { jobDesc: string; resume: ResumeData }) => {
      const response = await apiRequest('/api/job-analyses', 'POST', {
        jobDescription: jobDesc,
        resumeData: resume
      });
      return await response.json();
    },
    onSuccess: (data: JobAnalysis) => {
      setJobAnalysis(data);
      toast({ title: "Job analysis completed!" });
    },
    onError: (error) => {
      console.error('Analysis failed:', error);
      // Fallback to offline analysis
      const fallbackAnalysis = performOfflineAnalysis(jobDescription, resumeData);
      setJobAnalysis(fallbackAnalysis);
      toast({ title: "Analysis completed (offline mode)" });
    }
  });

  // Cover letter generation mutation  
  const generateCoverLetterMutation = useMutation({
    mutationFn: async (data: CoverLetterData) => {
      const response = await apiRequest('/api/cover-letters', 'POST', data);
      return await response.json();
    },
    onSuccess: (data: any) => {
      setCoverLetterData(prev => ({ ...prev, content: data.content }));
      toast({ title: "Cover letter generated successfully!" });
    },
    onError: (error) => {
      console.error('Cover letter generation failed:', error);
      // Fallback to basic generation
      const fallbackContent = generateBasicCoverLetter(coverLetterData, resumeData);
      setCoverLetterData(prev => ({ ...prev, content: fallbackContent }));
      toast({ title: "Cover letter generated (offline mode)" });
    }
  });

  // File processing functions
  const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const textItems = textContent.items as any[];
          const pageText = textItems.map(item => item.str).join(' ');
          fullText += pageText + '\n';
        }
        
        return fullText.trim();
      } catch (error) {
        console.error('PDF parsing error:', error);
        throw new Error('Failed to extract text from PDF');
      }
    }
    
    if (file.type === 'text/plain') {
      return await file.text();
    }
    
    if (file.type.includes('document') || file.name.endsWith('.docx')) {
      // For Word documents, we'll read as text (limited support)
      return await file.text();
    }
    
    throw new Error('Unsupported file type');
  };

  // Robust text parsing with comprehensive extraction
  const parseResumeText = (text: string): ResumeData => {
    if (!text || text.trim().length === 0) {
      return { ...defaultResumeData, title: "Empty Resume" };
    }

    // Clean and normalize text
    const cleanText = text
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable chars
      .replace(/\s+/g, ' ')
      .trim();

    const lines = cleanText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      return { ...defaultResumeData, title: "No Content Found" };
    }

    const result: ResumeData = {
      ...defaultResumeData,
      title: uploadedFile?.name?.replace(/\.[^/.]+$/, "") || "Imported Resume"
    };

    // Extract personal information with robust parsing
    const personalInfo = extractPersonalInfo(lines);
    result.personalInfo = { ...result.personalInfo, ...personalInfo };

    // Extract professional summary
    result.summary = extractSummary(lines) || "Professional with diverse experience and skills.";

    // Extract experience with proper validation
    result.experience = extractExperience(lines);

    // Extract education with validation
    result.education = extractEducation(lines);

    // Extract skills with deduplication
    result.skills = extractSkills(lines);

    // Extract projects if present
    result.projects = extractProjects(lines);

    return result;
  };

  // Robust personal information extraction
  const extractPersonalInfo = (lines: string[]) => {
    const info: Partial<PersonalInfo> = {};
    
    // Name extraction - check first 3 lines
    for (let i = 0; i < Math.min(lines.length, 3); i++) {
      const line = lines[i].trim();
      
      // Skip obvious non-name lines
      if (line.toLowerCase().includes('resume') || 
          line.toLowerCase().includes('curriculum') ||
          line.includes('@') || 
          line.includes('http') ||
          line.length < 3 ||
          line.length > 50) {
        continue;
      }

      const words = line.split(/\s+/).filter(w => w.length > 0);
      if (words.length >= 2 && words.length <= 4) {
        const namePattern = /^[A-Za-z][A-Za-z\s.'-]*$/;
        if (namePattern.test(line) && 
            words.every(word => word.length > 1) &&
            words.some(word => word[0] === word[0].toUpperCase())) {
          info.firstName = words[0];
          info.lastName = words.slice(1).join(' ');
          break;
        }
      }
    }

    // Extract contact information
    for (const line of lines) {
      // Email extraction
      const emailMatch = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch && !info.email) {
        info.email = emailMatch[1];
      }
      
      // Phone extraction
      const phoneMatch = line.match(/(\(?\d{3}\)?\s*[-.\s]?\d{3}[-.\s]?\d{4})/);
      if (phoneMatch && !info.phone) {
        info.phone = phoneMatch[1];
      }
      
      // LinkedIn extraction
      const linkedinMatch = line.match(/linkedin\.com\/in\/([^\s\/]+)/i);
      if (linkedinMatch && !info.linkedin) {
        info.linkedin = linkedinMatch[1];
      }
      
      // GitHub extraction
      const githubMatch = line.match(/github\.com\/([^\s\/]+)/i);
      if (githubMatch && !info.github) {
        info.github = githubMatch[1];
      }
      
      // Website extraction
      const websiteMatch = line.match(/(https?:\/\/[^\s]+)/);
      if (websiteMatch && !info.website) {
        info.website = websiteMatch[1];
      }
    }

    return info;
  };

  // Extract professional summary
  const extractSummary = (lines: string[]): string => {
    const summaryKeywords = ['summary', 'profile', 'objective', 'about', 'overview'];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (summaryKeywords.some(keyword => line.includes(keyword))) {
        const summaryLines = [];
        for (let j = i + 1; j < lines.length && j < i + 5; j++) {
          if (lines[j].length > 30 && !lines[j].toLowerCase().includes('experience') && 
              !lines[j].toLowerCase().includes('education') && !lines[j].toLowerCase().includes('skills')) {
            summaryLines.push(lines[j]);
          } else {
            break;
          }
        }
        if (summaryLines.length > 0) {
          return summaryLines.join(' ').trim();
        }
      }
    }
    return '';
  };

  // Extract work experience
  const extractExperience = (lines: string[]): ExperienceItem[] => {
    const experience: ExperienceItem[] = [];
    const experienceKeywords = ['experience', 'employment', 'work history', 'professional experience'];
    
    let inExperienceSection = false;
    let currentExperience: Partial<ExperienceItem> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      // Check if we're entering experience section
      if (experienceKeywords.some(keyword => lowerLine.includes(keyword))) {
        inExperienceSection = true;
        continue;
      }
      
      // Exit if we hit another section
      if (inExperienceSection && (lowerLine.includes('education') || lowerLine.includes('skills') || 
          lowerLine.includes('projects'))) {
        break;
      }
      
      if (inExperienceSection && line.trim().length > 0) {
        // Try to parse job entry
        const dateMatch = line.match(/(\d{4})\s*[-–]\s*(\d{4}|present|current)/i);
        if (dateMatch) {
          if (currentExperience.company) {
            experience.push({
              id: Date.now().toString() + Math.random(),
              company: currentExperience.company || '',
              position: currentExperience.position || '',
              startDate: currentExperience.startDate || '',
              endDate: currentExperience.endDate || '',
              current: currentExperience.current || false,
              description: currentExperience.description || '',
              achievements: currentExperience.achievements || []
            });
          }
          
          currentExperience = {
            startDate: dateMatch[1],
            endDate: dateMatch[2].toLowerCase() === 'present' || dateMatch[2].toLowerCase() === 'current' ? '' : dateMatch[2],
            current: dateMatch[2].toLowerCase() === 'present' || dateMatch[2].toLowerCase() === 'current'
          };
        } else if (line.includes('@') || line.includes('|') || line.includes('-')) {
          const parts = line.split(/[@|–-]/).map(p => p.trim());
          if (parts.length >= 2) {
            currentExperience.position = parts[0];
            currentExperience.company = parts[1];
          }
        } else if (line.length > 20 && !currentExperience.description) {
          currentExperience.description = line;
        }
      }
    }
    
    // Add the last experience if exists
    if (currentExperience.company) {
      experience.push({
        id: Date.now().toString() + Math.random(),
        company: currentExperience.company || '',
        position: currentExperience.position || '',
        startDate: currentExperience.startDate || '',
        endDate: currentExperience.endDate || '',
        current: currentExperience.current || false,
        description: currentExperience.description || '',
        achievements: currentExperience.achievements || []
      });
    }
    
    return experience;
  };

  // Extract education
  const extractEducation = (lines: string[]): EducationItem[] => {
    const education: EducationItem[] = [];
    const educationKeywords = ['education', 'academic', 'university', 'college', 'degree'];
    
    let inEducationSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      if (educationKeywords.some(keyword => lowerLine.includes(keyword))) {
        inEducationSection = true;
        continue;
      }
      
      if (inEducationSection && (lowerLine.includes('experience') || lowerLine.includes('skills') || 
          lowerLine.includes('projects'))) {
        break;
      }
      
      if (inEducationSection && line.trim().length > 0) {
        const degreeMatch = line.match(/(bachelor|master|phd|doctorate|associate|diploma|certificate)/i);
        if (degreeMatch) {
          education.push({
            id: Date.now().toString() + Math.random(),
            institution: line.split(/[-–@|]/).pop()?.trim() || '',
            degree: line.split(/[-–@|]/)[0]?.trim() || '',
            field: '',
            startDate: '',
            endDate: '',
            gpa: '',
            honors: ''
          });
        }
      }
    }
    
    return education;
  };

  // Extract skills
  const extractSkills = (lines: string[]): string[] => {
    const skills: Set<string> = new Set();
    const skillKeywords = ['skills', 'technologies', 'expertise', 'proficient', 'competencies'];
    
    let inSkillsSection = false;
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (skillKeywords.some(keyword => lowerLine.includes(keyword))) {
        inSkillsSection = true;
        continue;
      }
      
      if (inSkillsSection && (lowerLine.includes('experience') || lowerLine.includes('education') || 
          lowerLine.includes('projects'))) {
        break;
      }
      
      if (inSkillsSection && line.trim().length > 0) {
        const skillItems = line.split(/[,;|•·]/).map(s => s.trim()).filter(s => s.length > 1);
        skillItems.forEach(skill => {
          if (skill.length < 30 && !skill.includes('@') && !skill.includes('http')) {
            skills.add(skill);
          }
        });
      }
    }
    
    return Array.from(skills).slice(0, 15);
  };

  // Extract projects
  const extractProjects = (lines: string[]): ProjectItem[] => {
    const projects: ProjectItem[] = [];
    const projectKeywords = ['projects', 'portfolio', 'work samples'];
    
    let inProjectsSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      if (projectKeywords.some(keyword => lowerLine.includes(keyword))) {
        inProjectsSection = true;
        continue;
      }
      
      if (inProjectsSection && line.trim().length > 0) {
        const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
        projects.push({
          id: Date.now().toString() + Math.random(),
          name: line.split(/[-–]|http/)[0].trim(),
          description: line,
          technologies: [],
          url: urlMatch ? urlMatch[1] : '',
          startDate: '',
          endDate: ''
        });
      }
    }
    
    return projects.slice(0, 5);
  };

  // Offline analysis fallback
  const performOfflineAnalysis = (jobDesc: string, resume: ResumeData): JobAnalysis => {
    const jobWords = jobDesc.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const resumeText = `${resume.summary} ${resume.skills.join(' ')} ${resume.experience.map(e => e.description).join(' ')}`.toLowerCase();
    
    const matchingSkills = resume.skills.filter(skill => 
      jobWords.some(word => skill.toLowerCase().includes(word))
    );
    
    const missingSkills = jobWords.filter(word => 
      !resumeText.includes(word) && word.length > 4
    ).slice(0, 5);
    
    return {
      matchScore: Math.min(90, (matchingSkills.length / Math.max(resume.skills.length, 1)) * 100),
      keySkills: matchingSkills.slice(0, 8),
      missingSkills: missingSkills,
      strengths: ['Relevant experience', 'Strong skill set'],
      improvements: ['Add missing keywords', 'Enhance summary'],
      keywords: jobWords.slice(0, 10)
    };
  };

  // Basic cover letter generation
  const generateBasicCoverLetter = (data: CoverLetterData, resume: ResumeData): string => {
    return `Dear Hiring Manager,

I am writing to express my interest in the ${data.jobTitle} position at ${data.companyName}.

With my background in ${resume.skills.slice(0, 3).join(', ') || 'relevant technologies'}, I am confident I would be a valuable addition to your team.

${resume.summary || 'I bring a strong foundation of experience and skills that align well with your requirements.'}

I look forward to discussing how my experience can contribute to ${data.companyName}'s continued success.

Best regards,
${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`;
  };

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setUploadedFile(file);

    try {
      const extractedText = await extractTextFromFile(file);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the file');
      }

      // Try AI parsing first, fall back to manual parsing
      try {
        const response = await apiRequest('/api/resumes/parse', 'POST', { 
          resumeText: extractedText 
        });

        const parsedData = await response.json();
        const convertedData: ResumeData = {
          title: file.name.replace(/\.[^/.]+$/, ""),
          personalInfo: parsedData.personalInfo || defaultResumeData.personalInfo,
          summary: parsedData.summary || '',
          experience: parsedData.experience || [],
          education: parsedData.education || [],
          skills: parsedData.skills || [],
          projects: parsedData.projects || [],
          templateId: 'classic'
        };

        setResumeData(convertedData);
        setPreviewKey(prev => prev + 1);
        toast({ title: "Resume parsed successfully with AI!" });
      } catch (aiError) {
        console.warn('AI parsing failed, using manual parsing:', aiError);
        
        const manuallyParsed = parseResumeText(extractedText);
        setResumeData(manuallyParsed);
        setPreviewKey(prev => prev + 1);
        toast({ title: "Resume imported successfully!" });
      }
    } catch (error) {
      console.error('File processing error:', error);
      toast({ 
        title: "Failed to process file", 
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive" 
      });
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Event handlers
  const handleSaveResume = () => {
    if (!user) {
      toast({ title: "Please sign in to save resumes", variant: "destructive" });
      return;
    }
    saveResumeMutation.mutate(resumeData);
  };

  const handleAnalyzeJob = () => {
    if (!jobDescription.trim()) {
      toast({ title: "Please enter a job description", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    
    const cleanJobDesc = jobDescription.trim();
    if (cleanJobDesc.length < 50) {
      toast({ title: "Please provide a more detailed job description (at least 50 characters)", variant: "destructive" });
      setIsAnalyzing(false);
      return;
    }

    analyzeMutation.mutate({ jobDesc: cleanJobDesc, resume: resumeData });
    setIsAnalyzing(false);
  };

  const handleGenerateCoverLetter = () => {
    if (!coverLetterData.jobTitle || !coverLetterData.companyName) {
      toast({ title: "Please fill in job title and company name", variant: "destructive" });
      return;
    }

    setIsGenerating(true);

    const jobDesc = jobDescription || coverLetterData.jobDescription;
    if (!jobDesc.trim()) {
      toast({ title: "Please provide a job description", variant: "destructive" });
      setIsGenerating(false);
      return;
    }

    generateCoverLetterMutation.mutate({
      ...coverLetterData,
      jobDescription: jobDesc,
      resumeId: undefined
    });
    setIsGenerating(false);
  };

  const handlePDFDownload = () => {
    try {
      generateResumePDF(resumeData as any);
      toast({ title: "PDF downloaded successfully!" });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({ title: "Failed to generate PDF", variant: "destructive" });
    }
  };

  // Dynamic form handlers
  const addExperienceItem = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        id: Date.now().toString(),
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
        achievements: []
      }]
    }));
  };

  const removeExperienceItem = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(item => item.id !== id)
    }));
  };

  const updateExperienceItem = (id: string, field: string, value: any) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const addEducationItem = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, {
        id: Date.now().toString(),
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        gpa: '',
        honors: ''
      }]
    }));
  };

  const removeEducationItem = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(item => item.id !== id)
    }));
  };

  const updateEducationItem = (id: string, field: string, value: any) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && !resumeData.skills.includes(skill.trim())) {
      setResumeData(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">RapidCV Workspace</h1>
          <p className="text-gray-600">Build, optimize, and perfect your resume with AI assistance</p>
        </div>

        <Tabs defaultValue="resume" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="resume">Resume Builder</TabsTrigger>
            <TabsTrigger value="analyzer">Job Analyzer</TabsTrigger>
            <TabsTrigger value="cover-letter">Cover Letters</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn Optimizer</TabsTrigger>
          </TabsList>

          {/* Resume Builder Tab */}
          <TabsContent value="resume" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Panel - Resume Form */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Import Resume
                    </CardTitle>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingFile}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {isProcessingFile ? 'Processing...' : 'Upload File'}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Upload your existing resume (PDF, Word, or text file) to automatically extract and parse your information.
                    </p>
                    {uploadedFile && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-md">
                        <p className="text-sm font-medium">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={resumeData.personalInfo.firstName}
                          onChange={(e) => setResumeData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, firstName: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={resumeData.personalInfo.lastName}
                          onChange={(e) => setResumeData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, lastName: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={resumeData.personalInfo.email}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, email: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={resumeData.personalInfo.phone}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, phone: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={resumeData.personalInfo.location}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, location: e.target.value }
                        }))}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Professional Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Brief summary of your professional background and key qualifications..."
                      value={resumeData.summary}
                      onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                      rows={4}
                    />
                  </CardContent>
                </Card>

                {/* Skills */}
                <Card>
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {resumeData.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <button
                            onClick={() => removeSkill(skill)}
                            className="ml-1 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addSkill(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          addSkill(input.value);
                          input.value = '';
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - Preview */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Resume Preview</CardTitle>
                    <div className="flex gap-2">
                      <Button onClick={handlePDFDownload} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                      <Button onClick={handleSaveResume} disabled={saveResumeMutation.isPending}>
                        {saveResumeMutation.isPending ? 'Saving...' : 'Save Resume'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div key={previewKey} className="bg-white border rounded-lg p-6 shadow-sm">
                      {/* Resume Preview Content */}
                      <div className="space-y-4">
                        <div className="text-center border-b pb-4">
                          <h2 className="text-2xl font-bold">
                            {resumeData.personalInfo.firstName} {resumeData.personalInfo.lastName}
                          </h2>
                          <div className="text-sm text-gray-600 mt-2">
                            {resumeData.personalInfo.email && (
                              <span>{resumeData.personalInfo.email}</span>
                            )}
                            {resumeData.personalInfo.phone && (
                              <span> • {resumeData.personalInfo.phone}</span>
                            )}
                            {resumeData.personalInfo.location && (
                              <span> • {resumeData.personalInfo.location}</span>
                            )}
                          </div>
                        </div>

                        {resumeData.summary && (
                          <div>
                            <h3 className="font-semibold mb-2">Professional Summary</h3>
                            <p className="text-sm text-gray-700">{resumeData.summary}</p>
                          </div>
                        )}

                        {resumeData.skills.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-2">Skills</h3>
                            <div className="flex flex-wrap gap-1">
                              {resumeData.skills.map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {resumeData.experience.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-2">Experience</h3>
                            <div className="space-y-3">
                              {resumeData.experience.map((exp) => (
                                <div key={exp.id} className="border-l-2 border-blue-200 pl-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-medium">{exp.position}</h4>
                                      <p className="text-sm text-gray-600">{exp.company}</p>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                                    </span>
                                  </div>
                                  {exp.description && (
                                    <p className="text-sm mt-1">{exp.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {resumeData.education.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-2">Education</h3>
                            <div className="space-y-2">
                              {resumeData.education.map((edu) => (
                                <div key={edu.id}>
                                  <h4 className="font-medium">{edu.degree}</h4>
                                  <p className="text-sm text-gray-600">{edu.institution}</p>
                                  {edu.field && <p className="text-sm text-gray-500">{edu.field}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Job Analyzer Tab */}
          <TabsContent value="analyzer" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Job Description Analyzer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="jobDescription">Paste Job Description</Label>
                    <Textarea
                      id="jobDescription"
                      placeholder="Paste the complete job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows={12}
                    />
                  </div>
                  <Button 
                    onClick={handleAnalyzeJob} 
                    disabled={isAnalyzing || !jobDescription.trim()}
                    className="w-full"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Job Match'}
                  </Button>
                </CardContent>
              </Card>

              {jobAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle>Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Match Score</span>
                        <span className="text-2xl font-bold text-green-600">
                          {Math.round(jobAnalysis.matchScore)}%
                        </span>
                      </div>
                      <Progress value={jobAnalysis.matchScore} className="h-2" />
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Key Matching Skills</h4>
                      <div className="flex flex-wrap gap-1">
                        {jobAnalysis.keySkills.map((skill, index) => (
                          <Badge key={index} className="bg-green-100 text-green-800">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Missing Skills</h4>
                      <div className="flex flex-wrap gap-1">
                        {jobAnalysis.missingSkills.map((skill, index) => (
                          <Badge key={index} variant="destructive">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Strengths</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {jobAnalysis.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Improvement Suggestions</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {jobAnalysis.improvements.map((improvement, index) => (
                          <li key={index}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Cover Letter Tab */}
          <TabsContent value="cover-letter" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Cover Letter Generator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      placeholder="e.g., Senior Software Engineer"
                      value={coverLetterData.jobTitle}
                      onChange={(e) => setCoverLetterData(prev => ({
                        ...prev,
                        jobTitle: e.target.value
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      placeholder="e.g., Tech Corp"
                      value={coverLetterData.companyName}
                      onChange={(e) => setCoverLetterData(prev => ({
                        ...prev,
                        companyName: e.target.value
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="tone">Tone</Label>
                    <Select
                      value={coverLetterData.tone}
                      onValueChange={(value: any) => setCoverLetterData(prev => ({
                        ...prev,
                        tone: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="persuasive">Persuasive</SelectItem>
                        <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleGenerateCoverLetter}
                    disabled={isGenerating || !coverLetterData.jobTitle || !coverLetterData.companyName}
                    className="w-full"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Cover Letter'}
                  </Button>
                </CardContent>
              </Card>

              {coverLetterData.content && (
                <Card>
                  <CardHeader>
                    <CardTitle>Generated Cover Letter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={coverLetterData.content}
                      onChange={(e) => setCoverLetterData(prev => ({
                        ...prev,
                        content: e.target.value
                      }))}
                      rows={20}
                      className="font-mono text-sm"
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* LinkedIn Optimizer Tab */}
          <TabsContent value="linkedin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  LinkedIn Profile Optimizer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
                  <p className="text-gray-600">
                    LinkedIn profile optimization features will be available in the next update.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}