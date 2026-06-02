'use client';
import { useState, useEffect } from 'react';
import { useResumeStore } from '@/lib/store';
import styles from './QA-new.module.css';

export default function PracticeSection() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});

  const resumeStore = useResumeStore();

  useEffect(() => {
    setResumes(resumeStore.resumes);
  }, [resumeStore.resumes]);

  const handleGenerateQuestions = async () => {
    if (!selectedResumeId) return;

    const resume = resumes.find((r) => r.id === selectedResumeId);
    if (!resume) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: selectedResumeId, resume }),
      });

      const data = await response.json();
      if (data.success) {
        setQuestions(data.data.questions);
        setSelectedQuestionIdx(0);
        setUserAnswers({});
      }
    } catch (error) {
      console.error('Error generating questions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentQuestion = questions[selectedQuestionIdx];

  return (
    <div className="flex-col w-full h-full gap-6">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="h1">Practice & Interview Prep</h1>
        <p className="text-muted" style={{ marginTop: '0.5rem', maxWidth: '600px' }}>
          Get personalized questions based on your resume and practice your responses
        </p>
      </div>

      {/* Resume Selection */}
      <div className={styles.selectorGroup}>
        <label className={styles.label}>Select a Resume</label>
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

        <button
          className={styles.btnGenerate}
          onClick={handleGenerateQuestions}
          disabled={!selectedResumeId || isGenerating}
        >
          {isGenerating ? 'Generating Questions...' : '✨ Generate Questions'}
        </button>
      </div>

      {questions.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎯</div>
          <h2>No Questions Generated Yet</h2>
          <p>Select a resume and generate personalized interview questions</p>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Questions List */}
          <div className={styles.questionsList}>
            <h3 className={styles.listTitle}>Questions ({questions.length})</h3>
            {questions.map((question, idx) => (
              <button
                key={idx}
                className={`${styles.questionItem} ${
                  selectedQuestionIdx === idx ? styles.questionItemActive : ''
                }`}
                onClick={() => setSelectedQuestionIdx(idx)}
              >
                <div className={styles.questionMeta}>
                  <span className={`${styles.badge} ${styles['badge-' + question.category]}`}>
                    {question.category.toUpperCase()}
                  </span>
                  <span className={styles.priority}>
                    {question.priority === 'high' && '🔥'}
                    {question.priority === 'medium' && '⭐'}
                    {question.priority === 'low' && '💡'}
                  </span>
                </div>
                <p className={styles.questionText}>{question.text.substring(0, 80)}...</p>
              </button>
            ))}
          </div>

          {/* Question Detail */}
          {currentQuestion && (
            <div className={styles.questionDetail}>
              <div className={styles.questionHeader}>
                <span className={`${styles.badge} ${styles['badge-' + currentQuestion.category]}`}>
                  {currentQuestion.category.toUpperCase()}
                </span>
                <span className={styles.questionNumber}>
                  {selectedQuestionIdx + 1} / {questions.length}
                </span>
              </div>

              <h2 className={styles.questionTitle}>{currentQuestion.text}</h2>

              <div className={styles.questionInfo}>
                <div className={styles.infoItem}>
                  <strong>Suggested Length:</strong>
                  <span>{currentQuestion.suggestedLength}</span>
                </div>
                {currentQuestion.resumeContext && (
                  <div className={styles.infoItem}>
                    <strong>Context:</strong>
                    <span>{currentQuestion.resumeContext}</span>
                  </div>
                )}
              </div>

              <div className={styles.answerBox}>
                <label className={styles.answerLabel}>Your Answer</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Type your answer here. Take time to think about a specific example..."
                  value={userAnswers[selectedQuestionIdx] || ''}
                  onChange={(e) =>
                    setUserAnswers({
                      ...userAnswers,
                      [selectedQuestionIdx]: e.target.value,
                    })
                  }
                />
              </div>

              <div className={styles.navigation}>
                <button
                  className={styles.btnNav}
                  onClick={() => setSelectedQuestionIdx(Math.max(0, selectedQuestionIdx - 1))}
                  disabled={selectedQuestionIdx === 0}
                >
                  ← Previous
                </button>

                <div className={styles.progressDots}>
                  {questions.map((_, idx) => (
                    <div
                      key={idx}
                      className={`${styles.dot} ${
                        idx === selectedQuestionIdx ? styles.dotActive : ''
                      } ${userAnswers[idx] ? styles.dotAnswered : ''}`}
                      onClick={() => setSelectedQuestionIdx(idx)}
                    />
                  ))}
                </div>

                <button
                  className={styles.btnNav}
                  onClick={() =>
                    setSelectedQuestionIdx(Math.min(questions.length - 1, selectedQuestionIdx + 1))
                  }
                  disabled={selectedQuestionIdx === questions.length - 1}
                >
                  Next →
                </button>
              </div>

              <button className={styles.btnSubmit}>
                📤 Submit & Get Feedback
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
