---
description: Complete Project Workflow Overview
---

# 🎯 Preply - AI Interview Practice Platform

## Project Overview

**Preply** is a modern AI-powered interview practice platform built with **Next.js 13.5**, **TypeScript**, **Supabase**, and **Google Gemini AI**. It helps job seekers prepare for interviews with personalized mock sessions, instant AI feedback, and comprehensive performance analytics.

---

## 🏗️ Architecture Overview

### Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 13.5 (App Router) |
| **Language** | TypeScript 5.2 |
| **Styling** | Tailwind CSS 3.3 |
| **UI Components** | Radix UI + shadcn/ui |
| **Animations** | Framer Motion |
| **Authentication** | Supabase Auth |
| **Database** | Supabase PostgreSQL |
| **AI Model** | Google Gemini 2.0 Flash |
| **Charts** | Recharts |
| **PDF Generation** | jsPDF |
| **Deployment** | Netlify |

### Project Structure

```
preply/
├── app/                          # Next.js App Router
│   ├── api/interview/            # Interview API Routes
│   │   ├── generate-questions/   # AI question generation
│   │   ├── generate-report/      # AI feedback report
│   │   ├── parse-resume/         # Resume parsing
│   │   └── save-result/          # Save to database
│   ├── context/                  # React Context Providers
│   │   ├── AuthContext.tsx       # Authentication state
│   │   └── InterviewContext.tsx  # Interview state management
│   ├── _components/              # Shared home components
│   ├── dashboard/                # User dashboard
│   ├── interview-setup/          # Interview configuration UI
│   ├── active-interview/         # Live interview session
│   ├── result-page/              # Interview results display
│   ├── feedback/                 # Feedback page
│   ├── login/                    # Login page
│   ├── signup/                   # Signup page
│   ├── about/                    # About page
│   ├── contact/                  # Contact page
│   ├── help-center/              # Help center
│   ├── blog/                     # Blog section
│   ├── layout.tsx                # Root layout with providers
│   └── page.tsx                  # Landing page
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── dashboard/                # Dashboard-specific components
│   ├── landing/                  # Landing page sections
│   ├── Header.tsx                # Global header
│   ├── Footer.tsx                # Global footer
│   └── MotionProvider.tsx        # Framer Motion config
├── lib/
│   ├── supabase.ts               # Supabase client
│   ├── supabase-middleware.ts    # Supabase auth middleware
│   └── utils.ts                  # Utility functions
├── supabase/
│   └── migrations/               # Database migrations
│       ├── 20251224091400_create_profiles_table.sql
│       ├── 20251224101629_create_profile_trigger.sql
│       └── 20251225143000_create_interviews_table.sql
├── middleware.ts                 # Next.js middleware for auth
├── next.config.js                # Next.js configuration
└── netlify.toml                  # Netlify deployment config
```

---

## 🔄 Complete User Workflow

### 1. **Landing Page** (`/`)
- Modern, animated homepage with features showcase
- Pricing section
- FAQ section
- Testimonials
- Call-to-action to start interview practice

### 2. **Authentication Flow**

#### Sign Up (`/signup`)
- Email/password registration
- Creates user in Supabase Auth
- Auto-creates profile in `profiles` table (via trigger)
- Redirects to interview setup

#### Login (`/login`)
- Email/password authentication
- Session management via cookies
- Persistent login with refresh tokens
- Redirects to dashboard or interview setup

### 3. **Interview Setup** (`/interview-setup`)

**User Configuration:**
- **Resume Upload**: Upload PDF/DOCX or paste text
- **Category Selection**: HR, Technical, Behavioral, Stress, Situational
- **Difficulty Level**: Easy, Medium, Hard
- **Question Count**: 5, 10, or 15 questions
- **Job Description** (optional): Paste target job description

**API Flow:**
1. Parse resume → `/api/interview/parse-resume`
2. Generate personalized questions → `/api/interview/generate-questions`
   - Uses Google Gemini AI
   - Based on resume, category, difficulty, and job description
   - Returns array of question objects

**Data Storage:**
- Interview setup stored in `InterviewContext` (React Context)
- Persisted to `localStorage` for page refresh resilience

### 4. **Active Interview** (`/active-interview`)

**Interview Session:**
- Displays questions one by one
- **Input Methods:**
  - Voice input (Web Speech API)
  - Text input (textarea)
- Progress indicator (e.g., "Question 3 of 10")
- Timer for each question
- Skip question option
- Real-time answer storage in context

**Answer Flow:**
- User answers stored in `InterviewContext.answers`
- Each answer includes:
  - `questionId`
  - `questionText`
  - `userAnswer`

### 5. **Report Generation** (`/api/interview/generate-report`)

**When interview completes:**
1. Send all questions + answers to Gemini AI
2. AI generates comprehensive report:
   - **Overall Score** (0-100)
   - **Overall Feedback** (paragraph summary)
   - **Strengths** (array of bullet points)
   - **Weaknesses** (array of areas to improve)
   - **Question-wise Feedback** (for each question):
     - User's answer
     - Detailed feedback
     - Rating (good/average/needs_improvement)
     - Improvement suggestions

### 6. **Result Page** (`/result-page`)

**Display Results:**
- Score visualization with animated progress ring
- Overall feedback section
- Strengths and weaknesses cards
- Question-wise feedback accordion
- **Download PDF** button (generates PDF with jsPDF)

**Save Results:**
- Call `/api/interview/save-result`
- Inserts into `interviews` table:
  - `user_id`
  - `category`
  - `difficulty`
  - `score`
  - `strengths[]`
  - `weaknesses[]`
  - `overall_feedback`
  - `question_feedback` (JSONB)
  - `created_at`

### 7. **Dashboard** (`/dashboard`)

**User's Performance Hub:**

**Stats Cards:**
- Total Interviews
- Average Score
- Best Score
- Performance Improvement

**Performance Growth Chart:**
- Line chart showing score trends over time
- X-axis: Interview dates
- Y-axis: Scores

**Category Performance Chart:**
- Bar/Pie chart showing average scores by category
- Identifies strongest and weakest categories

**Interview History Table:**
- All past interviews with:
  - Date
  - Category
  - Difficulty
  - Score
  - View Report button (opens modal)

**Report Modal:**
- Full interview report in modal overlay
- Question-wise feedback
- Download PDF option

---

## 🔐 Authentication & Authorization

### Middleware (`middleware.ts`)
- Protects routes:
  - `/dashboard/*`
  - `/interview-setup/*`
  - `/active-interview/*`
  - `/result-page/*`
- Verifies Supabase session
- Redirects unauthenticated users to `/login`

### AuthContext
- Global authentication state
- **Cached Auth State** to avoid redundant API calls
- Provides:
  - `user`: Current user object
  - `session`: Current session
  - `loading`: Auth loading state
  - `signOut()`: Logout function
  - `refreshUser()`: Refresh user data

---

## 🗄️ Database Schema

### Tables

#### 1. `profiles` (User Profiles)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Trigger:** Auto-creates profile when user signs up

#### 2. `interviews` (Interview Results)
```sql
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  score INTEGER NOT NULL,
  strengths TEXT[],
  weaknesses TEXT[],
  overall_feedback TEXT,
  question_feedback JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `contact_messages` (Contact Form)
```sql
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  email TEXT,
  subject TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🤖 AI Integration (Google Gemini)

### API Endpoints Using Gemini

#### 1. **Generate Questions** (`/api/interview/generate-questions`)
**Input:**
```json
{
  "resumeText": "...",
  "category": "technical",
  "difficulty": "medium",
  "questionCount": 10,
  "jobDescription": "..."
}
```

**Gemini Prompt:**
```
You are an expert interviewer. Generate {questionCount} {difficulty} {category} 
interview questions based on the candidate's resume and job description.

Resume: {resumeText}
Job Description: {jobDescription}

Return ONLY a JSON array of questions.
```

**Output:**
```json
{
  "questions": [
    { "id": 1, "text": "Tell me about your experience with React..." },
    { "id": 2, "text": "How do you handle state management..." }
  ]
}
```

#### 2. **Generate Report** (`/api/interview/generate-report`)
**Input:**
```json
{
  "questions": [...],
  "answers": [
    {
      "questionId": 1,
      "questionText": "...",
      "userAnswer": "..."
    }
  ],
  "category": "technical",
  "difficulty": "medium"
}
```

**Gemini Prompt:**
```
You are an expert interview evaluator. Analyze the candidate's responses and 
provide detailed feedback.

Category: {category}
Difficulty: {difficulty}

Questions and Answers:
{Q&A pairs}

Provide:
1. Overall score (0-100)
2. Overall feedback (3-4 sentences)
3. 3-5 strengths
4. 3-5 weaknesses
5. Question-wise feedback with ratings and suggestions

Return as JSON.
```

**Output:**
```json
{
  "score": 78,
  "feedback": "Strong technical knowledge...",
  "strengths": ["Clear communication", "Deep React knowledge"],
  "weaknesses": ["Could improve on testing concepts"],
  "questionFeedback": [
    {
      "questionNumber": 1,
      "question": "...",
      "answer": "...",
      "feedback": "Excellent response...",
      "rating": "good",
      "suggestions": ["Consider mentioning..."]
    }
  ]
}
```

#### 3. **Parse Resume** (`/api/interview/parse-resume`)
- Extracts text from PDF/DOCX using `pdf-parse-new` and `mammoth`
- Returns plain text for question generation

---

## 🎨 UI/UX Features

### Styling & Theming
- **Dark/Light Mode** (via `next-themes`)
- **CSS Variables** for theme tokens
- **Tailwind CSS** with custom configuration
- **Framer Motion** for smooth animations

### Key UI Components (shadcn/ui)
- Buttons, Cards, Dialogs, Dropdowns
- Form inputs with validation (react-hook-form + zod)
- Toast notifications (sonner)
- Progress indicators
- Charts (recharts)
- Accordions, Tabs, Tooltips

### Animations
- Page transitions
- Micro-interactions on hover
- Loading skeletons
- Progress animations

---

## 📊 Performance Optimizations

### As Per Recent Conversations:

1. **Server Components** where possible
2. **Cached Authentication** (avoid redundant Supabase calls)
3. **Next.js Image Optimization** enabled
4. **Lazy Loading** of heavy components
5. **Preconnect** to Supabase and Google Fonts
6. **Dynamic Imports** for third-party libraries

---

## 🚀 Deployment Workflow

### Netlify Configuration (`netlify.toml`)
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Environment Variables Required:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### Deployment Steps:
1. Push code to GitHub
2. Connect repository to Netlify
3. Set environment variables in Netlify dashboard
4. Deploy (automatic on push)

---

## 🔍 Key Features Summary

| Feature | Status |
|---------|--------|
| ✅ User Authentication | Complete |
| ✅ Resume Upload & Parsing | Complete |
| ✅ AI Question Generation | Complete |
| ✅ Voice + Text Input | Complete |
| ✅ AI Feedback & Scoring | Complete |
| ✅ Detailed Reports | Complete |
| ✅ PDF Export | Complete |
| ✅ User Dashboard | Complete |
| ✅ Performance Charts | Complete |
| ✅ Interview History | Complete |
| ✅ Contact Form | Complete |
| ✅ Landing Page | Complete |
| ✅ Dark/Light Mode | Complete |
| ✅ Responsive Design | Complete |
| ✅ Deployment Ready | Complete |

---

## 🛠️ Development Workflow

### Local Development:
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

### Git Workflow:
```bash
# Current repository
https://github.com/Scalium-Tech/preply_nakul
```

---

## 🎯 User Journey Recap

```
Landing Page → Sign Up/Login
    ↓
Interview Setup (resume + config)
    ↓
AI generates questions
    ↓
Active Interview (voice/text answers)
    ↓
AI evaluates responses
    ↓
Result Page (score + feedback)
    ↓
Save to database
    ↓
Dashboard (history + analytics)
```

---

## 📝 Recent Improvements

Based on conversation history:
- ✅ Page load speed optimizations
- ✅ Contact form Supabase integration
- ✅ PDF report generation fixes
- ✅ Dashboard features (charts, stats)
- ✅ Interview history persistence
- ✅ Question-wise feedback
- ✅ Performance growth tracking

---

## 🔮 Future Enhancements (Potential)

- [ ] Social authentication (Google, GitHub)
- [ ] Practice streak gamification
- [ ] Interview recommendations based on performance
- [ ] Mock interview scheduling
- [ ] Peer comparison analytics
- [ ] Video interview support
- [ ] Custom question sets
- [ ] Team/organization features

---

## 📚 Key Files to Know

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with providers |
| `app/page.tsx` | Landing page (29KB, feature-rich) |
| `app/context/AuthContext.tsx` | Auth state management |
| `app/context/InterviewContext.tsx` | Interview state management |
| `middleware.ts` | Route protection |
| `lib/supabase.ts` | Supabase client setup |
| `next.config.js` | Next.js configuration |
| `tailwind.config.ts` | Tailwind CSS customization |
| `package.json` | Dependencies (82 lines) |

---

## 🏁 Conclusion

Preply is a **production-ready**, **full-stack AI interview practice platform** with:
- Modern Next.js 13 architecture
- Secure authentication & authorization
- AI-powered question generation and evaluation
- Rich analytics and performance tracking
- Polished UI/UX with animations
- Mobile-responsive design
- Optimized for performance
- Ready for Netlify deployment

The workflow is **end-to-end automated**, from user signup to AI-powered feedback to historical analytics.
