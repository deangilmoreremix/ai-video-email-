# Veo Models Guide

## Overview
The application now supports **all 4 Veo models** from Google, each optimized for different use cases.

---

## Available Models

### 1. Veo 2 (veo-2)
**Best for: Final production quality**

#### Characteristics:
- Highest photorealistic quality
- Most detailed and realistic outputs
- Superior lighting and physics simulation
- Best motion consistency

#### Use Cases:
- Final marketing videos
- Professional presentations
- Client deliverables
- High-budget productions

#### Trade-offs:
- Longer generation time (baseline)
- Higher computational cost

---

### 2. Veo 2 Flash (veo-2-flash)
**Best for: Rapid iteration**

#### Characteristics:
- **3x faster** than standard Veo 2
- Good quality output
- Quick turnaround time
- Efficient resource usage

#### Use Cases:
- Rapid prototyping
- Draft versions
- Testing concepts
- High-volume generation
- Preview content

#### Trade-offs:
- Slightly lower quality than Veo 2
- May have less fine detail

---

### 3. Veo 2 Gemini (veo-2-gemini)
**Best for: Complex prompts**

#### Characteristics:
- Optimized for text understanding
- Better at complex scene descriptions
- Enhanced narrative comprehension
- Balanced quality and speed

#### Use Cases:
- Story-driven content
- Complex multi-element scenes
- Detailed scenario descriptions
- Educational content
- Explainer videos

#### Trade-offs:
- Moderate generation time
- May prioritize prompt accuracy over photorealism

---

### 4. Veo 003 (veo-003)
**Best for: Cutting-edge features**

#### Characteristics:
- Latest experimental model
- Newest capabilities
- Potential beta features
- Early access to improvements

#### Use Cases:
- Experimental projects
- Testing new features
- Early adopter workflows
- Innovation projects

#### Trade-offs:
- May be less stable
- Documentation may be limited
- Features subject to change

---

## Model Comparison Matrix

| Feature | Veo 2 | Veo 2 Flash | Veo 2 Gemini | Veo 003 |
|---------|-------|-------------|--------------|---------|
| Quality | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Speed | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Prompt Understanding | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Photorealism | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Cost Efficiency | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Stability | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## Usage Examples

### Using in Code

```typescript
import { generateBRollWithVeo } from './services/advancedAIServices';

// Example 1: High quality for final production
const productionVideo = await generateBRollWithVeo({
    prompt: 'Professional office environment with modern design',
    duration: 15,
    style: 'cinematic',
    model: 'veo-2' // Highest quality
});

// Example 2: Fast iteration for testing
const draftVideo = await generateBRollWithVeo({
    prompt: 'Professional office environment with modern design',
    duration: 15,
    style: 'cinematic',
    model: 'veo-2-flash' // 3x faster
});

// Example 3: Complex narrative scene
const narrativeVideo = await generateBRollWithVeo({
    prompt: 'A startup founder presents to investors in a glass-walled conference room at sunset, with city skyline visible, natural lighting, confident body language',
    duration: 20,
    style: 'professional',
    model: 'veo-2-gemini' // Best prompt understanding
});

// Example 4: Experimental features
const experimentalVideo = await generateBRollWithVeo({
    prompt: 'Futuristic holographic interface demonstration',
    duration: 10,
    style: 'modern-tech',
    model: 'veo-003' // Latest features
});
```

### Using in UI

The Advanced AI Panel provides a dropdown to select any model:

1. Click the **🎬 B-Roll** button
2. Select your preferred model from the dropdown:
   - **Veo 2** (Highest Quality)
   - **Veo 2 Flash** (Faster)
   - **Veo 2 Gemini** (Balanced)
   - **Veo 003** (Latest)
3. Enter your prompt and settings
4. Click **Generate B-Roll**

---

## Workflow Recommendations

### Production Workflow
```
1. Draft → Veo 2 Flash (quick preview)
2. Review → Make adjustments
3. Final → Veo 2 (production quality)
```

### Iteration Workflow
```
1. Multiple concepts → Veo 2 Flash (test 5-10 variations)
2. Select best → Regenerate with Veo 2
3. Polish → Final production
```

### Complex Content Workflow
```
1. Complex prompt → Veo 2 Gemini (better understanding)
2. Refine prompt based on output
3. Final version → Veo 2 or Veo 2 Gemini
```

### Experimental Workflow
```
1. New feature testing → Veo 003
2. If stable → Switch to Veo 2 for consistency
3. Production → Veo 2 or Veo 2 Flash
```

---

## Database Storage

All generated videos are tracked in the database with the model used:

```sql
SELECT
  veo_model,
  COUNT(*) as count,
  AVG(duration) as avg_duration
FROM veo_generated_backgrounds
GROUP BY veo_model;
```

This allows you to:
- Track which models you use most
- Compare generation success rates
- Optimize costs
- Analyze quality vs speed trade-offs

---

## Cost Optimization Tips

1. **Use Flash for drafts**: Save 60-70% on generation costs
2. **Batch similar prompts**: Generate multiple variations with Flash first
3. **Reserve Veo 2 for finals**: Only use highest quality when needed
4. **Test with Gemini**: For complex prompts, Gemini may get it right first try
5. **Monitor usage**: Check database to see model distribution

---

## Technical Details

### API Configuration
All models use the same API structure:

```typescript
const response = await ai.models.generateContent({
  model: 'veo-2-flash', // Change model here
  contents: [{
    parts: [{ text: prompt }]
  }],
  config: {
    videoGeneration: {
      duration: 10,
      aspectRatio: '16:9'
    }
  }
});
```

### Database Schema
The `veo_generated_backgrounds` table includes:
- `veo_model` (text) - Which model was used
- Constraint: Must be one of the 4 supported models
- Index on `veo_model` for fast filtering

---

## FAQ

### Q: Can I switch models for the same prompt?
**A:** Yes! You can regenerate with a different model to compare quality vs speed.

### Q: Which model should I use for most projects?
**A:** Start with **Veo 2 Flash** for speed, upgrade to **Veo 2** for finals.

### Q: Is Veo 003 production-ready?
**A:** It's experimental. Test thoroughly before using in production.

### Q: Can I mix models in one project?
**A:** Absolutely! Use Flash for B-roll, Veo 2 for hero shots, Gemini for complex scenes.

### Q: How much faster is Flash really?
**A:** Approximately **3x faster** than standard Veo 2 in practice.

---

## Model Selection Flowchart

```
Need video generation?
│
├─ Final production quality needed? → Veo 2
│
├─ Quick iteration/preview? → Veo 2 Flash
│
├─ Complex narrative prompt? → Veo 2 Gemini
│
└─ Testing new features? → Veo 003
```

---

## Updates and Changes

- **Current**: All 4 models supported (veo-2, veo-2-flash, veo-2-gemini, veo-003)
- **Database**: Model selection stored with each generation
- **UI**: Dropdown selector with descriptions
- **Default**: veo-2 (can be changed per generation)

---

Built to give solopreneurs maximum flexibility in video generation! 🚀
