import { useState } from "react";
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
import { 
  Search, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Target, 
  Zap, 
  ArrowRight,
  Download,
  RefreshCw
} from "@/lib/icons";
import { type AuthUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { useToast } from "@/hooks/use-toast";

interface JobAnalyzerProps {
  user: AuthUser | null;
}

interface JobAnalysis {
  matchScore: number;
  keySkills: string[];
  missingSkills: string[];
  strengths: string[];
  improvements: string[];
  optimizedSummary?: string;
  optimizedExperience?: any[];
  keywords: string[];
}

interface ResumeData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
  };
  summary: string;
  experience: any[];
  education: any[];
  skills: string[];
  projects: any[];
}

const defaultResumeData: ResumeData = {
  personalInfo: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: ""
  },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  projects: []
};

export default function JobAnalyzer({ user }: JobAnalyzerProps) {
  const { toast } = useToast();
  const [jobDescription, setJobDescription] = useState("");
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Fetch user's resumes
  const { data: resumes = [] } = useQuery<any[]>({
    queryKey: ['/api/resumes'],
    enabled: !!user,
  });

  // Analyze job mutation
  const analyzeMutation = useMutation({
    mutationFn: async ({ jobDesc, resume }: { jobDesc: string; resume: ResumeData }) => {
      // Check if we have a saved resume to use
      let resumeId = null;
      if (user && selectedResumeId && resumes) {
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
          } else {
            console.warn('API analysis failed, falling back to offline analysis');
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
      setShowComparison(true);
      toast({
        title: "Analysis Complete",
        description: "Job analysis and resume optimization suggestions generated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze job posting. Please try again.",
        variant: "destructive",
      });
      console.error("Analysis error:", error);
    },
  });

  const performOfflineAnalysis = (jobDesc: string, resume: ResumeData): JobAnalysis => {
    // Extract keywords from job description
    const jobWords = jobDesc.toLowerCase()
      .split(/[\s,\.\!\?\;\:]+/)
      .filter(word => word.length > 3)
      .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word));

    // Common tech keywords
    const techKeywords = ['react', 'javascript', 'python', 'java', 'node', 'aws', 'docker', 'kubernetes', 'sql', 'mongodb', 'git', 'agile', 'scrum', 'api', 'rest', 'graphql', 'typescript', 'html', 'css', 'angular', 'vue', 'express', 'django', 'flask', 'spring', 'microservices', 'devops', 'ci/cd', 'testing', 'jest', 'cypress'];
    
    const jobKeywords = jobWords.filter(word => techKeywords.includes(word) || word.length > 4);
    const uniqueKeywords = Array.from(new Set(jobKeywords));

    // Compare with resume skills
    const resumeSkills = resume.skills.map(skill => skill.toLowerCase());
    const resumeText = (resume.summary + ' ' + resume.experience.map(exp => exp.description || '').join(' ')).toLowerCase();

    const matchingSkills = uniqueKeywords.filter(keyword => 
      resumeSkills.some(skill => skill.includes(keyword)) || resumeText.includes(keyword)
    );

    const missingSkills = uniqueKeywords.filter(keyword => 
      !resumeSkills.some(skill => skill.includes(keyword)) && !resumeText.includes(keyword)
    );

    const matchScore = Math.round((matchingSkills.length / Math.max(uniqueKeywords.length, 1)) * 100);

    return {
      matchScore,
      keySkills: uniqueKeywords.slice(0, 10),
      missingSkills: missingSkills.slice(0, 8),
      strengths: matchingSkills.slice(0, 6),
      improvements: [
        "Add more specific technical achievements with metrics",
        "Include keywords from the job description in your experience",
        "Quantify your impact with numbers and percentages",
        "Tailor your summary to match the role requirements"
      ],
      keywords: uniqueKeywords.slice(0, 15),
      optimizedSummary: generateOptimizedSummary(resume.summary, uniqueKeywords.slice(0, 5))
    };
  };

  const generateOptimizedSummary = (originalSummary: string, keywords: string[]): string => {
    if (!originalSummary) {
      return `Experienced professional with expertise in ${keywords.slice(0, 3).join(', ')}. Proven track record of delivering high-quality solutions and driving business results through technical excellence and collaborative problem-solving.`;
    }

    // Simple optimization - ensure key keywords are included
    let optimized = originalSummary;
    const missingKeywords = keywords.filter(keyword => 
      !originalSummary.toLowerCase().includes(keyword.toLowerCase())
    );

    if (missingKeywords.length > 0) {
      optimized += ` Skilled in ${missingKeywords.slice(0, 2).join(' and ')}.`;
    }

    return optimized;
  };

  const loadResumeData = (resumeId: string) => {
    if (!Array.isArray(resumes)) return;
    
    const resume = resumes.find((r: any) => r?.id?.toString() === resumeId);
    if (resume) {
      setResumeData({
        personalInfo: resume.personalInfo || defaultResumeData.personalInfo,
        summary: resume.summary || "",
        experience: resume.experience || [],
        education: resume.education || [],
        skills: resume.skills || [],
        projects: resume.projects || []
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

    if (!resumeData.personalInfo.firstName && resumeData.skills.length === 0 && !selectedResumeId) {
      toast({
        title: "Missing Resume Data",
        description: "Please select a resume or enter your information manually.",
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

  const applyOptimizations = () => {
    if (!analysis) return;

    // Update resume data with optimized content
    if (analysis.optimizedSummary) {
      setResumeData(prev => ({
        ...prev,
        summary: analysis.optimizedSummary!
      }));
    }

    // Add missing skills that are relevant
    const relevantMissingSkills = analysis.missingSkills.slice(0, 3);
    setResumeData(prev => ({
      ...prev,
      skills: [...prev.skills, ...relevantMissingSkills]
    }));

    toast({
      title: "Optimizations Applied",
      description: "Your resume has been updated with AI suggestions.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      <div className="container max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Job Description Analyzer</h1>
          <p className="text-gray-600 mt-2">
            Analyze job postings and optimize your resume for better matches
            {!user && (
              <span className="block text-sm text-amber-600 mt-1">
                Working offline with basic analysis features
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Job Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="jobDescription">Job Description *</Label>
                  <Textarea
                    id="jobDescription"
                    placeholder="Paste the complete job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={8}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Copy and paste the full job posting for accurate analysis
                  </p>
                </div>

                {user && resumes.length > 0 && (
                  <div>
                    <Label htmlFor="resumeSelect">Select Resume (Optional)</Label>
                    <Select
                      value={selectedResumeId}
                      onValueChange={(value) => {
                        setSelectedResumeId(value);
                        loadResumeData(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an existing resume..." />
                      </SelectTrigger>
                      <SelectContent>
                        {resumes.map((resume) => (
                          <SelectItem key={resume.id} value={resume.id.toString()}>
                            {resume.title || `Resume ${resume.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Resume Information</h3>
                  
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
                        placeholder="John"
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
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="summary">Professional Summary</Label>
                    <Textarea
                      id="summary"
                      value={resumeData.summary}
                      onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                      placeholder="Brief professional summary..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Skills</Label>
                    <div className="flex flex-wrap gap-2 mt-2 mb-2">
                      {resumeData.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <button
                            className="ml-1 hover:text-red-500"
                            onClick={() => setResumeData(prev => ({
                              ...prev,
                              skills: prev.skills.filter((_, i) => i !== index)
                            }))}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Input
                      placeholder="Add skill and press Enter"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const skill = e.currentTarget.value.trim();
                          if (skill && !resumeData.skills.includes(skill)) {
                            setResumeData(prev => ({
                              ...prev,
                              skills: [...prev.skills, skill]
                            }));
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAnalyze}
                  className="w-full"
                  disabled={isAnalyzing}
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
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {analysis ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Match Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Overall Match</span>
                        <span className="text-2xl font-bold text-green-600">{analysis.matchScore}%</span>
                      </div>
                      <Progress value={analysis.matchScore} className="h-3" />
                      <p className="text-sm text-gray-600 mt-1">
                        {analysis.matchScore >= 80 ? "Excellent match!" : 
                         analysis.matchScore >= 60 ? "Good match with room for improvement" :
                         analysis.matchScore >= 40 ? "Fair match - consider optimizations" :
                         "Low match - significant improvements needed"}
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Your Strengths ({analysis.strengths.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.strengths.map((strength, index) => (
                          <Badge key={index} variant="default" className="bg-green-100 text-green-800">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-amber-600 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Missing Skills ({analysis.missingSkills.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.missingSkills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="border-amber-300 text-amber-700">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-blue-600 mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Key Job Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-blue-600" />
                      Optimization Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Improvement Recommendations</h4>
                      <ul className="space-y-2">
                        {analysis.improvements.map((improvement, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {analysis.optimizedSummary && (
                      <div>
                        <h4 className="font-semibold mb-2">Optimized Summary</h4>
                        <div className="bg-blue-50 p-3 rounded border">
                          <p className="text-sm text-blue-900">{analysis.optimizedSummary}</p>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={applyOptimizations}
                      className="w-full"
                      variant="outline"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Apply AI Optimizations
                    </Button>

                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Review all suggestions carefully. AI recommendations should be tailored to your actual experience.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12 text-gray-500">
                    <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Ready to Analyze</h3>
                    <p>Paste a job description and fill in your resume details to get started.</p>
                    <p className="text-sm mt-2">
                      Get insights on job match percentage, missing skills, and optimization suggestions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}