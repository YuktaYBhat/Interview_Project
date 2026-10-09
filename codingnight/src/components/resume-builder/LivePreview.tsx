import { Education, Experience, Project, Resume } from '@/types';
import styles from '../../app/resume/Resume.module.css';

interface LivePreviewProps { resumeData: Resume['content']; }

function asBullets(value: string): string[] { return value.split(/\r?\n|(?=•)|(?=\* )|(?=\- )/).map((line) => line.replace(/^\s*[-*•]\s*/, '').trim()).filter(Boolean); }

export default function LivePreview({ resumeData }: LivePreviewProps) {
  const personalInfo = resumeData.personalInfo;
  const contacts = [personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedin, personalInfo.github].filter(Boolean);
  return <div className={styles.previewContent}>
    <h2 className={styles.prevName}>{personalInfo.fullName || 'Your Name'}</h2>
    {contacts.length > 0 && <p className={styles.prevContact}>{contacts.join(' • ')}</p>}
    {personalInfo.summary && <p className={styles.prevSummary}>{personalInfo.summary}</p>}
    {resumeData.experience.length > 0 && <section className={styles.prevSection}><h3 className={styles.prevSectionTitle}>EXPERIENCE</h3>{resumeData.experience.map((experience: Experience) => <div key={experience.id} className={styles.prevEntry}><div className={styles.prevEntryTitle}>{experience.jobTitle}{experience.company ? ` at ${experience.company}` : ''}</div><div className={styles.prevEntryMeta}>{[experience.location, experience.duration.startDate && `${experience.duration.startDate}${experience.duration.endDate || experience.duration.isCurrently ? ` – ${experience.duration.isCurrently ? 'Present' : experience.duration.endDate}` : ''}`].filter(Boolean).join(' • ')}</div><ul className={styles.prevEntryDesc}>{asBullets(experience.description).map((bullet, index) => <li key={`${experience.id}-${index}`}>{bullet}</li>)}</ul></div>)}</section>}
    {resumeData.education.length > 0 && <section className={styles.prevSection}><h3 className={styles.prevSectionTitle}>EDUCATION</h3>{resumeData.education.map((education: Education) => <div key={education.id} className={styles.prevEntry}><div className={styles.prevEntryTitle}>{[education.degree, education.field && `in ${education.field}`].filter(Boolean).join(' ')}</div><div className={styles.prevEntryMeta}>{[education.institution, education.graduationDate, education.gpa && `GPA: ${education.gpa}`].filter(Boolean).join(', ')}</div></div>)}</section>}
    {resumeData.skills.length > 0 && <section className={styles.prevSection}><h3 className={styles.prevSectionTitle}>SKILLS</h3><p className={styles.prevEntryDesc}>{resumeData.skills.join(' • ')}</p></section>}
    {resumeData.projects.length > 0 && <section className={styles.prevSection}><h3 className={styles.prevSectionTitle}>PROJECTS</h3>{resumeData.projects.map((project: Project) => <div key={project.id} className={styles.prevEntry}><div className={styles.prevEntryTitle}>{project.title || 'Project'}</div>{project.technologies.length > 0 && <div className={styles.prevEntryMeta}>Tech: {project.technologies.join(', ')}</div>}<p className={styles.prevEntryDesc}>{project.description}</p>{project.link && <div className={styles.prevEntryMeta}>{project.link}</div>}</div>)}</section>}
    {resumeData.certifications?.length ? <section className={styles.prevSection}><h3 className={styles.prevSectionTitle}>CERTIFICATIONS</h3><ul className={styles.prevEntryDesc}>{resumeData.certifications.map((item, index) => <li key={`cert-${index}`}>{item}</li>)}</ul></section> : null}
    {resumeData.achievements?.length ? <section className={styles.prevSection}><h3 className={styles.prevSectionTitle}>ACHIEVEMENTS</h3><ul className={styles.prevEntryDesc}>{resumeData.achievements.map((item, index) => <li key={`achievement-${index}`}>{item}</li>)}</ul></section> : null}
  </div>;
}