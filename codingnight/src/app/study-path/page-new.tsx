'use client';
import { useState, useEffect } from 'react';
import { useResumeStore } from '@/lib/store';
import styles from './Study-new.module.css';

export default function StudyMode() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState('');

  const resumeStore = useResumeStore();

  useEffect(() => {
    setResumes(resumeStore.resumes);
  }, [resumeStore.resumes]);

  const handleGeneratePlan = async () => {
    if (!selectedResumeId || !jobDescription.trim()) return;

    const resume = resumes.find((r) => r.id === selectedResumeId);
    if (!resume) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: selectedResumeId,
          resume,
          jobDescription,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setStudyPlan(data.data);
        setActiveModuleId(data.data.modules[0]?.id || '');
      }
    } catch (error) {
      console.error('Error generating study plan:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentModule = studyPlan?.modules.find((m: any) => m.id === activeModuleId);

  return (
    <div className="flex-col w-full h-full gap-6">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="h1">Personalized Study Path</h1>
        <p className="text-muted" style={{ marginTop: '0.5rem', maxWidth: '600px' }}>
          Get a customized learning path based on your resume and target job
        </p>
      </div>

      {/* Input Section */}
      <div className={styles.inputSection}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Select Your Resume</label>
          <select
            className={styles.select}
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
          >
            <option value="">-- Choose a resume --</option>
            {resumes.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resume.title || 'Untitled Resume'}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Job Description</label>
          <textarea
            className={styles.textarea}
            placeholder="Paste the job description here. The more details, the better the study plan!"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={6}
          />
          <div className={styles.hint}>
            Include role title, required skills, experience level, and responsibilities
          </div>
        </div>

        <button
          className={styles.btnGenerate}
          onClick={handleGeneratePlan}
          disabled={!selectedResumeId || !jobDescription.trim() || isGenerating}
        >
          {isGenerating ? 'Analyzing Your Fit...' : '🎯 Generate Study Plan'}
        </button>
      </div>

      {!studyPlan ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📚</div>
          <h2>No Study Plan Yet</h2>
          <p>Fill in your resume and job description to create a personalized learning path</p>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Skill Gaps */}
          <div className={styles.skillGaps}>
            <h3 className={styles.sidebarTitle}>Skill Gaps Identified</h3>
            <div className={styles.gapsList}>
              {studyPlan.gaps.map((gap: any, idx: number) => (
                <div key={idx} className={styles.gapItem}>
                  <div className={styles.gapHeader}>
                    <strong>{gap.name}</strong>
                    <span className={styles.gapScore}>{gap.gap === 0 ? '✓' : `${gap.gap}*`}</span>
                  </div>
                  <div className={styles.levelIndicator}>
                    <span className={styles.levelCurrent}>Current: {gap.currentLevel}</span>
                    <span className={styles.levelRequired}>Target: {gap.requiredLevel}</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${((4 - gap.gap) / 4) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Study Modules */}
          <div className="flex-col flex-1">
            <div className={styles.modulesContainer}>
              {studyPlan.modules.map((module: any, idx: number) => (
                <button
                  key={module.id}
                  className={`${styles.moduleCard} ${
                    activeModuleId === module.id ? styles.moduleCardActive : ''
                  }`}
                  onClick={() => setActiveModuleId(module.id)}
                >
                  <div className={styles.moduleNumber}>{idx + 1}</div>
                  <div className={styles.moduleInfo}>
                    <h4 className={styles.moduleTitle}>{module.title}</h4>
                    <div className={styles.moduleMeta}>
                      <span className={styles.moduleDuration}>⏱ {module.duration} mins</span>
                      <span className={`${styles.moduleDifficulty} ${styles['difficulty-' + module.difficulty]}`}>
                        {module.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className={styles.moduleStatus}>
                    {module.completed ? (
                      <span className={styles.completed}>✓ Done</span>
                    ) : (
                      <span className={styles.notStarted}>→</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Module Detail */}
            {currentModule && (
              <div className={styles.moduleDetail}>
                <div className={styles.detailHeader}>
                  <h2>{currentModule.title}</h2>
                  <span className={`${styles.badge} ${styles['badge-' + currentModule.difficulty]}`}>
                    {currentModule.difficulty.toUpperCase()}
                  </span>
                </div>

                <div className={styles.topics}>
                  <h3 className={styles.topicsTitle}>Topics to Master</h3>
                  <div className={styles.topicsList}>
                    {currentModule.topics.map((topic: string, idx: number) => (
                      <div key={idx} className={styles.topicItem}>
                        <span className={styles.topicDot}>•</span>
                        <span>{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.resources}>
                  <h3 className={styles.resourcesTitle}>Recommended Resources</h3>
                  <div className={styles.resourcesList}>
                    {currentModule.resources.map((resource: any) => (
                      <a
                        key={resource.id}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.resourceCard}
                      >
                        <div className={styles.resourceType}>
                          {resource.type === 'video' && '▶️'}
                          {resource.type === 'article' && '📄'}
                          {resource.type === 'course' && '📚'}
                          {resource.type === 'documentation' && '📖'}
                        </div>
                        <div className={styles.resourceInfo}>
                          <h4>{resource.title}</h4>
                          <div className={styles.resourceMeta}>
                            <span>{resource.source}</span>
                            <span className={styles.rating}>⭐ {resource.rating}</span>
                            {resource.duration && <span>⏱ {resource.duration} mins</span>}
                          </div>
                        </div>
                        <div className={styles.resourceLink}>→</div>
                      </a>
                    ))}
                  </div>
                </div>

                <button className={styles.btnStartStudy}>
                  {currentModule.completed ? '✓ Completed' : '▶️ Start Learning'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
