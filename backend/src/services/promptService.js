import fs from "fs";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";

import {
  BadRequestException,
  InvalidException,
  InternalServerErrorException,
  AIProviderException
} from "../utils/exceptions.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const SD_API_URL =
  process.env.SD_API_URL || "http://localhost:8000/generate-image";

let styleData;
let emotionData;
let textureData;
let specialEffectData;

try {
  styleData = JSON.parse(
    fs.readFileSync("./prompts/style_cards.json", "utf-8")
  );

  emotionData = JSON.parse(
    fs.readFileSync("./prompts/emotion_cards.json", "utf-8")
  );

  textureData = JSON.parse(
    fs.readFileSync("./prompts/texture_cards.json", "utf-8")
  );

  specialEffectData = JSON.parse(
    fs.readFileSync("./prompts/special_effect_cards.json", "utf-8")
  );
} catch {
  throw new InternalServerErrorException("Failed to load prompt JSON files");
}

function pickRandom(list) {
  if (!Array.isArray(list) || list.length === 0) return null;

  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

function getCardPrompt(categoryData, groupName, cardId) {
  if (!cardId) return null;

  const groups = categoryData?.[groupName];

  if (!groups) {
    throw new InvalidException(`Group "${groupName}" not found`);
  }

  for (const subgroup of Object.values(groups)) {
    if (subgroup?.[cardId]) {
      const card = subgroup[cardId];

      return {
        ...card,
        prompt_hint: pickRandom(card.prompt_hints),
        negative_prompt_hint: pickRandom(card.negative_prompt_hints)
      };
    }
  }

  throw new InvalidException(`Invalid card id: ${cardId}`);
}

function weightedPrompt(text, weight) {
  if (!text) return null;
  return `(${text}:${weight})`;
}

function validateImageSize(width, height) {
  const allowedSizes = [
    "256x256",
    "384x384",
    "512x512",
    "512x768",
    "768x512"
  ];

  const size = `${width}x${height}`;

  if (!allowedSizes.includes(size)) {
    throw new BadRequestException(
      "Invalid image size. Allowed: 256x256, 384x384, 512x512, 512x768, 768x512"
    );
  }
}

export async function buildPrompt(body) {
  const {
    emotion_card,
    style_card,
    texture_card,
    special_effect_card,
    subject,
    language = "en",
    width = 512,
    height = 512
  } = body;

  if (!subject) {
    throw new BadRequestException("Subject is required");
  }

  validateImageSize(width, height);

  const emotion = getCardPrompt(
    emotionData,
    "emotion_cards",
    emotion_card
  );

  const style = getCardPrompt(
    styleData,
    "style_cards",
    style_card
  );

  const texture = getCardPrompt(
    textureData,
    "texture_cards",
    texture_card
  );

  const specialEffect = getCardPrompt(
    specialEffectData,
    "special_effect_cards",
    special_effect_card
  );

  const structuredPrompt = {
    subject,
    language: language || "en",
    selected_hints: [
      weightedPrompt(style?.prompt_hint, styleData.category_weight),
      weightedPrompt(emotion?.prompt_hint, emotionData.category_weight),
      weightedPrompt(texture?.prompt_hint, textureData.category_weight),
      weightedPrompt(
        specialEffect?.prompt_hint,
        specialEffectData.category_weight
      )
    ].filter(Boolean),
    negative_prompt: [
        style?.negative_prompt_hint,
        emotion?.negative_prompt_hint,
        texture?.negative_prompt_hint,
        specialEffect?.negative_prompt_hint
    ]
        .filter(Boolean)
        .join(", ")
    };
  const llmInstruction = `
You are an AI image prompt generator.

Create one high-quality English image prompt for Stable Diffusion.

Rules:
- Use the subject.
- Use the selected style, emotion, texture, and special effect hints.
- Do not mention card names.
- Do not add violent, sexual, or inappropriate content.
- Keep the prompt visual and concise.
- Return JSON only.

Input:
${JSON.stringify(structuredPrompt, null, 2)}

Return format:
{
  "prompt": "...",
  "negative_prompt": "..."
}
`;

  let response;

  try {
    response = await ai.models.generateContent({
      model: "gemma-4-31b-it",
      contents: llmInstruction,
      config: {
        temperature: 0.7
      }
    });
  } catch (error) {
    throw new AIProviderException(
      "gemma",
      503,
      "GemmaError",
      error.message || "Gemma API request failed"
    );
  }

  const resultText = response.text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(resultText);
  } catch {
    throw new AIProviderException(
      "gemma",
      500,
      "InvalidGemmaResponse",
      "Gemma returned invalid JSON"
    );
  }
}

export async function generateImageFromPrompt(
  prompt,
  negativePrompt,
  width = 512,
  height = 512
) {
  validateImageSize(width, height);

  try {
    const response = await axios.post(SD_API_URL, {
      prompt,
      negative_prompt: negativePrompt,
      width,
      height
    });

    return response.data.image_url;
  } catch (error) {
    throw new InternalServerErrorException(
      error.response?.data?.detail ||
        "Stable Diffusion image generation failed"
    );
  }
}