import express from "express";
import { body } from "express-validator";
import {
  suggestDomains,
  analyzeDomain,
  chatWithAI,
  getConversationHistory,
  generateBusinessName,
} from "../controllers/ai.controller.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Validation rules
const domainSuggestionValidation = [
  body("business")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Business description too long"),
  body("industry")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Industry name too long"),
  body("keywords")
    .optional()
    .isArray()
    .withMessage("Keywords must be an array"),
  body("budget")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Budget description too long"),
  body("extensions")
    .optional()
    .isArray()
    .withMessage("Extensions must be an array"),
  body("audience")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Audience description too long"),
];

const chatValidation = [
  body("message")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message must be between 1 and 1000 characters"),
  body("sessionId").optional().isUUID().withMessage("Invalid session ID"),
];

const businessNameValidation = [
  body("industry")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Industry is required"),
  body("keywords")
    .isArray({ min: 1 })
    .withMessage("At least one keyword is required"),
  body("style")
    .optional()
    .trim()
    .isIn(["modern", "classic", "creative", "professional"])
    .withMessage("Invalid style"),
];

// Public routes (with rate limiting)
router.post("/suggest-domains", domainSuggestionValidation, suggestDomains);
router.post(
  "/analyze-domain",
  body("domain")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Domain name is required"),
  analyzeDomain
);

// Protected routes
router.use(protect);
router.post("/chat", chatValidation, chatWithAI);
router.get("/conversations", getConversationHistory);
router.post(
  "/generate-business-names",
  businessNameValidation,
  generateBusinessName
);

export default router;
