import { GoogleGenAI, Type } from "@google/genai";
import { Slide, SlideLayout, DetailLevel, IllustrationStyle } from "../types";

// Helper to ensure JSON is extracted correctly if wrapped in code blocks
const cleanJsonOutput = (text: string): string => {
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\n/, '').replace(/\n```$/, '');
  }
  return clean;
};

export const generateSlidesFromContent = async (content: string, detailLevel: DetailLevel = 'standard'): Promise<Slide[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set process.env.API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let quantityInstruction = "";
  let depthInstruction = "";

  switch(detailLevel) {
      case 'brief': 
        quantityInstruction = "Create a succinct executive summary (approx 5-8 slides)."; 
        depthInstruction = "Focus ONLY on the big picture. Merge related concepts into single slides. Keep text extremely minimal.";
        break;
      case 'detailed': 
        quantityInstruction = "Create a comprehensive training deck (approx 15-20+ slides)."; 
        depthInstruction = "Break down complex topics into multiple granular slides. Do not crowd slides. If a list has more than 4 items, split it across two slides. Include specific examples.";
        break;
      case 'standard': 
      default: 
        quantityInstruction = "Create a standard workshop deck (approx 10-12 slides)."; 
        depthInstruction = "Balance detail with clarity. One concept per slide.";
        break;
  }

  const systemInstruction = `
    You are a world-class Presentation Designer for Metodic.io.
    Your goal is to convert raw text into a visually balanced, professional slide deck.
    
    CONFIGURATION:
    ${quantityInstruction}
    ${depthInstruction}
    
    CRITICAL DESIGN RULES:
    1. **Brevity is King:** Slides should never have walls of text. Max 5 bullet points per slide. Max 10 words per bullet.
    2. **Visual Thinking:** Every slide needs a visual concept. 
       - For abstract concepts (Growth, Strategy), suggest an 'icon'.
       - For concrete scenarios (Team meeting, User testing), suggest an 'illustration' or 'image'.
       - Provide a 'prompt' describing the visual and a valid 'iconName' from the Lucide library (e.g., 'users', 'trending-up', 'target').
       - Use 'BIG_NUMBER' layout for key statistics.
       - Use 'QUOTE' layout for impactful statements.
       - Use 'THREE_COLUMN' for lists of 3 items.
    3. **Layout Selection:**
       - Use 'TWO_COLUMN' for comparisons, pros/cons, or "Problem -> Solution" structures. Also use it when you have a strong visual concept (Text Left, Image Right).
       - Use 'SECTION_HEADER' to visually break up major chapters.
       - Use 'AGENDA' immediately after the Title.
    4. **Formatting:** 
       - Do not start bullet points with "Slide 1:" or dashes. Just the text.
       - Titles should be punchy and short (under 6 words).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Convert this facilitator guide into a presentation:\n\n${content}`,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            layout: { type: Type.STRING, enum: Object.values(SlideLayout) },
            content: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Array of bullet points. Keep them short. Max 5 items."
            },
            visual: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['icon', 'image', 'illustration', 'none'] },
                prompt: { type: Type.STRING, description: "Description of the visual element." },
                iconName: { type: Type.STRING, description: "Kebab-case name of a relevant Lucide icon." }
              },
              required: ["type"]
            },
            speakerNotes: { type: Type.STRING, description: "Detailed script and instructions for the presenter." },
            duration: { type: Type.STRING, description: "Estimated time e.g. '5 min'" }
          },
          required: ["id", "title", "layout", "content"],
        }
      }
    }
  });

  const jsonStr = cleanJsonOutput(response.text || "[]");
  
  try {
    const slides = JSON.parse(jsonStr) as Slide[];
    return slides.map((s, i) => ({ ...s, id: `slide-${Date.now()}-${i}` }));
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Failed to generate valid slide structure.");
  }
};

export const generateImageForSlide = async (prompt: string, style: IllustrationStyle = 'flat'): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const stylePrompts: Record<IllustrationStyle, string> = {
        'minimalist': 'Minimalist, abstract vector art, clean lines, plenty of whitespace, subtle gradient backgrounds.',
        'flat': 'Flat vector art, corporate memphis style, vibrant colors, simple shapes, modern tech illustration.',
        '3d-render': 'High-end 3D render, claymorphism, soft studio lighting, cute 3d objects, isometric view, matte finish.',
        'watercolor': 'Digital watercolor illustration, artistic, soft edges, painterly texture, white background.',
        'photorealistic': 'High quality stock photography, cinematic lighting, shallow depth of field, professional corporate setting.',
        'line-art': 'Black and white line art, technical drawing, blueprint style, clean strokes, minimal.'
    };

    const styleInstruction = stylePrompts[style] || stylePrompts['flat'];

    // Common negative prompt to prevent text issues
    const negativePrompt = "text, letters, numbers, words, watermarks, logos, blurry, distorted, low quality, pixelated";

    const fullPrompt = `Create a professional illustration or image.
    
    Topic: ${prompt}.
    
    Artistic Style: ${styleInstruction}
    
    Composition: Center composed, balanced, suitable for presentation slide background or hero image.
    
    NEGATIVE PROMPT: ${negativePrompt}`;

    try {
        // Try Pro model first
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: fullPrompt }] },
            config: {
                imageConfig: { aspectRatio: "1:1", imageSize: "1K" },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
                ]
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    } catch (e) {
        console.warn("Pro image generation failed, falling back to Flash...", e);
        // Fallback to Flash Image
        try {
             const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: fullPrompt }] },
                config: {
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                    ]
                }
            });
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        } catch (innerE) {
            console.error("All image generation failed", innerE);
        }
    }
    
    throw new Error("No image data received from model.");
};

export const searchIcon = async (keyword: string): Promise<string> => {
    try {
        const searchRes = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(keyword)}&limit=1`);
        const searchData = await searchRes.json();
        
        if (searchData.icons && searchData.icons.length > 0) {
            const iconName = searchData.icons[0]; 
            const svgRes = await fetch(`https://api.iconify.design/${iconName}.svg?width=96&height=96`);
            const svgText = await svgRes.text();
            return svgText;
        }
        return "";
    } catch (e) {
        console.error("Icon search failed", e);
        return "";
    }
};