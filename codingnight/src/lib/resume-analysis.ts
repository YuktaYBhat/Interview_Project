export type SkillMatch = {
  name: string;
  requiredLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  currentLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  gap: number;
  matched: boolean;
  evidence?: string;
};

const SKILL_ALIASES: Record<string, string[]> = {
  javascript: ['javascript', 'js', 'ecmascript'],
  typescript: ['typescript', 'ts'],
  'node.js': ['node.js', 'nodejs', 'node'],
  'next.js': ['next.js', 'nextjs'],
  'machine learning': ['machine learning', 'ml'],
  'system design': ['system design', 'distributed systems'],
  'ci/cd': ['ci/cd', 'continuous integration', 'continuous delivery'],
  'rest api': ['rest api', 'restful api', 'rest'],
  sql: ['sql', 'mysql', 'postgresql', 'postgres'],
};

const KNOWN_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'React', 'Vue', 'Angular', 'Next.js',
  'Node.js', 'Express', 'Django', 'Spring Boot', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'SQL',
  'MongoDB', 'PostgreSQL', 'Redis', 'REST API', 'GraphQL', 'Agile', 'Scrum', 'CI/CD', 'Git', 'HTML', 'CSS',
  'Machine Learning', 'AI', 'TensorFlow', 'PyTorch', 'Communication', 'Leadership', 'Problem-solving',
  'Teamwork', 'System Design', 'Microservices', 'Serverless', 'DevOps', 'Monitoring', 'Testing', 'Performance',
];

const levels = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 } as const;

export function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[\u2013\u2014]/g, '-').replace(/[^a-z0-9+#./ -]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function resumeToText(resume: any): string {
  const c = resume?.content || {};
  return [
    c.personalInfo?.summary,
    ...(c.skills || []),
    ...(c.experience || []).flatMap((item: any) => [item.jobTitle, item.company, item.description]),
    ...(c.education || []).flatMap((item: any) => [item.degree, item.field, item.institution]),
    ...(c.projects || []).flatMap((item: any) => [item.title, item.description, ...(item.technologies || [])]),
  ].filter(Boolean).join('\n');
}

export function extractSkills(text: string): string[] {
  const normalized = normalizeText(text);
  return KNOWN_SKILLS.filter((skill) => {
    const aliases = SKILL_ALIASES[skill.toLowerCase()] || [skill.toLowerCase()];
    return aliases.some((alias) => new RegExp(`(^|\\s|[^a-z0-9])${escapeRegExp(alias)}($|\\s|[^a-z0-9])`, 'i').test(normalized));
  });
}

export function inferRequiredLevel(skill: string, jobDescription: string): SkillMatch['requiredLevel'] {
  const text = normalizeText(jobDescription);
  const name = normalizeText(skill);
  if (new RegExp(`(expert|expertise|principal|architect|lead).*${escapeRegExp(name)}`, 'i').test(text)) return 'expert';
  if (new RegExp(`(advanced|deep knowledge|strong).*${escapeRegExp(name)}`, 'i').test(text)) return 'advanced';
  if (new RegExp(`(basic|familiar|exposure).*${escapeRegExp(name)}`, 'i').test(text)) return 'beginner';
  return 'intermediate';
}

export function analyzeResumeAgainstJob(resume: any, jobDescription: string) {
  const resumeText = resumeToText(resume);
  const requiredSkills = extractSkills(jobDescription);
  const resumeSkills = extractSkills(resumeText);
  const explicitResumeSkills = (resume?.content?.skills || []).map((skill: string) => skill.trim());
  const allRequired = requiredSkills.length ? requiredSkills : extractKeywordRequirements(jobDescription);
  const skills: SkillMatch[] = allRequired.map((name) => {
    const aliases = SKILL_ALIASES[name.toLowerCase()] || [name.toLowerCase()];
    const evidence = explicitResumeSkills.find((skill: string) => aliases.some((alias) => normalizeText(skill).includes(alias)))
      || resumeSkills.find((skill) => skill.toLowerCase() === name.toLowerCase());
    const requiredLevel = inferRequiredLevel(name, jobDescription);
    const currentLevel = evidence ? inferCurrentLevel(name, resumeText) : 'beginner';
    return { name, requiredLevel, currentLevel, gap: Math.max(0, levels[requiredLevel] - levels[currentLevel]), matched: Boolean(evidence), evidence };
  });
  const matched = skills.filter((skill) => skill.matched).length;
  const coverage = skills.length ? Math.round((matched / skills.length) * 100) : 0;
  return { skills, matchedSkills: skills.filter((skill) => skill.matched), missingSkills: skills.filter((skill) => !skill.matched), coverage, resumeSkills, requiredSkills: allRequired };
}

function inferCurrentLevel(skill: string, resumeText: string): SkillMatch['currentLevel'] {
  const text = normalizeText(resumeText);
  const name = escapeRegExp(normalizeText(skill));
  if (new RegExp(`(architect|led|expert|owned|designed).*${name}`, 'i').test(text)) return 'advanced';
  if (new RegExp(`(senior|developed|built|implemented|managed).*${name}`, 'i').test(text)) return 'intermediate';
  return 'beginner';
}

function extractKeywordRequirements(text: string): string[] {
  const words = text.split(/\s+/).map((word) => word.replace(/[^a-z0-9+#./-]/gi, '')).filter((word) => word.length >= 4);
  return Array.from(new Set(words.filter((word) => /[a-z]/i.test(word)))).slice(0, 20);
}

function escapeRegExp(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
