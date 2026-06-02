'use client';
import { useState, useEffect, useCallback } from 'react';
import { useResumeStore } from '@/lib/store';
import { Resume, Experience, Education, Project } from '@/types';
import { calculateATSScore, generateResumeDocx } from '@/lib/resume-utils';
import styles from './Resume.module.css';

const emptyResume = (): Partial<Resume> => ({
  id: '',
  title: 'Untitled Resume',
  content: {
    personalInfo: { fullName: '', email: '', phone: '', location: '', summary: '' },
    experience: [],
    education: [],
    skills: [],
    projects: [],
  },
});

const emptyExperience = (): Experience => ({
  id: Date.now().toString(),
  jobTitle: '', company: '', location: '',
  duration: { startDate: '', endDate: '', isCurrently: false },
  description: '',
});

const emptyEducation = (): Education => ({
  id: Date.now().toString(),
  degree: '', institution: '', field: '', graduationDate: '', gpa: '',
});

const emptyProject = (): Project => ({
  id: Date.now().toString(),
  title: '', description: '', technologies: [], link: '',
});

type TabKey = 'personal' | 'experience' | 'education' | 'skills' | 'projects';

export default function ResumeBuilder() {
  const { resumes, addResume, updateResume, deleteResume, selectedResumeId, setSelectedResume } = useResumeStore();
  const [activeTab, setActiveTab] = useState<TabKey>('personal');
  const [currentResume, setCurrentResume] = useState<Partial<Resume>>(emptyResume());
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishIdx, setPolishIdx] = useState(-1);
  const [atsScore, setAtsScore] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const [skillInput, setSkillInput] = useState('');
  const [techInput, setTechInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Load selected resume
  useEffect(() => {
    if (!mounted) return;
    if (selectedResumeId) {
      const found = resumes.find((r: any) => r.id === selectedResumeId);
      if (found) {
        setCurrentResume(found);
        setAtsScore(calculateATSScore(found as Resume));
        return;
      }
    }
    if (resumes.length > 0) {
      setCurrentResume(resumes[0]);
      setSelectedResume(resumes[0].id);
      setAtsScore(calculateATSScore(resumes[0] as Resume));
    }
  }, [selectedResumeId, resumes, mounted]);

  // Recalculate ATS
  const recalcATS = useCallback(() => {
    try {
      setAtsScore(calculateATSScore(currentResume as Resume));
    } catch { setAtsScore(0); }
  }, [currentResume]);

  useEffect(() => { recalcATS(); }, [currentResume, recalcATS]);

  const updateField = (section: string, field: string, value: any) => {
    setCurrentResume((prev: any) => ({
      ...prev,
      content: {
        ...prev.content,
        [section]: { ...prev.content[section], [field]: value },
      },
    }));
  };

  const updateExperience = (idx: number, field: string, value: any) => {
    setCurrentResume((prev: any) => {
      const exps = [...prev.content.experience];
      if (field.startsWith('duration.')) {
        const durField = field.split('.')[1];
        exps[idx] = { ...exps[idx], duration: { ...exps[idx].duration, [durField]: value } };
      } else {
        exps[idx] = { ...exps[idx], [field]: value };
      }
      return { ...prev, content: { ...prev.content, experience: exps } };
    });
  };

  const addExperience = () => {
    setCurrentResume((prev: any) => ({
      ...prev,
      content: { ...prev.content, experience: [...prev.content.experience, emptyExperience()] },
    }));
  };

  const removeExperience = (idx: number) => {
    setCurrentResume((prev: any) => ({
      ...prev,
      content: { ...prev.content, experience: prev.content.experience.filter((_: any, i: number) => i !== idx) },
    }));
  };

  const updateEducation = (idx: number, field: string, value: any) => {
    setCurrentResume((prev: any) => {
      const edus = [...prev.content.education];
      edus[idx] = { ...edus[idx], [field]: value };
      return { ...prev, content: { ...prev.content, education: edus } };
    });
  };

  const addEducation = () => {
    setCurrentResume((prev: any) => ({
      ...prev,
      content: { ...prev.content, education: [...prev.content.education, emptyEducation()] },
    }));
  };

  const removeEducation = (idx: number) => {
    setCurrentResume((prev: any) => ({
      ...prev,
      content: { ...prev.content, education: prev.content.education.filter((_: any, i: number) => i !== idx) },
    }));
  };

  const addSkill = () => {
    if (!skillInput.trim()) return;
    setCurrentResume((prev: any) => ({
      ...prev,
      content: { ...prev.content, skills: [...prev.content.skills, skillInput.trim()] },
    }));
    setSkillInput('');
  };

  const removeSkill = (idx: number) => {
    setCurrentResume((prev: any) => ({
      ...prev,
      content: { ...prev.content, skills: prev.content.skills.filter((_: any, i: number) => i !== idx) },
    }));
  };

  const updateProject = (idx: number, field: string, value: any) => {
    setCurrentResume((prev: any) => {
      const projs = [...prev.content.projects];
      projs[idx] = { ...projs[idx], [field]: value };
      return { ...prev, content: { ...prev.content, projects: projs } };
    });
  };

  const addProject = () => {
    setCurrentResume((prev: any) => ({
      ...prev,
      content: { ...prev.content, projects: [...prev.content.projects, emptyProject()] },
    }));
  };

  const removeProject = (idx: number) => {
    setCurrentResume((prev: any) => ({
      ...prev,
      content: { ...prev.content, projects: prev.content.projects.filter((_: any, i: number) => i !== idx) },
    }));
  };

  const addProjectTech = (projIdx: number) => {
    if (!techInput.trim()) return;
    setCurrentResume((prev: any) => {
      const projs = [...prev.content.projects];
      projs[projIdx] = { ...projs[projIdx], technologies: [...projs[projIdx].technologies, techInput.trim()] };
      return { ...prev, content: { ...prev.content, projects: projs } };
    });
    setTechInput('');
  };

  const handleSave = () => {
    setIsSaving(true);
    const title = currentResume.content?.personalInfo?.fullName
      ? `${currentResume.content.personalInfo.fullName}'s Resume`
      : currentResume.title || 'Untitled Resume';
    
    if (currentResume.id && resumes.find((r: any) => r.id === currentResume.id)) {
      updateResume(currentResume.id, { ...currentResume, title, updatedAt: new Date() });
    } else {
      addResume({ ...currentResume, title, userId: 'local', createdAt: new Date(), updatedAt: new Date() });
    }
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleNewResume = () => {
    const nr = emptyResume();
    setCurrentResume(nr);
  };

  const handleSelectResume = (id: string) => {
    setSelectedResume(id);
    const found = resumes.find((r: any) => r.id === id);
    if (found) setCurrentResume(found);
  };

  const handleDeleteResume = (id: string) => {
    deleteResume(id);
    if (resumes.length > 1) {
      const remaining = resumes.filter((r: any) => r.id !== id);
      if (remaining.length > 0) {
        setCurrentResume(remaining[0]);
        setSelectedResume(remaining[0].id);
      }
    } else {
      setCurrentResume(emptyResume());
    }
  };

  const handleAiPolish = async (idx: number) => {
    setIsPolishing(true);
    setPolishIdx(idx);
    try {
      const desc = currentResume.content?.experience?.[idx]?.description || '';
      const res = await fetch('/api/resume-polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc, jobTitle: currentResume.content?.experience?.[idx]?.jobTitle }),
      });
      const data = await res.json();
      if (data.polished) updateExperience(idx, 'description', data.polished);
    } catch (e) { console.error(e); }
    finally { setIsPolishing(false); setPolishIdx(-1); }
  };

  const handleDownloadDocx = async () => {
    try {
      const blob = await generateResumeDocx(currentResume as Resume);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentResume.title || 'resume'}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
    }
  };

  const content = currentResume.content;
  if (!content) return null;

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'personal', label: 'Personal', icon: '👤' },
    { key: 'experience', label: 'Experience', icon: '💼' },
    { key: 'education', label: 'Education', icon: '🎓' },
    { key: 'skills', label: 'Skills', icon: '⚡' },
    { key: 'projects', label: 'Projects', icon: '🚀' },
  ];

  const scoreLabel = atsScore >= 80 ? 'Excellent' : atsScore >= 60 ? 'Good' : atsScore >= 40 ? 'Fair' : 'Needs Work';
  const scoreColor = atsScore >= 80 ? '#059669' : atsScore >= 60 ? '#2563eb' : atsScore >= 40 ? '#d97706' : '#dc2626';

  return (
    <div className={styles.pageWrapper}>
      {/* Resume Selector Bar */}
      {mounted && (
        <div className={styles.resumeSelector}>
          <div className="flex items-center gap-3">
            <span className="overline">MY RESUMES</span>
            {resumes.map((r: any) => (
              <button
                key={r.id}
                className={`${styles.resumeTab} ${r.id === currentResume.id ? styles.resumeTabActive : ''}`}
                onClick={() => handleSelectResume(r.id)}
              >
                {r.title || 'Untitled'}
                <span className={styles.resumeTabClose} onClick={(e) => { e.stopPropagation(); handleDeleteResume(r.id); }}>×</span>
              </button>
            ))}
            <button className={styles.newResumeBtn} onClick={handleNewResume}>+ New</button>
          </div>
        </div>
      )}

      <div className={styles.mainGrid}>
        {/* LEFT: Form */}
        <div className={styles.formPane}>
          <div className="mb-6">
            <h1 className="h1">Resume Architect</h1>
            <p className="body-sm mt-1">Build a professional resume that passes ATS scanners with ease.</p>
          </div>

          {/* Tabs */}
          <div className={styles.tabsRow}>
            {tabs.map((t) => (
              <button
                key={t.key}
                className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className={styles.formContent}>
            {activeTab === 'personal' && (
              <div className="animate-in">
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className="form-label">Full Name</label>
                    <input className="input-field" placeholder="e.g. Jane Smith" value={content.personalInfo.fullName} onChange={(e) => updateField('personalInfo', 'fullName', e.target.value)}/>
                  </div>
                  <div className={styles.formGroup}>
                    <label className="form-label">Email</label>
                    <input className="input-field" type="email" placeholder="jane@example.com" value={content.personalInfo.email} onChange={(e) => updateField('personalInfo', 'email', e.target.value)}/>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className="form-label">Phone</label>
                    <input className="input-field" placeholder="+1 555-0123" value={content.personalInfo.phone || ''} onChange={(e) => updateField('personalInfo', 'phone', e.target.value)}/>
                  </div>
                  <div className={styles.formGroup}>
                    <label className="form-label">Location</label>
                    <input className="input-field" placeholder="City, State" value={content.personalInfo.location || ''} onChange={(e) => updateField('personalInfo', 'location', e.target.value)}/>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className="form-label">Professional Summary</label>
                  <textarea className="textarea-field" rows={4} placeholder="A brief summary highlighting your expertise and career goals..." value={content.personalInfo.summary || ''} onChange={(e) => updateField('personalInfo', 'summary', e.target.value)}/>
                </div>
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="animate-in">
                {content.experience.map((exp: Experience, idx: number) => (
                  <div key={exp.id || idx} className={styles.entryCard}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold">Position {idx + 1}</span>
                      <button className="btn-ghost text-error" onClick={() => removeExperience(idx)}>🗑️ Remove</button>
                    </div>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}><label className="form-label">Job Title</label><input className="input-field" placeholder="Senior Developer" value={exp.jobTitle} onChange={(e) => updateExperience(idx, 'jobTitle', e.target.value)}/></div>
                      <div className={styles.formGroup}><label className="form-label">Company</label><input className="input-field" placeholder="Acme Corp" value={exp.company} onChange={(e) => updateExperience(idx, 'company', e.target.value)}/></div>
                    </div>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}><label className="form-label">Start Date</label><input className="input-field" placeholder="Jan 2022" value={exp.duration.startDate} onChange={(e) => updateExperience(idx, 'duration.startDate', e.target.value)}/></div>
                      <div className={styles.formGroup}><label className="form-label">End Date</label><input className="input-field" placeholder="Present" value={exp.duration.endDate} onChange={(e) => updateExperience(idx, 'duration.endDate', e.target.value)}/></div>
                      <div className={styles.formGroup}><label className="form-label">Location</label><input className="input-field" placeholder="Remote" value={exp.location || ''} onChange={(e) => updateExperience(idx, 'location', e.target.value)}/></div>
                    </div>
                    <div className={styles.formGroup}>
                      <label className="form-label">Description & Achievements</label>
                      <textarea className="textarea-field" rows={4} placeholder="Describe your key accomplishments..." value={exp.description} onChange={(e) => updateExperience(idx, 'description', e.target.value)}/>
                      <div className="flex justify-end mt-2">
                        <button className={styles.aiPolishBtn} onClick={() => handleAiPolish(idx)} disabled={isPolishing}>
                          {isPolishing && polishIdx === idx ? (<><span className="spinner" style={{ width: 14, height: 14 }}></span> Polishing...</>) : '✨ AI Polish'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button className="btn-secondary w-full" onClick={addExperience}>+ Add Position</button>
              </div>
            )}

            {activeTab === 'education' && (
              <div className="animate-in">
                {content.education.map((edu: Education, idx: number) => (
                  <div key={edu.id || idx} className={styles.entryCard}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold">Education {idx + 1}</span>
                      <button className="btn-ghost text-error" onClick={() => removeEducation(idx)}>🗑️ Remove</button>
                    </div>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}><label className="form-label">Degree</label><input className="input-field" placeholder="Bachelor of Science" value={edu.degree} onChange={(e) => updateEducation(idx, 'degree', e.target.value)}/></div>
                      <div className={styles.formGroup}><label className="form-label">Field of Study</label><input className="input-field" placeholder="Computer Science" value={edu.field} onChange={(e) => updateEducation(idx, 'field', e.target.value)}/></div>
                    </div>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}><label className="form-label">Institution</label><input className="input-field" placeholder="MIT" value={edu.institution} onChange={(e) => updateEducation(idx, 'institution', e.target.value)}/></div>
                      <div className={styles.formGroup}><label className="form-label">Graduation Date</label><input className="input-field" placeholder="May 2020" value={edu.graduationDate} onChange={(e) => updateEducation(idx, 'graduationDate', e.target.value)}/></div>
                    </div>
                  </div>
                ))}
                <button className="btn-secondary w-full" onClick={addEducation}>+ Add Education</button>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="animate-in">
                <div className="flex gap-2 mb-4">
                  <input className="input-field" placeholder="Type a skill and press Add..." value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSkill()}/>
                  <button className="btn-primary" onClick={addSkill}>Add</button>
                </div>
                <div className={styles.skillsGrid}>
                  {content.skills.map((s: string, i: number) => (
                    <span key={i} className={styles.skillPill}>
                      {s}
                      <button className={styles.skillRemove} onClick={() => removeSkill(i)}>×</button>
                    </span>
                  ))}
                </div>
                {content.skills.length === 0 && <p className="caption text-center mt-6">No skills added yet. Start typing above to add your technical and soft skills.</p>}
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="animate-in">
                {content.projects.map((proj: Project, idx: number) => (
                  <div key={proj.id || idx} className={styles.entryCard}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold">Project {idx + 1}</span>
                      <button className="btn-ghost text-error" onClick={() => removeProject(idx)}>🗑️ Remove</button>
                    </div>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}><label className="form-label">Title</label><input className="input-field" placeholder="Project Name" value={proj.title} onChange={(e) => updateProject(idx, 'title', e.target.value)}/></div>
                      <div className={styles.formGroup}><label className="form-label">Link</label><input className="input-field" placeholder="https://..." value={proj.link || ''} onChange={(e) => updateProject(idx, 'link', e.target.value)}/></div>
                    </div>
                    <div className={styles.formGroup}>
                      <label className="form-label">Description</label>
                      <textarea className="textarea-field" rows={3} placeholder="Describe the project..." value={proj.description} onChange={(e) => updateProject(idx, 'description', e.target.value)}/>
                    </div>
                    <div className={styles.formGroup}>
                      <label className="form-label">Technologies</label>
                      <div className="flex gap-2 mb-2">
                        <input className="input-field" placeholder="Add technology..." value={techInput} onChange={(e) => setTechInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addProjectTech(idx)}/>
                        <button className="btn-secondary" onClick={() => addProjectTech(idx)}>Add</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {proj.technologies.map((t: string, ti: number) => (
                          <span key={ti} className={styles.skillPill}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                <button className="btn-secondary w-full" onClick={addProject}>+ Add Project</button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={styles.formActions}>
            <button className="btn-secondary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? '✓ Saved' : '💾 Save Resume'}
            </button>
            <button className="btn-primary" onClick={handleDownloadDocx}>
              📄 Download Resume
            </button>
          </div>
        </div>

        {/* RIGHT: Preview + ATS */}
        <div className={styles.previewPane}>
          {/* ATS Score */}
          <div className={styles.atsCard}>
            <div className={styles.atsHeader}>
              <span className="overline">ATS OPTIMIZATION SCORE</span>
            </div>
            <div className={styles.atsCircle}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle cx="60" cy="60" r="52" fill="none" stroke={scoreColor} strokeWidth="8"
                  strokeDasharray={`${(atsScore / 100) * 327} 327`}
                  strokeLinecap="round" transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dasharray 0.6s ease' }}
                />
              </svg>
              <div className={styles.atsScoreText}>
                <span className={styles.atsScoreNum} style={{ color: scoreColor }}>{atsScore}</span>
                <span className={styles.atsScoreLabel}>{scoreLabel}</span>
              </div>
            </div>
            <p className="caption text-center mt-2">
              {atsScore >= 80 ? 'Your resume is well-optimized for ATS systems!' 
               : atsScore >= 50 ? 'Add more details to improve your score.'
               : 'Start filling out your resume to see your score improve.'}
            </p>
          </div>

          {/* Preview */}
          <div className={styles.previewCard}>
            <div className="flex justify-between items-center mb-4">
              <span className="overline">LIVE PREVIEW</span>
              <button className="btn-ghost" onClick={() => setShowPreview(!showPreview)}>
                {showPreview ? '👁️ Hide' : '👁️ Show'}
              </button>
            </div>
            {showPreview && (
              <div className={styles.previewFrame}>
                {content.personalInfo.fullName ? (
                  <div className={styles.previewContent}>
                    <h2 className={styles.prevName}>{content.personalInfo.fullName}</h2>
                    <p className={styles.prevContact}>
                      {[content.personalInfo.email, content.personalInfo.phone, content.personalInfo.location].filter(Boolean).join(' • ')}
                    </p>
                    {content.personalInfo.summary && <p className={styles.prevSummary}>{content.personalInfo.summary}</p>}
                    {content.experience.length > 0 && (
                      <div className={styles.prevSection}>
                        <h3 className={styles.prevSectionTitle}>EXPERIENCE</h3>
                        {content.experience.map((exp: Experience, i: number) => (
                          <div key={i} className={styles.prevEntry}>
                            <div className={styles.prevEntryTitle}>{exp.jobTitle}{exp.company ? ` at ${exp.company}` : ''}</div>
                            <div className={styles.prevEntryMeta}>{exp.duration.startDate}{exp.duration.endDate ? ` – ${exp.duration.endDate}` : ''}</div>
                            <p className={styles.prevEntryDesc}>{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {content.education.length > 0 && (
                      <div className={styles.prevSection}>
                        <h3 className={styles.prevSectionTitle}>EDUCATION</h3>
                        {content.education.map((edu: Education, i: number) => (
                          <div key={i} className={styles.prevEntry}>
                            <div className={styles.prevEntryTitle}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</div>
                            <div className={styles.prevEntryMeta}>{edu.institution}{edu.graduationDate ? `, ${edu.graduationDate}` : ''}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {content.skills.length > 0 && (
                      <div className={styles.prevSection}>
                        <h3 className={styles.prevSectionTitle}>SKILLS</h3>
                        <p className={styles.prevEntryDesc}>{content.skills.join(' • ')}</p>
                      </div>
                    )}
                    {content.projects.length > 0 && (
                      <div className={styles.prevSection}>
                        <h3 className={styles.prevSectionTitle}>PROJECTS</h3>
                        {content.projects.map((p: Project, i: number) => (
                          <div key={i} className={styles.prevEntry}>
                            <div className={styles.prevEntryTitle}>{p.title}</div>
                            <p className={styles.prevEntryDesc}>{p.description}</p>
                            {p.technologies.length > 0 && <div className={styles.prevEntryMeta}>Tech: {p.technologies.join(', ')}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.previewEmpty}>
                    <span style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📝</span>
                    <h3 className="font-semibold mb-1">Resume Template</h3>
                    <p className="caption">Start filling out your information on the left to see a live preview of your resume here.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
