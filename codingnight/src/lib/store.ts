import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthStore {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user: User, token: string) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-store',
    }
  )
);

interface ResumeStore {
  resumes: any[];
  selectedResumeId: string | null;
  addResume: (resume: any) => void;
  updateResume: (id: string, resume: any) => void;
  deleteResume: (id: string) => void;
  setSelectedResume: (id: string) => void;
  getSelectedResume: () => any;
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      resumes: [],
      selectedResumeId: null,
      addResume: (resume: any) => 
        set((state) => ({
          resumes: [...state.resumes, { ...resume, id: Date.now().toString() }],
        })),
      updateResume: (id: string, updatedResume: any) =>
        set((state) => ({
          resumes: state.resumes.map((r) => (r.id === id ? updatedResume : r)),
        })),
      deleteResume: (id: string) =>
        set((state) => ({
          resumes: state.resumes.filter((r) => r.id !== id),
        })),
      setSelectedResume: (id: string) => set({ selectedResumeId: id }),
      getSelectedResume: () => {
        const state = get();
        return state.resumes.find((r) => r.id === state.selectedResumeId);
      },
    }),
    {
      name: 'resume-store',
    }
  )
);

interface StudyStore {
  studyPlans: any[];
  currentPlan: any | null;
  addStudyPlan: (plan: any) => void;
  setCurrentPlan: (plan: any) => void;
}

export const useStudyStore = create<StudyStore>()(
  persist(
    (set) => ({
      studyPlans: [],
      currentPlan: null,
      addStudyPlan: (plan: any) =>
        set((state) => ({
          studyPlans: [...state.studyPlans, { ...plan, id: Date.now().toString() }],
        })),
      setCurrentPlan: (plan: any) => set({ currentPlan: plan }),
    }),
    {
      name: 'study-store',
    }
  )
);
