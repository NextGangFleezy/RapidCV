import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "@/lib/icons";
import { useState } from "react";

interface ResumeFormProps {
  section: string;
  data: any;
  onUpdate: (section: string, data: any) => void;
}

export default function ResumeForm({ section, data, onUpdate }: ResumeFormProps) {
  const form = useForm();

  if (section === "personal") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={data.personalInfo?.firstName || ""}
              onChange={(e) => onUpdate("personalInfo", {
                ...data.personalInfo,
                firstName: e.target.value
              })}
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={data.personalInfo?.lastName || ""}
              onChange={(e) => onUpdate("personalInfo", {
                ...data.personalInfo,
                lastName: e.target.value
              })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={data.personalInfo?.email || ""}
            onChange={(e) => onUpdate("personalInfo", {
              ...data.personalInfo,
              email: e.target.value
            })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={data.personalInfo?.phone || ""}
              onChange={(e) => onUpdate("personalInfo", {
                ...data.personalInfo,
                phone: e.target.value
              })}
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={data.personalInfo?.location || ""}
              onChange={(e) => onUpdate("personalInfo", {
                ...data.personalInfo,
                location: e.target.value
              })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="summary">Professional Summary</Label>
          <Textarea
            id="summary"
            rows={4}
            value={data.personalInfo?.summary || ""}
            onChange={(e) => onUpdate("personalInfo", {
              ...data.personalInfo,
              summary: e.target.value
            })}
            placeholder="Write a brief summary of your professional background..."
          />
        </div>
      </div>
    );
  }

  if (section === "experience") {
    const experiences = data.experience || [];

    const addExperience = () => {
      const newExperience = {
        id: Date.now().toString(),
        company: "",
        position: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
        achievements: [""]
      };
      onUpdate("experience", [...experiences, newExperience]);
    };

    const updateExperience = (index: number, field: string, value: any) => {
      const updated = [...experiences];
      updated[index] = { ...updated[index], [field]: value };
      onUpdate("experience", updated);
    };

    const removeExperience = (index: number) => {
      onUpdate("experience", experiences.filter((_: any, i: number) => i !== index));
    };

    const addAchievement = (expIndex: number) => {
      const updated = [...experiences];
      updated[expIndex].achievements.push("");
      onUpdate("experience", updated);
    };

    const updateAchievement = (expIndex: number, achIndex: number, value: string) => {
      const updated = [...experiences];
      updated[expIndex].achievements[achIndex] = value;
      onUpdate("experience", updated);
    };

    const removeAchievement = (expIndex: number, achIndex: number) => {
      const updated = [...experiences];
      updated[expIndex].achievements = updated[expIndex].achievements.filter((_: any, i: number) => i !== achIndex);
      onUpdate("experience", updated);
    };

    return (
      <div className="space-y-6">
        {experiences.map((exp: any, index: number) => (
          <Card key={exp.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">Experience {index + 1}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeExperience(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Company</Label>
                  <Input
                    value={exp.company}
                    onChange={(e) => updateExperience(index, "company", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Position</Label>
                  <Input
                    value={exp.position}
                    onChange={(e) => updateExperience(index, "position", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="month"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="month"
                    value={exp.endDate}
                    disabled={exp.current}
                    onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                  />
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id={`current-${index}`}
                      checked={exp.current}
                      onCheckedChange={(checked) => updateExperience(index, "current", checked)}
                    />
                    <Label htmlFor={`current-${index}`} className="text-sm">
                      I currently work here
                    </Label>
                  </div>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={exp.description}
                  onChange={(e) => updateExperience(index, "description", e.target.value)}
                  placeholder="Describe your role and responsibilities..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Key Achievements</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addAchievement(index)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Achievement
                  </Button>
                </div>
                {exp.achievements.map((achievement: string, achIndex: number) => (
                  <div key={achIndex} className="flex gap-2 mb-2">
                    <Input
                      value={achievement}
                      onChange={(e) => updateAchievement(index, achIndex, e.target.value)}
                      placeholder="Describe a key achievement..."
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAchievement(index, achIndex)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <Button type="button" onClick={addExperience} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Experience
        </Button>
      </div>
    );
  }

  if (section === "education") {
    const educations = data.education || [];

    const addEducation = () => {
      const newEducation = {
        id: Date.now().toString(),
        institution: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        current: false,
        gpa: "",
        honors: ""
      };
      onUpdate("education", [...educations, newEducation]);
    };

    const updateEducation = (index: number, field: string, value: any) => {
      const updated = [...educations];
      updated[index] = { ...updated[index], [field]: value };
      onUpdate("education", updated);
    };

    const removeEducation = (index: number) => {
      onUpdate("education", educations.filter((_: any, i: number) => i !== index));
    };

    return (
      <div className="space-y-6">
        {educations.map((edu: any, index: number) => (
          <Card key={edu.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">Education {index + 1}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeEducation(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Institution</Label>
                <Input
                  value={edu.institution}
                  onChange={(e) => updateEducation(index, "institution", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Degree</Label>
                  <Input
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, "degree", e.target.value)}
                    placeholder="e.g., Bachelor of Science"
                  />
                </div>
                <div>
                  <Label>Field of Study</Label>
                  <Input
                    value={edu.field}
                    onChange={(e) => updateEducation(index, "field", e.target.value)}
                    placeholder="e.g., Computer Science"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="month"
                    value={edu.startDate}
                    onChange={(e) => updateEducation(index, "startDate", e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="month"
                    value={edu.endDate}
                    disabled={edu.current}
                    onChange={(e) => updateEducation(index, "endDate", e.target.value)}
                  />
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id={`edu-current-${index}`}
                      checked={edu.current}
                      onCheckedChange={(checked) => updateEducation(index, "current", checked)}
                    />
                    <Label htmlFor={`edu-current-${index}`} className="text-sm">
                      Currently enrolled
                    </Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>GPA (Optional)</Label>
                  <Input
                    value={edu.gpa}
                    onChange={(e) => updateEducation(index, "gpa", e.target.value)}
                    placeholder="e.g., 3.8/4.0"
                  />
                </div>
                <div>
                  <Label>Honors (Optional)</Label>
                  <Input
                    value={edu.honors}
                    onChange={(e) => updateEducation(index, "honors", e.target.value)}
                    placeholder="e.g., Magna Cum Laude"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button type="button" onClick={addEducation} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Education
        </Button>
      </div>
    );
  }

  if (section === "skills") {
    const skills = data.skills || [];

    const addSkillCategory = () => {
      const newCategory = {
        id: Date.now().toString(),
        category: "",
        items: [""]
      };
      onUpdate("skills", [...skills, newCategory]);
    };

    const updateSkillCategory = (index: number, field: string, value: any) => {
      const updated = [...skills];
      updated[index] = { ...updated[index], [field]: value };
      onUpdate("skills", updated);
    };

    const removeSkillCategory = (index: number) => {
      onUpdate("skills", skills.filter((_: any, i: number) => i !== index));
    };

    const addSkillItem = (categoryIndex: number) => {
      const updated = [...skills];
      updated[categoryIndex].items.push("");
      onUpdate("skills", updated);
    };

    const updateSkillItem = (categoryIndex: number, itemIndex: number, value: string) => {
      const updated = [...skills];
      updated[categoryIndex].items[itemIndex] = value;
      onUpdate("skills", updated);
    };

    const removeSkillItem = (categoryIndex: number, itemIndex: number) => {
      const updated = [...skills];
      updated[categoryIndex].items = updated[categoryIndex].items.filter((_: any, i: number) => i !== itemIndex);
      onUpdate("skills", updated);
    };

    return (
      <div className="space-y-6">
        {skills.map((skillCategory: any, index: number) => (
          <Card key={skillCategory.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">Skill Category {index + 1}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSkillCategory(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Category Name</Label>
                <Input
                  value={skillCategory.category}
                  onChange={(e) => updateSkillCategory(index, "category", e.target.value)}
                  placeholder="e.g., Programming Languages, Soft Skills"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Skills</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSkillItem(index)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Skill
                  </Button>
                </div>
                {skillCategory.items.map((skill: string, itemIndex: number) => (
                  <div key={itemIndex} className="flex gap-2 mb-2">
                    <Input
                      value={skill}
                      onChange={(e) => updateSkillItem(index, itemIndex, e.target.value)}
                      placeholder="Enter a skill..."
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSkillItem(index, itemIndex)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <Button type="button" onClick={addSkillCategory} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Skill Category
        </Button>
      </div>
    );
  }

  return <div>Form section not implemented yet</div>;
}
