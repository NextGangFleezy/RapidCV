import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import Navigation from "@/components/navigation";
import ResumeForm from "@/components/resume-form";
import ResumePreview from "@/components/resume-preview";
import TemplateSelector from "@/components/template-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { generateResumePDF } from "@/lib/pdf-generator";
import type { AuthUser } from "@/lib/auth";
import type { Resume, InsertResume } from "@shared/schema";
import { Download, Save, Eye } from "@/lib/icons";

interface ResumeBuilderProps {
  user: AuthUser | null;
}

export default function ResumeBuilder({ user }: ResumeBuilderProps) {
  const params = useParams();
  const resumeId = params.id ? parseInt(params.id) : null;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  const [showPreview, setShowPreview] = useState(false);

  const { data: resume, isLoading } = useQuery({
    queryKey: [`/api/resumes/${resumeId}`],
    enabled: !!resumeId,
  });

  const [resumeData, setResumeData] = useState<Partial<InsertResume>>({
    title: "My Resume",
    templateId: "professional",
    personalInfo: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      location: "",
      summary: "",
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
  });

  useEffect(() => {
    if (resume) {
      setResumeData(resume);
    }
  }, [resume]);

  const saveResumeMutation = useMutation({
    mutationFn: async (data: Partial<InsertResume>) => {
      if (!user?.userData?.id) {
        throw new Error("User not authenticated");
      }

      const payload = { ...data, userId: user.userData.id };
      
      if (resumeId) {
        return apiRequest("PATCH", `/api/resumes/${resumeId}`, payload);
      } else {
        return apiRequest("POST", "/api/resumes", payload);
      }
    },
    onSuccess: async (response) => {
      const savedResume = await response.json();
      setResumeData(savedResume);
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.userData?.id}/resumes`] });
      
      toast({
        title: "Success",
        description: "Resume saved successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save resume. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveResumeMutation.mutate(resumeData);
  };

  const handleDownload = () => {
    if (resumeData) {
      generateResumePDF(resumeData as Resume);
      toast({
        title: "Success",
        description: "Resume downloaded successfully!",
      });
    }
  };

  const updateResumeData = (section: string, data: any) => {
    setResumeData(prev => ({
      ...prev,
      [section]: data,
    }));
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
            You need to be signed in to access the resume builder.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading && resumeId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation user={user} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resume Builder</h1>
            <p className="text-gray-600 mt-2">
              Create your professional resume with our easy-to-use builder
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="lg:hidden"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? "Edit" : "Preview"}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={saveResumeMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {saveResumeMutation.isPending ? "Saving..." : "Save"}
            </Button>
            
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className={`${showPreview ? "hidden lg:block" : ""}`}>
            <Card>
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="experience">Experience</TabsTrigger>
                    <TabsTrigger value="education">Education</TabsTrigger>
                    <TabsTrigger value="skills">Skills</TabsTrigger>
                    <TabsTrigger value="template">Template</TabsTrigger>
                  </TabsList>
                  
                  <div className="mt-6">
                    <TabsContent value="personal">
                      <ResumeForm
                        section="personal"
                        data={resumeData}
                        onUpdate={updateResumeData}
                      />
                    </TabsContent>
                    
                    <TabsContent value="experience">
                      <ResumeForm
                        section="experience"
                        data={resumeData}
                        onUpdate={updateResumeData}
                      />
                    </TabsContent>
                    
                    <TabsContent value="education">
                      <ResumeForm
                        section="education"
                        data={resumeData}
                        onUpdate={updateResumeData}
                      />
                    </TabsContent>
                    
                    <TabsContent value="skills">
                      <ResumeForm
                        section="skills"
                        data={resumeData}
                        onUpdate={updateResumeData}
                      />
                    </TabsContent>
                    
                    <TabsContent value="template">
                      <TemplateSelector
                        selectedTemplate={resumeData.templateId || "professional"}
                        onTemplateChange={(templateId) => 
                          updateResumeData("templateId", templateId)
                        }
                      />
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className={`${!showPreview ? "hidden lg:block" : ""}`}>
            <div className="sticky top-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                  
                  <ResumePreview 
                    resumeData={resumeData as Resume} 
                    templateId={resumeData.templateId || "professional"}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
