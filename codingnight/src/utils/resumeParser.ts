import { extractSkills } from '@/lib/resume-analysis';

export interface ParsedResume {
  title: string;
  content: {
    personalInfo: { fullName: string; email: string; phone: string; location: string; summary: string; linkedin: string; github: string };
    experience: Array<Record<string, unknown>>;
    education: Array<Record<string, unknown>>;
    skills: string[];
    projects: Array<Record<string, unknown>>;
    certifications: string[];
    achievements: string[];
  };
}

const SECTION_NAMES = ['summary', 'experience', 'education', 'projects', 'skills', 'certifications', 'achievements'] as const;
type SectionName = typeof SECTION_NAMES[number];

export function normalizeResume(value: any): ParsedResume {
  const content = value?.content || {};
  const personalInfo = content.personalInfo || {};
  const experiences = [
    ...(Array.isArray(content.experience) ? content.experience : []),
    ...(Array.isArray(content.internships) ? content.internships : []),
    ...(Array.isArray(content.workExperience) ? content.workExperience : []),
  ];
  return {
    title: value?.title || 'Imported Resume',
    content: {
      personalInfo: {
        fullName: clean(personalInfo.fullName), email: clean(personalInfo.email), phone: clean(personalInfo.phone),
        location: clean(personalInfo.location), summary: clean(personalInfo.summary), linkedin: clean(personalInfo.linkedin || personalInfo.linkedIn), github: clean(personalInfo.github || personalInfo.gitHub),
      },
      experience: dedupeExperiences(experiences.map(normalizeExperience).filter(hasResumeContent)),
      education: (Array.isArray(content.education) ? content.education : []).map(normalizeEducation).filter(hasResumeContent),
      skills: unique([...(Array.isArray(content.skills) ? content.skills : []).map((skill: any) => typeof skill === 'string' ? skill : skill?.name), ...extractSkills(JSON.stringify(content))]),
      projects: (Array.isArray(content.projects) ? content.projects : []).map(normalizeProject).filter(hasResumeContent),
      certifications: normalizeList(content.certifications), achievements: normalizeList(content.achievements),
    },
  };
}

export function fallbackResume(text: string): ParsedResume {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const sections = splitResumeSections(text);
  const email = text.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0] || '';
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() || '';
  const linkedin = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i)?.[0] || '';
  const github = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i)?.[0] || '';
  const excluded = new Set([email, phone, linkedin, github].filter(Boolean));
  const fullName = lines.find((line) => line.length > 2 && line.length < 60 && !excluded.has(line) && !/@|resume|curriculum vitae/i.test(line)) || '';
  const location = lines.find((line) => !excluded.has(line) && !/@|linkedin\.com|github\.com/i.test(line) && /\b(remote|[A-Za-z .'-]+,\s*[A-Z]{2,})\b/.test(line) && line.length < 80) || '';
  const summary = sections.summary.filter((line) => !excluded.has(line) && line !== fullName && line !== location && !/@|linkedin\.com|github\.com/i.test(line)).slice(0, 3).join(' ');
  return normalizeResume({
    title: fullName ? `${fullName}'s Resume` : 'Imported Resume',
    content: {
      personalInfo: { fullName, email, phone, location, summary, linkedin, github },
      experience: parseExperience(sections.experience), education: parseEducation(sections.education), skills: [...extractSkills(text), ...parseSkills(sections.skills)],
      projects: parseProjects(sections.projects), certifications: sections.certifications, achievements: sections.achievements,
    },
  });
}

export function splitResumeSections(text: string): Record<SectionName, string[]> {
  const sections = {} as Record<SectionName, string[]>;
  SECTION_NAMES.forEach((name) => { sections[name] = []; });
  let current: SectionName = 'summary';
  for (const line of text.split(/\r?\n/)) {
    const value = line.trim();
    if (!value) {
      if ((current === 'projects' || current === 'experience') && sections[current].length > 0 && sections[current][sections[current].length - 1] !== '') sections[current].push('');
      continue;
    }
    const next = sectionForHeading(value);
    if (next) current = next;
    else sections[current].push(value);
  }
  return sections;
}

function sectionForHeading(value: string): SectionName | null {
  const heading = value.replace(/[\s:|-]+$/g, '').replace(/^[\s:|-]+/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (/^(summary|profile|objective|about me|professional summary)$/.test(heading)) return 'summary';
  if (/^(experience|work experience|internship experience|internships?|employment history|professional experience)$/.test(heading)) return 'experience';
  if (/^(education|academic background|qualifications)$/.test(heading)) return 'education';
  if (/^(projects?|personal projects|academic projects)$/.test(heading)) return 'projects';
  if (/^(skills?|technical skills|competencies|technologies)$/.test(heading)) return 'skills';
  if (/^(certifications?|licenses?)$/.test(heading)) return 'certifications';
  if (/^(achievements?|awards?|accomplishments?)$/.test(heading)) return 'achievements';
  return null;
}

function parseExperience(lines: string[]): any[] {
  const entries: any[] = [];
  let separatedByBlankLine = false;
  for (const line of lines) {
    if (!line.trim()) {
      separatedByBlankLine = true;
      continue;
    }
    if (/^\s*[-*•▪◦]/.test(line) && entries.length) {
      entries[entries.length - 1].description = append(entries[entries.length - 1].description, line);
      separatedByBlankLine = false;
      continue;
    }
    if (line.length < 3) continue;
    const current = entries[entries.length - 1];
    const dates = extractDates(line);
    const fields = line.split(/\s+\|\s+/).map(clean).filter(Boolean);
    const isHeader = Boolean(dates || fields.length > 1);
    if (!current || separatedByBlankLine || (isHeader && hasExperienceMetadata(current))) {
      entries.push(createExperience(line, entries.length));
    } else if (isHeader && !hasExperienceMetadata(current)) {
      current.company = fields[0] || current.company;
      if (fields[1] && !current.company) current.company = fields[0];
      applyDates(current, line);
    } else {
      current.description = append(current.description, line);
    }
    separatedByBlankLine = false;
  }
  return entries;
}

function createExperience(line: string, index: number): any {
  const fields = line.split(/\s+\|\s+/).map(clean).filter(Boolean);
  const entry = { id: `exp_${index + 1}`, jobTitle: fields[0] || line, company: fields[1] || '', location: '', duration: { startDate: '', endDate: '', isCurrently: false }, description: '' };
  applyDates(entry, line);
  return entry;
}

function applyDates(entry: any, line: string): void {
  const match = extractDates(line);
  if (!match) return;
  entry.duration.startDate = match[1] || entry.duration.startDate;
  entry.duration.endDate = match[2] || entry.duration.endDate;
  entry.duration.isCurrently = /present|current/i.test(match[2] || '');
}

function extractDates(line: string): RegExpMatchArray | null { return line.match(/((?:19|20)\d{2}|[A-Z][a-z]{2,9}\s+(?:19|20)\d{2}).*?(present|current|(?:19|20)\d{2}|[A-Z][a-z]{2,9}\s+(?:19|20)\d{2})/i); }
function hasExperienceMetadata(entry: any): boolean { return Boolean(entry.company || entry.duration.startDate || entry.duration.endDate); }

function parseEducation(lines: string[]): any[] { return lines.filter((line) => !/^[-*•]/.test(line)).map((line, index) => { const fields = line.split(/\s+\|\s+/).map(clean).filter(Boolean); return { id: `edu_${index + 1}`, degree: fields[0] || line, institution: fields[1] || '', field: '', graduationDate: line.match(/(?:19|20)\d{2}/)?.[0] || '', gpa: '' }; }); }

function parseProjects(lines: string[]): any[] {
  const blocks = projectBlocks(lines);
  return blocks.map((block, index) => {
    const title = block[0].replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').replace(/^\s*:\s*/, '').trim();
    const techLines = block.slice(1).filter((line) => /^(?:tech|technologies|technology|stack)\s*:/i.test(line));
    const technologies = unique(techLines.flatMap((line) => line.replace(/^(?:tech|technologies|technology|stack)\s*:/i, '').split(/[,|•]/)));
    const description = block.slice(1).filter((line) => !/^(?:tech|technologies|technology|stack)\s*:/i.test(line)).map((line) => line.replace(/^\s*[-*•]\s*/, '').trim()).filter(Boolean).join(' ');
    return { id: `project_${index + 1}`, title, description, technologies, link: '' };
  });
}

function projectBlocks(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) { if (current.length) { blocks.push(current); current = []; } continue; }
    const startsNumbered = /^\d+[.)]\s+/.test(line) || /^\d+\s*:\s*/.test(line) || /^project\s+\d+\s*:/i.test(line);
    const startsTitle = current.length > 1 && isLikelyProjectTitle(line);
    if ((startsNumbered || startsTitle) && current.length) { blocks.push(current); current = []; }
    current.push(line);
  }
  if (current.length) blocks.push(current);
  return blocks.length ? blocks : lines.filter(Boolean).map((line) => [line]);
}

function isLikelyProjectTitle(line: string): boolean {
  const value = line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').replace(/^project\s*\d*\s*:\s*/i, '').trim();
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 8 || /[.!?]$/.test(value) || /\b(will|does|used|built|developed|created|implemented|provides|allows|enables|using|based|practice|analysis)\b/i.test(value)) return false;
  return words.every((word) => /^[A-Z0-9][A-Za-z0-9+#./-]*$/.test(word));
}

function normalizeExperience(item: any, index: number): any { const duration = item?.duration || {}; return { id: item?.id || `exp_${index + 1}`, jobTitle: clean(item?.jobTitle || item?.position || item?.role || item?.title), company: clean(item?.company || item?.organization), location: clean(item?.location), duration: { startDate: clean(duration.startDate || item?.startDate), endDate: clean(duration.endDate || item?.endDate), isCurrently: Boolean(duration.isCurrently || item?.isCurrently || /present|current/i.test(duration.endDate || item?.endDate || '')) }, description: clean(item?.description || item?.responsibilities || item?.achievements) }; }
function normalizeEducation(item: any, index: number): any { return { id: item?.id || `edu_${index + 1}`, degree: clean(item?.degree || item?.qualification), institution: clean(item?.institution || item?.school || item?.university), field: clean(item?.field || item?.major || item?.specialization), graduationDate: clean(item?.graduationDate || item?.endDate), gpa: clean(item?.gpa || item?.grade) }; }
function normalizeProject(item: any, index: number): any { return { id: item?.id || `project_${index + 1}`, title: clean(item?.title || item?.name), description: clean(item?.description), technologies: Array.isArray(item?.technologies) ? item.technologies.map(clean).filter(Boolean) : item?.technology ? [clean(item.technology)] : [], link: clean(item?.link || item?.url) }; }
function normalizeList(value: any): string[] { return Array.isArray(value) ? value.flatMap((item) => typeof item === 'string' ? [clean(item)] : [clean(item?.name || item?.title || item?.description)]).filter(Boolean) : []; }
function parseSkills(lines: string[]): string[] { return lines.flatMap((line) => line.split(/[,|•]/)).map(clean).filter((skill) => skill.length > 1); }
function unique(values: any[]): string[] { return Array.from(new Set(values.map(clean).filter(Boolean))); }
function clean(value: unknown): string { return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''; }
function append(existing: string, line: string): string { return `${existing} ${line.replace(/^[-*•]\s*/, '').trim()}`.trim(); }
function hasResumeContent(item: any): boolean { return Object.values(item).some((value) => Array.isArray(value) ? value.length > 0 : value && typeof value === 'object' ? Object.values(value).some(Boolean) : Boolean(value)); }
function dedupeExperiences(items: any[]): any[] {
  const collapsed: any[] = [];
  for (const item of items) {
    if (/^\s*[-*•▪◦]/.test(item.jobTitle || '') && collapsed.length) {
      collapsed[collapsed.length - 1].description = append(collapsed[collapsed.length - 1].description, item.jobTitle);
      if (item.description) collapsed[collapsed.length - 1].description = append(collapsed[collapsed.length - 1].description, item.description);
    } else {
      collapsed.push(item);
    }
  }
  const seen = new Set<string>();
  return collapsed.filter((item) => {
    const duration = item.duration || {};
    const key = [item.jobTitle, item.company, item.location, duration.startDate, duration.endDate, item.description].map((value) => clean(value).toLowerCase()).join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((item, index) => ({ ...item, id: item.id || `exp_${index + 1}` }));
}