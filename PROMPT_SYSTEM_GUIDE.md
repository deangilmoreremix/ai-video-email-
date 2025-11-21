# Enhanced Prompt System Guide

## Overview

The new Smart Prompt system transforms simple ideas into professional video scripts using AI-powered prompt improvement, intelligent suggestions, and a comprehensive prompt library.

## Key Features

### 1. Smart Prompt Builder

**Location:** Script Editor > Smart Prompt tab

The Smart Prompt Builder helps you create high-quality prompts that generate better scripts:

- **Simple Mode**: Quick prompt entry with instant quality feedback
- **Advanced Mode**: Detailed context fields for precise control
  - Target Audience
  - Video Purpose
  - Tone/Style
  - Key Message
  - Target Video Length

**Quality Analysis:**
- Real-time prompt quality scoring (0-100)
- Clarity, Specificity, and Completeness metrics
- Automatic issue detection and suggestions

### 2. AI Prompt Improvement

Click "Improve Prompt" to transform your rough idea into a detailed, effective prompt.

**The AI Improver:**
- Adds structure (hook, body, call-to-action)
- Specifies tone and style
- Includes target audience details
- Adds emotional appeal elements
- Makes prompts actionable and clear

**Before/After Comparison:**
See exactly what improvements were made and why, then choose to use the improved version or stick with your original.

### 3. Prompt Variations

Generate 3 different versions of your prompt, each with:
- Different tone (professional, friendly, urgent, casual)
- Different focus areas (features, benefits, emotions, results)
- Different storytelling approaches

Pick the variation that best fits your needs.

### 4. Quick Enhancers

One-click buttons to add specific elements to your prompt:
- **+ Call to Action**: Adds compelling CTAs
- **+ Urgency**: Adds time-sensitivity
- **+ Personalization**: Adds recipient-specific elements
- **+ Emotion**: Adds emotional appeal

### 5. Prompt Library

Access your prompt history and saved prompts:

**History Tab:**
- Recent prompts with quality scores
- Favorite prompts (⭐)
- Engagement scores when available
- One-click reuse or save

**My Prompts Tab:**
- Your saved prompt collection
- Organized by category and tags
- Usage statistics
- Quick search and filter

**Community Tab:**
- Public prompts shared by other users
- Top-performing prompts
- Learn from successful examples

**Examples Tab:**
- AI-generated example prompts by category
- Industry-specific templates
- Best practice demonstrations

### 6. Prompt Categories

Organized prompts by type:
- **Sales Pitch**: Introduce products/services
- **Product Demo**: Show features and benefits
- **Tutorial**: Teach step-by-step
- **Thank You**: Express gratitude
- **Update**: Share news/announcements
- **Welcome**: Onboard new users/customers
- **Testimonial**: Share success stories
- **Announcement**: Announce features/changes
- **Explainer**: Explain concepts/processes

## How to Use

### Basic Workflow

1. **Choose Your Approach:**
   - Smart Prompt: For best results with AI guidance
   - Quick Prompt: Fast, simple prompt entry
   - Template: Pre-built structured prompts

2. **Enter Your Idea:**
   - Type what you want your video to say
   - Add context in Advanced Mode (optional)

3. **Improve Your Prompt:**
   - Click "Improve Prompt" for AI enhancement
   - Review quality scores and suggestions
   - Use quick enhancers as needed

4. **Generate Script:**
   - Click "Use This Prompt"
   - AI generates your video script
   - Script is automatically saved to history

5. **Refine & Reuse:**
   - Save successful prompts to your library
   - Mark favorites for quick access
   - Build your personal prompt collection

### Advanced Tips

**For Better Quality Scores:**
- Be specific about your audience
- Include your key message or goal
- Specify desired tone and length
- Add a clear call-to-action

**For Consistent Results:**
- Save successful prompts with descriptive titles
- Tag prompts by project or campaign
- Review prompt history to identify patterns
- Use variations to test different approaches

**For Team Collaboration:**
- Mark best-performing prompts as public
- Share prompt library across team members
- Build category-specific collections
- Track usage statistics

## Database Structure

### Prompt History Table
Automatically tracks all prompts you use:
- Original and improved versions
- Generated scripts
- Quality and engagement scores
- Favorites and usage counts

### Saved Prompts Table
Your curated prompt library:
- Custom titles and descriptions
- Categories and tags
- Public/private sharing
- Usage statistics

## API Integration

All prompt features use Gemini AI:
- **gemini-2.5-pro**: Complex improvements and analysis
- **gemini-2.5-flash**: Quick suggestions and variations

API key configured in `.env`:
```
VITE_GEMINI_API_KEY=your_key_here
```

## Best Practices

### Writing Effective Prompts

1. **Start with the Goal:** What action do you want viewers to take?
2. **Know Your Audience:** Who are you speaking to?
3. **Set the Tone:** Professional, friendly, urgent?
4. **Include Key Points:** What must be communicated?
5. **Add Structure:** Hook, body, call-to-action

### Example Prompts

**Poor Prompt:**
"Tell them about our product"

**Good Prompt:**
"Create a professional 60-second pitch for small business owners explaining how our project management software saves 10 hours per week. Start with a relatable problem, highlight our 3 key features, and end with a free trial offer."

**Improved by AI:**
"Craft an engaging 60-second video pitch targeting small business owners (2-50 employees) who struggle with project chaos. Open with: 'Still managing projects with endless email threads?' Introduce our project management platform as the solution. Highlight three transformative features: 1) Visual task boards that eliminate confusion, 2) Automated deadline reminders that prevent missed deliverables, 3) Team collaboration tools that replace scattered communication. Include a specific success metric: clients save an average of 10 hours per week. Close with urgency: 'Start your 14-day free trial today—no credit card required.' Maintain a professional yet approachable tone, speaking directly to the viewer's pain points while demonstrating empathy and understanding."

## Keyboard Shortcuts

- `Enter` in search: Execute search
- Click prompt: Quick preview
- Double-click prompt: Use immediately

## Troubleshooting

**Prompt improvement fails:**
- Check your Gemini API key
- Verify API quota is not exceeded
- Ensure prompt is at least 10 characters

**Low quality scores:**
- Add more specific details
- Include target audience
- Specify desired outcome
- Add emotional or urgency elements

**Library not loading:**
- Check authentication status
- Verify database connection
- Review browser console for errors

## Future Enhancements

Planned features:
- Voice-to-text prompt input
- Collaborative prompt editing
- A/B testing for prompts
- Industry-specific prompt packs
- Automated engagement tracking
- Prompt performance analytics
