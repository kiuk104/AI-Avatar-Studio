import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const HAIR_STYLES = [
  "Bald",
  "Buzz Cut",
  "Crew Cut",
  "Short Wavy",
  "Side Part",
  "Slicked Back",
  "Undercut",
  "Mohawk",
  "Top Knot",
  "Man Bun",
  "Bob Cut",
  "Bangs",
  "Pixie Cut",
  "Long Straight",
  "Ponytail",
  "Braids",
  "Curly Afro",
  "Double Bun",
  "Cornrows",
  "Dreadlocks",
];

const BASE_PROMPT = `A single 3D Pixar-style character head thumbnail on a solid white background.
Gender-neutral young adult face, smooth skin, soft studio lighting, centered front-facing view.
The character has a friendly neutral expression with slightly rounded features.
Focus on clearly showing the hairstyle. No text, no accessories, no body.
Clean professional render, high quality, consistent with Apple Memoji 3D aesthetic.`;

const OUT_DIR = path.resolve("public/thumbnails");

function toFilename(style: string): string {
  return style.toLowerCase().replace(/\s+/g, "-") + ".png";
}

async function generateThumbnail(style: string): Promise<void> {
  const filename = toFilename(style);
  const outPath = path.join(OUT_DIR, filename);

  if (fs.existsSync(outPath)) {
    console.log(`  [SKIP] ${filename} already exists`);
    return;
  }

  const prompt = `${BASE_PROMPT}\nHairstyle: "${style}" hair.`;

  console.log(`  [GEN]  ${style} ...`);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
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

  console.error(`  [FAIL] ${style}: no image data returned`);
}

async function main() {
  console.log(`\nGenerating ${HAIR_STYLES.length} hairstyle thumbnails...\n`);
  console.log(`Output: ${OUT_DIR}\n`);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Generate sequentially to avoid rate limits
  for (const style of HAIR_STYLES) {
    try {
      await generateThumbnail(style);
    } catch (err: any) {
      console.error(`  [ERR]  ${style}: ${err.message}`);
      // Wait a bit on error (rate limit)
      if (err.message?.includes("429") || err.message?.includes("rate")) {
        console.log("  ... waiting 10s for rate limit ...");
        await new Promise((r) => setTimeout(r, 10000));
        // Retry once
        try {
          await generateThumbnail(style);
        } catch (retryErr: any) {
          console.error(`  [ERR]  ${style} retry failed: ${retryErr.message}`);
        }
      }
    }
  }

  // Check results
  const generated = HAIR_STYLES.filter((s) =>
    fs.existsSync(path.join(OUT_DIR, toFilename(s)))
  );
  console.log(`\nDone: ${generated.length}/${HAIR_STYLES.length} thumbnails generated.`);

  if (generated.length < HAIR_STYLES.length) {
    const missing = HAIR_STYLES.filter(
      (s) => !fs.existsSync(path.join(OUT_DIR, toFilename(s)))
    );
    console.log("Missing:", missing.join(", "));
  }
}

main();
