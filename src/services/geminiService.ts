import { GoogleGenAI } from "@google/genai";
import type { BuilderSettings } from "../utils/avatarDB";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export type GeminiUsage = {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
};

export type GenerateResult = {
  imageUrl: string;
  usage: GeminiUsage | null;
};

/** Shared Gemini image call — runs generateContent, extracts usage + the first image part. */
const callGemini = async (parts: any[]): Promise<GenerateResult> => {
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

  // Extract usage metadata
  const meta = response.usageMetadata as any;
  const usage: GeminiUsage | null = meta ? {
    promptTokenCount: meta.promptTokenCount ?? 0,
    candidatesTokenCount: meta.candidatesTokenCount ?? 0,
    totalTokenCount: meta.totalTokenCount ?? 0,
  } : null;

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const base64EncodeString = part.inlineData.data;
      return { imageUrl: `data:image/png;base64,${base64EncodeString}`, usage };
    }
  }
  throw new Error("No image data received from Gemini");
};

export const generateAvatar = async (prompt: string, style: string = "", referenceImage?: string): Promise<GenerateResult> => {
  const isBuilderSpec = prompt.includes('[CHARACTER SPEC');

  let fullPrompt: string;
  if (isBuilderSpec) {
    fullPrompt = style
      ? `${prompt}\n\nArt style to use (MANDATORY — this overrides any style mentioned in the spec): ${style}.`
      : prompt;
  } else {
    fullPrompt = style
      ? `A high-quality profile avatar based on the provided reference image (if any) and the description: ${prompt}, in ${style} style. Centered, clean background, professional lighting.`
      : `A high-quality profile avatar based on the provided reference image (if any) and the description: ${prompt}. Centered, clean background, professional lighting.`;
  }

  try {
    const parts: any[] = [{ text: fullPrompt }];

    if (referenceImage) {
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

    return await callGemini(parts);
  } catch (error) {
    console.error("Error generating avatar:", error);
    throw error;
  }
};

// Identity guardrail for delta edits. NOTE: intentionally does NOT mention art style —
// style is controlled solely by the trailing `Keep the "X" art style.` clause (attribute edits)
// or the style-change sentence inside `instruction` (style edits). Locking style here would
// conflict with style-change edits.
const PRESERVE =
  "Preserve the EXACT same character identity from the provided image: " +
  "same face, head shape, skin tone, hairstyle & color, eyes, expression, " +
  "pose and framing. It must look like the SAME person.";

/**
 * Delta edit — feeds the current avatar back as an inline reference and changes ONLY
 * what `instruction` describes, preserving identity. Used when a base avatar already exists.
 */
export const editAvatar = async (
  currentImage: string,
  instruction: string,
  style?: string,
): Promise<GenerateResult> => {
  const text =
    `Edit the provided avatar image. ${instruction} ${PRESERVE} ` +
    `Change ONLY what is explicitly requested; do not redraw or restyle anything else.` +
    (style ? ` Keep the "${style}" art style.` : "");

  try {
    const parts: any[] = [{ text }];
    const m = currentImage.match(/^data:(image\/\w+);base64,(.+)$/);
    if (m) {
      parts.push({ inlineData: { mimeType: m[1], data: m[2] } });
    }
    return await callGemini(parts);
  } catch (error) {
    console.error("Error editing avatar:", error);
    throw error;
  }
};

// Guardrail for emotion-sheet cells. Unlike PRESERVE this deliberately does NOT lock the
// expression — that's the one thing each cell changes. Identity/style/framing stay fixed.
const EXPRESSION_PRESERVE =
  "Keep the SAME character/person as the provided reference image — same identity, " +
  "hairstyle, hair color, skin tone, glasses, eyebrows and facial features EXACTLY the same. " +
  "Keep framing, scale, pose and lighting consistent.";

// ALWAYS applied: stop the model from inventing accessories (the common failure mode is
// adding glasses that aren't in the base) or dropping features (eyebrows fading on some
// expressions). Reference must be matched exactly.
const ACCESSORY_LOCK =
  "Do NOT add, remove, or change any accessories, headwear, facial hair, jewelry, hairstyle " +
  "or outfit — match the reference image's appearance EXACTLY. In particular, do NOT add " +
  "glasses or any item that is not clearly present in the reference. Always keep BOTH eyebrows " +
  "clearly visible with the same shape and color as the reference — never erase, hide or fade " +
  "them, even for closed-eye or subtle expressions. Only the facial expression may change.";

// For builder-origin bases we know the exact intended appearance, so lock the drift-prone
// attributes explicitly (None → assert absence; otherwise assert the chosen value).
function appearanceLockClause(s: BuilderSettings): string {
  const parts = [
    s.glasses === 'None' ? 'The person wears NO glasses.' : `Glasses: ${s.glasses} (keep exactly).`,
    s.headwear === 'None' ? 'No headwear or hat.' : `Headwear: ${s.headwear} (keep exactly).`,
    s.facialHair === 'None' ? 'No facial hair.' : `Facial hair: ${s.facialHair} (keep exactly).`,
    s.earrings === 'None' ? 'No earrings.' : `Earrings: ${s.earrings} (keep exactly).`,
    `Eyebrows: ${s.eyebrows} (both clearly visible, keep exactly).`,
    `Hair: ${s.hairColor} ${s.hair} (keep exactly).`,
  ];
  return parts.join(' ');
}

/**
 * Generate one emotion-sheet cell: the base avatar re-rendered with a different facial
 * expression, identity/style preserved. The base image is used as the inline reference for
 * every cell, which is what keeps the character consistent across the sheet.
 *
 * @param settings builder-origin base settings to hard-lock accessories/hair; pass null for
 *   text-origin bases (the always-on accessory guardrail still applies).
 */
export const generateExpressionCell = async (
  baseImage: string,
  expressionDesc: string,
  style?: string,
  settings?: BuilderSettings | null,
): Promise<GenerateResult> => {
  const lock = settings ? ` ${appearanceLockClause(settings)}` : "";
  const text =
    (style ? `${style}. ` : "") +
    `${EXPRESSION_PRESERVE} ${ACCESSORY_LOCK}${lock} Change ONLY the facial expression to: ${expressionDesc}.`;

  try {
    const parts: any[] = [{ text }];
    const m = baseImage.match(/^data:(image\/\w+);base64,(.+)$/);
    if (m) {
      parts.push({ inlineData: { mimeType: m[1], data: m[2] } });
    }
    return await callGemini(parts);
  } catch (error) {
    console.error("Error generating expression cell:", error);
    throw error;
  }
};
