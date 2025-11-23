import { GoogleGenAI } from '@google/genai';
import { CampaignRecipient } from './campaignService';

export interface PersonalizationAsset {
  type: 'intro' | 'overlay' | 'cta' | 'broll' | 'caption' | 'background';
  url?: string;
  data: Record<string, any>;
  prompt?: string;
  generationTime: number;
}

export interface PersonalizedContent {
  introText: string;
  overlayText: string;
  ctaText: string;
  emailSubject: string;
  emailBody: string;
  assets: PersonalizationAsset[];
}

const TIER_CONFIGS = {
  basic: {
    cost: 0.02,
    processingTime: 15000,
    features: ['text_overlays', 'thumbnails', 'email_subject'],
  },
  smart: {
    cost: 0.05,
    processingTime: 45000,
    features: ['text_overlays', 'thumbnails', 'email_subject', 'industry_visuals', 'role_messaging', 'company_research'],
  },
  advanced: {
    cost: 0.15,
    processingTime: 120000,
    features: ['text_overlays', 'thumbnails', 'email_subject', 'industry_visuals', 'role_messaging', 'company_research', 'dynamic_backgrounds', 'deep_research', 'multi_language'],
  },
};

export class PersonalizationEngine {
  private genAI: GoogleGenAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
  }

  async generateBasicPersonalization(
    recipient: CampaignRecipient,
    scriptTemplate: string
  ): Promise<PersonalizedContent> {
    const startTime = Date.now();

    const name = recipient.recipient_name || 'there';
    const company = recipient.company || 'your company';

    const personalizedScript = this.replaceVariables(scriptTemplate, {
      NAME: name,
      COMPANY: company,
      EMAIL: recipient.recipient_email,
      ...recipient.custom_fields,
    });

    const introText = `Hi ${name}!`;
    const overlayText = `${name} @ ${company}`;
    const ctaText = `Schedule a Call with ${company}`;
    const emailSubject = `Personal Video for ${name} at ${company}`;
    const emailBody = `Hi ${name},\n\nI recorded a personal video just for you and ${company}. I think you'll find it valuable.\n\nWatch here: [VIDEO_LINK]\n\nBest regards`;

    const assets: PersonalizationAsset[] = [
      {
        type: 'intro',
        data: { text: introText, color: '#FFFFFF', fontSize: 48 },
        generationTime: Date.now() - startTime,
      },
      {
        type: 'overlay',
        data: { text: overlayText, position: 'bottom', color: '#000000', backgroundColor: 'rgba(255, 255, 255, 0.9)' },
        generationTime: Date.now() - startTime,
      },
      {
        type: 'cta',
        data: { text: ctaText, style: 'button', color: '#3B82F6' },
        generationTime: Date.now() - startTime,
      },
    ];

    return {
      introText,
      overlayText,
      ctaText,
      emailSubject,
      emailBody,
      assets,
    };
  }

  async generateSmartPersonalization(
    recipient: CampaignRecipient,
    scriptTemplate: string,
    visualStyle: string
  ): Promise<PersonalizedContent> {
    const basicContent = await this.generateBasicPersonalization(recipient, scriptTemplate);
    const startTime = Date.now();

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const industryPrompt = `Generate a professional visual description for the ${recipient.industry || 'business'} industry.
      Format: Brief, descriptive phrase for an image generator. Max 50 words.`;

      const industryResult = await model.generateContent(industryPrompt);
      const industryVisualDesc = industryResult.response.text().trim();

      const rolePrompt = `Write a compelling value proposition for a ${recipient.role || 'professional'} at ${recipient.company || 'the company'}.
      Focus on their specific challenges and how our solution helps. Max 100 words.`;

      const roleResult = await model.generateContent(rolePrompt);
      const roleMessage = roleResult.response.text().trim();

      const companyPrompt = `Based on the company name "${recipient.company || 'this company'}" and industry "${recipient.industry || 'business'}",
      write a personalized opening line that shows research. Max 50 words.`;

      const companyResult = await model.generateContent(companyPrompt);
      const companyInsight = companyResult.response.text().trim();

      const enhancedIntro = `${basicContent.introText} ${companyInsight}`;
      const enhancedOverlay = `${recipient.recipient_name} | ${recipient.role || 'Professional'} | ${recipient.company || 'Company'}`;

      const smartAssets: PersonalizationAsset[] = [
        ...basicContent.assets,
        {
          type: 'broll',
          data: { description: industryVisualDesc, style: visualStyle },
          prompt: industryVisualDesc,
          generationTime: Date.now() - startTime,
        },
        {
          type: 'caption',
          data: { text: roleMessage, timing: 5, duration: 10 },
          generationTime: Date.now() - startTime,
        },
      ];

      return {
        ...basicContent,
        introText: enhancedIntro,
        overlayText: enhancedOverlay,
        emailBody: `Hi ${recipient.recipient_name},\n\n${roleMessage}\n\nI recorded a personal video showing exactly how this works for ${recipient.company}.\n\nWatch here: [VIDEO_LINK]\n\nBest regards`,
        assets: smartAssets,
      };
    } catch (error) {
      console.error('Smart personalization error:', error);
      return basicContent;
    }
  }

  async generateAdvancedPersonalization(
    recipient: CampaignRecipient,
    scriptTemplate: string,
    visualStyle: string
  ): Promise<PersonalizedContent> {
    const smartContent = await this.generateSmartPersonalization(recipient, scriptTemplate, visualStyle);
    const startTime = Date.now();

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const deepResearchPrompt = `Analyze ${recipient.company || 'this company'} in the ${recipient.industry || 'business'} industry.
      Provide:
      1. Key business challenges they likely face
      2. Recent industry trends affecting them
      3. Competitive advantages our solution offers
      Max 150 words. Format as JSON with keys: challenges, trends, advantages`;

      const researchResult = await model.generateContent(deepResearchPrompt);
      let researchData;
      try {
        researchData = JSON.parse(researchResult.response.text());
      } catch {
        researchData = {
          challenges: recipient.pain_point || 'operational efficiency',
          trends: 'digital transformation',
          advantages: 'streamlined workflows',
        };
      }

      const backgroundPrompt = `Create a cinematic ${visualStyle.toLowerCase()} background scene showing ${recipient.company || 'a modern company'}
      in the ${recipient.industry || 'business'} industry. Include subtle branding elements. Professional, dynamic, engaging.`;

      const ctaPrompt = `Write 3 different call-to-action options for a ${recipient.role || 'decision maker'} at ${recipient.company || 'a company'}.
      Make them specific, urgent, and valuable. Format as JSON array of strings.`;

      const ctaResult = await model.generateContent(ctaPrompt);
      let ctaOptions = [smartContent.ctaText];
      try {
        ctaOptions = JSON.parse(ctaResult.response.text());
      } catch {
        ctaOptions = [
          `See How ${recipient.company} Can Benefit`,
          `Book Your Personal Demo, ${recipient.recipient_name}`,
          `Unlock ${recipient.company}'s Potential`,
        ];
      }

      const advancedAssets: PersonalizationAsset[] = [
        ...smartContent.assets,
        {
          type: 'background',
          data: { description: backgroundPrompt, style: visualStyle, veoModel: 'veo-2' },
          prompt: backgroundPrompt,
          generationTime: Date.now() - startTime,
        },
        {
          type: 'overlay',
          data: {
            research: researchData,
            ctaOptions,
            companyLogo: recipient.company,
          },
          generationTime: Date.now() - startTime,
        },
      ];

      const advancedEmailBody = `Hi ${recipient.recipient_name},\n\n${researchData.challenges}\n\nI've prepared a personalized video specifically for ${recipient.company} that addresses these challenges.\n\nWatch here: [VIDEO_LINK]\n\nKey benefits for ${recipient.company}:\n- ${researchData.advantages}\n\nLooking forward to connecting,\n[Your Name]`;

      return {
        ...smartContent,
        emailBody: advancedEmailBody,
        ctaText: ctaOptions[0],
        assets: advancedAssets,
      };
    } catch (error) {
      console.error('Advanced personalization error:', error);
      return smartContent;
    }
  }

  async personalizeForRecipient(
    recipient: CampaignRecipient,
    tier: 'basic' | 'smart' | 'advanced',
    scriptTemplate: string,
    visualStyle: string
  ): Promise<PersonalizedContent> {
    switch (tier) {
      case 'basic':
        return this.generateBasicPersonalization(recipient, scriptTemplate);
      case 'smart':
        return this.generateSmartPersonalization(recipient, scriptTemplate, visualStyle);
      case 'advanced':
        return this.generateAdvancedPersonalization(recipient, scriptTemplate, visualStyle);
      default:
        return this.generateBasicPersonalization(recipient, scriptTemplate);
    }
  }

  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\[${key}\\]`, 'gi');
      result = result.replace(regex, value || '');
    });
    return result;
  }

  extractVariables(template: string): string[] {
    const regex = /\[([A-Z_]+)\]/g;
    const matches = template.match(regex);
    if (!matches) return [];
    return [...new Set(matches.map(m => m.slice(1, -1)))];
  }

  getEstimatedProcessingTime(tier: 'basic' | 'smart' | 'advanced'): number {
    return TIER_CONFIGS[tier].processingTime;
  }

  getTierCost(tier: 'basic' | 'smart' | 'advanced'): number {
    return TIER_CONFIGS[tier].cost;
  }

  getTierFeatures(tier: 'basic' | 'smart' | 'advanced'): string[] {
    return TIER_CONFIGS[tier].features;
  }
}

export const createPersonalizationEngine = (apiKey: string): PersonalizationEngine => {
  return new PersonalizationEngine(apiKey);
};
