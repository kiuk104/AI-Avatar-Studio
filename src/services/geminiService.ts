import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateAvatar = async (prompt: string, style: string = "", referenceImage?: string) => {
  const fullPrompt = style 
    ? `A high-quality profile avatar based on the provided reference image (if any) and the description: ${prompt}, in ${style} style. Centered, clean background, professional lighting.`
    : `A high-quality profile avatar based on the provided reference image (if any) and the description: ${prompt}. Centered, clean background, professional lighting.`;

  try {
    const parts: any[] = [{ text: fullPrompt }];
    
    if (referenceImage) {
      // Extract base64 data and mime type
      const match = referenceImage.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    throw new Error("No image data received from Gemini");
  } catch (error) {
    console.error("Error generating avatar:", error);
    throw error;
  }
};
