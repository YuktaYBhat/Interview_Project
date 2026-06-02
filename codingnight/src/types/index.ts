// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface UserCredentials {
  name: string;
  email: string;
  password: string;
}

// Resume Types
export interface Resume {
  id: string;
  userId: string;
  title: string;
  content: {
    personalInfo: PersonalInfo;
    experience: Experience[];
    education: Education[];
    skills: string[];
    projects: Project[];
  };
  atsScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  summary?: string;
}

export interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  duration: {
    startDate: string;
    endDate: string;
    isCurrently: boolean;
  };
  location?: string;
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  field: string;
  graduationDate: string;
  gpa?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  link?: string;
}

// Question Types
export interface Question {
  id: string;
  category: 'behavioral' | 'technical' | 'leadership' | 'situational';
  priority: 'high' | 'medium' | 'low';
  text: string;
  suggestedLength: string;
  resumeContext?: string;
}

export interface QAPractice {
  id: string;
  userId: string;
  resumeId: string;
  questions: Question[];
  createdAt: Date;
}

// Study Plan Types
export interface StudyPlan {
  id: string;
  userId: string;
  resumeId: string;
  jobDescription: string;
  gaps: Skill[];
  modules: StudyModule[];
  createdAt: Date;
}

export interface Skill {
  name: string;
  requiredLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  currentLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  gap: number;
}

export interface StudyModule {
  id: string;
  title: string;
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  resources: StudyResource[];
  completed: boolean;
}

export interface StudyResource {
  id: string;
  title: string;
  type: 'video' | 'article' | 'course' | 'documentation';
  url: string;
  duration?: number;
  rating: number;
  source: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
