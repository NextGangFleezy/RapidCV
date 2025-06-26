import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Resume } from "@shared/schema";

interface ResumePreviewProps {
  resumeData: Resume;
  templateId: string;
}

export default function ResumePreview({ resumeData, templateId }: ResumePreviewProps) {
  const { personalInfo, experience, education, skills, projects, certifications } = resumeData;

  if (templateId === "modern") {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6 transform scale-90 origin-top">
        <div className="grid grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="col-span-1 bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-3"></div>
              <h2 className="text-lg font-bold text-gray-900">
                {personalInfo?.firstName} {personalInfo?.lastName}
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                {experience?.[0]?.position || "Professional"}
              </p>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Contact</h3>
              <div className="space-y-1 text-xs text-gray-600">
                {personalInfo?.email && <p>{personalInfo.email}</p>}
                {personalInfo?.phone && <p>{personalInfo.phone}</p>}
                {personalInfo?.location && <p>{personalInfo.location}</p>}
              </div>
            </div>

            {/* Skills */}
            {skills && skills.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Skills</h3>
                <div className="space-y-2">
                  {skills.map((skillCategory, index) => (
                    <div key={index}>
                      <h4 className="text-xs font-medium text-gray-800 mb-1">
                        {skillCategory.category}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {skillCategory.items.map((skill, skillIndex) => (
                          <Badge key={skillIndex} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="col-span-2 space-y-4">
            {/* Summary */}
            {personalInfo?.summary && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Professional Summary</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {personalInfo.summary}
                </p>
              </div>
            )}

            {/* Experience */}
            {experience && experience.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Experience</h3>
                <div className="space-y-3">
                  {experience.map((exp, index) => (
                    <div key={index} className="border-l-2 border-primary pl-3">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-gray-900 text-xs">{exp.position}</h4>
                        <span className="text-xs text-gray-500">
                          {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{exp.company}</p>
                      <p className="text-xs text-gray-600 mb-2">{exp.description}</p>
                      {exp.achievements && exp.achievements.length > 0 && (
                        <ul className="text-xs text-gray-600 space-y-0.5">
                          {exp.achievements.slice(0, 3).map((achievement, achIndex) => (
                            <li key={achIndex}>• {achievement}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {education && education.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Education</h3>
                <div className="space-y-2">
                  {education.map((edu, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-900 text-xs">
                          {edu.degree} in {edu.field}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{edu.institution}</p>
                      {edu.gpa && <p className="text-xs text-gray-600">GPA: {edu.gpa}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Professional template (default)
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4 transform scale-90 origin-top">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {personalInfo?.firstName} {personalInfo?.lastName}
        </h2>
        <p className="text-lg text-gray-600">
          {experience?.[0]?.position || "Professional"}
        </p>
        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
          {personalInfo?.email && <span>{personalInfo.email}</span>}
          {personalInfo?.phone && <span>{personalInfo.phone}</span>}
          {personalInfo?.location && <span>{personalInfo.location}</span>}
        </div>
      </div>

      {/* Professional Summary */}
      {personalInfo?.summary && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Professional Summary</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {personalInfo.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Experience</h3>
          <div className="space-y-3">
            {experience.map((exp, index) => (
              <div key={index}>
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-gray-900">{exp.position}</h4>
                  <span className="text-xs text-gray-500">
                    {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{exp.company}</p>
                <p className="text-sm text-gray-600 mb-2">{exp.description}</p>
                {exp.achievements && exp.achievements.length > 0 && (
                  <ul className="text-sm text-gray-600 space-y-1">
                    {exp.achievements.slice(0, 3).map((achievement, achIndex) => (
                      <li key={achIndex}>• {achievement}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Education</h3>
          <div className="space-y-2">
            {education.map((edu, index) => (
              <div key={index}>
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-gray-900">
                    {edu.degree} in {edu.field}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{edu.institution}</p>
                {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
                {edu.honors && <p className="text-sm text-gray-600">Honors: {edu.honors}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
          <div className="space-y-2">
            {skills.map((skillCategory, index) => (
              <div key={index}>
                <h4 className="text-sm font-medium text-gray-800 mb-1">
                  {skillCategory.category}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {skillCategory.items.map((skill, skillIndex) => (
                    <Badge key={skillIndex} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Projects</h3>
          <div className="space-y-2">
            {projects.map((project, index) => (
              <div key={index}>
                <h4 className="font-medium text-gray-900">{project.name}</h4>
                <p className="text-sm text-gray-600 mb-1">{project.description}</p>
                <p className="text-sm text-gray-500">
                  Technologies: {project.technologies.join(', ')}
                </p>
                {project.url && (
                  <p className="text-sm text-primary">{project.url}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Certifications</h3>
          <div className="space-y-1">
            {certifications.map((cert, index) => (
              <div key={index}>
                <h4 className="font-medium text-gray-900">
                  {cert.name} - {cert.issuer}
                </h4>
                <p className="text-sm text-gray-600">{cert.date}</p>
                {cert.url && (
                  <p className="text-sm text-primary">{cert.url}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
