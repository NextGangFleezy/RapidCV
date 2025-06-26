import { jsPDF } from 'jspdf';
import type { Resume } from '@shared/schema';

export const generateResumePDF = (resume: Resume): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add text with wrapping
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * (fontSize * 0.4) + 5;
  };

  // Header
  if (resume.personalInfo) {
    const { firstName, lastName, email, phone, location, summary } = resume.personalInfo;
    
    addText(`${firstName || ''} ${lastName || ''}`, 20, true);
    addText(`${email || ''} | ${phone || ''} | ${location || ''}`, 10);
    yPosition += 5;
    
    if (summary) {
      addText('Professional Summary', 14, true);
      addText(summary, 10);
      yPosition += 5;
    }
  }

  // Experience
  if (resume.experience && resume.experience.length > 0) {
    addText('Professional Experience', 14, true);
    
    resume.experience.forEach((exp) => {
      addText(`${exp.position} at ${exp.company}`, 12, true);
      addText(`${exp.startDate} - ${exp.current ? 'Present' : exp.endDate || ''}`, 10);
      addText(exp.description, 10);
      
      if (exp.achievements && exp.achievements.length > 0) {
        exp.achievements.forEach((achievement) => {
          addText(`• ${achievement}`, 10);
        });
      }
      yPosition += 5;
    });
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    addText('Education', 14, true);
    
    resume.education.forEach((edu) => {
      addText(`${edu.degree} in ${edu.field}`, 12, true);
      addText(`${edu.institution} | ${edu.startDate} - ${edu.current ? 'Present' : edu.endDate || ''}`, 10);
      if (edu.gpa) {
        addText(`GPA: ${edu.gpa}`, 10);
      }
      if (edu.honors) {
        addText(`Honors: ${edu.honors}`, 10);
      }
      yPosition += 5;
    });
  }

  // Skills
  if (resume.skills && resume.skills.length > 0) {
    addText('Skills', 14, true);
    
    resume.skills.forEach((skillCategory) => {
      addText(`${skillCategory.category}: ${skillCategory.items.join(', ')}`, 10);
    });
    yPosition += 5;
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    addText('Projects', 14, true);
    
    resume.projects.forEach((project) => {
      addText(project.name, 12, true);
      addText(project.description, 10);
      addText(`Technologies: ${project.technologies.join(', ')}`, 10);
      if (project.url) {
        addText(`URL: ${project.url}`, 10);
      }
      yPosition += 5;
    });
  }

  // Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    addText('Certifications', 14, true);
    
    resume.certifications.forEach((cert) => {
      addText(`${cert.name} - ${cert.issuer} (${cert.date})`, 10);
      if (cert.url) {
        addText(`URL: ${cert.url}`, 10);
      }
    });
  }

  // Save the PDF
  const fileName = `${resume.personalInfo?.firstName || 'Resume'}_${resume.personalInfo?.lastName || ''}_Resume.pdf`;
  doc.save(fileName);
};
