import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const OUT_DIR = path.resolve("public/thumbnails");

const EXTRA: { category: string; option: string; prompt: string }[] = [
  // Gender
  { category: "gender", option: "Male", prompt: "A 3D Pixar-style male character head on a solid white background. Young adult male with short hair, friendly neutral expression. Clean professional 3D render, Apple Memoji aesthetic." },
  { category: "gender", option: "Female", prompt: "A 3D Pixar-style female character head on a solid white background. Young adult female with medium-length hair, friendly neutral expression. Clean professional 3D render, Apple Memoji aesthetic." },
  { category: "gender", option: "Non-binary", prompt: "A 3D Pixar-style androgynous/non-binary character head on a solid white background. Young adult with gender-neutral features, friendly neutral expression. Clean professional 3D render, Apple Memoji aesthetic." },
  // Earrings
  { category: "earrings", option: "None", prompt: "A 3D Pixar-style character head on a solid white background. Gender-neutral face, no earrings, plain ears visible. Clean professional 3D render, Apple Memoji aesthetic." },
  { category: "earrings", option: "Stud", prompt: "A 3D Pixar-style character head on a solid white background. Gender-neutral face wearing small stud earrings. Ears visible. Clean professional 3D render, Apple Memoji aesthetic." },
  { category: "earrings", option: "Hoop", prompt: "A 3D Pixar-style character head on a solid white background. Gender-neutral face wearing hoop earrings. Ears visible. Clean professional 3D render, Apple Memoji aesthetic." },
  { category: "earrings", option: "Drop", prompt: "A 3D Pixar-style character head on a solid white background. Gender-neutral face wearing drop/dangle earrings. Ears visible. Clean professional 3D render, Apple Memoji aesthetic." },
  // Necklace
  { category: "necklace", option: "None", prompt: "A 3D Pixar-style character head and neck on a solid white background. Gender-neutral face, no necklace, plain neck visible. Clean professional 3D render, Apple Memoji aesthetic." },
  { category: "necklace", option: "Chain", prompt: "A 3D Pixar-style character head and neck on a solid white background. Gender-neutral face wearing a simple chain necklace. Clean professional 3D render, Apple Memoji aesthetic." },
  { category: "necklace", option: "Pendant", prompt: "A 3D Pixar-style character head and neck on a solid white background. Gender-neutral face wearing a pendant necklace. Clean professional 3D render, Apple Memoji aesthetic." },
  { category: "necklace", option: "Choker", prompt: "A 3D Pixar-style character head and neck on a solid white background. Gender-neutral face wearing a choker necklace. Clean professional 3D render, Apple Memoji aesthetic." },
  // Extra outfit
  { category: "outfit", option: "Turtleneck", prompt: "A 3D Pixar-style character upper body (head and shoulders/chest) on a solid white background. Gender-neutral young adult, short hair, wearing a turtleneck sweater. Clean professional 3D render, Apple Memoji aesthetic." },
  { category: "outfit", option: "Polo Shirt", prompt: "A 3D Pixar-style character upper body (head and shoulders/chest) on a solid white background. Gender-neutral young adult, short hair, wearing a polo shirt. Clean professional 3D render, Apple Memoji aesthetic." },
];

function toFilename(category: string, option: string): string {
  return `${category}-${option.toLowerCase().replace(/\s+/g, "-")}.png`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Generating ${EXTRA.length} extra thumbnails...\n`);

  for (const { category, option, prompt } of EXTRA) {
    const filename = toFilename(category, option);
    const outPath = path.join(OUT_DIR, filename);

    if (fs.existsSync(outPath)) {
      console.log(`  [SKIP] ${filename}`);
      continue;
    }

    console.log(`  [GEN]  ${filename} ...`);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const buffer = Buffer.from(part.inlineData.data!, "base64");
          fs.writeFileSync(outPath, buffer);
          console.log(`  [OK]   ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
          break;
        }
      }
    } catch (err: any) {
      console.error(`  [ERR]  ${filename}: ${err.message}`);
      if (err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED")) {
        console.log("  ... waiting 15s ...");
        await new Promise((r) => setTimeout(r, 15000));
        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "1:1" } },
          });
          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              const buffer = Buffer.from(part.inlineData.data!, "base64");
              fs.writeFileSync(outPath, buffer);
              console.log(`  [OK]   ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
              break;
            }
          }
        } catch (retryErr: any) {
          console.error(`  [ERR]  retry: ${retryErr.message}`);
        }
      }
    }
  }

  console.log("\nDone!");
}

main();
