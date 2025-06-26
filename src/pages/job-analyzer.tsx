import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AuthUser } from "@/lib/auth";
import type { JobAnalysis } from "@shared/schema";
import { BarChart3, CheckCircle, AlertTriangle, XCircle, Loader2, FileSearch } from "@/lib/icons";

interface JobAnalyzerProps {
  user: AuthUser | null;
}

export default function JobAnalyzer({ user }: JobAnalyzerProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    jobDescription: "",
    resumeId: "",
  });
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);

  const { data: resumes } = useQuery({
    queryKey: [`/api/users/${user?.userData?.id}/resumes`],
    enabled: !!user?.userData?.id,
  });

  const { data: jobAnalyses } = useQuery({
    queryKey: [`/api/users/${user?.userData?.id}/job-analyses`],
    enabled: !!user?.userData?.id,
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/job-analyses", data);
    },
    onSuccess: async (response) => {
      const analysisResult = await response.json();
      setAnalysis(analysisResult);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.userData?.id}/job-analyses`] });
      toast({
        title: "Success",
        description: "Job analysis completed successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to analyze job match. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (!formData.jobDescription || !formData.resumeId) {
      toast({
        title: "Missing Information",
        description: "Please select a resume and provide a job description.",
        variant: "destructive",
      });
      return;
    }

    analyzeMutation.mutate(formData);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-warning";
    return "bg-destructive";
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
            You need to be signed in to access the job analyzer.
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
          <h1 className="text-3xl font-bold text-gray-900">Job Match Analyzer</h1>
          <p className="text-gray-600 mt-2">
            Analyze how well your resume matches job requirements and get improvement suggestions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-8 h-8 bg-success rounded-lg flex items-center justify-center mr-3">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                Analyze Job Match
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
                    <SelectValue placeholder="Choose a resume to analyze" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes?.map((resume: any) => (
                      <SelectItem key={resume.id} value={resume.id.toString()}>
                        {resume.title} - {resume.personalInfo?.firstName} {resume.personalInfo?.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="jobDescription">Job Description</Label>
                <Textarea
                  id="jobDescription"
                  rows={12}
                  value={formData.jobDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
                  placeholder="Paste the complete job description here..."
                />
              </div>

              <Button 
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending}
                className="w-full bg-success text-white hover:bg-green-700"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analyze Match Score
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            {analysis && (
              <>
                {/* Match Score */}
                <Card>
                  <CardHeader>
                    <CardTitle>Match Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-700">Overall Match</span>
                      <span className={`text-3xl font-bold ${getScoreColor(analysis.matchScore || 0)}`}>
                        {analysis.matchScore}%
                      </span>
                    </div>
                    <Progress 
                      value={analysis.matchScore || 0} 
                      className="w-full h-3"
                    />
                    <div className="mt-4">
                      {analysis.matchScore && analysis.matchScore >= 80 && (
                        <div className="flex items-center text-success text-sm">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Excellent match! Your resume aligns well with the job requirements.
                        </div>
                      )}
                      {analysis.matchScore && analysis.matchScore >= 60 && analysis.matchScore < 80 && (
                        <div className="flex items-center text-warning text-sm">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Good match with room for improvement.
                        </div>
                      )}
                      {analysis.matchScore && analysis.matchScore < 60 && (
                        <div className="flex items-center text-destructive text-sm">
                          <XCircle className="w-4 h-4 mr-2" />
                          Consider updating your resume to better match the job requirements.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Strengths */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-success">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.strengths?.map((strength, index) => (
                        <div key={index} className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-success mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Areas for Improvement */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-warning">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Areas for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.improvements?.map((improvement, index) => (
                        <div key={index} className="flex items-start">
                          <AlertTriangle className="w-4 h-4 text-warning mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{improvement}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Missing Skills */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-destructive">
                      <XCircle className="w-5 h-5 mr-2" />
                      Missing Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.missingSkills?.map((skill, index) => (
                        <Badge key={index} variant="destructive" className="mr-2 mb-2">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Previous Analyses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileSearch className="w-5 h-5 mr-2" />
                  Previous Analyses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jobAnalyses && jobAnalyses.length > 0 ? (
                  <div className="space-y-3">
                    {jobAnalyses.map((analysis: JobAnalysis) => (
                      <div
                        key={analysis.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => setAnalysis(analysis)}
                      >
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {analysis.jobDescription.substring(0, 100)}...
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(analysis.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center ml-4">
                          <span className={`text-lg font-bold ${getScoreColor(analysis.matchScore || 0)}`}>
                            {analysis.matchScore}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No job analyses yet. Create your first analysis above!
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
