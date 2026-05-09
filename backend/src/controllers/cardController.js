import fs from "fs";

function loadJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf-8"));
}

export function getCards(req, res, next) {
  try {
    const styleData = loadJson("./src/prompts/style_cards.json");
    const emotionData = loadJson("./src/prompts/emotion_cards.json");
    const textureData = loadJson("./src/prompts/texture_cards.json");
    const specialEffectData = loadJson("./src/prompts/special_effect_cards.json");

    res.json({
      style_cards: styleData.style_cards,
      emotion_cards: emotionData.emotion_cards,
      texture_cards: textureData.texture_cards,
      special_effect_cards: specialEffectData.special_effect_cards
    });
  } catch (error) {
    next(error);
  }
}