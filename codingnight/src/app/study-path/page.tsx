'use client';
import { useState, useEffect } from 'react';
import { useResumeStore, useStudyStore } from '@/lib/store';
import styles from './Study.module.css';

export default function StudyPath() {
  const { resumes, selectedResumeId, setSelectedResume } = useResumeStore();
  const { currentPlan, setCurrentPlan } = useStudyStore();
  const [mounted, setMounted] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'modules' | 'heatmap'>('modules');

  useEffect(() => { setMounted(true); }, []);

  const handleResumeSelect = (id: string) => {
    setSelectedResume(id);
    setCurrentPlan(null);
  };

  const handleGeneratePlan = async () => {
    const resume = resumes.find((r: any) => r.id === selectedResumeId);
    if (!resume || !jobDescription.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: resume.id, resume, jobDescription }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCurrentPlan(data.data);
        setActiveModuleIdx(0);
        setViewMode('modules');
      }
    } catch (e) { console.error(e); }
    finally { setIsGenerating(false); }
  };

  if (!mounted) return null;

  const plan = currentPlan;
  const activeModule = plan?.modules?.[activeModuleIdx];
  const totalGap = plan?.gaps?.reduce((s: number, g: any) => s + g.gap, 0) || 0;
  const maxGap = (plan?.gaps?.length || 1) * 3;
  const masteryPct = Math.round(((maxGap - totalGap) / maxGap) * 100);

  const renderHeatmapJD = () => {
      if (!jobDescription) return null;
      
      const missingSkills = plan?.gaps?.map((g: any) => g.name.toLowerCase()) || [];
      const resumeSkills = resumes.find((r: any) => r.id === selectedResumeId)?.content?.skills?.map((s: string) => s.toLowerCase()) || [];
      
      // Tokenize the JD roughly to allow HTML injection
      const words = jobDescription.split(/(\s+)/);
      
      return (
          <div className={styles.heatmapContainer}>
              <div className="flex gap-4 mb-4 items-center">
                  <div className="flex items-center gap-2"><span className={styles.legendMatch}></span> <span className="caption">Matched Skill</span></div>
                  <div className="flex items-center gap-2"><span className={styles.legendMiss}></span> <span className="caption">Missing Skill</span></div>
              </div>
            <p className={styles.heatmapDescription}>
                {words.map((word, i) => {
                    const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (cleanWord.length < 3) return <span key={i}>{word}</span>;
                    
                    if (resumeSkills.some((s: string) => s === cleanWord || s.includes(cleanWord))) {
                        return <mark key={i} className={styles.matchMark}>{word}</mark>;
                    }
                    if (missingSkills.some((s: string) => s === cleanWord || s.includes(cleanWord))) {
                        return <mark key={i} className={styles.missMark}>{word}</mark>;
                    }
                    
                    return <span key={i}>{word}</span>;
                })}
            </p>
          </div>
      );
  };

  return (
    <div className={styles.pageWrapper}>
      <div className="mb-4">
        <h1 className="h1">Study Path & Gap Analysis</h1>
        <p className="body-sm mt-1">Select a resume and paste the job description you&apos;re targeting. We&apos;ll generate a personalized study plan to bridge your skill gaps.</p>
      </div>

      {/* Setup */}
      <div className={styles.setupCard}>
        <div className={styles.setupRow}>
          <div className={styles.setupSection}>
            <span className="overline mb-2">SELECT RESUME</span>
            <div className="flex gap-2 flex-wrap">
              {resumes.length === 0 ? (
                <p className="body-sm">No resumes yet. <a href="/resume" className="text-primary font-semibold">Create one first →</a></p>
              ) : (
                resumes.map((r: any) => (
                  <button
                    key={r.id}
                    className={`${styles.resumeBtn} ${r.id === selectedResumeId ? styles.resumeBtnActive : ''}`}
                    onClick={() => handleResumeSelect(r.id)}
                  >
                    📄 {r.title || 'Untitled'}
                  </button>
                ))
              )}
            </div>
          </div>
          <div className={styles.setupSection} style={{ flex: 2 }}>
            <span className="overline mb-2">PASTE JOB DESCRIPTION</span>
            <textarea
              className="textarea-field"
              rows={4}
              placeholder="Paste the full job description here. We'll analyze skill requirements and compare against your resume..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>
        </div>
        <button className="btn-primary mt-4" onClick={handleGeneratePlan} disabled={isGenerating || !selectedResumeId || !jobDescription.trim()}>
          {isGenerating ? (<><span className="spinner" style={{ width: 14, height: 14 }}></span> Analyzing Gaps...</>) : '🔍 Generate Study Plan'}
        </button>
      </div>

      {/* Study Plan Results */}
      {plan && (
        <div className="animate-in">
          {/* Mastery Bar */}
          <div className={styles.masteryBar}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Overall Coverage Match</span>
              <span className="font-bold text-primary">{Math.min(100, Math.max(0, masteryPct))}%</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${Math.min(100, Math.max(0, masteryPct))}%` }} />
            </div>
          </div>

          {/* View Toggles */}
          <div className={styles.viewToggles}>
              <button 
                className={`${styles.toggleBtn} ${viewMode === 'modules' ? styles.toggleBtnActive : ''}`}
                onClick={() => setViewMode('modules')}
              >
                  📚 Study Modules
              </button>
              <button 
                className={`${styles.toggleBtn} ${viewMode === 'heatmap' ? styles.toggleBtnActive : ''}`}
                onClick={() => setViewMode('heatmap')}
              >
                  🔥 Live JD Heatmap
              </button>
          </div>

          {viewMode === 'heatmap' ? (
              renderHeatmapJD()
          ) : (
            <>
                {/* Gaps Overview */}
                {plan.gaps && plan.gaps.length > 0 && (
                    <div className={styles.gapsGrid}>
                    {plan.gaps.map((gap: any, i: number) => (
                        <div key={i} className={styles.gapCard}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold" style={{ fontSize: '0.8125rem' }}>{gap.name}</span>
                            <span className={`badge ${gap.gap >= 2 ? 'badge-red' : gap.gap >= 1 ? 'badge-amber' : 'badge-green'}`}>
                            {gap.gap >= 2 ? 'Critical' : gap.gap >= 1 ? 'Moderate' : 'Minor'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="caption">Current: {gap.currentLevel}</span>
                            <span className="caption">Required: {gap.requiredLevel}</span>
                        </div>
                        <div className={styles.gapBar}>
                            <div className={styles.gapBarFill} style={{ width: `${((3 - gap.gap) / 3) * 100}%`, background: gap.gap >= 2 ? '#dc2626' : gap.gap >= 1 ? '#d97706' : '#059669' }} />
                        </div>
                        </div>
                    ))}
                    </div>
                )}

                {/* Modules */}
                {plan.modules && plan.modules.length > 0 && (
                    <div className={styles.modulesGrid}>
                    <div className={styles.modulesNav}>
                        <span className="overline mb-3">STUDY MODULES</span>
                        {plan.modules.map((mod: any, i: number) => (
                        <button
                            key={mod.id}
                            className={`${styles.moduleBtn} ${i === activeModuleIdx ? styles.moduleBtnActive : ''}`}
                            onClick={() => setActiveModuleIdx(i)}
                        >
                            <div className="flex justify-between items-center">
                            <span className="font-semibold" style={{ fontSize: '0.8125rem' }}>{mod.title}</span>
                            {mod.completed && <span style={{ color: '#059669' }}>✓</span>}
                            </div>
                            <div className="flex gap-2 mt-1">
                            <span className="badge badge-gray">{mod.difficulty}</span>
                            <span className="caption">⏱ {mod.duration}m</span>
                            </div>
                        </button>
                        ))}
                    </div>

                    {activeModule && (
                        <div className={styles.moduleDetail}>
                        <h2 className="h2 mb-2">{activeModule.title}</h2>
                        <div className="flex gap-2 mb-4">
                            <span className="badge badge-blue">{activeModule.difficulty}</span>
                            <span className="caption">⏱ Estimated: {activeModule.duration} minutes</span>
                        </div>

                        <div className="mb-6">
                            <span className="overline mb-3">KEY TOPICS</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                            {activeModule.topics?.map((topic: string, i: number) => (
                                <span key={i} className={styles.topicPill}>{topic}</span>
                            ))}
                            </div>
                        </div>

                        <div>
                            <span className="overline mb-3">RECOMMENDED RESOURCES</span>
                            <div className={styles.resourcesList}>
                            {activeModule.resources?.map((res: any) => (
                                <a key={res.id} href={res.url} target="_blank" rel="noopener noreferrer" className={styles.resourceItem}>
                                <div className="flex items-center gap-3">
                                    <span className={styles.resourceIcon}>
                                    {res.type === 'video' ? '▶️' : res.type === 'course' ? '📚' : res.type === 'documentation' ? '📖' : '📄'}
                                    </span>
                                    <div>
                                    <p className="font-semibold" style={{ fontSize: '0.8125rem' }}>{res.title}</p>
                                    <div className="flex gap-2 mt-1">
                                        <span className="caption">{res.source}</span>
                                        <span className="caption">⭐ {res.rating}</span>
                                        {res.duration && <span className="caption">⏱ {res.duration}m</span>}
                                    </div>
                                    </div>
                                </div>
                                <span className="caption">↗</span>
                                </a>
                            ))}
                            </div>
                        </div>
                        </div>
                    )}
                    </div>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
