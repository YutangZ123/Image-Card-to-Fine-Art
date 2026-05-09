import express from "express";
import { generatePrompt } from "../controllers/promptController.js";

const router = express.Router();

router.post("/generate", generatePrompt);

export default router;