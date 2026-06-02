# Integration Guide - Using New Features

## 🔗 How to Use the Enhanced Features

This guide shows you how to integrate and use the new features in your AIPS application without breaking existing functionality.

---

## 📍 File Structure: Old vs. New

All new features have been created **alongside** existing files:

```
src/app/
├── resume/
│   ├── page.tsx          (Original - still works)
│   ├── page-new.tsx      (NEW - Enhanced version)
│   ├── Resume.module.css (Original styles)
│   └── Resume-new.module.css (NEW - Enhanced styles)
│
├── qa-generator/
│   ├── page.tsx          (Original - still works)
│   ├── page-new.tsx      (NEW - Practice section)
│   ├── QA.module.css     (Original styles)
│   └── QA-new.module.css (NEW - Enhanced styles)
│
└── study-path/
    ├── page.tsx          (Original - still works)
    ├── page-new.tsx      (NEW - Study planner)
    ├── Study.module.css  (Original styles)
    └── Study-new.module.css (NEW - Enhanced styles)
```

---

## 🚀 Migration Paths

### Option 1: Keep Both (Recommended for Testing)
Keep existing pages and new pages running in parallel:
- Original pages: `/resume`, `/qa-generator`, `/study-path`
- New pages: Navigate manually to `page-new.tsx` routes

### Option 2: Gradual Migration
Replace original pages one by one:
1. Replace original with new
2. Test thoroughly
3. Remove old file

### Option 3: Full Replacement (After Testing)
```bash
# After confirming all features work:
mv src/app/resume/page-new.tsx src/app/resume/page.tsx
mv src/app/resume/Resume-new.module.css src/app/resume/Resume.module.css
# Repeat for other pages...
```

---

## 🔐 Authentication Setup

### For Protected Pages

Update your `layout.tsx` to include auth check:

```typescript
'use client';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  return isAuthenticated ? children : null;
}
```

---

## 📱 Using the Store

### Access Authenticated User

```typescript
import { useAuthStore } from '@/lib/store';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  return <h1>Welcome, {user?.name}</h1>;
}
```

### Manage Resumes

```typescript
import { useResumeStore } from '@/lib/store';

export default function ResumeList() {
  const resumes = useResumeStore((state) => state.resumes);
  const addResume = useResumeStore((state) => state.addResume);
  const deleteResume = useResumeStore((state) => state.deleteResume);

  return (
    <div>
      {resumes.map((resume) => (
        <div key={resume.id}>
          <h3>{resume.title}</h3>
          <button onClick={() => deleteResume(resume.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### Manage Study Plans

```typescript
import { useStudyStore } from '@/lib/store';

export default function StudyDashboard() {
  const studyPlans = useStudyStore((state) => state.studyPlans);
  const setCurrentPlan = useStudyStore((state) => state.setCurrentPlan);

  return (
    <div>
      {studyPlans.map((plan) => (
        <button key={plan.id} onClick={() => setCurrentPlan(plan)}>
          {plan.jobDescription.substring(0, 50)}...
        </button>
      ))}
    </div>
  );
}
```

---

## 🔌 API Integration Examples

### Generate Questions from Resume

```typescript
const generateQuestions = async (resume: any) => {
  const response = await fetch('/api/questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify({
      resumeId: resume.id,
      resume: resume,
    }),
  });

  const data = await response.json();
  return data.data.questions;
};
```

### Create Study Plan

```typescript
const createStudyPlan = async (resume: any, jobDescription: string) => {
  const response = await fetch('/api/study-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resumeId: resume.id,
      resume: resume,
      jobDescription: jobDescription,
    }),
  });

  const data = await response.json();
  return data.data; // Returns: { gaps, modules, jobDescription, etc }
};
```

### Create Resume

```typescript
const createResume = async (resumeData: any, userId: string) => {
  const response = await fetch('/api/resumes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify(resumeData),
  });

  const data = await response.json();
  return data.data; // Returns: { id, atsScore, ... }
};
```

---

## 🎨 Styling Integration

### Use Existing Color Variables

All new components use the global CSS variables. To customize:

**File**: `src/app/globals.css`

```css
:root {
  --color-primary: #2563eb;      /* Change primary color */
  --color-accent: #7c3aed;       /* Change accent */
  --bg-main: #f5f8fc;            /* Change background */
  /* ... other variables ... */
}
```

### Add New Theme

Create a theme CSS file:

```css
/* themes/dark.css */
:root[data-theme="dark"] {
  --bg-main: #0f172a;
  --text-main: #f8fafc;
  /* ... */
}
```

---

## ✅ Validation Integration

### Use Validation Schemas

```typescript
import { signupSchema, loginSchema } from '@/lib/validation';

// In your form handler
try {
  const validated = signupSchema.parse(formData);
  // Proceed with validated data
} catch (error) {
  // Handle validation errors
  console.error(error.issues);
}
```

### Validate Password

```typescript
import { validatePassword } from '@/lib/validation';

const validation = validatePassword(password);
if (!validation.valid) {
  console.error(validation.errors); // Array of error messages
}
```

---

## 🔄 Data Flow Examples

### Complete Resume Creation Flow

```typescript
import { useResumeStore } from '@/lib/store';
import { calculateATSScore } from '@/lib/resume-utils';

const handleSaveResume = async (formData: any) => {
  // 1. Calculate ATS score
  const atsScore = calculateATSScore(formData);

  // 2. Create resume object
  const resume = {
    title: formData.title,
    content: formData.content,
    atsScore: atsScore,
  };

  // 3. Save to store (localStorage)
  useResumeStore.getState().addResume(resume);

  // 4. Optional: Send to API
  // const response = await fetch('/api/resumes', { ... });

  return resume;
};
```

### Complete Questions Generation Flow

```typescript
const handleGenerateQuestions = async (resumeId: string) => {
  // 1. Get resume from store
  const resume = useResumeStore.getState().resumes.find((r) => r.id === resumeId);

  // 2. Call API
  const response = await fetch('/api/questions', {
    method: 'POST',
    body: JSON.stringify({ resumeId, resume }),
  });

  // 3. Extract questions
  const { data } = await response.json();

  // 4. Save answers in local state
  setUserAnswers({});

  // 5. Display questions
  setQuestions(data.questions);
};
```

---

## 🧪 Testing the Integration

### Test Authentication Flow
```bash
1. Go to http://localhost:3000/auth/signup
2. Create account (Password: "Test1234!")
3. Should redirect to dashboard
4. Go to http://localhost:3000/auth/login
5. Login with same credentials
6. Verify token saved in localStorage
```

### Test Resume Builder
```bash
1. Navigate to /resume
2. Create new resume
3. Fill in sections
4. Check ATS score updates
5. Download resume
```

### Test Practice Section
```bash
1. Navigate to /qa-generator
2. Select a resume
3. Generate questions
4. Answer a question
5. Navigate to next question
```

### Test Study Mode
```bash
1. Navigate to /study-path
2. Select resume and paste job description
3. Generate study plan
4. Verify skill gaps
5. Click on resources
```

---

## 🐛 Common Integration Issues & Fixes

### Issue: "localStorage is not defined"
**Fix**: Ensure code runs only on client side
```typescript
'use client'; // Add at top of file
import { useEffect } from 'react';

useEffect(() => {
  const data = localStorage.getItem('key'); // Now safe
}, []);
```

### Issue: Styles not applying
**Fix**: Check CSS module import
```typescript
// Correct
import styles from './Component.module.css';

// Incorrect
import './Component.module.css';
```

### Issue: API returning 401
**Fix**: Include user ID header
```typescript
const response = await fetch('/api/resumes', {
  method: 'POST',
  headers: {
    'x-user-id': userId, // Add this
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});
```

### Issue: State not persisting on reload
**Fix**: Zustand persistence is already set up
```typescript
// Already configured in store.ts
persist((set) => ({ ... }), { name: 'store-name' })
```

---

## 📊 Database Migration Path

When ready to use a real database, create:

```typescript
// lib/db.ts
import { Prisma } from '@prisma/client';

export async function createUser(data: any) {
  return await prisma.user.create({ data });
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({ where: { email } });
}

// Similar functions for resumes, questions, study plans
```

Then update API routes:
```typescript
// api/auth/signup/route.ts
import { createUser } from '@/lib/db';

// Replace local database calls with DB calls
const user = await createUser({ name, email, password: hashed });
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Update `JWT_SECRET` in `.env.local`
- [ ] Set real database URL in `.env.local`
- [ ] Configure CORS for API endpoints
- [ ] Test all authentication flows
- [ ] Verify PDF download works
- [ ] Test API endpoints with real data
- [ ] Set up error logging
- [ ] Enable HTTPS
- [ ] Configure SSL certificates
- [ ] Test on multiple devices

---

## 📞 Integration Support

If you encounter integration issues:

1. Check browser console for errors
2. Review `ENHANCEMENT_GUIDE.md` for feature details
3. Check `src/types/index.ts` for data structure
4. Review API route implementations
5. Check localStorage (DevTools > Application > Storage)

---

## ✨ Best Practices

1. **Use Types**: Import from `src/types/index.ts`
2. **Validate Input**: Use Zod schemas before API calls
3. **Handle Errors**: Always have try-catch around API calls
4. **Use Store**: Leverage Zustand for state management
5. **Component Isolation**: Keep components focused and small
6. **Document Changes**: Add comments for customizations

---

**Happy integrating! 🎯**
