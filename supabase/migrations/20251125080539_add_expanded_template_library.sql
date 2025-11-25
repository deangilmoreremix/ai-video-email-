/*
  # Expand Video Template Library

  This migration adds a comprehensive set of video templates for various use cases.

  1. New Templates Added
    - Cold Outreach (sales_pitch category)
    - Account-Based Marketing (sales_pitch category)
    - Customer Onboarding Welcome (onboarding category)
    - Feature Tutorial (tutorial category)
    - Product Update Announcement (update category)
    - Event Invitation (sales_pitch category)
    - Customer Success Check-in (thank_you category)
    - Problem Resolution (thank_you category)
    - Partnership Proposal (sales_pitch category)
    - Referral Request (sales_pitch category)

  2. Categories Covered
    - sales_pitch: Cold outreach, ABM, events, partnerships, referrals
    - demo: Product demonstrations
    - onboarding: Welcome and getting started
    - tutorial: Feature walkthroughs
    - update: Product updates and announcements
    - thank_you: Appreciation and follow-ups

  Notes:
    - All templates include customizable placeholders
    - Templates are marked as public for all users
    - Duration estimates are provided for each template
*/

-- Cold Outreach Template
INSERT INTO video_templates (name, description, category, script_template, placeholders, duration, is_public, user_id)
VALUES (
  'Cold Outreach',
  'Personalized cold outreach for new prospects',
  'sales_pitch',
  'Hi {{recipient_name}},

I''m {{your_name}} from {{company_name}}, and I came across {{company_name}} while researching {{industry}}.

I noticed you''re {{specific_observation}}, which reminded me of how we helped {{similar_company}} achieve {{result}}.

Our solution helps {{target_audience}} {{main_benefit}} without {{common_pain}}.

Would you be open to a quick {{duration}} conversation about {{specific_topic}}?

{{closing_line}}',
  '[
    {"key": "recipient_name", "label": "Recipient Name", "type": "text"},
    {"key": "your_name", "label": "Your Name", "type": "text"},
    {"key": "company_name", "label": "Your Company", "type": "text"},
    {"key": "industry", "label": "Industry", "type": "text"},
    {"key": "specific_observation", "label": "Specific Observation", "type": "text"},
    {"key": "similar_company", "label": "Similar Company", "type": "text"},
    {"key": "result", "label": "Result Achieved", "type": "text"},
    {"key": "target_audience", "label": "Target Audience", "type": "text"},
    {"key": "main_benefit", "label": "Main Benefit", "type": "text"},
    {"key": "common_pain", "label": "Common Pain Point", "type": "text"},
    {"key": "duration", "label": "Call Duration", "type": "text", "defaultValue": "15-minute"},
    {"key": "specific_topic", "label": "Specific Topic", "type": "text"},
    {"key": "closing_line", "label": "Closing Line", "type": "text", "defaultValue": "Looking forward to connecting!"}
  ]'::jsonb,
  75,
  true,
  NULL
) ON CONFLICT DO NOTHING;

-- Account-Based Marketing Template
INSERT INTO video_templates (name, description, category, script_template, placeholders, duration, is_public, user_id)
VALUES (
  'Account-Based Marketing',
  'Highly personalized video for target accounts',
  'sales_pitch',
  'Hello {{decision_maker_name}},

I''ve been following {{company_name}}''s recent {{company_milestone}}, and I wanted to personally reach out.

Based on your {{job_title}} role and {{company_name}}''s focus on {{company_focus}}, I believe {{product_name}} could help you {{specific_value}}.

We''ve partnered with {{competitor_or_peer}} in your space, helping them {{quantifiable_result}}.

I''ve prepared a custom {{deliverable}} specifically for {{company_name}}. Can we schedule {{meeting_length}} to discuss?

{{personalized_ps}}',
  '[
    {"key": "decision_maker_name", "label": "Decision Maker Name", "type": "text"},
    {"key": "company_name", "label": "Company Name", "type": "text"},
    {"key": "company_milestone", "label": "Recent Company Milestone", "type": "text"},
    {"key": "job_title", "label": "Job Title", "type": "text"},
    {"key": "company_focus", "label": "Company Focus Area", "type": "text"},
    {"key": "product_name", "label": "Product Name", "type": "text"},
    {"key": "specific_value", "label": "Specific Value Prop", "type": "text"},
    {"key": "competitor_or_peer", "label": "Competitor/Peer Company", "type": "text"},
    {"key": "quantifiable_result", "label": "Quantifiable Result", "type": "text"},
    {"key": "deliverable", "label": "Custom Deliverable", "type": "text", "defaultValue": "ROI analysis"},
    {"key": "meeting_length", "label": "Meeting Length", "type": "text", "defaultValue": "30 minutes"},
    {"key": "personalized_ps", "label": "Personalized P.S.", "type": "text"}
  ]'::jsonb,
  90,
  true,
  NULL
) ON CONFLICT DO NOTHING;

-- Customer Onboarding Welcome
INSERT INTO video_templates (name, description, category, script_template, placeholders, duration, is_public, user_id)
VALUES (
  'Customer Onboarding Welcome',
  'Welcome new customers and guide their first steps',
  'onboarding',
  'Welcome to {{product_name}}, {{customer_name}}!

I''m {{your_name}}, your dedicated {{your_role}}, and I''m excited to help you get started.

Over the next {{timeframe}}, we''ll help you {{primary_goal}}.

Here''s what to expect:
- {{step_1}}
- {{step_2}}
- {{step_3}}

Your first task is to {{first_action}}. I''ve sent you {{resource}} to help with this.

If you have any questions, {{contact_method}}.

Let''s make this successful together!',
  '[
    {"key": "product_name", "label": "Product Name", "type": "text"},
    {"key": "customer_name", "label": "Customer Name", "type": "text"},
    {"key": "your_name", "label": "Your Name", "type": "text"},
    {"key": "your_role", "label": "Your Role", "type": "text", "defaultValue": "Customer Success Manager"},
    {"key": "timeframe", "label": "Onboarding Timeframe", "type": "text", "defaultValue": "30 days"},
    {"key": "primary_goal", "label": "Primary Goal", "type": "text"},
    {"key": "step_1", "label": "Step 1", "type": "text"},
    {"key": "step_2", "label": "Step 2", "type": "text"},
    {"key": "step_3", "label": "Step 3", "type": "text"},
    {"key": "first_action", "label": "First Action", "type": "text"},
    {"key": "resource", "label": "Resource Provided", "type": "text", "defaultValue": "a getting started guide"},
    {"key": "contact_method", "label": "Contact Method", "type": "text", "defaultValue": "reply to this email"}
  ]'::jsonb,
  60,
  true,
  NULL
) ON CONFLICT DO NOTHING;

-- Feature Tutorial Template
INSERT INTO video_templates (name, description, category, script_template, placeholders, duration, is_public, user_id)
VALUES (
  'Feature Tutorial',
  'Quick tutorial for a specific product feature',
  'tutorial',
  'Hey {{user_name}}!

Today I''m showing you {{feature_name}}, one of our most powerful features.

{{feature_name}} helps you {{main_benefit}} in just {{time_saved}}.

Let me walk you through it:

Step 1: {{step_1_instruction}}
Step 2: {{step_2_instruction}}
Step 3: {{step_3_instruction}}

Pro tip: {{pro_tip}}

That''s it! Try it yourself and let me know if you have questions.

Want to learn more? Check out {{next_resource}}.',
  '[
    {"key": "user_name", "label": "User Name", "type": "text"},
    {"key": "feature_name", "label": "Feature Name", "type": "text"},
    {"key": "main_benefit", "label": "Main Benefit", "type": "text"},
    {"key": "time_saved", "label": "Time Saved", "type": "text", "defaultValue": "seconds"},
    {"key": "step_1_instruction", "label": "Step 1", "type": "text"},
    {"key": "step_2_instruction", "label": "Step 2", "type": "text"},
    {"key": "step_3_instruction", "label": "Step 3", "type": "text"},
    {"key": "pro_tip", "label": "Pro Tip", "type": "text"},
    {"key": "next_resource", "label": "Next Resource", "type": "text", "defaultValue": "our advanced tutorials"}
  ]'::jsonb,
  120,
  true,
  NULL
) ON CONFLICT DO NOTHING;

-- Product Update Announcement
INSERT INTO video_templates (name, description, category, script_template, placeholders, duration, is_public, user_id)
VALUES (
  'Product Update Announcement',
  'Announce new features and product improvements',
  'update',
  'Hi {{user_name}}!

Exciting news from {{company_name}}!

We just launched {{update_name}}, and you''re one of the first to know.

Here''s what''s new:

{{feature_1_name}}: {{feature_1_description}}
{{feature_2_name}}: {{feature_2_description}}
{{feature_3_name}}: {{feature_3_description}}

Why this matters to you: {{personal_benefit}}

{{update_name}} is available now in your dashboard. {{cta_action}}

Have feedback? {{feedback_method}}

Thanks for being an amazing customer!',
  '[
    {"key": "user_name", "label": "User Name", "type": "text"},
    {"key": "company_name", "label": "Company Name", "type": "text"},
    {"key": "update_name", "label": "Update Name", "type": "text"},
    {"key": "feature_1_name", "label": "Feature 1 Name", "type": "text"},
    {"key": "feature_1_description", "label": "Feature 1 Description", "type": "text"},
    {"key": "feature_2_name", "label": "Feature 2 Name", "type": "text"},
    {"key": "feature_2_description", "label": "Feature 2 Description", "type": "text"},
    {"key": "feature_3_name", "label": "Feature 3 Name", "type": "text"},
    {"key": "feature_3_description", "label": "Feature 3 Description", "type": "text"},
    {"key": "personal_benefit", "label": "Personal Benefit", "type": "text"},
    {"key": "cta_action", "label": "Call to Action", "type": "text", "defaultValue": "Try it now!"},
    {"key": "feedback_method", "label": "Feedback Method", "type": "text", "defaultValue": "reply to this email"}
  ]'::jsonb,
  75,
  true,
  NULL
) ON CONFLICT DO NOTHING;

-- Event Invitation Template
INSERT INTO video_templates (name, description, category, script_template, placeholders, duration, is_public, user_id)
VALUES (
  'Event Invitation',
  'Invite prospects or customers to events',
  'sales_pitch',
  'Hi {{recipient_name}},

I''m personally inviting you to {{event_name}} on {{event_date}}.

This {{event_type}} brings together {{attendee_type}} to {{event_purpose}}.

You''ll get to:
- {{benefit_1}}
- {{benefit_2}}
- {{benefit_3}}

Special guest {{special_guest}} will be {{guest_topic}}.

As a {{recipient_qualifier}}, you''ll get {{exclusive_benefit}}.

{{event_name}} is {{event_location}}. Save your spot: {{registration_link}}

Hope to see you there!',
  '[
    {"key": "recipient_name", "label": "Recipient Name", "type": "text"},
    {"key": "event_name", "label": "Event Name", "type": "text"},
    {"key": "event_date", "label": "Event Date", "type": "text"},
    {"key": "event_type", "label": "Event Type", "type": "text", "defaultValue": "virtual event"},
    {"key": "attendee_type", "label": "Attendee Type", "type": "text"},
    {"key": "event_purpose", "label": "Event Purpose", "type": "text"},
    {"key": "benefit_1", "label": "Benefit 1", "type": "text"},
    {"key": "benefit_2", "label": "Benefit 2", "type": "text"},
    {"key": "benefit_3", "label": "Benefit 3", "type": "text"},
    {"key": "special_guest", "label": "Special Guest", "type": "text"},
    {"key": "guest_topic", "label": "Guest Topic", "type": "text"},
    {"key": "recipient_qualifier", "label": "Recipient Qualifier", "type": "text"},
    {"key": "exclusive_benefit", "label": "Exclusive Benefit", "type": "text"},
    {"key": "event_location", "label": "Event Location", "type": "text"},
    {"key": "registration_link", "label": "Registration Link", "type": "url"}
  ]'::jsonb,
  60,
  true,
  NULL
) ON CONFLICT DO NOTHING;

-- Customer Success Check-in
INSERT INTO video_templates (name, description, category, script_template, placeholders, duration, is_public, user_id)
VALUES (
  'Customer Success Check-in',
  'Regular check-in with customers to ensure success',
  'thank_you',
  'Hi {{customer_name}},

It''s been {{time_period}} since you started with {{product_name}}, and I wanted to check in.

I noticed you''ve been {{usage_observation}}. That''s {{positive_feedback}}!

I wanted to share some insights:
- {{insight_1}}
- {{insight_2}}

To help you get even more value, I recommend {{recommendation}}.

Also, we have {{upcoming_feature}} coming soon that I think you''ll love.

Is there anything I can help with? {{scheduling_cta}}

Keep up the great work!',
  '[
    {"key": "customer_name", "label": "Customer Name", "type": "text"},
    {"key": "time_period", "label": "Time Period", "type": "text", "defaultValue": "30 days"},
    {"key": "product_name", "label": "Product Name", "type": "text"},
    {"key": "usage_observation", "label": "Usage Observation", "type": "text"},
    {"key": "positive_feedback", "label": "Positive Feedback", "type": "text", "defaultValue": "fantastic"},
    {"key": "insight_1", "label": "Insight 1", "type": "text"},
    {"key": "insight_2", "label": "Insight 2", "type": "text"},
    {"key": "recommendation", "label": "Recommendation", "type": "text"},
    {"key": "upcoming_feature", "label": "Upcoming Feature", "type": "text"},
    {"key": "scheduling_cta", "label": "Scheduling CTA", "type": "text", "defaultValue": "Let''s schedule a quick call."}
  ]'::jsonb,
  60,
  true,
  NULL
) ON CONFLICT DO NOTHING;

-- Problem Resolution Template
INSERT INTO video_templates (name, description, category, script_template, placeholders, duration, is_public, user_id)
VALUES (
  'Problem Resolution',
  'Address and resolve customer issues personally',
  'thank_you',
  'Hi {{customer_name}},

I wanted to personally reach out about {{issue_description}}.

First, I want to apologize for {{specific_problem}}. That''s not the experience we want you to have.

Here''s what happened: {{explanation}}

And here''s what we''ve done to fix it:
- {{solution_1}}
- {{solution_2}}

To make this right, {{compensation}}.

Going forward, {{prevention_measure}}.

I''m personally monitoring this to ensure {{assurance}}.

Thanks for your patience and for being a valued customer.',
  '[
    {"key": "customer_name", "label": "Customer Name", "type": "text"},
    {"key": "issue_description", "label": "Issue Description", "type": "text"},
    {"key": "specific_problem", "label": "Specific Problem", "type": "text"},
    {"key": "explanation", "label": "Explanation", "type": "text"},
    {"key": "solution_1", "label": "Solution 1", "type": "text"},
    {"key": "solution_2", "label": "Solution 2", "type": "text"},
    {"key": "compensation", "label": "Compensation/Goodwill", "type": "text"},
    {"key": "prevention_measure", "label": "Prevention Measure", "type": "text"},
    {"key": "assurance", "label": "Assurance Statement", "type": "text"}
  ]'::jsonb,
  75,
  true,
  NULL
) ON CONFLICT DO NOTHING;

-- Partnership Proposal Template
INSERT INTO video_templates (name, description, category, script_template, placeholders, duration, is_public, user_id)
VALUES (
  'Partnership Proposal',
  'Propose strategic partnerships or collaborations',
  'sales_pitch',
  'Hi {{partner_name}},

I''m {{your_name}} from {{your_company}}, and I''ve been impressed by {{their_company}}''s work in {{their_focus}}.

I see a great synergy between our companies. We both {{shared_value}}.

I''m reaching out to explore a partnership where:
- {{benefit_to_them_1}}
- {{benefit_to_them_2}}
- {{mutual_benefit}}

Specifically, I''m thinking we could {{partnership_idea}}.

Our customers would love {{combined_offering}}, and your audience would benefit from {{your_value_add}}.

Would you be open to exploring this? {{meeting_proposal}}

Looking forward to potentially working together!',
  '[
    {"key": "partner_name", "label": "Partner Name", "type": "text"},
    {"key": "your_name", "label": "Your Name", "type": "text"},
    {"key": "your_company", "label": "Your Company", "type": "text"},
    {"key": "their_company", "label": "Their Company", "type": "text"},
    {"key": "their_focus", "label": "Their Focus Area", "type": "text"},
    {"key": "shared_value", "label": "Shared Value", "type": "text"},
    {"key": "benefit_to_them_1", "label": "Benefit to Them 1", "type": "text"},
    {"key": "benefit_to_them_2", "label": "Benefit to Them 2", "type": "text"},
    {"key": "mutual_benefit", "label": "Mutual Benefit", "type": "text"},
    {"key": "partnership_idea", "label": "Partnership Idea", "type": "text"},
    {"key": "combined_offering", "label": "Combined Offering", "type": "text"},
    {"key": "your_value_add", "label": "Your Value Add", "type": "text"},
    {"key": "meeting_proposal", "label": "Meeting Proposal", "type": "text", "defaultValue": "Can we schedule a call?"}
  ]'::jsonb,
  90,
  true,
  NULL
) ON CONFLICT DO NOTHING;

-- Referral Request Template
INSERT INTO video_templates (name, description, category, script_template, placeholders, duration, is_public, user_id)
VALUES (
  'Referral Request',
  'Ask happy customers for referrals',
  'sales_pitch',
  'Hi {{customer_name}},

I hope {{product_name}} is working well for you!

Since you started using our solution {{time_ago}}, you''ve {{achievement}}.

I''m reaching out because customers like you are our best advocates.

If you know someone who could benefit from {{main_benefit}}, I''d love an introduction.

Specifically, I work best with {{ideal_referral_profile}}.

To make this easy:
- {{referral_incentive}}
- {{what_you_will_do}}

Simply {{referral_action}}, and I''ll take it from there.

Thanks for being an amazing customer and for considering this!',
  '[
    {"key": "customer_name", "label": "Customer Name", "type": "text"},
    {"key": "product_name", "label": "Product Name", "type": "text"},
    {"key": "time_ago", "label": "Time Since Start", "type": "text"},
    {"key": "achievement", "label": "Customer Achievement", "type": "text"},
    {"key": "main_benefit", "label": "Main Benefit", "type": "text"},
    {"key": "ideal_referral_profile", "label": "Ideal Referral Profile", "type": "text"},
    {"key": "referral_incentive", "label": "Referral Incentive", "type": "text"},
    {"key": "what_you_will_do", "label": "What You Will Do", "type": "text"},
    {"key": "referral_action", "label": "Referral Action", "type": "text", "defaultValue": "reply with their email"}
  ]'::jsonb,
  60,
  true,
  NULL
) ON CONFLICT DO NOTHING;
