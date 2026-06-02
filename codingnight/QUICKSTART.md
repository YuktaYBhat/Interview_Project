# Quick Start Guide - AIPS Enhanced

## 🎯 5-Minute Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create Environment File
Create `.env.local` in the root directory:
```env
JWT_SECRET=your-dev-secret-key
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Step 3: Run Development Server
```bash
npm run dev
```

### Step 4: Access the Application
- Open `http://localhost:3000` in your browser
- You'll be redirected to signup/login

---

## 👤 User Signup & Authentication

### Create Account
1. Go to `http://localhost:3000/auth/signup`
2. Fill in:
   - Full Name (e.g., John Doe)
   - Email (e.g., john@example.com)
   - Password (must have: 8+ chars, 1 uppercase, 1 digit, 1 special char)
   - Confirm Password
3. Click "Create Account"
4. You'll be redirected to dashboard

### Login
1. Go to `http://localhost:3000/auth/login`
2. Enter email and password
3. Click "Sign In"

---

## 📄 Creating Your First Resume

### Access Resume Builder
1. From dashboard, click "Go to Resume Builder"
2. Or navigate to `/resume`

### Create New Resume
1. Click the "+" button in the left sidebar
2. Fill in your resume sections:
   - **Experience**: Job titles, companies, descriptions
   - **Education**: Degrees, institutions
   - **Skills**: Technical and soft skills
   - **Projects**: Portfolio projects

### View ATS Score
- Real-time ATS score displayed at the top (0-100)
- Score factors:
  - Section completeness (20%)
  - Experience detail (20%)
  - Education (15%)
  - Skills (20%)
  - Projects (15%)
  - Personal info (10%)

### Download Resume
- Click "⬇️ Download" button
- Get text format version (PDF coming soon)

---

## 🎯 Practice Interview Questions

### Generate Questions
1. Navigate to `/qa-generator`
2. Select a resume from dropdown
3. Click "✨ Generate Questions"
4. Wait for 10+ questions to be generated

### Practice Answering
1. Review each question carefully
2. Type your answer in the text area
3. Use suggested length as guidance
4. Navigate with:
   - Previous/Next buttons
   - Progress dots (click to jump)
5. Track answered questions with colored dots

### Submit for Feedback (Coming Soon)
- Click "📤 Submit & Get Feedback"
- Get AI-powered feedback on your answer

---

## 📚 Personalized Study Path

### Generate Study Plan
1. Navigate to `/study-path`
2. Select your resume
3. Paste job description in the text area:
   - Include role title
   - Required skills
   - Experience level
   - Key responsibilities
4. Click "🎯 Generate Study Plan"

### View Skill Gaps
- Left panel shows identified gaps
- Priority order (most critical first)
- Current vs. Target skill levels
- Progress visualization

### Access Learning Resources
1. Click on any module card to view details
2. See topics to master:
   - Concept breakdowns
   - Key learnings
3. Review recommended resources:
   - **▶️ Videos**: YouTube tutorials
   - **📄 Articles**: Medium articles
   - **📚 Courses**: Udemy/Codecademy
   - **📖 Docs**: Official documentation

### Study Resources
- Each resource is rated and linked
- Duration estimates for videos/courses
- Start learning button for each module

---

## 🎨 New Features Showcase

### 1. Professional UI Design
- Modern gradient backgrounds
- Soothing color palette
- Smooth animations
- Professional typography

### 2. Smart Question Generation
- Based entirely on your resume
- Different question types
- Context-aware questions
- Categorized by difficulty

### 3. Gap Analysis
- Skill gaps identified automatically
- Resources ranked by rating
- Time to mastery estimates
- Structured learning modules

### 4. Multiple Resumes
- Create and manage multiple versions
- Quick switch between resumes
- Individual ATS scores
- Resume-specific questions

---

## 🔑 Password Requirements

Your password must contain:
- ✅ At least 8 characters
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 digit (0-9)
- ✅ At least 1 special character (!@#$%^&*)

Example: `MyPassword123!`

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, CSS Modules
- **State**: Zustand (localStorage persistence)
- **Auth**: JWT, bcryptjs
- **API**: RESTful Next.js routes
- **Utilities**: Zod validation, date-fns

---

## 📱 Responsive Design

All features work on:
- ✅ Desktop (1920px+)
- ✅ Laptop (1280px)
- ✅ Tablet (768px)
- ✅ Mobile (Coming soon with optimizations)

---

## 🐛 Troubleshooting

### Password Not Accepted
- Ensure it has 8+ characters
- Include 1 uppercase letter
- Include 1 digit
- Include 1 special character

### Questions Not Generating
- Ensure resume is properly filled
- Check browser console for errors
- Make sure all required fields are complete

### Study Plan Empty
- Verify job description is detailed
- Check that resume has skills populated
- Try with more descriptive JD

### Login Issues
- Verify email matches signup email
- Check password exactly (case-sensitive)
- Ensure account was created first

---

## 📖 Files & Structure

### Key Directories
```
src/
  ├── app/
  │   ├── auth/          # Login/Signup pages
  │   ├── resume/        # Resume builder
  │   ├── qa-generator/  # Practice section
  │   ├── study-path/    # Study mode
  │   └── api/           # API routes
  ├── lib/
  │   ├── auth.ts        # Auth functions
  │   ├── store.ts       # State management
  │   ├── validation.ts  # Input validation
  │   └── resume-utils.ts # Resume utilities
  └── types/
      └── index.ts       # TypeScript types
```

### New Files Created
- `/auth/signup` - User registration
- `/auth/login` - User login
- `/resume/page-new.tsx` - Enhanced resume builder
- `/qa-generator/page-new.tsx` - Practice section
- `/study-path/page-new.tsx` - Study planner
- `ENHANCEMENT_GUIDE.md` - Detailed documentation
- `.env.local` - Environment configuration

---

## ✨ Next Steps

1. **Test the Application**
   - Sign up with test account
   - Create a resume
   - Generate practice questions
   - Create study plan

2. **Customize**
   - Modify colors in `/app/globals.css`
   - Adjust validation rules in `/lib/validation.ts`
   - Update API endpoints as needed

3. **Integrate Real APIs**
   - Add OpenAI API key for advanced features
   - Setup database (PostgreSQL/MongoDB)
   - Integrate payment system (if needed)

4. **Deploy**
   - Push to Vercel (recommended)
   - Setup production database
   - Configure environment variables
   - Enable SSL/HTTPS

---

## 📞 Support & Documentation

Refer to:
- `ENHANCEMENT_GUIDE.md` - Comprehensive feature documentation
- `src/types/index.ts` - Data structure definitions
- Component files - Usage examples
- API routes - Endpoint documentation

---

**Happy Learning! 🚀**
