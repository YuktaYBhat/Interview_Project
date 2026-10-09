'use client';
import { useState, useEffect } from 'react';
import { useResumeStore } from '@/lib/store';
import { Question } from '@/types';
import styles from './QA.module.css';

export default function QAGenerator() {
  const { resumes, selectedResumeId, setSelectedResume } = useResumeStore();
  const [mounted, setMounted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQ, setSelectedQ] = useState<Question | null>(null);
  const [draft, setDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [jobDescription, setJobDescription] = useState('');

  useEffect(() => { setMounted(true); }, []);

  // Timer
  useEffect(() => {
    let interval: any;
    if (timerActive) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleResumeSelect = (id: string) => {
    setSelectedResume(id);
    setQuestions([]);
    setSelectedQ(null);
    setFeedback(null);
    setDraft('');
  };

  const handleGenerateQuestions = async () => {
    const resume = resumes.find((r: any) => r.id === selectedResumeId);
    if (!resume) return;
    setIsGenerating(true);
    setFeedback(null);
    setDraft('');
    try {
      const historyKey = `practice-qa-history:${resume.id}:${jobDescription.trim().slice(0, 100)}`;
      const previousQuestions = JSON.parse(localStorage.getItem(historyKey) || '[]') as string[];
      const res = await fetch('/api/generate-practice-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'GENERATE_QUESTIONS', resumeText: JSON.stringify(resume.content), jobDescription, companyName: 'Target role', previousQuestions, randomSeed: Date.now() }),
      });
      const data = await res.json();
      if (data.success && data.data?.questions) {
        const generated = data.data.questions.map((question: any, index: number) => ({ id: question.id || `q_${Date.now()}_${index}`, category: mapCategory(question.category), priority: 'medium', text: question.question, suggestedLength: '2-3 minutes', resumeContext: question.keyFocus }));
        setQuestions(generated);
        localStorage.setItem(historyKey, JSON.stringify([...previousQuestions, ...generated.map((question: Question) => question.text)].slice(-50)));
        setSelectedQ(generated[0] || null);
      }
    } catch (e) { console.error(e); }
    finally { setIsGenerating(false); }
  };

  const handleSelectQuestion = (q: Question) => {
    setSelectedQ(q);
    setDraft('');
    setFeedback(null);
    setTimer(0);
    setTimerActive(false);
  };

  const handleStartDraft = () => {
    setTimerActive(true);
  };

  const handleGetFeedback = async () => {
    if (!selectedQ || draft.length < 10) return;
    setIsScoring(true);
    setTimerActive(false);
    try {
      const res = await fetch('/api/generate-practice-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EVALUATE_RESPONSE', questionText: selectedQ.text, userDraftAnswer: draft }),
      });
      const data = await res.json();
      setFeedback(data.is_valid === false ? { score: 0, positives: [], improvements: [data.feedback] } : { score: Number.parseInt(String(data.relevance_score || '0'), 10) * 10, positives: [data.feedback], improvements: [data.improved_sample_answer], starBreakdown: data.star_breakdown });
    } catch (e) { console.error(e); }
    finally { setIsScoring(false); }
  };

  const currentResume = resumes.find((r: any) => r.id === selectedResumeId);
  const categoryColors: Record<string, string> = {
    behavioral: 'badge-blue',
    technical: 'badge-purple',
    leadership: 'badge-amber',
    situational: 'badge-green',
  };
  const priorityLabels: Record<string, string> = {
    high: '🔥 High Priority',
    medium: '⚡ Medium',
    low: '💡 Low',
  };

  if (!mounted) return null;

  return (
    <div className={styles.pageWrapper}>
      <div className="mb-4">
        <h1 className="h1">Practice Q&A</h1>
        <p className="body-sm mt-1">Questions are generated from your saved resumes. Select a resume and start practicing.</p>
      </div>

      {/* Resume Picker */}
      <div className={styles.resumePicker}>
        <span className="overline">SELECT RESUME</span>
        <div className="flex gap-2 flex-wrap">
          {resumes.length === 0 ? (
            <p className="body-sm">No resumes saved yet. <a href="/resume" className="text-primary font-semibold">Create one first →</a></p>
          ) : (
            resumes.map((r: any) => (
              <button
                key={r.id}
                className={`${styles.resumePickBtn} ${r.id === selectedResumeId ? styles.resumePickBtnActive : ''}`}
                onClick={() => handleResumeSelect(r.id)}
              >
                📄 {r.title || 'Untitled'}
              </button>
            ))
          )}
        </div>
        <textarea
          className="textarea-field"
          rows={4}
          placeholder="Paste the target job description so questions match the role and required skills..."
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
        />
        {selectedResumeId && (
          <button className="btn-primary mt-3" onClick={handleGenerateQuestions} disabled={isGenerating}>
            {isGenerating ? (<><span className="spinner" style={{ width: 14, height: 14 }}></span> Generating...</>) : '🎯 Generate Interview Questions'}
          </button>
        )}
      </div>

      {questions.length > 0 && (
        <div className={styles.mainGrid}>
          {/* Questions List */}
          <div className={styles.questionsCol}>
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold" style={{ fontSize: '0.875rem' }}>Questions ({questions.length})</span>
              <span className="badge badge-blue">AI Generated</span>
            </div>
            <div className={styles.questionsList}>
              {questions.map((q) => (
                <button
                  key={q.id}
                  className={`${styles.questionItem} ${selectedQ?.id === q.id ? styles.questionItemActive : ''}`}
                  onClick={() => handleSelectQuestion(q)}
                >
                  <div className="flex gap-2 mb-2">
                    <span className={`badge ${categoryColors[q.category] || 'badge-gray'}`}>{q.category.toUpperCase()}</span>
                    {q.priority === 'high' && <span className="badge badge-red">HIGH</span>}
                  </div>
                  <p className={styles.questionText}>{q.text}</p>
                  {q.resumeContext && <p className="caption mt-2">📎 {q.resumeContext}</p>}
                </button>
              ))}
            </div>
          </div>

          {/* Main Practice Area */}
          {selectedQ && (
            <div className={styles.practiceCol}>
              <div className={styles.questionHero}>
                <div className="flex gap-2 mb-3">
                  <span className={`badge ${categoryColors[selectedQ.category]}`}>{selectedQ.category.toUpperCase()}</span>
                  <span className="caption">{priorityLabels[selectedQ.priority]}</span>
                </div>
                <h2 className={styles.questionHeroText}>"{selectedQ.text}"</h2>
                {selectedQ.resumeContext && (
                  <div className={styles.contextBox}>
                    <span className="overline">RESUME CONTEXT</span>
                    <p className="body-sm mt-1">{selectedQ.resumeContext}</p>
                  </div>
                )}
                <div className={styles.frameworkTip}>
                  <span className="font-semibold text-primary" style={{ fontSize: '0.8125rem' }}>💡 Tip:</span>
                  <span className="body-sm ml-2">Use the STAR method — Situation, Task, Action, Result.</span>
                </div>
              </div>

              {/* Draft Area */}
              <div className={styles.draftSection}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold" style={{ fontSize: '0.875rem' }}>Draft Your Response</h3>
                  <span className="caption">⏱️ {formatTime(timer)}</span>
                </div>
                <textarea
                  className={styles.draftTextarea}
                  placeholder="Start typing your response... (Click to start timer)"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onFocus={handleStartDraft}
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="caption">{draft.length} characters</span>
                  <button className="btn-primary" onClick={handleGetFeedback} disabled={isScoring || draft.length < 10}>
                    {isScoring ? (<><span className="spinner" style={{ width: 14, height: 14 }}></span> Analyzing...</>) : '✨ Get AI Feedback'}
                  </button>
                </div>
              </div>

              {/* Feedback */}
              {feedback && (
                <div className={`${styles.feedbackCard} animate-in`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={styles.feedbackScore} style={{ borderColor: feedback.score >= 70 ? '#059669' : feedback.score >= 50 ? '#d97706' : '#dc2626' }}>
                      {feedback.score}
                    </div>
                    <div>
                      <h4 className="font-semibold">Readiness Score</h4>
                      <p className="caption">{feedback.score >= 70 ? 'Great job!' : 'Keep refining.'}</p>
                    </div>
                  </div>

                  {feedback.positives?.length > 0 && (
                    <div className="mb-4">
                      <span className="overline text-success">STRENGTHS</span>
                      <ul className={styles.feedbackList}>
                        {feedback.positives.map((p: string, i: number) => (
                          <li key={i}><span style={{ color: '#059669' }}>✓</span> {p}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {feedback.improvements?.length > 0 && (
                    <div>
                      <span className="overline text-error">AREAS FOR IMPROVEMENT</span>
                      <ul className={styles.feedbackList}>
                        {feedback.improvements.map((p: string, i: number) => (
                          <li key={i}><span style={{ color: '#dc2626' }}>!</span> {p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function mapCategory(category: string): Question['category'] {
  if (/behavior|star/i.test(category)) return 'behavioral';
  if (/leadership/i.test(category)) return 'leadership';
  if (/scenario|problem/i.test(category)) return 'situational';
  return 'technical';
}
