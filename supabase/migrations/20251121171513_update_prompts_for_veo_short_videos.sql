/*
  # Update Prompts for Gemini Veo Short Videos

  1. Changes
    - Replace all 50 system prompts with versions optimized for 4, 6, or 8 second videos
    - Focus on single, powerful messages instead of multi-step narratives
    - Adjust expectations for ultra-short video format
  
  2. Notes
    - Gemini Veo supports 4, 6, or 8 second videos via API
    - Each prompt now focuses on ONE key message or hook
*/

-- Delete existing system prompts
DELETE FROM saved_prompts WHERE user_id IS NULL;

-- Insert new short-form video prompts optimized for 4-8 seconds

-- SALES PITCH PROMPTS (8 prompts - mostly 6-8 seconds)
INSERT INTO saved_prompts (user_id, title, prompt_text, category, tags, is_public, usage_count) VALUES
(NULL, 'High-Ticket Service Power Hook', 'Create an 8-second video hook for premium consulting services. Open with ONE compelling question that stops C-level executives in their tracks. Example: "What if I told you we helped 3 companies add $10M in revenue this quarter?" Speak directly to camera with confident authority. Use professional background, business attire. Tone: exclusive, authoritative.', 'sales_pitch', ARRAY['consulting', 'b2b', 'executive'], true, 0),

(NULL, 'E-commerce Product Tease', 'Make a 6-second product launch teaser. Show the product dramatically with text overlay of ONE key benefit and launch date. Example: "The sleep mask that changed everything - drops tomorrow" with product reveal. High energy, create FOMO. Tone: exciting, mysterious.', 'sales_pitch', ARRAY['ecommerce', 'product', 'launch'], true, 0),

(NULL, 'Quick Value Proposition', 'Create a 6-second direct pitch. State your service and ONE transformational result. Example: "We scale your business systems so you can focus on what matters - our clients save 20 hours per week." Professional setting, direct eye contact. Tone: confident, results-focused.', 'sales_pitch', ARRAY['services', 'b2b', 'consulting'], true, 0),

(NULL, 'Problem-Solution Flash', 'Make a 4-second problem hook. Show frustration with common business problem via text/visual. Example: "Spending hours on manual reports?" with stressed person at desk. Sets up follow-up video. Tone: relatable, urgent.', 'sales_pitch', ARRAY['saas', 'productivity', 'hook'], true, 0),

(NULL, 'Social Proof Snippet', 'Create a 6-second credibility builder. Share ONE impressive client result with visual proof. Example: "Just helped our client hit $1M in 90 days" showing dashboard or testimonial screenshot. Builds instant authority. Tone: matter-of-fact, confident.', 'sales_pitch', ARRAY['results', 'testimonial', 'proof'], true, 0),

(NULL, 'Course Launch Hook', 'Make an 8-second course announcement. Present the transformation promise with launch timeline. Example: "Master executive presence in 30 days. Join 500+ leaders who transformed their careers. Enrollment opens Monday." Show your face, professional setting. Tone: inspirational, exclusive.', 'sales_pitch', ARRAY['course', 'training', 'education'], true, 0),

(NULL, 'SaaS Feature Benefit Bomb', 'Create a 4-second feature-benefit punch. Show ONE app feature solving ONE problem instantly. Example: "Turn 3 hours of work into 3 minutes" with screen recording of the feature. Fast-paced, visual. Tone: exciting, efficient.', 'sales_pitch', ARRAY['saas', 'software', 'demo'], true, 0),

(NULL, 'Partnership Invitation', 'Make a 6-second collaboration pitch. Directly invite ideal partners with specific benefit. Example: "Looking for agencies wanting to add $50K/month passive revenue. No overhead, just results. DM me." Face to camera, professional. Tone: opportunity-focused, direct.', 'sales_pitch', ARRAY['partnership', 'b2b', 'collaboration'], true, 0),

-- PRODUCT DEMO PROMPTS (6 prompts - mostly 6-8 seconds)
(NULL, 'Software Quick Win Demo', 'Create an 8-second screen recording showing ONE powerful feature solving a problem. Start with the problem (messy data), show the one-click solution, end with perfect result. Add text overlay explaining what happened. No talking needed. Tone: efficient, impressive.', 'product_demo', ARRAY['software', 'saas', 'demo'], true, 0),

(NULL, 'Physical Product Unboxing Moment', 'Make a 6-second unboxing highlight. Show the most impressive moment: opening the package and revealing the product with reaction. Example: elegant packaging opening to reveal premium item. Add music, no talking. Tone: premium, satisfying.', 'product_demo', ARRAY['product', 'unboxing', 'physical'], true, 0),

(NULL, 'Before-After Transformation', 'Create a 4-second before/after split screen. Show dramatic difference your product creates. Example: messy desk vs organized desk, or old process (slow) vs new process (fast). Text overlay only, no voice. Tone: dramatic, clear.', 'product_demo', ARRAY['transformation', 'results', 'comparison'], true, 0),

(NULL, 'Feature Spotlight', 'Make a 6-second close-up of ONE standout feature. Show it in action with one benefit text overlay. Example: "Water-resistant coating that actually works" with water beading off product. Simple, focused. Tone: proof-driven, impressive.', 'product_demo', ARRAY['feature', 'detail', 'benefit'], true, 0),

(NULL, 'App Navigation Flow', 'Create an 8-second app walkthrough of ONE key task. Screen recording showing user completing important action from start to finish. Example: "Book appointment in 3 taps" showing the full flow. Fast-paced with step numbers. Tone: simple, efficient.', 'product_demo', ARRAY['app', 'mobile', 'tutorial'], true, 0),

(NULL, 'Product in Use', 'Make a 6-second lifestyle shot of product being used. Show someone using your product in ideal context looking satisfied/successful. Example: professional using your planner looking organized. No talking, ambient sound. Tone: aspirational, relatable.', 'product_demo', ARRAY['lifestyle', 'usage', 'real-world'], true, 0),

-- TUTORIAL PROMPTS (5 prompts - 6-8 seconds)
(NULL, 'One-Minute Hack', 'Create an 8-second tutorial of ONE quick tip. Show the problem, then your simple solution step-by-step. Example: "Can''t find files? Here''s the trick" with 3-second problem then 5-second solution. Direct, hands-on. Tone: helpful, quick.', 'tutorial', ARRAY['tip', 'hack', 'howto'], true, 0),

(NULL, 'Mistake Warning', 'Make a 6-second "don''t do this" video. Show common mistake and text overlay of correction. Example: "Stop doing [X]. Do [Y] instead." with split screen comparison. Grab attention with contrast. Tone: authoritative, helpful.', 'tutorial', ARRAY['mistakes', 'advice', 'tips'], true, 0),

(NULL, 'Tool Feature Tutorial', 'Create a 6-second focused tutorial on ONE tool feature. Screen record the exact steps with numbered text overlays. Example: "3 clicks to automate your reports" showing each click. Clear, specific. Tone: educational, efficient.', 'tutorial', ARRAY['tools', 'software', 'howto'], true, 0),

(NULL, 'Productivity Shortcut', 'Make a 4-second keyboard shortcut or productivity tip. Show the old slow way vs the fast shortcut side-by-side. Example: "Stop right-clicking, use Ctrl+C" with comparison. Quick visual impact. Tone: time-saving, smart.', 'tutorial', ARRAY['productivity', 'shortcuts', 'efficiency'], true, 0),

(NULL, 'Setup Essentials', 'Create an 8-second "must-have setup" video. Show 3-4 essential things for beginners with quick cuts. Example: "3 must-haves for your home office" showing each item for 2 seconds. Fast-paced list format. Tone: essential, authoritative.', 'tutorial', ARRAY['setup', 'essentials', 'beginner'], true, 0),

-- THANK YOU PROMPTS (4 prompts - 4-6 seconds)
(NULL, 'New Customer Thank You', 'Make a 6-second personal thank you to new customers. Look at camera, smile, say thanks and what''s coming next. Example: "Thank you for joining us! Your welcome package arrives tomorrow." Warm, genuine. Professional but friendly setting. Tone: grateful, welcoming.', 'thank_you', ARRAY['customer', 'welcome', 'gratitude'], true, 0),

(NULL, 'Milestone Celebration', 'Create a 6-second celebration video. Announce milestone with genuine excitement. Example: "We just hit 10,000 customers because of you - thank you!" with confetti or celebration visual. Face to camera or team shot. Tone: excited, grateful.', 'thank_you', ARRAY['milestone', 'achievement', 'community'], true, 0),

(NULL, 'Event Attendee Thanks', 'Make a 4-second quick thank you to event participants. Example: "Thanks for joining today''s webinar! Check your email for the replay and bonus." Direct to camera, energetic. Tone: appreciative, valuable.', 'thank_you', ARRAY['event', 'webinar', 'attendee'], true, 0),

(NULL, 'Year-End Appreciation', 'Create a 6-second heartfelt thank you. Personal message appreciating your audience. Example: "This year has been incredible because of you. Thank you for being part of our journey." Warm, authentic. Tone: sincere, reflective.', 'thank_you', ARRAY['appreciation', 'annual', 'reflection'], true, 0),

-- UPDATE PROMPTS (6 prompts - 4-8 seconds)
(NULL, 'Product Update Flash', 'Make a 6-second update announcement. State what changed and key benefit. Example: "New feature just dropped: Bulk edit now saves you hours. Check it out!" Direct to camera or screen recording. Tone: exciting, beneficial.', 'update', ARRAY['feature', 'product', 'news'], true, 0),

(NULL, 'Behind-the-Scenes Peek', 'Create a 4-second BTS moment. Quick glimpse of work in progress or team moment. Example: "Late night shipping your orders" showing packing station. Builds connection. Tone: authentic, hardworking.', 'update', ARRAY['bts', 'transparency', 'team'], true, 0),

(NULL, 'Progress Report', 'Make an 8-second progress update with stats. Show key metrics or achievements with visuals. Example: "Month 6: 500 users, 98% satisfaction, 50 new features shipped" with animated numbers. Builds credibility. Tone: confident, transparent.', 'update', ARRAY['metrics', 'progress', 'transparency'], true, 0),

(NULL, 'Coming Soon Teaser', 'Create a 6-second teaser for upcoming launch. Build anticipation without revealing everything. Example: "Something big drops Monday. You''re not ready for this." with cryptic visual. Create buzz. Tone: mysterious, exciting.', 'update', ARRAY['teaser', 'launch', 'anticipation'], true, 0),

(NULL, 'Policy Change Notice', 'Make a 6-second important update. Clearly state what''s changing and when. Example: "Heads up: New pricing takes effect March 1st. Current members keep their rate. Check your email." Face to camera, serious. Tone: clear, respectful.', 'update', ARRAY['policy', 'important', 'notice'], true, 0),

(NULL, 'Team Update', 'Create a 4-second team announcement. Introduce new member or role change. Example: "Meet Sarah, our new head of support. She''s amazing!" with person waving. Builds team connection. Tone: friendly, welcoming.', 'update', ARRAY['team', 'announcement', 'people'], true, 0),

-- WELCOME PROMPTS (5 prompts - 6-8 seconds)
(NULL, 'New Member Onboarding', 'Make an 8-second welcome for new members. Introduce yourself, state what they get, tell them next step. Example: "Welcome! I''m Alex, you now have access to everything. Check your email for getting started guide." Friendly, professional setting. Tone: welcoming, clear.', 'welcome', ARRAY['onboarding', 'member', 'intro'], true, 0),

(NULL, 'Community Welcome', 'Create a 6-second community introduction. Welcome new person, highlight key benefit, invite to engage. Example: "Welcome to our community of 5,000 founders! Introduce yourself in the chat." Face to camera, warm. Tone: inclusive, friendly.', 'welcome', ARRAY['community', 'introduction', 'social'], true, 0),

(NULL, 'First Purchase Thank You', 'Make a 6-second thank you after first purchase. Express gratitude, confirm what''s next. Example: "Thank you for your first order! It ships today, and we added a surprise gift." Genuine smile to camera. Tone: grateful, exciting.', 'welcome', ARRAY['purchase', 'customer', 'gratitude'], true, 0),

(NULL, 'Trial Start Motivation', 'Create a 6-second trial welcome. Build excitement, mention key feature to try first. Example: "Your trial is active! Start with the automation wizard - it''ll blow your mind." Enthusiastic, direct to camera. Tone: energetic, guiding.', 'welcome', ARRAY['trial', 'activation', 'saas'], true, 0),

(NULL, 'Email List Welcome', 'Make a 4-second subscriber welcome. Thank them, tell them what to expect. Example: "Thanks for subscribing! Weekly tips drop every Monday." Quick, friendly. Tone: appreciative, promise.', 'welcome', ARRAY['email', 'subscriber', 'newsletter'], true, 0),

-- TESTIMONIAL PROMPTS (4 prompts - 6-8 seconds)
(NULL, 'Results-Focused Testimonial', 'Create an 8-second testimonial showcasing ONE specific result. Customer states problem, shares exact result achieved. Example: "I was stuck at $50K/year. After 6 months, I hit $200K. This program changed everything." Face to camera, authentic. Tone: genuine, specific.', 'testimonial', ARRAY['results', 'success', 'proof'], true, 0),

(NULL, 'Emotional Transformation', 'Make a 6-second before/after emotional testimonial. Customer expresses how they felt before vs after. Example: "I felt overwhelmed daily. Now I feel in control and confident." Genuine emotion, close-up. Tone: vulnerable, hopeful.', 'testimonial', ARRAY['transformation', 'emotional', 'impact'], true, 0),

(NULL, 'Quick Win Story', 'Create a 6-second fast result testimonial. Customer shares surprisingly quick result. Example: "I saw results in 48 hours. My first client came from lesson 3." Excited delivery. Tone: surprised, energetic.', 'testimonial', ARRAY['quick-win', 'fast-results', 'success'], true, 0),

(NULL, 'Skeptic to Believer', 'Make a 6-second "I was skeptical" testimonial. Customer admits doubt then shares positive surprise. Example: "I thought it was too good to be true. I was wrong - this actually works." Honest, direct. Tone: authentic, converted.', 'testimonial', ARRAY['skeptic', 'proof', 'honest'], true, 0),

-- ANNOUNCEMENT PROMPTS (6 prompts - 4-8 seconds)
(NULL, 'Big News Drop', 'Create an 8-second major announcement. Build anticipation in first 3 seconds, deliver news in remaining 5. Example: "The moment you''ve been waiting for... We''re launching in 10 new countries next month!" Energetic, face to camera. Tone: exciting, significant.', 'announcement', ARRAY['news', 'launch', 'major'], true, 0),

(NULL, 'Event Announcement', 'Make a 6-second event invitation. State what, when, why attend. Example: "Live workshop: Scale to $100K in 90 days. Thursday at 2pm EST. Limited spots." Clear, urgent. Tone: valuable, exclusive.', 'announcement', ARRAY['event', 'webinar', 'invitation'], true, 0),

(NULL, 'Sale or Promotion', 'Create a 6-second sale announcement. State offer, urgency, action. Example: "48-hour flash sale: 50% off everything. Ends Sunday midnight. Shop now!" Bold text overlays, energetic. Tone: urgent, exciting.', 'announcement', ARRAY['sale', 'promotion', 'urgency'], true, 0),

(NULL, 'Partnership Reveal', 'Make a 6-second partnership announcement. Reveal partner, state what it means for audience. Example: "Huge news: We partnered with [Brand]! You now get exclusive access to their premium tools." Professional, exciting. Tone: prestigious, beneficial.', 'announcement', ARRAY['partnership', 'collaboration', 'exclusive'], true, 0),

(NULL, 'Award or Recognition', 'Create a 4-second achievement announcement. Share award/recognition with visual proof. Example: "We just won Best SaaS Tool of 2024!" showing award/badge. Quick celebration. Tone: proud, credible.', 'announcement', ARRAY['award', 'recognition', 'achievement'], true, 0),

(NULL, 'Waitlist Opening', 'Make a 6-second waitlist announcement. Create exclusivity and urgency. Example: "Waitlist opens tomorrow. Only 100 spots for our beta program. Set your alarm." Direct to camera. Tone: exclusive, urgent.', 'announcement', ARRAY['waitlist', 'exclusive', 'launch'], true, 0),

-- EXPLAINER PROMPTS (6 prompts - 6-8 seconds)
(NULL, 'What We Do Simply', 'Create an 8-second company/product explainer. State problem, your solution, key benefit. Example: "Hiring takes forever. We find you pre-vetted candidates in 48 hours. You interview only the best." Clear, direct. Tone: simple, valuable.', 'explainer', ARRAY['company', 'product', 'intro'], true, 0),

(NULL, 'How It Works Quick', 'Make a 6-second process explainer. Show 3 simple steps. Example: "1. Connect your data. 2. We analyze it. 3. Get your report. That''s it." Visual or text-based steps. Tone: simple, clear.', 'explainer', ARRAY['process', 'howto', 'simple'], true, 0),

(NULL, 'Why Choose Us', 'Create a 6-second differentiation explainer. State what makes you different in one sentence. Example: "Unlike other platforms, we guarantee results or refund 100%. No risk, all reward." Confident, face to camera. Tone: confident, unique.', 'explainer', ARRAY['differentiation', 'unique', 'value'], true, 0),

(NULL, 'Problem Awareness', 'Make a 4-second problem education video. Help audience recognize problem they have. Example: "If you''re manually entering data, you''re losing 10 hours per week." Eye-opening. Tone: revealing, helpful.', 'explainer', ARRAY['problem', 'awareness', 'education'], true, 0),

(NULL, 'Concept Simplified', 'Create a 6-second complex concept explanation. Break down ONE difficult idea simply. Example: "AI automation = teaching software to do your repetitive tasks while you focus on growth." Clear analogy. Tone: educational, simple.', 'explainer', ARRAY['concept', 'education', 'simple'], true, 0),

(NULL, 'Pricing Explained', 'Make an 8-second pricing clarity video. State pricing, what''s included, value proposition. Example: "$99/month gets you unlimited users, 24/7 support, and all features. Most tools charge per user - we don''t." Transparent, valuable. Tone: clear, valuable.', 'explainer', ARRAY['pricing', 'value', 'transparency'], true, 0);
