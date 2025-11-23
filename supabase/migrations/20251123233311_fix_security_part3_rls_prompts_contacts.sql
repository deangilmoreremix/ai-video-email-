/*
  # Fix Security Issues - Part 3: Optimize RLS Policies (Prompts & Contacts)

  1. Performance Improvements
    - Updates RLS policies to use (SELECT auth.uid()) pattern
    - Removes duplicate policies and consolidates them

  2. Tables Updated
    - contacts
    - prompt_history
    - saved_prompts (consolidated duplicates)
    - campaigns
*/

-- contacts policies
DROP POLICY IF EXISTS "Users can view own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON public.contacts;

CREATE POLICY "Users can view own contacts" ON public.contacts
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own contacts" ON public.contacts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own contacts" ON public.contacts
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own contacts" ON public.contacts
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- prompt_history policies
DROP POLICY IF EXISTS "Users can view own prompt history" ON public.prompt_history;
DROP POLICY IF EXISTS "Users can insert own prompt history" ON public.prompt_history;
DROP POLICY IF EXISTS "Users can update own prompt history" ON public.prompt_history;
DROP POLICY IF EXISTS "Users can delete own prompt history" ON public.prompt_history;

CREATE POLICY "Users can view own prompt history" ON public.prompt_history
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own prompt history" ON public.prompt_history
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own prompt history" ON public.prompt_history
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own prompt history" ON public.prompt_history
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- saved_prompts policies - REMOVE DUPLICATES AND OPTIMIZE
DROP POLICY IF EXISTS "Users can view own saved prompts" ON public.saved_prompts;
DROP POLICY IF EXISTS "Anyone can view public prompts" ON public.saved_prompts;
DROP POLICY IF EXISTS "Users can insert own saved prompts" ON public.saved_prompts;
DROP POLICY IF EXISTS "Users can update own saved prompts" ON public.saved_prompts;
DROP POLICY IF EXISTS "Users can delete own saved prompts" ON public.saved_prompts;

CREATE POLICY "Users can view own and public saved prompts" ON public.saved_prompts
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR is_public = true);

CREATE POLICY "Users can insert own saved prompts" ON public.saved_prompts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own saved prompts" ON public.saved_prompts
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own saved prompts" ON public.saved_prompts
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- campaigns policies
DROP POLICY IF EXISTS "Users can view own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can insert own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can delete own campaigns" ON public.campaigns;

CREATE POLICY "Users can view own campaigns" ON public.campaigns
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own campaigns" ON public.campaigns
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own campaigns" ON public.campaigns
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own campaigns" ON public.campaigns
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));
