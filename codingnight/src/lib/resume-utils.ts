import { Resume } from '@/types';

// Mock ATS score calculation based on keywords and structure
export function calculateATSScore(resume: Resume): number {
  let score = 0;
  const maxScore = 100;

  // Check for required sections (20 points)
  const sections = resume.content;
  let sectionCount = 0;

  if (sections.personalInfo) sectionCount += 1;
  if (sections.experience && sections.experience.length > 0) sectionCount += 1;
  if (sections.education && sections.education.length > 0) sectionCount += 1;
  if (sections.skills && sections.skills.length > 0) sectionCount += 1;

  score += (sectionCount / 4) * 20;

  // Experience quality (20 points)
  if (sections.experience && sections.experience.length > 0) {
    const avgDescriptionLength = sections.experience.reduce(
      (sum, exp) => sum + (exp.description?.length || 0),
      0
    ) / sections.experience.length;

    score += Math.min((avgDescriptionLength / 200) * 20, 20);
  }

  // Education completeness (15 points)
  if (sections.education && sections.education.length > 0) {
    const avgEducationInfo = sections.education.reduce((sum, edu) => {
      let count = 0;
      if (edu.degree) count += 1;
      if (edu.institution) count += 1;
      if (edu.field) count += 1;
      if (edu.graduationDate) count += 1;
      return sum + count;
    }, 0) / (sections.education.length * 4);

    score += avgEducationInfo * 15;
  }

  // Skills relevance (20 points)
  if (sections.skills && sections.skills.length > 0) {
    // Higher score for more skills and specific technical skills
    const skillCount = Math.min(sections.skills.length, 20);
    score += (skillCount / 20) * 15;

    // Bonus for specific technical keywords (5 points)
    const technicalKeywords = ['Python', 'Java', 'JavaScript', 'React', 'AWS', 'SQL', 'Docker', 'Kubernetes', 'AI', 'ML'];
    const hasTechnicalSkills = sections.skills.some((skill) =>
      technicalKeywords.some((keyword) => skill.toUpperCase().includes(keyword.toUpperCase()))
    );
    if (hasTechnicalSkills) score += 5;
  }

  // Projects (15 points)
  if (sections.projects && sections.projects.length > 0) {
    score += (Math.min(sections.projects.length, 5) / 5) * 15;
  }

  // Personal info completeness (10 points)
  if (sections.personalInfo) {
    let infoCount = 0;
    if (sections.personalInfo.fullName) infoCount += 1;
    if (sections.personalInfo.email) infoCount += 1;
    if (sections.personalInfo.phone) infoCount += 1;
    if (sections.personalInfo.location) infoCount += 1;
    if (sections.personalInfo.summary) infoCount += 1;

    score += (infoCount / 5) * 10;
  }

  return Math.min(Math.round(score), maxScore);
}

// Extract keywords from resume
export function extractKeywords(resume: Resume): string[] {
  const keywords = new Set<string>();

  // From skills
  if (resume.content.skills) {
    resume.content.skills.forEach((skill) => keywords.add(skill));
  }

  // From job titles
  if (resume.content.experience) {
    resume.content.experience.forEach((exp) => {
      if (exp.jobTitle) {
        const titleWords = exp.jobTitle.split(' ');
        titleWords.forEach((word) => {
          if (word.length > 3) keywords.add(word);
        });
      }
    });
  }

  // From technologies in projects
  if (resume.content.projects) {
    resume.content.projects.forEach((proj) => {
      if (proj.technologies) {
        proj.technologies.forEach((tech) => keywords.add(tech));
      }
    });
  }

  return Array.from(keywords);
}

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';

// ... (keep calculateATSScore, extractKeywords) ...

// Generate ATS-friendly DOCX
export async function generateResumeDocx(resume: Resume): Promise<Blob> {
  const { personalInfo, experience, education, skills, projects } = resume.content;

  const children: any[] = [];

  // 1. Name and Contact Info (Centered)
  if (personalInfo.fullName) {
    children.push(
      new Paragraph({
        text: personalInfo.fullName.toUpperCase(),
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      })
    );
  }

  const contactText = [personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join(' | ');
  if (contactText) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contactText, size: 20 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      })
    );
  }

  // Section Header Helper
  const createSectionHeader = (title: string) => {
    return new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 24 })],
      heading: HeadingLevel.HEADING_2,
      border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } },
      spacing: { before: 300, after: 150 },
    });
  };

  // 2. Summary
  if (personalInfo.summary) {
    children.push(createSectionHeader('PROFESSIONAL SUMMARY'));
    children.push(new Paragraph({
      children: [new TextRun({ text: personalInfo.summary, size: 22 })],
      spacing: { after: 200 }
    }));
  }

  // 3. Experience
  if (experience && experience.length > 0) {
    children.push(createSectionHeader('EXPERIENCE'));
    experience.forEach((exp) => {
      // Header row: Job title and Dates
      children.push(new Paragraph({
        children: [
          new TextRun({ text: exp.jobTitle || 'Role', bold: true, size: 22 }),
          new TextRun({ text: ` — ${exp.company || 'Company'}`, size: 22 }),
        ],
        spacing: { before: 150, after: 50 },
      }));
      
      const dateText = `${exp.duration?.startDate || ''} - ${exp.duration?.isCurrently ? 'Present' : exp.duration?.endDate || ''}`;
      if (dateText.length > 3) {
        children.push(new Paragraph({
          children: [new TextRun({ text: dateText, size: 20, italics: true, color: "666666" })],
          spacing: { after: 100 },
        }));
      }

      // We should split description into bullet points if there are newlines or bullets
      if (exp.description) {
        const sentences = exp.description.split(/(?:\r?\n|(?<=\.) )/).filter((s: string) => s.trim().length > 0);
        sentences.forEach((bullet: string) => {
          children.push(new Paragraph({
            children: [new TextRun({ text: bullet.replace(/^[•\-\*]\s*/, '').trim(), size: 22 })],
            bullet: { level: 0 },
            spacing: { after: 50 }
          }));
        });
      }
    });
  }

  // 4. Projects
  if (projects && projects.length > 0) {
    children.push(createSectionHeader('PROJECTS'));
    projects.forEach((proj) => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: proj.title || 'Project', bold: true, size: 22 }),
          ...(proj.technologies && proj.technologies.length > 0 ? [new TextRun({ text: ` | ${proj.technologies.join(', ')}`, size: 20, italics: true })] : [])
        ],
        spacing: { before: 150, after: 100 },
      }));

      if (proj.description) {
        children.push(new Paragraph({
          children: [new TextRun({ text: proj.description, size: 22 })],
          spacing: { after: 100 }
        }));
      }
    });
  }

  // 5. Education
  if (education && education.length > 0) {
    children.push(createSectionHeader('EDUCATION'));
    education.forEach((edu) => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: edu.institution || 'University', bold: true, size: 22 }),
          new TextRun({ text: edu.graduationDate ? `, ${edu.graduationDate}` : '', size: 20 }),
        ],
        spacing: { before: 100, after: 50 },
      }));
      children.push(new Paragraph({
        children: [new TextRun({ text: `${edu.degree || ''} ${edu.field ? 'in ' + edu.field : ''}`, size: 22 })],
        spacing: { after: 100 },
      }));
    });
  }

  // 6. Skills
  if (skills && skills.length > 0) {
    children.push(createSectionHeader('TECHNICAL SKILLS'));
    children.push(new Paragraph({
      children: [new TextRun({ text: skills.join(' • '), size: 22 })],
      spacing: { before: 100, after: 200 }
    }));
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Calibri" } } },
    },
    sections: [{ properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } }, children }],
  });

  return await Packer.toBlob(doc);
}

