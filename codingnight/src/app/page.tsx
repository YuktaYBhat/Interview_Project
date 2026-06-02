'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useResumeStore, useAuthStore } from '@/lib/store';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import styles from './Dashboard.module.css';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { resumes } = useResumeStore();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => { setMounted(true); }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Generate simulated market data based on skills count
  const marketData = useMemo(() => {
    let totalSkills = 0;
    resumes.forEach((r: any) => {
      if (r.content?.skills) totalSkills += r.content.skills.length;
    });
    
    const baseDemand = Math.min(60 + (totalSkills * 2), 98);
    const data = [];
    let currentVal = baseDemand - 20; // Start lower 6 months ago
    
    // Simulate 6 months of data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    for (let i = 0; i < 6; i++) {
        data.push({
            name: months[i],
            demand: Math.max(0, Math.min(100, currentVal + Math.random() * 10 - 2))
        });
        currentVal += (baseDemand - currentVal) / 2; // Trend towards baseDemand
    }
    // Fix last month to exact baseDemand
    data[5].demand = baseDemand;
    
    return {
        data,
        currentDemand: baseDemand,
        growth: Math.round(baseDemand - data[0].demand)
    };
  }, [resumes]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className="h1">{greeting()}{mounted && isAuthenticated && user ? `, ${user.name}` : ''} 👋</h1>
          <p className="body-sm mt-2">Your AI-powered interview preparation dashboard. Build, practice, and master.</p>
        </div>
        {mounted && !isAuthenticated && (
          <Link href="/auth/login" className="btn-primary">
            🔑 Sign In to Save Progress
          </Link>
        )}
      </div>

      <div className={styles.cardsGrid}>
        <Link href="/resume" className={styles.actionCard}>
          <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}>📝</div>
          <h3 className={styles.cardTitle}>Resume Builder</h3>
          <p className={styles.cardDesc}>
            Build ATS-optimized resumes with AI polishing and live preview.
          </p>
          <div className={styles.cardFooter}>
            <span className="caption">
              {mounted ? `${resumes.length} resume${resumes.length !== 1 ? 's' : ''} saved` : '...'}
            </span>
            <span className={styles.cardArrow}>→</span>
          </div>
        </Link>

        <Link href="/study-path" className={styles.actionCard}>
          <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}>📚</div>
          <h3 className={styles.cardTitle}>Study Path</h3>
          <p className={styles.cardDesc}>
            Get a personalized study plan based on your resume and target job description.
          </p>
          <div className={styles.cardFooter}>
            <span className="caption">Resume + JD gap analysis</span>
            <span className={styles.cardArrow}>→</span>
          </div>
        </Link>

        <Link href="/qa-generator" className={styles.actionCard}>
          <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>💬</div>
          <h3 className={styles.cardTitle}>Practice Q&A</h3>
          <p className={styles.cardDesc}>
            Practice with AI-generated questions tailored from your resume experience.
          </p>
          <div className={styles.cardFooter}>
            <span className="caption">Resume-based questions</span>
            <span className={styles.cardArrow}>→</span>
          </div>
        </Link>

        <Link href="/mock-interview" className={styles.actionCard}>
          <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #d97706, #ea580c)' }}>🎙️</div>
          <h3 className={styles.cardTitle}>Mock Interview</h3>
          <p className={styles.cardDesc}>
            Real-time simulation and company-specific FAQs tailored to your resume.
          </p>
          <div className={styles.cardFooter}>
            <span className="caption">Top Tech Companies</span>
            <span className={styles.cardArrow}>→</span>
          </div>
        </Link>
      </div>

      {mounted && (
        <div className={styles.marketWidget}>
            <div className={styles.marketHeader}>
                <div>
                    <h2 className="h3">📈 Your Skill Market Value</h2>
                    <p className="caption mt-1">Simulated demand based on skills extracted from your saved resumes.</p>
                </div>
                <div className={styles.marketStats}>
                    <div className={styles.statBox}>
                        <span className="caption">Demand Score</span>
                        <span className="font-bold text-primary" style={{ fontSize: '1.5rem' }}>{Math.round(marketData.currentDemand)}/100</span>
                    </div>
                    <div className={styles.statBox}>
                        <span className="caption">6-Month Trend</span>
                        <span className="font-bold text-success" style={{ fontSize: '1.5rem' }}>+{marketData.growth}%</span>
                    </div>
                </div>
            </div>
            
            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={marketData.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7b8d' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7b8d' }} domain={[0, 100]} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            formatter={(value: number) => [`${Math.round(value)}%`, 'Demand']}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="demand" 
                            stroke="#2563eb" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorDemand)" 
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
      )}

      <div className={styles.tipsSection}>
        <h2 className="h3 mb-4">💡 Quick Tips</h2>
        <div className={styles.tipsGrid}>
          <div className={styles.tipCard}>
            <span className={styles.tipNum}>01</span>
            <h4 className="font-semibold mb-1" style={{ fontSize: '0.875rem' }}>Start with your Resume</h4>
            <p className="caption">Build your resume first — all other features generate content from it.</p>
          </div>
          <div className={styles.tipCard}>
            <span className={styles.tipNum}>02</span>
            <h4 className="font-semibold mb-1" style={{ fontSize: '0.875rem' }}>Use AI Polish</h4>
            <p className="caption">Let AI transform your descriptions with strong action verbs and metrics.</p>
          </div>
          <div className={styles.tipCard}>
            <span className={styles.tipNum}>03</span>
            <h4 className="font-semibold mb-1" style={{ fontSize: '0.875rem' }}>Practice with Context</h4>
            <p className="caption">Questions are generated from YOUR resume, making practice highly relevant.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
