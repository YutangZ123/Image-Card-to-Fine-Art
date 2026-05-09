import fs from "fs";
import path from "path";

const basePath = path.resolve("src/prompts");

function loadJson(fileName) {
  const filePath = path.join(basePath, `${fileName}.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function getCardPrompt(groupName, cardId) {
  if (!cardId) return null;

  const data = loadJson(groupName);
  const card = data[groupName]?.[cardId];

  if (!card) {
    throw new Error(`Card not found: ${cardId}`);
  }

  return card.prompt;
}