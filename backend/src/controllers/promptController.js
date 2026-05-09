import {
  buildPrompt,
  generateImageFromPrompt
} from "../services/promptService.js";

export async function generatePrompt(req, res, next) {
  try {
    const {
      width = 512,
      height = 512
    } = req.body;

    const promptResult = await buildPrompt(req.body);

    const imageUrl = await generateImageFromPrompt(
      promptResult.prompt,
      promptResult.negative_prompt,
      width,
      height
    );

    return res.json({
      success: true,
      data: {
        prompt: promptResult.prompt,
        negative_prompt: promptResult.negative_prompt,
        width,
        height,
        image_url: imageUrl
      }
    });
  } catch (error) {
    next(error);
  }
}