/*
  # Seed Default Templates

  1. Data
    - Insert default public templates for common use cases
    - Sales Pitch, Product Demo, Thank You templates

  2. Notes
    - These templates are public and available to all users
    - Uses conditional insert to avoid duplicates
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM video_templates WHERE name = 'Sales Pitch' AND is_public = true) THEN
    INSERT INTO video_templates (
      user_id,
      name,
      description,
      category,
      script_template,
      placeholders,
      duration,
      is_public,
      usage_count
    ) VALUES (
      NULL,
      'Sales Pitch',
      'Introduce your product or service to a potential customer',
      'sales_pitch',
      'Hi {{recipient_name}},

I noticed {{company_name}} is working on {{pain_point}}, and I wanted to share how {{product_name}} can help.

We''ve helped companies like yours {{benefit_1}}, {{benefit_2}}, and {{benefit_3}}.

The best part? {{unique_value}}.

I''d love to show you a quick demo. Are you available {{meeting_time}}?

{{cta_message}}',
      '[
        {"key": "recipient_name", "label": "Recipient Name", "type": "text", "defaultValue": "there"},
        {"key": "company_name", "label": "Company Name", "type": "text"},
        {"key": "pain_point", "label": "Pain Point", "type": "text"},
        {"key": "product_name", "label": "Product Name", "type": "text"},
        {"key": "benefit_1", "label": "Benefit 1", "type": "text"},
        {"key": "benefit_2", "label": "Benefit 2", "type": "text"},
        {"key": "benefit_3", "label": "Benefit 3", "type": "text"},
        {"key": "unique_value", "label": "Unique Value", "type": "text"},
        {"key": "meeting_time", "label": "Proposed Meeting Time", "type": "text"},
        {"key": "cta_message", "label": "Call to Action", "type": "text", "defaultValue": "Let me know!"}
      ]'::jsonb,
      60,
      true,
      0
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM video_templates WHERE name = 'Product Demo' AND is_public = true) THEN
    INSERT INTO video_templates (
      user_id,
      name,
      description,
      category,
      script_template,
      placeholders,
      duration,
      is_public,
      usage_count
    ) VALUES (
      NULL,
      'Product Demo',
      'Walk through your product features and benefits',
      'demo',
      'Welcome to {{product_name}}!

Today I''ll show you how to {{main_goal}}.

First, let''s look at {{feature_1}}. This allows you to {{feature_1_benefit}}.

Next, {{feature_2}} makes it easy to {{feature_2_benefit}}.

Finally, {{feature_3}} helps you {{feature_3_benefit}}.

Ready to try it yourself? {{cta_message}}',
      '[
        {"key": "product_name", "label": "Product Name", "type": "text"},
        {"key": "main_goal", "label": "Main Goal", "type": "text"},
        {"key": "feature_1", "label": "Feature 1", "type": "text"},
        {"key": "feature_1_benefit", "label": "Feature 1 Benefit", "type": "text"},
        {"key": "feature_2", "label": "Feature 2", "type": "text"},
        {"key": "feature_2_benefit", "label": "Feature 2 Benefit", "type": "text"},
        {"key": "feature_3", "label": "Feature 3", "type": "text"},
        {"key": "feature_3_benefit", "label": "Feature 3 Benefit", "type": "text"},
        {"key": "cta_message", "label": "Call to Action", "type": "text", "defaultValue": "Get started now!"}
      ]'::jsonb,
      90,
      true,
      0
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM video_templates WHERE name = 'Thank You' AND is_public = true) THEN
    INSERT INTO video_templates (
      user_id,
      name,
      description,
      category,
      script_template,
      placeholders,
      duration,
      is_public,
      usage_count
    ) VALUES (
      NULL,
      'Thank You',
      'Show appreciation to customers or partners',
      'thank_you',
      'Hi {{recipient_name}},

I wanted to personally thank you for {{reason}}.

{{specific_detail}}

This means a lot to us because {{impact}}.

Looking forward to {{future_action}}.

Thanks again!',
      '[
        {"key": "recipient_name", "label": "Recipient Name", "type": "text"},
        {"key": "reason", "label": "Reason for Thanks", "type": "text"},
        {"key": "specific_detail", "label": "Specific Detail", "type": "text"},
        {"key": "impact", "label": "Impact Statement", "type": "text"},
        {"key": "future_action", "label": "Future Action", "type": "text"}
      ]'::jsonb,
      45,
      true,
      0
    );
  END IF;
END $$;