import { Education, Experience, Project, Resume } from '@/types';
import styles from './Resume.module.css';

type ResumeContent = Resume['content'];

interface LivePreviewProps {
  content: ResumeContent;
}

function bullets(value: string): string[] {
  return value.split(/\r?\n|(?=•)|(?=\* )|(?=\- )/).map((item) => item.replace(/^\s*[-*•]\s*/, '').trim()).filter(Boolean);
}

export default function LivePreview({ content }: LivePreviewProps) {
  const personalInfo = content.personalInfo;
  const contacts = [personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedin, personalInfo.github].filter(Boolean);
  const hasContent = Boolean(personalInfo.fullName || personalInfo.summary || content.experience.length || content.education.length || content.skills.length || content.projects.length);

  if (!hasContent) {
    return <div className={styles.previewEmpty}><span style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📝</span><h3 className="font-semibold mb-1">Resume Template</h3><p className="caption">Start filling out your information on the left to see a live preview of your resume here.</p></div>;
  }

  return <div className={styles.previewContent}>
    <h2 className={styles.prevName}>{personalInfo.fullName || 'Your Name'}</h2>
    {contacts.length > 0 && <p className={styles.prevContact}>{contacts.join(' • ')}</p>}
    {personalInfo.summary && <p className={styles.prevSummary}>{personalInfo.summary}</p>}

    {content.experience.length > 0 && <section className={styles.prevSection}><h3 className={styles.prevSectionTitle}>EXPERIENCE</h3>{content.experience.map((exp: Experience) => <div key={exp.id} className={styles.prevEntry}>
      <div className={styles.prevEntryTitle}>{exp.jobTitle}{exp.company ? ` at ${exp.company}` : ''}</div>
      <div className={styles.prevEntryMeta}>{[exp.location, exp.duration.startDate && `${exp.duration.startDate}${exp.duration.endDate || exp.duration.isCurrently ? ` – ${exp.duration.isCurrently ? 'Present' : exp.duration.endDate}` : ''}`].filter(Boolean).join(' • ')}</div>
      {bullets(exp.description).length > 0 && <ul className={styles.prevEntryDesc}>{bullets(exp.description).map((item, index) => <li key={`${exp.id}-bullet-${index}`}>{item}</li>)}</ul>}
    </div>)}</section>}

    {content.education.length > 0 && <section className={styles.prevSection}><h3 className={styles.prevSectionTitle}>EDUCATION</h3>{content.education.map((edu: Education) => <div key={edu.id} className={styles.prevEntry}>
      <div className={styles.prevEntryTitle}>{[edu.degree, edu.field && `in ${edu.field}`].filter(Boolean).join(' ')}</div>
      <div className={styles.prevEntryMeta}>{[edu.institution, edu.graduationDate, edu.gpa && `GPA: ${edu.gpa}`].filter(Boolean).join(', ')}</div>
    </div>)}</section>}

    {content.skills.length > 0 && <section className={styles.prevSection}><h3 className={styles.prevSectionTitle}>SKILLS</h3><p className={styles.prevEntryDesc}>{content.skills.join(' • ')}</p></section>}

    {content.projects.length > 0 && <section className={styles.prevSection}><h3 className={styles.prevSectionTitle}>PROJECTS</h3>{content.projects.map((project: Project) => <div key={project.id} className={styles.prevEntry}>
      <div className={styles.prevEntryTitle}>{project.title || 'Project'}</div>
      {project.technologies.length > 0 && <div className={styles.prevEntryMeta}>Tech: {project.technologies.join(', ')}</div>}
      <p className={styles.prevEntryDesc}>{project.description}</p>
      {project.link && <div className={styles.prevEntryMeta}>{project.link}</div>}
    </div>)}</section>}

    {content.certifications && content.certifications.length > 0 && <section className={styles.prevSection}><h3 className={styles.prevSectionTitle}>CERTIFICATIONS</h3><ul className={styles.prevEntryDesc}>{content.certifications.map((item, index) => <li key={`cert-${index}`}>{item}</li>)}</ul></section>}
    {content.achievements && content.achievements.length > 0 && <section className={styles.prevSection}><h3 className={styles.prevSectionTitle}>ACHIEVEMENTS</h3><ul className={styles.prevEntryDesc}>{content.achievements.map((item, index) => <li key={`achievement-${index}`}>{item}</li>)}</ul></section>}
  </div>;
}