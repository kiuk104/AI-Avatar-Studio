import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const OUT_DIR = path.resolve("public/thumbnails");

// Category-specific prompts for consistent, distinguishable thumbnails
const CATEGORIES: Record<string, { prompt: string; options: string[] }> = {
  eyebrows: {
    prompt: `A close-up 3D Pixar-style render showing ONLY the upper portion of a face (forehead and eyes area) on a solid white background.
Gender-neutral, smooth skin, soft studio lighting, front-facing.
Focus clearly on the eyebrow shape and thickness. The eyebrows should be the most prominent visible feature.
Clean professional 3D render, Apple Memoji aesthetic.`,
    options: ["Natural", "Thin", "Thick", "Arched", "Straight", "Bushy"],
  },
  face: {
    prompt: `A 3D Pixar-style character head on a solid white background.
Gender-neutral young adult, smooth skin, soft studio lighting, centered front-facing view.
No hair (bald), friendly neutral expression. Focus on clearly showing the face SHAPE.
Clean professional 3D render, Apple Memoji aesthetic.`,
    options: ["Oval", "Round", "Square", "Heart", "Diamond", "Long"],
  },
  nose: {
    prompt: `A close-up 3D Pixar-style render showing ONLY the center of a face (nose area from between eyes to upper lip) on a solid white background.
Gender-neutral, smooth skin, soft studio lighting, front-facing.
Focus clearly on the nose shape and size. The nose should be the most prominent feature.
Clean professional 3D render, Apple Memoji aesthetic.`,
    options: ["Small", "Pointy", "Wide", "Button", "Hooked", "Flat"],
  },
  lips: {
    prompt: `A close-up 3D Pixar-style render showing ONLY the lower portion of a face (mouth and lips area) on a solid white background.
Gender-neutral, smooth skin, soft studio lighting, front-facing.
Focus clearly on the lip shape, fullness and proportions. The lips should be the most prominent feature.
Clean professional 3D render, Apple Memoji aesthetic.`,
    options: ["Natural", "Thin", "Full", "Wide", "Small", "Pouty"],
  },
  facialHair: {
    prompt: `A 3D Pixar-style character head on a solid white background.
Male adult face, smooth skin, soft studio lighting, centered front-facing, short buzz cut hair.
Focus on clearly showing the facial hair style. The facial hair should be the most prominent distinguishing feature.
Clean professional 3D render, Apple Memoji aesthetic.`,
    options: ["None", "Stubble", "Goatee", "Full Beard", "Mustache", "Circle Beard"],
  },
  glasses: {
    prompt: `A 3D Pixar-style character head on a solid white background.
Gender-neutral young adult face, short hair, soft studio lighting, centered front-facing.
Focus on clearly showing the eyewear style. The glasses/eyewear should be the most prominent feature.
Clean professional 3D render, Apple Memoji aesthetic.`,
    options: ["None", "Rectangular", "Round", "Aviator", "Cat Eye", "Wayfarer"],
  },
  headwear: {
    prompt: `A 3D Pixar-style character head on a solid white background.
Gender-neutral young adult face, soft studio lighting, centered front-facing.
Focus on clearly showing the headwear/hat. The headwear should be the most prominent feature.
Clean professional 3D render, Apple Memoji aesthetic.`,
    options: ["None", "Beanie", "Baseball Cap", "Beret", "Fedora", "Headband", "Turban"],
  },
  outfit: {
    prompt: `A 3D Pixar-style character upper body (head and shoulders/chest) on a solid white background.
Gender-neutral young adult, short hair, soft studio lighting, centered front-facing.
Focus on clearly showing the clothing/outfit style. The outfit should be the most prominent feature.
Clean professional 3D render, Apple Memoji aesthetic.`,
    options: ["T-Shirt", "Hoodie", "Suit", "Dress", "Sweater", "Jacket", "Tank Top"],
  },
};

function toFilename(category: string, option: string): string {
  return `${category}-${option.toLowerCase().replace(/\s+/g, "-")}.png`;
}

async function generateThumbnail(
  category: string,
  option: string,
  basePrompt: string
): Promise<void> {
  const filename = toFilename(category, option);
  const outPath = path.join(OUT_DIR, filename);

  if (fs.existsSync(outPath)) {
    console.log(`  [SKIP] ${filename}`);
    return;
  }

  // Build option-specific prompt detail
  let detail = "";
  switch (category) {
    case "eyebrows":
      detail = `Eyebrow style: "${option}" eyebrows.`;
      break;
    case "face":
      detail = `Face shape: "${option}" face shape. Make the shape clearly distinguishable.`;
      break;
    case "nose":
      detail = `Nose type: "${option}" nose.`;
      break;
    case "lips":
      detail = `Lip style: "${option}" lips.`;
      break;
    case "facialHair":
      if (option === "None") {
        detail = "Clean-shaven face, no facial hair at all.";
      } else {
        detail = `Facial hair style: "${option}".`;
      }
      break;
    case "glasses":
      if (option === "None") {
        detail = "No glasses or eyewear. Plain face.";
      } else {
        detail = `Eyewear style: "${option}" glasses.`;
      }
      break;
    case "headwear":
      if (option === "None") {
        detail = "No hat or headwear. Bare head with short hair.";
      } else {
        detail = `Headwear: wearing a "${option}".`;
      }
      break;
    case "outfit":
      detail = `Outfit: wearing a "${option}".`;
      break;
  }

  const prompt = `${basePrompt}\n${detail}`;

  console.log(`  [GEN]  ${filename} ...`);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: { aspectRatio: "1:1" },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data!, "base64");
      fs.writeFileSync(outPath, buffer);
      console.log(`  [OK]   ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
      return;
    }
  }

  console.error(`  [FAIL] ${filename}: no image data`);
}

async function main() {
  const totalOptions = Object.values(CATEGORIES).reduce(
    (sum, c) => sum + c.options.length,
    0
  );
  console.log(
    `\nGenerating thumbnails for ${Object.keys(CATEGORIES).length} categories (${totalOptions} total)...\n`
  );
  console.log(`Output: ${OUT_DIR}\n`);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let generated = 0;
  let failed = 0;

  for (const [category, { prompt, options }] of Object.entries(CATEGORIES)) {
    console.log(`\n=== ${category.toUpperCase()} (${options.length} options) ===`);

    for (const option of options) {
      try {
        await generateThumbnail(category, option, prompt);
        generated++;
      } catch (err: any) {
        console.error(`  [ERR]  ${category}/${option}: ${err.message}`);
        failed++;

        if (
          err.message?.includes("429") ||
          err.message?.includes("rate") ||
          err.message?.includes("RESOURCE_EXHAUSTED")
        ) {
          console.log("  ... waiting 15s for rate limit ...");
          await new Promise((r) => setTimeout(r, 15000));
          try {
            await generateThumbnail(category, option, prompt);
            generated++;
            failed--;
          } catch (retryErr: any) {
            console.error(`  [ERR]  retry failed: ${retryErr.message}`);
          }
        }
      }
    }
  }

  console.log(`\n\nDone: ${generated} generated, ${failed} failed out of ${totalOptions} total.`);

  // List any missing
  const missing: string[] = [];
  for (const [cat, { options }] of Object.entries(CATEGORIES)) {
    for (const opt of options) {
      if (!fs.existsSync(path.join(OUT_DIR, toFilename(cat, opt)))) {
        missing.push(`${cat}/${opt}`);
      }
    }
  }
  if (missing.length > 0) {
    console.log("Missing:", missing.join(", "));
  }
}

main();
