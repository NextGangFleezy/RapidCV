import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Mail, 
  FileText, 
  Zap, 
  Download, 
  Save, 
  RefreshCw,
  CopyIcon,
  Edit3,
  User,
  Briefcase
} from "@/lib/icons";
import { type AuthUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { useToast } from "@/hooks/use-toast";

interface CoverLetterProps {
  user: AuthUser | null;
}

interface CoverLetterData {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  tone: 'professional' | 'casual' | 'persuasive' | 'enthusiastic';
  content: string;
  resumeId?: number;
}

const toneOptions = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-appropriate' },
  { value: 'casual', label: 'Casual', description: 'Friendly and approachable' },
  { value: 'persuasive', label: 'Persuasive', description: 'Compelling and results-focused' },
  { value: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic and passionate' }
];

export default function CoverLetter({ user }: CoverLetterProps) {
  const { toast } = useToast();
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData>({
    jobTitle: "",
    companyName: "",
    jobDescription: "",
    tone: 'professional',
    content: "",
    resumeId: undefined
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");

  // Fetch user's resumes
  const { data: resumes = [] } = useQuery<any[]>({
    queryKey: ['/api/resumes'],
    enabled: !!user,
  });

  // Fetch existing cover letters
  const { data: coverLetters = [] } = useQuery<any[]>({
    queryKey: ['/api/cover-letters'],
    enabled: !!user,
  });

  // Generate cover letter mutation
  const generateMutation = useMutation({
    mutationFn: async (data: Omit<CoverLetterData, 'content'>) => {
      if (!user) {
        // Offline generation - create basic template
        return generateOfflineCoverLetter(data);
      }
      
      const response = await fetch("/api/cover-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          userId: user.userData?.id
        }),
      });
      return await response.json();
    },
    onSuccess: (result) => {
      setCoverLetterData(prev => ({ ...prev, content: result.content || result }));
      toast({
        title: "Cover Letter Generated",
        description: "Your personalized cover letter is ready for review.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed", 
        description: "Failed to generate cover letter. Please try again.",
        variant: "destructive",
      });
      console.error("Generation error:", error);
    },
  });

  const generateOfflineCoverLetter = (data: Omit<CoverLetterData, 'content'>): string => {
    const today = new Date().toLocaleDateString();
    
    return `Dear Hiring Manager,

I am writing to express my strong interest in the ${data.jobTitle} position at ${data.companyName}. With my background and skills, I am confident that I would be a valuable addition to your team.

${getToneIntro(data.tone)}

Based on the job description, I understand that you are looking for someone who can contribute to ${data.companyName}'s continued success. My experience has prepared me well for this role, and I am particularly drawn to the opportunity to work with your innovative team.

Key qualifications that make me an ideal candidate:
• Proven track record of delivering results in similar roles
• Strong technical and analytical skills
• Excellent communication and collaboration abilities
• Passion for continuous learning and growth

I am excited about the possibility of contributing to ${data.companyName} and would welcome the opportunity to discuss how my skills and enthusiasm can benefit your team. Thank you for considering my application.

${getToneClosing(data.tone)}

Sincerely,
[Your Name]

---
Generated on ${today}
Tone: ${data.tone.charAt(0).toUpperCase() + data.tone.slice(1)}`;
  };

  const getToneIntro = (tone: string): string => {
    switch (tone) {
      case 'casual':
        return "I'm really excited about this opportunity and think I'd be a great fit for your team.";
      case 'persuasive':
        return "Your search for the ideal candidate ends here - I bring exactly the combination of skills and experience you need.";
      case 'enthusiastic':
        return "I am thrilled to apply for this position! Your company's mission resonates deeply with my professional values and career aspirations.";
      default:
        return "I am pleased to submit my application for consideration.";
    }
  };

  const getToneClosing = (tone: string): string => {
    switch (tone) {
      case 'casual':
        return "Looking forward to hearing from you soon!";
      case 'persuasive':
        return "I am confident that a conversation with me will convince you that I am the right person for this role.";
      case 'enthusiastic':
        return "I can't wait to bring my passion and expertise to your team!";
      default:
        return "I look forward to the opportunity to discuss my qualifications with you.";
    }
  };

  const handleGenerate = async () => {
    if (!coverLetterData.jobTitle || !coverLetterData.companyName) {
      toast({
        title: "Missing Information",
        description: "Please fill in the job title and company name.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync({
        jobTitle: coverLetterData.jobTitle,
        companyName: coverLetterData.companyName,
        jobDescription: coverLetterData.jobDescription,
        tone: coverLetterData.tone,
        resumeId: selectedResumeId ? parseInt(selectedResumeId) : undefined
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(coverLetterData.content);
    toast({
      title: "Copied to Clipboard",
      description: "Cover letter content has been copied.",
    });
  };

  const downloadCoverLetter = () => {
    const element = document.createElement('a');
    const file = new Blob([coverLetterData.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `cover-letter-${coverLetterData.companyName.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Download Started",
      description: "Your cover letter has been downloaded.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      <div className="container max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Cover Letter Generator</h1>
          <p className="text-gray-600 mt-2">
            Create personalized cover letters tailored to specific job applications
            {!user && (
              <span className="block text-sm text-amber-600 mt-1">
                Working offline with template-based generation
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
                  <Edit3 className="h-5 w-5" />
                  Cover Letter Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jobTitle">Job Title *</Label>
                    <Input
                      id="jobTitle"
                      value={coverLetterData.jobTitle}
                      onChange={(e) => setCoverLetterData(prev => ({ ...prev, jobTitle: e.target.value }))}
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={coverLetterData.companyName}
                      onChange={(e) => setCoverLetterData(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder="Tech Corp"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tone">Writing Tone</Label>
                  <Select
                    value={coverLetterData.tone}
                    onValueChange={(value: any) => setCoverLetterData(prev => ({ ...prev, tone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {toneOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-gray-500">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {user && resumes.length > 0 && (
                  <div>
                    <Label htmlFor="resumeSelect">Link to Resume (Optional)</Label>
                    <Select
                      value={selectedResumeId}
                      onValueChange={setSelectedResumeId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a resume to personalize content..." />
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

                <div>
                  <Label htmlFor="jobDescription">Job Description (Optional)</Label>
                  <Textarea
                    id="jobDescription"
                    value={coverLetterData.jobDescription}
                    onChange={(e) => setCoverLetterData(prev => ({ ...prev, jobDescription: e.target.value }))}
                    placeholder="Paste the job description to create more targeted content..."
                    rows={6}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Including the job description helps create more personalized content
                  </p>
                </div>

                <Button
                  onClick={handleGenerate}
                  className="w-full"
                  disabled={isGenerating}
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

            {/* Previous Cover Letters */}
            {user && Array.isArray(coverLetters) && coverLetters.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Previous Cover Letters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {coverLetters.slice(0, 5).map((letter: any, index: number) => (
                      <div key={letter.id || index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <h4 className="font-medium">{letter.jobTitle}</h4>
                          <p className="text-sm text-gray-600">{letter.companyName}</p>
                          <p className="text-xs text-gray-500">
                            {letter.createdAt ? new Date(letter.createdAt).toLocaleDateString() : 'Recent'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCoverLetterData(prev => ({ 
                            ...prev, 
                            content: letter.content,
                            jobTitle: letter.jobTitle,
                            companyName: letter.companyName
                          }))}
                        >
                          Load
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Generated Cover Letter
                </CardTitle>
                {coverLetterData.content && (
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={copyToClipboard}>
                      <CopyIcon className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button size="sm" variant="outline" onClick={downloadCoverLetter}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {coverLetterData.content ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="secondary">
                        {coverLetterData.tone.charAt(0).toUpperCase() + coverLetterData.tone.slice(1)} Tone
                      </Badge>
                      <Badge variant="outline">
                        {coverLetterData.content.split(/\s+/).length} words
                      </Badge>
                    </div>
                    
                    <Textarea
                      value={coverLetterData.content}
                      onChange={(e) => setCoverLetterData(prev => ({ ...prev, content: e.target.value }))}
                      rows={20}
                      className="font-mono text-sm resize-none"
                    />
                    
                    <Alert>
                      <Edit3 className="h-4 w-4" />
                      <AlertDescription>
                        Review and customize the generated content to match your personal style and specific experiences.
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Ready to Generate</h3>
                    <p>Fill in the job details and click "Generate Cover Letter" to get started.</p>
                    <p className="text-sm mt-2">
                      The AI will create a personalized cover letter based on your inputs and selected tone.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💡 Cover Letter Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-gray-600">
                  <li>• Keep it concise - aim for 3-4 paragraphs</li>
                  <li>• Mention specific achievements with numbers</li>
                  <li>• Research the company and reference their values</li>
                  <li>• Customize each letter for the specific role</li>
                  <li>• End with a clear call to action</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}