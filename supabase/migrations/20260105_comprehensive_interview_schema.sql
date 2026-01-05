-- ============================================================
-- PREPLY INTERVIEW DASHBOARD - COMPREHENSIVE DATABASE SCHEMA
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PART 1: STORAGE BUCKET POLICIES (for 'resumes' bucket)
-- ============================================================

-- Policy: Users can upload their own resumes
CREATE POLICY "Users can upload resumes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own resumes
CREATE POLICY "Users can read own resumes"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own resumes
CREATE POLICY "Users can delete own resumes"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own resumes
CREATE POLICY "Users can update own resumes"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);


-- ============================================================
-- PART 2: RESUMES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.resumes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_type text,
    file_size_bytes integer,
    extracted_text text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own resumes"
ON public.resumes FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);


-- ============================================================
-- PART 3: MODIFY INTERVIEWS TABLE
-- ============================================================

ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS resume_id uuid REFERENCES public.resumes(id) ON DELETE SET NULL;

ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS job_description text;

ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS duration_seconds integer;

CREATE INDEX IF NOT EXISTS idx_interviews_resume_id ON public.interviews(resume_id);


-- ============================================================
-- PART 4: INTERVIEW REPORTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.interview_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id uuid NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
    overall_score integer NOT NULL,
    overall_feedback text,
    strengths jsonb DEFAULT '[]'::jsonb,
    weaknesses jsonb DEFAULT '[]'::jsonb,
    questions_answers jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT unique_interview_report UNIQUE (interview_id)
);

ALTER TABLE public.interview_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
ON public.interview_reports FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.interviews 
        WHERE interviews.id = interview_reports.interview_id 
        AND interviews.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert own reports"
ON public.interview_reports FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.interviews 
        WHERE interviews.id = interview_reports.interview_id 
        AND interviews.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update own reports"
ON public.interview_reports FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.interviews 
        WHERE interviews.id = interview_reports.interview_id 
        AND interviews.user_id = auth.uid()
    )
);

CREATE INDEX IF NOT EXISTS idx_interview_reports_interview_id ON public.interview_reports(interview_id);

-- ============================================================
-- DONE! 
-- ============================================================
