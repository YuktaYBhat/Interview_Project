'use client';

import { Project } from '@/types';
import styles from '../../app/resume/Resume.module.css';

interface ProjectsTabProps {
  projects: Project[];
  techInput: string;
  onTechInputChange: (value: string) => void;
  onUpdate: (index: number, field: keyof Project, value: string | string[]) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onAddTechnology: (index: number) => void;
}

export default function ProjectsTab({ projects, techInput, onTechInputChange, onUpdate, onAdd, onRemove, onAddTechnology }: ProjectsTabProps) {
  return <div className="animate-in">
    {projects.map((project, index) => <div key={project.id || index} className={styles.entryCard}>
      <div className="flex justify-between items-center mb-4"><span className="font-semibold">Project {index + 1}</span><button className="btn-ghost text-error" onClick={() => onRemove(index)}>🗑️ Remove</button></div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}><label className="form-label">Title</label><input className="input-field" value={project.title} placeholder="Project Name" onChange={(event) => onUpdate(index, 'title', event.target.value)} /></div>
        <div className={styles.formGroup}><label className="form-label">Link</label><input className="input-field" value={project.link || ''} placeholder="https://..." onChange={(event) => onUpdate(index, 'link', event.target.value)} /></div>
      </div>
      <div className={styles.formGroup}><label className="form-label">Description</label><textarea className="textarea-field" rows={3} value={project.description} placeholder="Describe the project..." onChange={(event) => onUpdate(index, 'description', event.target.value)} /></div>
      <div className={styles.formGroup}><label className="form-label">Technologies</label><div className="flex gap-2 mb-2"><input className="input-field" value={techInput} placeholder="Add technology..." onChange={(event) => onTechInputChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onAddTechnology(index); }} /><button className="btn-secondary" onClick={() => onAddTechnology(index)}>Add</button></div><div className="flex flex-wrap gap-2">{project.technologies.map((technology, techIndex) => <span key={`${technology}-${techIndex}`} className={styles.skillPill}>{technology}</span>)}</div></div>
    </div>)}
    <button className="btn-secondary w-full" onClick={onAdd}>+ Add Project</button>
  </div>;
}