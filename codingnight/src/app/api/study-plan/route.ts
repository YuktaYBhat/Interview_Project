import { NextRequest, NextResponse } from 'next/server';
import { StudyPlan, Skill, StudyModule, StudyResource } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { resumeId, resume, jobDescription } = await request.json();

    if (!resume || !jobDescription) {
      return NextResponse.json(
        { success: false, error: 'Resume and job description are required' },
        { status: 400 }
      );
    }

    // Analyze gaps
    const gaps = analyzeSkillGaps(resume, jobDescription);

    // Generate study plan
    const modules = generateStudyModules(gaps, jobDescription);

    const studyPlan: StudyPlan = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'current-user', // This should come from auth
      resumeId,
      jobDescription,
      gaps,
      modules,
      createdAt: new Date(),
    };

    return NextResponse.json(
      {
        success: true,
        data: studyPlan,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Study plan generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function analyzeSkillGaps(resume: any, jobDescription: string): Skill[] {
  const requiredSkills = extractSkillsFromJD(jobDescription);
  const resumeSkills = resume.content.skills || [];

  const skills: Skill[] = [];

  for (const skill of requiredSkills) {
    const hasSkill = resumeSkills.some((s: string) =>
      s.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(s.toLowerCase())
    );

    const requiredLevel = determineSkillLevel(skill, jobDescription);
    const currentLevel = hasSkill ? 'intermediate' : 'beginner';

    skills.push({
      name: skill,
      requiredLevel,
      currentLevel,
      gap: calculateGap(currentLevel, requiredLevel),
    });
  }

  return skills.sort((a, b) => b.gap - a.gap).slice(0, 10);
}

function extractSkillsFromJD(jobDescription: string): string[] {
  // Common technical skills keywords
  const skillKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust',
    'React', 'Vue', 'Angular', 'Next.js',
    'Node.js', 'Express', 'Django', 'Spring Boot',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
    'SQL', 'MongoDB', 'PostgreSQL', 'Redis',
    'API', 'REST', 'GraphQL',
    'Agile', 'Scrum', 'CI/CD', 'Git',
    'HTML', 'CSS', 'SASS',
    'Machine Learning', 'AI', 'TensorFlow', 'PyTorch',
    'Communication', 'Leadership', 'Problem-solving', 'Teamwork',
    'System Design', 'Microservices', 'Serverless',
    'DevOps', 'Monitoring', 'Testing', 'Performance',
  ];

  const jdLower = jobDescription.toLowerCase();
  const foundSkills = new Set<string>();

  for (const skill of skillKeywords) {
    if (jdLower.includes(skill.toLowerCase())) {
      foundSkills.add(skill);
    }
  }

  return Array.from(foundSkills);
}

function determineSkillLevel(skill: string, jobDescription: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  const jdLower = jobDescription.toLowerCase();
  const skillLower = skill.toLowerCase();

  // Look for level indicators
  if (jdLower.includes(`expert ${skillLower}`) || jdLower.includes(`${skillLower} expertise`)) {
    return 'expert';
  }
  if (jdLower.includes(`advanced ${skillLower}`) || jdLower.includes(`deep knowledge of ${skillLower}`)) {
    return 'advanced';
  }
  if (jdLower.includes(`familiar with ${skillLower}`) || jdLower.includes(`basic ${skillLower}`)) {
    return 'beginner';
  }

  return 'intermediate';
}

function calculateGap(current: string, required: string): number {
  const levels = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 };
  return (levels[required as keyof typeof levels] || 1) - (levels[current as keyof typeof levels] || 0);
}

function generateStudyModules(gaps: Skill[], jobDescription: string): StudyModule[] {
  const modules: StudyModule[] = [];

  gaps.slice(0, 5).forEach((gap, index) => {
    const module: StudyModule = {
      id: `module_${index}`,
      title: `Master ${gap.name}`,
      duration: gap.gap > 2 ? 180 : gap.gap > 1 ? 120 : 60,
      difficulty: gap.requiredLevel as any,
      topics: generateTopics(gap.name),
      resources: generateResources(gap.name),
      completed: false,
    };

    modules.push(module);
  });

  return modules;
}

function generateTopics(skill: string): string[] {
  const topicMap: Record<string, string[]> = {
    'JavaScript': ['ES6+ Features', 'Async/Await', 'Closures', 'Prototypes', 'DOM Manipulation'],
    'Python': ['Data Structures', 'OOP Concepts', 'Functional Programming', 'Libraries (NumPy, Pandas)', 'Decorators'],
    'React': ['Hooks', 'State Management', 'Performance Optimization', 'Context API', 'Testing'],
    'AWS': ['EC2', 'S3', 'Lambda', 'RDS', 'CloudFront', 'VPC'],
    'Docker': ['Images', 'Containers', 'Docker Compose', 'Registry', 'Networking'],
    'System Design': ['Scalability', 'Load Balancing', 'Caching', 'Databases', 'Message Queues'],
  };

  return topicMap[skill] || ['Fundamentals', 'Best Practices', 'Real-world Applications', 'Troubleshooting'];
}

function generateResources(skill: string): StudyResource[] {
  return [
    {
      id: `res_${skill}_1`,
      title: `${skill} Complete Guide - Udemy`,
      type: 'course',
      url: `https://www.udemy.com/search/?q=${skill}`,
      duration: 240,
      rating: 4.8,
      source: 'Udemy',
    },
    {
      id: `res_${skill}_2`,
      title: `${skill} Tutorial - YouTube`,
      type: 'video',
      url: `https://www.youtube.com/results?search_query=${skill}+tutorial`,
      duration: 120,
      rating: 4.6,
      source: 'YouTube',
    },
    {
      id: `res_${skill}_3`,
      title: `${skill} Documentation`,
      type: 'documentation',
      url: `https://docs.${skill.toLowerCase()}.io`,
      rating: 4.9,
      source: 'Official',
    },
    {
      id: `res_${skill}_4`,
      title: `${skill} on Medium - Best Articles`,
      type: 'article',
      url: `https://medium.com/search?q=${skill}`,
      rating: 4.5,
      source: 'Medium',
    },
    {
      id: `res_${skill}_5`,
      title: `${skill} Interactive Course - Codecademy`,
      type: 'course',
      url: `https://www.codecademy.com/learn/${skill.toLowerCase()}`,
      duration: 180,
      rating: 4.7,
      source: 'Codecademy',
    },
  ];
}
