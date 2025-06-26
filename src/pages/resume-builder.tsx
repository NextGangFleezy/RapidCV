import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Download, Save, Eye, Edit, FileText, User, Briefcase } from "@/lib/icons";
import { type AuthUser } from "@/lib/auth";
import { type Resume, type InsertResume } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { generateResumePDF } from "@/lib/pdf-generator";
import Navigation from "@/components/navigation";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";

interface ResumeBuilderProps {
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

const templates = [
  { id: "modern", name: "Modern", description: "Clean and contemporary design" },
  { id: "classic", name: "Classic", description: "Traditional professional layout" },
  { id: "minimal", name: "Minimal", description: "Simple and elegant" },
];

export default function ResumeBuilder({ user }: ResumeBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const params = useParams();
  const [, setLocation] = useLocation();
  const resumeId = params.id ? parseInt(params.id) : null;
  
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  const [activeTab, setActiveTab] = useState("personal");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing resume if editing
  const { data: existingResume, isLoading } = useQuery<any>({
    queryKey: ['/api/resumes', resumeId],
    enabled: !!resumeId && !!user,
  });

  // Load resume data when fetched
  useEffect(() => {
    if (existingResume && typeof existingResume === 'object') {
      setResumeData({
        title: existingResume.title || "My Resume",
        personalInfo: existingResume.personalInfo || defaultResumeData.personalInfo,
        summary: existingResume.summary || "",
        experience: existingResume.experience || [],
        education: existingResume.education || [],
        skills: existingResume.skills || [],
        projects: existingResume.projects || [],
        templateId: existingResume.templateId || "modern"
      });
    }
  }, [existingResume]);

  // Save/Update resume mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ResumeData) => {
      // If no user, just save locally and show success message
      if (!user?.userData?.id) {
        localStorage.setItem('resumeData', JSON.stringify(data));
        return { id: 'local', ...data };
      }

      const resumePayload = {
        userId: user.userData.id,
        title: data.title,
        personalInfo: data.personalInfo,
        summary: data.summary,
        experience: data.experience,
        education: data.education,
        skills: data.skills,
        projects: data.projects,
        templateId: data.templateId
      };

      let response;
      if (resumeId) {
        response = await fetch(`/api/resumes/${resumeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resumePayload),
        });
      } else {
        response = await fetch("/api/resumes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resumePayload),
        });
      }
      return await response.json();
    },
    onSuccess: (savedResume) => {
      toast({
        title: "Resume Saved",
        description: user ? "Your resume has been saved successfully." : "Resume saved locally in your browser.",
      });
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
        
        // Redirect to edit mode if creating new resume
        if (!resumeId && savedResume && typeof savedResume === 'object' && 'id' in savedResume) {
          setLocation(`/builder/${savedResume.id}`);
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: "Failed to save resume. Please try again.",
        variant: "destructive",
      });
      console.error("Save error:", error);
    },
  });

  // Load from localStorage if no user
  useEffect(() => {
    if (!user && !resumeId) {
      const saved = localStorage.getItem('resumeData');
      if (saved) {
        try {
          const parsedData = JSON.parse(saved);
          setResumeData(parsedData);
        } catch (e) {
          console.error('Failed to load saved resume data:', e);
        }
      }
    }
  }, [user, resumeId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveMutation.mutateAsync(resumeData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    try {
      generateResumePDF(resumeData as any);
      toast({
        title: "PDF Generated",
        description: "Your resume PDF has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addExperience = () => {
    const newExperience: ExperienceItem = {
      id: nanoid(),
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

  const updateExperience = (id: string, field: keyof ExperienceItem, value: any) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const addEducation = () => {
    const newEducation: EducationItem = {
      id: nanoid(),
      institution: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      gpa: "",
      honors: ""
    };
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, newEducation]
    }));
  };

  const updateEducation = (id: string, field: keyof EducationItem, value: any) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const addProject = () => {
    const newProject: ProjectItem = {
      id: nanoid(),
      name: "",
      description: "",
      technologies: [],
      url: "",
      startDate: "",
      endDate: ""
    };
    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, newProject]
    }));
  };

  const updateProject = (id: string, field: keyof ProjectItem, value: any) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map(project => 
        project.id === id ? { ...project, [field]: value } : project
      )
    }));
  };

  const removeProject = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter(project => project.id !== id)
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
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      <div className="container max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Resume Builder</h1>
          <p className="text-gray-600 mt-2">
            {resumeId ? 'Edit your resume' : 'Create your professional resume'}
            {!user && (
              <span className="block text-sm text-amber-600 mt-1">
                Working offline - Sign in to save your resume permanently
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Resume Editor</CardTitle>
                  <Input 
                    className="mt-2 font-semibold"
                    placeholder="Resume Title"
                    value={resumeData.title}
                    onChange={(e) => setResumeData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleSave} 
                    variant="outline" 
                    size="sm"
                    disabled={isSaving || saveMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button onClick={handleDownload} size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3 lg:grid-cols-6 mb-6">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="experience">Experience</TabsTrigger>
                    <TabsTrigger value="education">Education</TabsTrigger>
                    <TabsTrigger value="skills">Skills</TabsTrigger>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
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
                        <Label htmlFor="lastName">Last Name *</Label>
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
                      <Label htmlFor="email">Email *</Label>
                      <Input 
                        id="email" 
                        type="email"
                        value={resumeData.personalInfo.email}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, email: e.target.value }
                        }))}
                        placeholder="john.doe@email.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input 
                        id="phone" 
                        value={resumeData.personalInfo.phone}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, phone: e.target.value }
                        }))}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input 
                        id="location" 
                        value={resumeData.personalInfo.location}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, location: e.target.value }
                        }))}
                        placeholder="San Francisco, CA"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input 
                        id="website" 
                        value={resumeData.personalInfo.website || ''}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, website: e.target.value }
                        }))}
                        placeholder="johndoe.dev"
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input 
                        id="linkedin" 
                        value={resumeData.personalInfo.linkedin || ''}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, linkedin: e.target.value }
                        }))}
                        placeholder="linkedin.com/in/johndoe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="github">GitHub</Label>
                      <Input 
                        id="github" 
                        value={resumeData.personalInfo.github || ''}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, github: e.target.value }
                        }))}
                        placeholder="github.com/johndoe"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="summary" className="space-y-4">
                    <div>
                      <Label htmlFor="summary">Professional Summary</Label>
                      <Textarea 
                        id="summary" 
                        rows={6}
                        placeholder="Write a compelling summary of your professional background, key skills, and career objectives..."
                        value={resumeData.summary}
                        onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Tip: Keep it concise (2-3 sentences) and highlight your most relevant achievements.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="experience" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Work Experience</h3>
                      <Button onClick={addExperience} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Experience
                      </Button>
                    </div>
                    
                    {resumeData.experience.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No work experience added yet.</p>
                        <p className="text-sm">Click "Add Experience" to get started.</p>
                      </div>
                    ) : (
                      resumeData.experience.map((exp, index) => (
                        <Card key={exp.id} className="p-4">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-gray-900">Experience #{index + 1}</h4>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeExperience(exp.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Job Title *</Label>
                                <Input 
                                  placeholder="Software Engineer" 
                                  value={exp.position}
                                  onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Company *</Label>
                                <Input 
                                  placeholder="Tech Corp" 
                                  value={exp.company}
                                  onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Start Date</Label>
                                <Input 
                                  placeholder="2022-01" 
                                  value={exp.startDate}
                                  onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>End Date</Label>
                                <Input 
                                  placeholder="2023-12" 
                                  value={exp.endDate || ''}
                                  onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                                  disabled={exp.current}
                                />
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id={`current-${exp.id}`}
                                checked={exp.current}
                                onCheckedChange={(checked) => updateExperience(exp.id, 'current', checked)}
                              />
                              <Label htmlFor={`current-${exp.id}`}>I currently work here</Label>
                            </div>
                            
                            <div>
                              <Label>Job Description</Label>
                              <Textarea 
                                placeholder="Describe your responsibilities, achievements, and impact in this role..."
                                value={exp.description}
                                onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                                rows={3}
                              />
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="education" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Education</h3>
                      <Button onClick={addEducation} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Education
                      </Button>
                    </div>
                    
                    {resumeData.education.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No education added yet.</p>
                        <p className="text-sm">Click "Add Education" to get started.</p>
                      </div>
                    ) : (
                      resumeData.education.map((edu, index) => (
                        <Card key={edu.id} className="p-4">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-gray-900">Education #{index + 1}</h4>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeEducation(edu.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div>
                              <Label>Institution *</Label>
                              <Input 
                                placeholder="University of Technology" 
                                value={edu.institution}
                                onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Degree *</Label>
                                <Input 
                                  placeholder="Bachelor of Science" 
                                  value={edu.degree}
                                  onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Field of Study</Label>
                                <Input 
                                  placeholder="Computer Science" 
                                  value={edu.field || ''}
                                  onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label>Start Date</Label>
                                <Input 
                                  placeholder="2016-09" 
                                  value={edu.startDate}
                                  onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>End Date</Label>
                                <Input 
                                  placeholder="2020-05" 
                                  value={edu.endDate || ''}
                                  onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>GPA</Label>
                                <Input 
                                  placeholder="3.8" 
                                  value={edu.gpa || ''}
                                  onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="skills" className="space-y-4">
                    <div>
                      <Label>Technical Skills</Label>
                      <div className="flex flex-wrap gap-2 mt-2 mb-4">
                        {resumeData.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {skill}
                            <button 
                              className="ml-1 hover:text-red-500"
                              onClick={() => removeSkill(skill)}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <Input 
                        placeholder="Add a skill and press Enter (e.g., JavaScript, React, Python)"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const skill = e.currentTarget.value.trim();
                            if (skill) {
                              addSkill(skill);
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Add relevant technical skills, programming languages, frameworks, tools, etc.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="projects" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Projects</h3>
                      <Button onClick={addProject} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Project
                      </Button>
                    </div>
                    
                    {resumeData.projects.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No projects added yet.</p>
                        <p className="text-sm">Click "Add Project" to showcase your work.</p>
                      </div>
                    ) : (
                      resumeData.projects.map((project, index) => (
                        <Card key={project.id} className="p-4">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-gray-900">Project #{index + 1}</h4>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeProject(project.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div>
                              <Label>Project Name *</Label>
                              <Input 
                                placeholder="E-commerce Platform" 
                                value={project.name}
                                onChange={(e) => updateProject(project.id, 'name', e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <Label>Description</Label>
                              <Textarea 
                                placeholder="Describe what the project does, your role, and key achievements..."
                                value={project.description}
                                onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                                rows={3}
                              />
                            </div>
                            
                            <div>
                              <Label>URL (GitHub, Live Demo, etc.)</Label>
                              <Input 
                                placeholder="https://github.com/username/project" 
                                value={project.url || ''}
                                onChange={(e) => updateProject(project.id, 'url', e.target.value)}
                              />
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Template Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Template</CardTitle>
              </CardHeader>
              <CardContent>
                <Select 
                  value={resumeData.templateId} 
                  onValueChange={(value) => setResumeData(prev => ({ ...prev, templateId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} - {template.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white border rounded-lg p-8 shadow-sm min-h-[800px] max-h-[1000px] overflow-y-auto">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {resumeData.personalInfo.firstName || 'First Name'} {resumeData.personalInfo.lastName || 'Last Name'}
                    </h1>
                    <div className="text-gray-600 mt-2">
                      <p>
                        {resumeData.personalInfo.email || 'email@example.com'} • {resumeData.personalInfo.phone || '(555) 123-4567'}
                      </p>
                      <p>{resumeData.personalInfo.location || 'City, State'}</p>
                      {(resumeData.personalInfo.website || resumeData.personalInfo.linkedin) && (
                        <p className="text-sm">
                          {resumeData.personalInfo.website && (
                            <span>{resumeData.personalInfo.website}</span>
                          )}
                          {resumeData.personalInfo.website && resumeData.personalInfo.linkedin && ' • '}
                          {resumeData.personalInfo.linkedin && (
                            <span>{resumeData.personalInfo.linkedin}</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  {resumeData.summary && (
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 border-b pb-1 mb-3">Professional Summary</h2>
                      <p className="text-gray-700">{resumeData.summary}</p>
                    </div>
                  )}

                  {/* Experience */}
                  {resumeData.experience.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 border-b pb-1 mb-3">Experience</h2>
                      {resumeData.experience.map((exp) => (
                        <div key={exp.id} className="mb-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">{exp.position || 'Job Title'}</h3>
                              <p className="text-gray-600">{exp.company || 'Company Name'}</p>
                            </div>
                            <span className="text-sm text-gray-500">
                              {exp.startDate || 'Start'} - {exp.current ? 'Present' : (exp.endDate || 'End')}
                            </span>
                          </div>
                          {exp.description && <p className="text-gray-700 mt-2">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Education */}
                  {resumeData.education.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 border-b pb-1 mb-3">Education</h2>
                      {resumeData.education.map((edu) => (
                        <div key={edu.id} className="mb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {edu.degree || 'Degree'} {edu.field && `in ${edu.field}`}
                              </h3>
                              <p className="text-gray-600">{edu.institution || 'Institution'}</p>
                              {edu.gpa && <p className="text-gray-600 text-sm">GPA: {edu.gpa}</p>}
                            </div>
                            <span className="text-sm text-gray-500">
                              {edu.startDate || 'Start'} - {edu.endDate || 'End'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Skills */}
                  {resumeData.skills.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 border-b pb-1 mb-3">Skills</h2>
                      <div className="flex flex-wrap gap-2">
                        {resumeData.skills.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {resumeData.projects.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 border-b pb-1 mb-3">Projects</h2>
                      {resumeData.projects.map((project) => (
                        <div key={project.id} className="mb-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-gray-900">{project.name || 'Project Name'}</h3>
                            {project.url && (
                              <a href={project.url} className="text-blue-600 text-sm hover:underline" target="_blank" rel="noopener noreferrer">
                                View Project
                              </a>
                            )}
                          </div>
                          {project.description && <p className="text-gray-700 mt-1">{project.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty state when no content */}
                  {!resumeData.personalInfo.firstName && !resumeData.personalInfo.lastName && !resumeData.summary && 
                   resumeData.experience.length === 0 && resumeData.education.length === 0 && 
                   resumeData.skills.length === 0 && resumeData.projects.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                      <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Start building your resume</p>
                      <p>Fill out the form on the left to see your resume preview here.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}