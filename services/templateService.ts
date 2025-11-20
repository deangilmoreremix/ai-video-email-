import { supabase } from '../lib/supabase';

export interface TemplatePlaceholder {
  key: string;
  label: string;
  type: 'text' | 'email' | 'url' | 'date';
  defaultValue?: string;
}

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  script_template: string;
  placeholders: TemplatePlaceholder[];
  duration: number;
  usage_count: number;
  is_public: boolean;
}

export interface PersonalizationData {
  [key: string]: string;
}

export const TEMPLATE_CATEGORIES = [
  'sales_pitch',
  'demo',
  'onboarding',
  'thank_you',
  'tutorial',
  'update'
] as const;

export async function getTemplates(category?: string): Promise<VideoTemplate[]> {
  try {
    let query = supabase
      .from('video_templates')
      .select('*')
      .eq('is_public', true)
      .order('usage_count', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
}

export async function getUserTemplates(userId: string): Promise<VideoTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('video_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user templates:', error);
    return [];
  }
}

export function generateScriptFromTemplate(
  template: VideoTemplate,
  personalization: PersonalizationData
): string {
  let script = template.script_template;

  Object.entries(personalization).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    script = script.replace(regex, value);
  });

  return script;
}

export async function incrementTemplateUsage(templateId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_template_usage', {
      template_id: templateId
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error incrementing template usage:', error);
  }
}

export async function createTemplate(
  template: Omit<VideoTemplate, 'id' | 'usage_count' | 'created_at' | 'updated_at'>
): Promise<VideoTemplate | null> {
  try {
    const { data, error } = await supabase
      .from('video_templates')
      .insert([template])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating template:', error);
    return null;
  }
}

export const DEFAULT_TEMPLATES: Omit<VideoTemplate, 'id' | 'usage_count'>[] = [
  {
    name: 'Sales Pitch',
    description: 'Introduce your product or service to a potential customer',
    category: 'sales_pitch',
    script_template: `Hi {{recipient_name}},

I noticed {{company_name}} is working on {{pain_point}}, and I wanted to share how {{product_name}} can help.

We've helped companies like yours {{benefit_1}}, {{benefit_2}}, and {{benefit_3}}.

The best part? {{unique_value}}.

I'd love to show you a quick demo. Are you available {{meeting_time}}?

{{cta_message}}`,
    placeholders: [
      { key: 'recipient_name', label: 'Recipient Name', type: 'text', defaultValue: 'there' },
      { key: 'company_name', label: 'Company Name', type: 'text' },
      { key: 'pain_point', label: 'Pain Point', type: 'text' },
      { key: 'product_name', label: 'Product Name', type: 'text' },
      { key: 'benefit_1', label: 'Benefit 1', type: 'text' },
      { key: 'benefit_2', label: 'Benefit 2', type: 'text' },
      { key: 'benefit_3', label: 'Benefit 3', type: 'text' },
      { key: 'unique_value', label: 'Unique Value', type: 'text' },
      { key: 'meeting_time', label: 'Proposed Meeting Time', type: 'text' },
      { key: 'cta_message', label: 'Call to Action', type: 'text', defaultValue: 'Let me know!' }
    ],
    duration: 60,
    is_public: true
  },
  {
    name: 'Product Demo',
    description: 'Walk through your product features and benefits',
    category: 'demo',
    script_template: `Welcome to {{product_name}}!

Today I'll show you how to {{main_goal}}.

First, let's look at {{feature_1}}. This allows you to {{feature_1_benefit}}.

Next, {{feature_2}} makes it easy to {{feature_2_benefit}}.

Finally, {{feature_3}} helps you {{feature_3_benefit}}.

Ready to try it yourself? {{cta_message}}`,
    placeholders: [
      { key: 'product_name', label: 'Product Name', type: 'text' },
      { key: 'main_goal', label: 'Main Goal', type: 'text' },
      { key: 'feature_1', label: 'Feature 1', type: 'text' },
      { key: 'feature_1_benefit', label: 'Feature 1 Benefit', type: 'text' },
      { key: 'feature_2', label: 'Feature 2', type: 'text' },
      { key: 'feature_2_benefit', label: 'Feature 2 Benefit', type: 'text' },
      { key: 'feature_3', label: 'Feature 3', type: 'text' },
      { key: 'feature_3_benefit', label: 'Feature 3 Benefit', type: 'text' },
      { key: 'cta_message', label: 'Call to Action', type: 'text', defaultValue: 'Get started now!' }
    ],
    duration: 90,
    is_public: true
  },
  {
    name: 'Thank You',
    description: 'Show appreciation to customers or partners',
    category: 'thank_you',
    script_template: `Hi {{recipient_name}},

I wanted to personally thank you for {{reason}}.

{{specific_detail}}

This means a lot to us because {{impact}}.

Looking forward to {{future_action}}.

Thanks again!`,
    placeholders: [
      { key: 'recipient_name', label: 'Recipient Name', type: 'text' },
      { key: 'reason', label: 'Reason for Thanks', type: 'text' },
      { key: 'specific_detail', label: 'Specific Detail', type: 'text' },
      { key: 'impact', label: 'Impact Statement', type: 'text' },
      { key: 'future_action', label: 'Future Action', type: 'text' }
    ],
    duration: 45,
    is_public: true
  }
];
