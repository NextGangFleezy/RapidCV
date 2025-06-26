import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Search, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Target, 
  Zap, 
  ArrowRight,
  Download,
  RefreshCw,
  Plus,
  Minus,
  Save,
  Edit,
  Mail,
  Upload,
  CopyIcon,
  AlertCircle
} from "@/lib/icons";
import { type AuthUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";

interface UnifiedWorkspaceProps {
  user: AuthUser | null;
}

// Resume data interfaces
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

// Template configurations
const templates = {
  classic: {
    name: "Classic",
    description: "Traditional professional layout",
    headerBg: "bg-gray-800",
    headerText: "text-white",
    accentColor: "text-gray-800",
    sectionBorder: "border-l-2 border-gray-300",
    skillBadge: "bg-gray-100 text-gray-800"
  },
  modern: {
    name: "Modern",
    description: "Clean contemporary design",
    headerBg: "bg-blue-600",
    headerText: "text-white",
    accentColor: "text-blue-600",
    sectionBorder: "border-l-2 border-blue-200",
    skillBadge: "bg-blue-100 text-blue-800"
  },
  creative: {
    name: "Creative",
    description: "Vibrant design for creative roles",
    headerBg: "bg-purple-600",
    headerText: "text-white",
    accentColor: "text-purple-600",
    sectionBorder: "border-l-2 border-purple-200",
    skillBadge: "bg-purple-100 text-purple-800"
  }
};

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
  templateId: "modern"
};

export default function UnifiedWorkspace({ user }: UnifiedWorkspaceProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Main state
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  const [previewKey, setPreviewKey] = useState(0);
  
  // Debug: Track state changes and rendering
  useEffect(() => {
    console.log("🔄 STATE UPDATE:", {
      firstName: resumeData.personalInfo.firstName,
      lastName: resumeData.personalInfo.lastName,
      email: resumeData.personalInfo.email,
      summary: resumeData.summary.substring(0, 30),
      skillsCount: resumeData.skills.length,
      experienceCount: resumeData.experience.length
    });
  }, [resumeData]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("resume");
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  // Job Analysis state
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Cover Letter state
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData>({
    jobTitle: "",
    companyName: "",
    jobDescription: "",
    tone: 'professional',
    content: ""
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch existing resumes
  const { data: resumes, refetch: refetchResumes } = useQuery({
    queryKey: ['/api/resumes'],
    enabled: !!user,
  });

  // Save resume mutation
  const saveResumeMutation = useMutation({
    mutationFn: async (data: ResumeData) => {
      const response = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          userId: user?.userData?.id || 1
        }),
      });
      if (!response.ok) throw new Error('Failed to save resume');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Resume Saved",
        description: "Your resume has been saved successfully.",
      });
      refetchResumes();
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save resume. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Job analysis mutation
  const analyzeMutation = useMutation({
    mutationFn: async ({ jobDesc, resume }: { jobDesc: string; resume: ResumeData }) => {
      // Check if we have a saved resume to use
      let resumeId = null;
      if (user && selectedResumeId && Array.isArray(resumes)) {
        const selectedResume = resumes.find((r: any) => r.id.toString() === selectedResumeId);
        if (selectedResume) {
          resumeId = selectedResume.id;
        }
      }

      if (user && resumeId) {
        // Use API with saved resume for authenticated users
        try {
          const response = await fetch("/api/job-analyses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jobDescription: jobDesc,
              resumeId: resumeId
            }),
          });
          
          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.warn('API analysis failed, falling back to offline analysis:', error);
        }
      }
      
      // Always fallback to offline analysis
      return performOfflineAnalysis(jobDesc, resume);
    },
    onSuccess: (result) => {
      setAnalysis(result);
      toast({
        title: "Analysis Complete",
        description: "Job analysis completed with optimization suggestions.",
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze job posting. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cover letter generation mutation
  const generateCoverLetterMutation = useMutation({
    mutationFn: async (data: CoverLetterData) => {
      try {
        const response = await fetch("/api/cover-letters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            userId: user?.userData?.id || 1,
            resumeId: selectedResumeId ? parseInt(selectedResumeId) : null
          }),
        });
        
        if (response.ok) {
          return await response.json();
        } else {
          // Fallback to basic template
          return {
            content: generateBasicCoverLetter(data, resumeData)
          };
        }
      } catch (error) {
        return {
          content: generateBasicCoverLetter(data, resumeData)
        };
      }
    },
    onSuccess: (result) => {
      setCoverLetterData(prev => ({ ...prev, content: result.content }));
      toast({
        title: "Cover Letter Generated",
        description: "Your cover letter has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate cover letter. Please try again.",
        variant: "destructive",
      });
    },
  });

  // File upload and parsing functions
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/rtf'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported File Type",
        description: "Please upload a PDF, Word document, or text file.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setIsProcessingFile(true);

    try {
      const extractedText = await extractTextFromFile(file);
      console.log("Extracted text:", extractedText.substring(0, 200));
      
      // Set the text in the textarea but don't auto-parse
      setResumeText(extractedText);
      
      // For text files, auto-parse. For PDF/Word, require manual import
      if (file.type === 'text/plain' || file.type === 'text/rtf') {
        const parsedData = parseResumeText(extractedText);
        console.log("Parsed data:", parsedData);
        
        setResumeData(parsedData);
        setPreviewKey(prev => prev + 1);
        setShowImportDialog(false);
        
        toast({
          title: "Text File Imported",
          description: "Resume content has been parsed automatically.",
        });
      } else {
        // For PDF/Word files, clear the textarea and show instructions
        setResumeText("");
        toast({
          title: "PDF/Word File Detected",
          description: "Please copy text from your file, paste it below, and click 'Import Text'.",
        });
      }
      
      toast({
        title: "Resume Imported Successfully",
        description: `Extracted content from ${file.name}. Please review and edit as needed.`,
      });
    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: "Processing Failed",
        description: "Unable to extract text from file. Please try copy/paste instead.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingFile(false);
    }
  };

  // File text extraction utility
  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result;
        
        if (file.type === 'text/plain' || file.type === 'text/rtf') {
          resolve(result as string);
        } else if (file.type === 'application/pdf') {
          // For PDF files, we'll provide clear instructions for manual extraction
          // PDF parsing requires specialized libraries that we don't have access to
          resolve(`PDF file detected: ${file.name}

To extract your resume content for parsing:

1. Open your PDF file
2. Select all text (Ctrl+A or Cmd+A)
3. Copy the text (Ctrl+C or Cmd+C)
4. Paste it in the text area below
5. Click "Import from Text"

This manual approach ensures accurate text extraction and proper resume parsing.`);
        } else if (file.type.includes('word') || file.type.includes('officedocument')) {
          // For Word docs, provide instructions for manual text extraction
          resolve(`Word document uploaded: ${file.name}\n\nNote: For best results with Word documents, please:\n1. Open your Word document\n2. Select and copy the text content\n3. Paste it in the text area below\n\nThis ensures accurate text extraction and better resume parsing.`);
        } else {
          resolve(result as string);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  };



  const parseResumeText = (text: string): ResumeData => {
    console.log("📄 PARSING RESUME TEXT - Length:", text.length);
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    console.log("📝 TOTAL LINES:", lines.length);
    
    const result: ResumeData = {
      ...defaultResumeData,
      title: uploadedFile?.name.replace(/\.[^/.]+$/, "") || "Imported Resume"
    };

    let currentSection = '';
    let lineIndex = 0;

    // Enhanced name extraction - look for the first line that looks like a name
    for (let i = 0; i < Math.min(lines.length, 3); i++) {
      const line = lines[i];
      const words = line.split(' ').filter(w => w.length > 0);
      
      // Check if this looks like a name (2-4 words, no special characters, capitalized)
      if (words.length >= 2 && words.length <= 4 && 
          !line.includes('@') && !line.includes('(') && !line.includes('.com') &&
          words.every(word => /^[A-Za-z]+$/.test(word) && word[0] === word[0].toUpperCase())) {
        result.personalInfo.firstName = words[0];
        result.personalInfo.lastName = words.slice(1).join(' ');
        console.log("👤 EXTRACTED NAME:", result.personalInfo.firstName, result.personalInfo.lastName);
        lineIndex = i + 1;
        break;
      }
    }

    // Enhanced contact extraction - scan more lines
    for (let i = 0; i < Math.min(lines.length, 8); i++) {
      const line = lines[i];
      
      // Email extraction
      const emailMatch = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        result.personalInfo.email = emailMatch[1];
        console.log("📧 EXTRACTED EMAIL:", result.personalInfo.email);
      }
      
      // Phone extraction
      const phoneMatch = line.match(/(\(?\d{3}\)?\s*[-.\s]?\d{3}[-.\s]?\d{4})/);
      if (phoneMatch) {
        result.personalInfo.phone = phoneMatch[1];
        console.log("📞 EXTRACTED PHONE:", result.personalInfo.phone);
      }
      
      // Location extraction
      if ((line.toLowerCase().includes('address') || line.toLowerCase().includes('location') || 
          line.match(/\d+\s+\w+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|city|state)/i)) &&
          !result.personalInfo.location) {
        result.personalInfo.location = line;
        console.log("📍 EXTRACTED LOCATION:", result.personalInfo.location);
      }
    }

    // Enhanced section parsing
    let summaryLines = [];
    let skillsLines = [];
    let experienceBuffer = [];
    
    for (let i = lineIndex; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();
      
      // Section detection
      if (lineLower.match(/^(summary|objective|profile|about)/)) {
        currentSection = 'summary';
        console.log("🎯 FOUND SUMMARY SECTION");
        continue;
      } else if (lineLower.match(/^(experience|employment|work|career)/)) {
        currentSection = 'experience';
        console.log("💼 FOUND EXPERIENCE SECTION");
        continue;
      } else if (lineLower.match(/^(education|academic|school)/)) {
        currentSection = 'education';
        console.log("🎓 FOUND EDUCATION SECTION");
        continue;
      } else if (lineLower.match(/^(skills|competencies|technologies|technical)/)) {
        currentSection = 'skills';
        console.log("🛠️ FOUND SKILLS SECTION");
        continue;
      }

      // Content extraction based on section
      if (currentSection === 'summary' && line.length > 10) {
        summaryLines.push(line);
      } else if (currentSection === 'skills' && line.length > 0) {
        skillsLines.push(line);
      } else if (currentSection === 'experience' && line.length > 0) {
        experienceBuffer.push(line);
      }
    }

    // Process collected data
    if (summaryLines.length > 0) {
      result.summary = summaryLines.join(' ');
      console.log("📋 EXTRACTED SUMMARY:", result.summary.substring(0, 100));
    }

    if (skillsLines.length > 0) {
      const allSkillsText = skillsLines.join(' ');
      const skills = allSkillsText.split(/[,•·|;\n]/).map(s => s.trim()).filter(s => s.length > 1);
      const uniqueSkills = [];
      const seenSkills = new Set();
      for (const skill of skills) {
        if (!seenSkills.has(skill)) {
          seenSkills.add(skill);
          uniqueSkills.push(skill);
        }
      }
      result.skills = uniqueSkills.slice(0, 20); // Limit to 20
      console.log("🛠️ EXTRACTED SKILLS:", result.skills);
    }

    if (experienceBuffer.length > 0) {
      // Simple experience parsing - group every 2-3 lines as one experience
      for (let i = 0; i < experienceBuffer.length; i += 3) {
        if (experienceBuffer[i] && experienceBuffer[i].length > 5) {
          const exp: ExperienceItem = {
            id: `exp_${Date.now()}_${i}`,
            position: experienceBuffer[i] || 'Position',
            company: experienceBuffer[i + 1] || 'Company',
            startDate: '',
            endDate: '',
            current: false,
            description: experienceBuffer[i + 2] || '',
            achievements: []
          };
          result.experience.push(exp);
        }
      }
      console.log("💼 EXTRACTED EXPERIENCE:", result.experience.length, "entries");
    }

    console.log("✅ PARSING COMPLETE - Result:", result);
    return result;
  };

  const handleTextImport = () => {
    if (!resumeText.trim()) {
      toast({
        title: "No Text Provided",
        description: "Please paste your resume text to import.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingFile(true);
    console.log("🚀 STARTING TEXT IMPORT - Text length:", resumeText.length);
    
    try {
      const parsedData = parseResumeText(resumeText);
      console.log("🎯 PARSED DATA RESULT:", parsedData);
      
      setResumeData(parsedData);
      setPreviewKey(prev => prev + 1); // Force preview refresh
      setShowImportDialog(false);
      
      toast({
        title: "Text Imported Successfully",
        description: `Parsed: ${parsedData.personalInfo.firstName} ${parsedData.personalInfo.lastName}`,
      });
    } catch (error) {
      console.error("❌ PARSING ERROR:", error);
      toast({
        title: "Import Failed",
        description: "Unable to parse resume text. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Helper functions
  const performOfflineAnalysis = (jobDesc: string, resume: ResumeData): JobAnalysis => {
    if (!jobDesc.trim()) {
      return {
        matchScore: 0,
        keySkills: [],
        missingSkills: [],
        strengths: [],
        improvements: ["Please provide a job description to analyze"],
        keywords: []
      };
    }

    // Extract keywords from job description
    const jobWords = jobDesc.toLowerCase()
      .split(/[\s,\.\!\?\;\:]+/)
      .filter(word => word.length > 3)
      .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word));

    // Common tech keywords
    const techKeywords = ['react', 'javascript', 'python', 'java', 'node', 'aws', 'docker', 'kubernetes', 'sql', 'mongodb', 'git', 'agile', 'scrum', 'api', 'rest', 'graphql', 'typescript', 'html', 'css', 'angular', 'vue', 'express', 'django', 'flask', 'spring', 'microservices', 'devops', 'ci/cd', 'testing', 'jest', 'cypress', 'leadership', 'communication', 'teamwork', 'problem-solving', 'analytical'];
    
    const jobKeywords = jobWords.filter(word => techKeywords.includes(word) || word.length > 4);
    const uniqueKeywords = Array.from(new Set(jobKeywords));

    // Compare with resume skills
    const resumeSkills = resume.skills.map(skill => skill.toLowerCase());
    const resumeText = (resume.summary + ' ' + resume.experience.map(exp => exp.description || '').join(' ')).toLowerCase();
    
    const skillMatches = uniqueKeywords.filter(keyword => 
      resumeSkills.some(skill => skill.includes(keyword)) ||
      resumeText.includes(keyword)
    );
    
    const missingSkills = uniqueKeywords.filter(keyword => 
      !resumeSkills.some(skill => skill.includes(keyword)) &&
      !resumeText.includes(keyword)
    ).slice(0, 5);
    
    const matchScore = Math.round((skillMatches.length / Math.max(uniqueKeywords.length, 1)) * 100);
    
    return {
      matchScore,
      keySkills: skillMatches.slice(0, 6),
      missingSkills,
      strengths: skillMatches.length > 0 ? skillMatches.slice(0, 4).map(skill => 
        `Strong experience with ${skill.charAt(0).toUpperCase() + skill.slice(1)}`
      ) : ["Complete your resume with relevant skills and experience"],
      improvements: [
        missingSkills.length > 0 ? `Consider adding skills: ${missingSkills.slice(0, 3).join(', ')}` : "Add more specific technical skills",
        "Include quantifiable achievements and metrics in your experience",
        "Expand on relevant projects that demonstrate your capabilities",
        "Tailor your summary to highlight skills mentioned in the job posting"
      ].slice(0, 3),
      keywords: uniqueKeywords.slice(0, 8)
    };
  };

  const generateBasicCoverLetter = (data: CoverLetterData, resume: ResumeData): string => {
    const { firstName, lastName } = resume.personalInfo;
    const name = firstName && lastName ? `${firstName} ${lastName}` : "Candidate";
    
    return `Dear Hiring Manager,

I am writing to express my strong interest in the ${data.jobTitle} position at ${data.companyName}. With my background in ${resume.skills.slice(0, 3).join(', ')}, I am excited about the opportunity to contribute to your team.

${resume.summary || 'I am a dedicated professional with experience in software development and a passion for creating innovative solutions.'}

My key qualifications include:
${resume.experience.slice(0, 2).map(exp => `• ${exp.position} at ${exp.company}: ${exp.description}`).join('\n')}
${resume.skills.length > 0 ? `• Technical expertise in ${resume.skills.slice(0, 5).join(', ')}` : ''}

I am particularly drawn to this role because it aligns perfectly with my career goals and allows me to leverage my skills in a meaningful way. I would welcome the opportunity to discuss how my experience and enthusiasm can contribute to ${data.companyName}'s continued success.

Thank you for your consideration. I look forward to hearing from you.

Best regards,
${name}`;
  };

  const loadResumeData = (resumeId: string) => {
    if (!Array.isArray(resumes)) return;
    
    const resume = resumes.find((r: any) => r?.id?.toString() === resumeId);
    if (resume) {
      setResumeData({
        title: resume.title || "My Resume",
        personalInfo: resume.personalInfo || defaultResumeData.personalInfo,
        summary: resume.summary || "",
        experience: resume.experience || [],
        education: resume.education || [],
        skills: resume.skills || [],
        projects: resume.projects || [],
        templateId: resume.templateId || "modern"
      });
    }
  };

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Missing Job Description",
        description: "Please paste a job description to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      await analyzeMutation.mutateAsync({
        jobDesc: jobDescription,
        resume: resumeData
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!coverLetterData.jobTitle || !coverLetterData.companyName) {
      toast({
        title: "Missing Information",
        description: "Please provide job title and company name.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      await generateCoverLetterMutation.mutateAsync({
        ...coverLetterData,
        jobDescription: jobDescription || coverLetterData.jobDescription
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addExperienceItem = () => {
    const newExperience: ExperienceItem = {
      id: Date.now().toString(),
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      achievements: []
    };
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, newExperience]
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

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !resumeData.skills.includes(trimmedSkill)) {
      setResumeData(prev => ({
        ...prev,
        skills: [...prev.skills, trimmedSkill]
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      <div className="container max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Unified Resume Workspace</h1>
          <p className="text-gray-600 mt-2">
            Build your resume, analyze jobs, and generate cover letters - all in one place with real-time preview
          </p>
        </div>

        {/* Import Resume Options */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Resume Import & Management
              <div className="flex gap-2">
                <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Resume
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Import Your Resume</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* File Upload Section */}
                      <div>
                        <Label className="text-base font-medium">Upload File</Label>
                        <p className="text-sm text-gray-600 mb-3">
                          Upload PDF, Word document, or text file (max 50MB)
                        </p>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.txt,.rtf"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <div className="space-y-2">
                            <Upload className="h-8 w-8 mx-auto text-gray-400" />
                            <div>
                              <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessingFile}
                              >
                                {isProcessingFile ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Choose File
                                  </>
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                              Supports PDF, DOC, DOCX, TXT, RTF files
                            </p>
                          </div>
                        </div>
                        {uploadedFile && (
                          <div className="mt-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4 inline mr-1" />
                            {uploadedFile.name} uploaded successfully
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Text Input Section */}
                      <div>
                        <Label htmlFor="resumeTextInput" className="text-base font-medium">
                          Copy & Paste Text
                        </Label>
                        <p className="text-sm text-gray-600 mb-3">
                          Paste your resume text directly for parsing
                        </p>
                        <Textarea
                          id="resumeTextInput"
                          value={resumeText}
                          onChange={(e) => {
                            console.log("📝 TEXTAREA CHANGE - Length:", e.target.value.length);
                            setResumeText(e.target.value);
                          }}
                          placeholder="Paste your resume text here..."
                          rows={8}
                          className="w-full"
                        />
                        <div className="flex justify-between mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const sampleText = `John Smith
john.smith@email.com
(555) 123-4567
New York, NY

Summary
Experienced software engineer with 5+ years developing web applications and leading technical teams. Passionate about creating scalable solutions and mentoring junior developers.

Experience
Senior Software Engineer
Tech Solutions Inc
Built and maintained React applications serving 100k+ users. Led team of 4 developers on major product features.

Software Developer
StartupCorp
Developed full-stack web applications using Node.js and React. Implemented automated testing reducing bugs by 40%.

Skills
JavaScript, React, Node.js, Python, AWS, Docker, Git, Agile, Leadership, Problem Solving

Education
Bachelor of Science in Computer Science
University of Technology
Graduated Magna Cum Laude`;
                              console.log("🎯 LOADING SAMPLE TEXT - Length:", sampleText.length);
                              setResumeText(sampleText);
                            }}
                          >
                            Load Sample
                          </Button>
                          <Button
                            onClick={handleTextImport}
                            disabled={isProcessingFile || !resumeText.trim()}
                          >

                            {isProcessingFile ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CopyIcon className="h-4 w-4 mr-2" />
                                Import Text
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {isProcessingFile && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Processing your resume... This may take a moment.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {user && (
                  <Button
                    onClick={() => saveResumeMutation.mutate(resumeData)}
                    disabled={saveResumeMutation.isPending}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Current
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          {user && Array.isArray(resumes) && resumes.length > 0 && (
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Load Existing Resume</Label>
                  <Select
                    value={selectedResumeId}
                    onValueChange={(value) => {
                      setSelectedResumeId(value);
                      loadResumeData(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a resume to load..." />
                    </SelectTrigger>
                    <SelectContent>
                      {resumes.map((resume: any) => (
                        <SelectItem key={resume.id} value={resume.id.toString()}>
                          {resume.title || `Resume ${resume.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Tools */}
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="resume">Resume Builder</TabsTrigger>
                <TabsTrigger value="analyzer">Job Analyzer</TabsTrigger>
                <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
              </TabsList>

              {/* Resume Builder Tab */}
              <TabsContent value="resume" className="space-y-6">
                {/* Template Selector */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit className="h-5 w-5" />
                      Choose Template
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(templates).map(([key, template]) => (
                        <div
                          key={key}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                            resumeData.templateId === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                          onClick={() => setResumeData(prev => ({ ...prev, templateId: key }))}
                        >
                          <div className={`w-full h-16 ${template.headerBg} rounded mb-2`}></div>
                          <h3 className="font-medium text-sm">{template.name}</h3>
                          <p className="text-xs text-gray-600">{template.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={resumeData.personalInfo.firstName}
                          onChange={(e) => {
                            console.log("🔍 INPUT CHANGE - First name:", e.target.value);
                            const newData = {
                              ...resumeData,
                              personalInfo: { ...resumeData.personalInfo, firstName: e.target.value }
                            };
                            console.log("🔄 SETTING NEW DATA:", newData.personalInfo);
                            setResumeData(newData);
                          }}
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
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Professional Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Write a brief summary of your professional background..."
                      rows={4}
                      value={resumeData.summary}
                      onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Work Experience
                      <Button onClick={addExperienceItem} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Experience
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {resumeData.experience.map((exp, index) => (
                      <Card key={exp.id} className="p-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="grid grid-cols-2 gap-4 flex-1">
                              <div>
                                <Label>Company</Label>
                                <Input
                                  value={exp.company}
                                  onChange={(e) => updateExperienceItem(exp.id, 'company', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Position</Label>
                                <Input
                                  value={exp.position}
                                  onChange={(e) => updateExperienceItem(exp.id, 'position', e.target.value)}
                                />
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExperienceItem(exp.id)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              rows={3}
                              value={exp.description}
                              onChange={(e) => updateExperienceItem(exp.id, 'description', e.target.value)}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a skill..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.target as HTMLInputElement;
                              if (input.value.trim()) {
                                addSkill(input.value.trim());
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <Button
                          onClick={() => {
                            const input = document.querySelector('input[placeholder="Add a skill..."]') as HTMLInputElement;
                            if (input && input.value.trim()) {
                              addSkill(input.value.trim());
                              input.value = '';
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {resumeData.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="cursor-pointer">
                            {skill}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1 ml-2"
                              onClick={() => removeSkill(skill)}
                            >
                              ×
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Job Analyzer Tab */}
              <TabsContent value="analyzer" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Job Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="jobDescription">Job Description</Label>
                      <Textarea
                        id="jobDescription"
                        placeholder="Paste the complete job description here..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows={8}
                      />
                    </div>
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="w-full"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Target className="h-4 w-4 mr-2" />
                          Analyze Job Match
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {analysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Analysis Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Match Score</span>
                          <span className="text-lg font-bold">{analysis.matchScore}%</span>
                        </div>
                        <Progress value={analysis.matchScore} className="w-full" />
                      </div>

                      {analysis.keySkills.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Matching Skills</h4>
                          <div className="flex flex-wrap gap-1">
                            {analysis.keySkills.map((skill, index) => (
                              <Badge key={index} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysis.missingSkills.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Missing Skills</h4>
                          <div className="flex flex-wrap gap-1">
                            {analysis.missingSkills.map((skill, index) => (
                              <Badge key={index} variant="outline">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium mb-2">Improvement Suggestions</h4>
                        <ul className="space-y-1">
                          {analysis.improvements.map((improvement, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                              <ArrowRight className="h-3 w-3 mt-1 flex-shrink-0" />
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Cover Letter Tab */}
              <TabsContent value="cover-letter" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Cover Letter Generator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input
                          id="jobTitle"
                          value={coverLetterData.jobTitle}
                          onChange={(e) => setCoverLetterData(prev => ({ ...prev, jobTitle: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          value={coverLetterData.companyName}
                          onChange={(e) => setCoverLetterData(prev => ({ ...prev, companyName: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="tone">Tone</Label>
                      <Select
                        value={coverLetterData.tone}
                        onValueChange={(value: any) => setCoverLetterData(prev => ({ ...prev, tone: value }))}
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
                      disabled={isGenerating}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Generate Cover Letter
                        </>
                      )}
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
                        onChange={(e) => setCoverLetterData(prev => ({ ...prev, content: e.target.value }))}
                        rows={15}
                        className="whitespace-pre-wrap"
                      />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Real-time Preview */}
          <div className="lg:sticky lg:top-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Real-time Preview - {templates[resumeData.templateId as keyof typeof templates]?.name || 'Modern'}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      // Basic PDF generation functionality
                      const element = document.createElement('a');
                      const content = `${resumeData.personalInfo.firstName} ${resumeData.personalInfo.lastName} Resume`;
                      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
                      element.setAttribute('download', 'resume.txt');
                      element.style.display = 'none';
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                      
                      toast({
                        title: "Download Started",
                        description: "Resume download initiated. Full PDF generation coming soon.",
                      });
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg border shadow-sm min-h-[600px] overflow-hidden">
                  {/* Header Section */}
                  {resumeData.personalInfo.firstName || resumeData.personalInfo.lastName ? (
                    <div className="bg-blue-600 text-white p-6">
                      <h1 className="text-2xl font-bold">
                        {resumeData.personalInfo.firstName} {resumeData.personalInfo.lastName}
                      </h1>
                      <div className="text-sm mt-2 space-y-1 opacity-90">
                        {resumeData.personalInfo.email && <div>{resumeData.personalInfo.email}</div>}
                        {resumeData.personalInfo.phone && <div>{resumeData.personalInfo.phone}</div>}
                        {resumeData.personalInfo.location && <div>{resumeData.personalInfo.location}</div>}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-200 rounded-lg m-6">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Enter your personal information to see live preview</p>
                      <p className="text-xs mt-2">Start with the Resume Builder tab or Import Resume</p>
                    </div>
                  )}
                  
                  {/* Content Section */}
                  <div className="p-6 space-y-6">
                    {resumeData.summary && (
                      <div>
                        <h2 className="text-lg font-semibold mb-2 text-blue-600">Professional Summary</h2>
                        <p className="text-sm text-gray-700">{resumeData.summary}</p>
                      </div>
                    )}

                    {resumeData.experience.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold mb-2 text-blue-600">Work Experience</h2>
                        <div className="space-y-3">
                          {resumeData.experience.map((exp, index) => (
                            <div key={exp.id} className="border-l-2 border-blue-200 pl-4">
                              <h3 className="font-medium">{exp.position}</h3>
                              <div className="text-sm text-gray-600">{exp.company}</div>
                              {exp.description && (
                                <p className="text-sm text-gray-700 mt-1">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {resumeData.skills.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold mb-2 text-blue-600">Skills</h2>
                        <div className="flex flex-wrap gap-1">
                          {resumeData.skills.map((skill, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {resumeData.education.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold mb-2 text-blue-600">Education</h2>
                        <div className="space-y-2">
                          {resumeData.education.map((edu, index) => (
                            <div key={edu.id} className="border-l-2 border-blue-200 pl-4">
                              <h3 className="font-medium">{edu.degree}</h3>
                              <div className="text-sm text-gray-600">{edu.institution}</div>
                              {edu.field && <div className="text-sm text-gray-500">{edu.field}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Show parsed content info */}
                    {resumeText && (
                      <div className="mt-6 pt-4 border-t">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Imported Resume Content</h3>
                        <div className="bg-gray-50 p-3 rounded text-xs text-gray-700 max-h-32 overflow-y-auto">
                          {resumeText.substring(0, 500)}...
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

