import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AuthUser } from "@/lib/auth";
import type { CoverLetter } from "@shared/schema";
import { MessageSquare, Download, Loader2, FileText } from "@/lib/icons";

interface CoverLetterProps {
  user: AuthUser | null;
}

export default function CoverLetter({ user }: CoverLetterProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    jobTitle: "",
    companyName: "",
    jobDescription: "",
    resumeId: "",
  });
  const [generatedLetter, setGeneratedLetter] = useState<CoverLetter | null>(null);

  const { data: resumes } = useQuery({
    queryKey: [`/api/users/${user?.userData?.id}/resumes`],
    enabled: !!user?.userData?.id,
  });

  const { data: coverLetters } = useQuery({
    queryKey: [`/api/users/${user?.userData?.id}/cover-letters`],
    enabled: !!user?.userData?.id,
  });

  const generateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/cover-letters/generate", data);
    },
    onSuccess: async (response) => {
      const coverLetter = await response.json();
      setGeneratedLetter(coverLetter);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.userData?.id}/cover-letters`] });
      toast({
        title: "Success",
        description: "Cover letter generated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate cover letter. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!formData.jobTitle || !formData.companyName || !formData.jobDescription || !formData.resumeId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate(formData);
  };

  const handleDownload = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Please sign in to continue
          </h1>
          <p className="text-gray-600">
            You need to be signed in to access the cover letter generator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Cover Letter Generator</h1>
          <p className="text-gray-600 mt-2">
            Generate personalized cover letters that perfectly match job descriptions using AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                Generate Cover Letter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="resumeSelect">Select Resume</Label>
                <Select 
                  value={formData.resumeId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, resumeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a resume to base the cover letter on" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((resume: any) => (
                      <SelectItem key={resume.id} value={resume.id.toString()}>
                        {resume.title} - {resume.personalInfo?.firstName} {resume.personalInfo?.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                  placeholder="e.g., Senior Frontend Developer"
                />
              </div>

              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="e.g., Google"
                />
              </div>

              <div>
                <Label htmlFor="jobDescription">Job Description</Label>
                <Textarea
                  id="jobDescription"
                  rows={8}
                  value={formData.jobDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
                  placeholder="Paste the complete job description here..."
                />
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="w-full bg-purple-600 text-white hover:bg-purple-700"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Generate Cover Letter
                  </>
                )}
              </Button>

              <div className="flex items-center text-sm text-gray-500 mt-4">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                Your data is secure and never stored permanently
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            {generatedLetter && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>Generated Cover Letter</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(
                      generatedLetter.content,
                      `${generatedLetter.jobTitle}_${generatedLetter.companyName}_CoverLetter.txt`
                    )}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg p-6 border whitespace-pre-wrap font-mono text-sm">
                    {generatedLetter.content}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Previous Cover Letters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Previous Cover Letters
                </CardTitle>
              </CardHeader>
              <CardContent>
                {coverLetters && coverLetters.length > 0 ? (
                  <div className="space-y-3">
                    {coverLetters.map((letter: CoverLetter) => (
                      <div
                        key={letter.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {letter.jobTitle} at {letter.companyName}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {new Date(letter.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(
                            letter.content,
                            `${letter.jobTitle}_${letter.companyName}_CoverLetter.txt`
                          )}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No cover letters generated yet. Create your first one above!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
