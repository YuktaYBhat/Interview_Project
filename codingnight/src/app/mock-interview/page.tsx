'use client';
import { useState, useEffect, useRef } from 'react';
import { useResumeStore } from '@/lib/store';
import styles from './Mock.module.css';

const TOP_COMPANIES = [
  { name: 'Google', icon: '🔍', color: '#ea4335' },
  { name: 'Amazon', icon: '📦', color: '#ff9900' },
  { name: 'Microsoft', icon: '🪟', color: '#00a4ef' },
  { name: 'Meta', icon: '♾️', color: '#0668E1' },
  { name: 'Apple', icon: '🍏', color: '#555555' },
  { name: 'Netflix', icon: '🍿', color: '#e50914' },
];

export default function MockInterview() {
  const { resumes, selectedResumeId, setSelectedResume } = useResumeStore();
  const [mounted, setMounted] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [faqs, setFaqs] = useState<any[]>([]);

  // Simulation State
  const [simulationMode, setSimulationMode] = useState(false);
  const [currentFaqIndex, setCurrentFaqIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => { 
    setMounted(true); 
    
    // Setup Speech Recognition
    if (typeof window !== 'undefined') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            
            recognition.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(prev => prev + ' ' + currentTranscript);
            };
            
            recognition.onerror = (e: any) => {
                console.error("Speech recognition error:", e);
                setIsListening(false);
            };
            
            recognition.onend = () => {
                setIsListening(false);
            };
            
            recognitionRef.current = recognition;
        }
    }
  }, []);

  const handleResumeSelect = (id: string) => {
    setSelectedResume(id);
    setFaqs([]);
    setSimulationMode(false);
  };

  const currentResume = resumes.find((r: any) => r.id === selectedResumeId);

  const fetchFaqs = async (companyName: string) => {
    if (!currentResume) return;
    
    setSelectedCompany(companyName);
    setIsGenerating(true);
    setFaqs([]);
    setSimulationMode(false);

    try {
      const res = await fetch('/api/company-faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: currentResume.id,
          resume: currentResume,
          jobDescription,
          company: companyName
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.faqs) {
        setFaqs(data.data.faqs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const speak = (text: string, callback?: () => void) => {
      if (!('speechSynthesis' in window)) {
          if (callback) callback();
          return;
      }
      
      window.speechSynthesis.cancel(); // Stop any current speech
      setAiSpeaking(true);
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
          setAiSpeaking(false);
          if (callback) callback();
      };
      
      window.speechSynthesis.speak(utterance);
  };

  const startSimulation = () => {
      setSimulationMode(true);
      setCurrentFaqIndex(0);
      setTranscript('');
      
      if (faqs.length > 0) {
          // Add a tiny delay for UI to transition
          setTimeout(() => {
              speak(`Welcome to your mock interview at ${selectedCompany}. We've reviewed your resume. Our first question is: ${faqs[0].question}`);
          }, 500);
      }
  };

  const toggleListening = () => {
      if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
      } else {
          try {
            recognitionRef.current?.start();
            setIsListening(true);
          } catch (e) {
             console.error("Mic start error", e);
          }
      }
  };

  const nextQuestion = () => {
      if (isListening) toggleListening();
      window.speechSynthesis.cancel();
      
      if (currentFaqIndex < faqs.length - 1) {
          const nextIdx = currentFaqIndex + 1;
          setCurrentFaqIndex(nextIdx);
          setTranscript('');
          
          speak(`Great. Next question: ${faqs[nextIdx].question}`);
      } else {
          speak("That concludes our interview. Thank you for your time.");
          setTimeout(() => setSimulationMode(false), 4000);
      }
  };

  const exitSimulation = () => {
      setSimulationMode(false);
      window.speechSynthesis.cancel();
      if (isListening) recognitionRef.current?.stop();
      setIsListening(false);
  };

  if (!mounted) return null;

  return (
    <div className={styles.pageWrapper}>
      <div className="mb-4">
        <h1 className="h1">Mock Interview & Company FAQs</h1>
        <p className="body-sm mt-1">Select a resume, outline your target job, and discover company-specific FAQs tailored to your profile.</p>
      </div>

      {!simulationMode && (
        <div className={styles.setupCard}>
            <div className={styles.setupRow}>
            <div className={styles.setupSection}>
                <span className="overline mb-2">SELECT RESUME</span>
                <div className="flex gap-2 flex-wrap">
                {resumes.length === 0 ? (
                    <p className="body-sm">No resumes saved yet. <a href="/resume" className="text-primary font-semibold">Create one first →</a></p>
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
            <div className={styles.setupSection} style={{ flex: 1.5 }}>
                <span className="overline mb-2">TARGET JOB DESCRIPTION (OPTIONAL)</span>
                <textarea
                className="textarea-field"
                rows={3}
                placeholder="Paste the job description here for more precise company questions..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                />
            </div>
            </div>
        </div>
      )}

      <div className={styles.mainContent}>
        {!simulationMode && (
            <div className={styles.companiesCol}>
            <span className="overline mb-3">TOP COMPANIES</span>
            <div className={styles.companiesList}>
                {TOP_COMPANIES.map((company) => (
                <button
                    key={company.name}
                    className={`${styles.companyCard} ${selectedCompany === company.name ? styles.companyCardActive : ''}`}
                    onClick={() => fetchFaqs(company.name)}
                    disabled={!selectedResumeId || isGenerating}
                    style={{ '--brand-color': company.color } as React.CSSProperties}
                >
                    <div className={styles.companyIcon}>{company.icon}</div>
                    <div className={styles.companyName}>{company.name}</div>
                </button>
                ))}
            </div>
            {!selectedResumeId && (
                <p className="caption mt-3 text-warning">Please select a resume first.</p>
            )}
            </div>
        )}

        <div className={styles.faqsCol}>
          {simulationMode ? (
              <div className={styles.simulationContainer}>
                  <div className={styles.simHeader}>
                      <button className="btn-secondary" onClick={exitSimulation}>← Exit Interview</button>
                      <span className="badge badge-amber">{selectedCompany} Simulation</span>
                  </div>
                  
                  <div className={styles.waveVisualizer}>
                      {[...Array(12)].map((_, i) => (
                          <div key={i} className={`${styles.waveBar} ${aiSpeaking || isListening ? styles.active : ''}`}></div>
                      ))}
                  </div>
                  
                  <div className={styles.questionCard}>
                      <h3 className="h3" style={{ marginBottom: '1rem' }}>{faqs[currentFaqIndex]?.question}</h3>
                      <p className="caption text-muted">Question {currentFaqIndex + 1} of {faqs.length}</p>
                  </div>
                  
                  <div className={styles.transcriptBox}>
                      {transcript ? `"${transcript}"` : <span style={{ opacity: 0.5 }}>{isListening ? 'Listening...' : 'Your answer will appear here...'}</span>}
                  </div>
                  
                  <div className="flex gap-4 items-center mt-2">
                      <button 
                        className={`${styles.micButton} ${isListening ? styles.listening : ''}`} 
                        onClick={toggleListening}
                      >
                          {isListening ? '⏹️' : '🎙️'}
                      </button>
                      
                      <button className="btn-secondary" onClick={nextQuestion}>
                          {currentFaqIndex < faqs.length - 1 ? 'Next Question →' : 'Finish →'}
                      </button>
                  </div>
              </div>
          ) : !selectedCompany ? (
            <div className={styles.emptyState}>
              <span style={{ fontSize: '3rem', opacity: 0.5 }}>🏢</span>
              <p className="body-sm mt-3 text-muted">Select a company from the left to view tailored FAQs.</p>
            </div>
          ) : isGenerating ? (
            <div className={styles.emptyState}>
              <span className="spinner" style={{ width: '32px', height: '32px', borderTopColor: 'var(--color-primary)', borderRightColor: 'var(--color-primary)' }}></span>
              <p className="body-sm mt-3 font-medium">Analyzing your resume and generating {selectedCompany} FAQs...</p>
            </div>
          ) : faqs.length > 0 ? (
            <div className="animate-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="h3">🎯 {selectedCompany} Specific FAQs</span>
                    <span className="badge badge-blue">AI Tailored</span>
                </div>
                <button className="btn-primary" onClick={startSimulation} style={{ background: 'linear-gradient(135deg, #d97706, #ea580c)' }}>
                    🎙️ Start Voice Simulation
                </button>
              </div>
              <div className={styles.faqsList}>
                {faqs.map((faq, i) => (
                  <div key={faq.id || i} className={styles.faqCard}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`badge ${faq.category === 'behavioral' ? 'badge-blue' : faq.category === 'technical' ? 'badge-purple' : faq.category === 'system-design' ? 'badge-amber' : 'badge-green'}`}>
                        {(faq.category || 'general').toUpperCase()}
                      </span>
                    </div>
                    <h4 className={styles.faqQuestion}>"{faq.question}"</h4>
                    {faq.strategy && (
                      <div className={styles.faqStrategy}>
                        <span className="font-semibold text-primary" style={{ fontSize: '0.8125rem' }}>💡 Strategy:</span>
                        <p className="body-sm mt-1">{faq.strategy}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className="body-sm text-muted">No FAQS generated. Try again.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
