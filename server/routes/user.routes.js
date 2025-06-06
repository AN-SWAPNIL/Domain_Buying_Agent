import express from "express";
import { body } from "express-validator";
import {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  getUserStats,
  updateUserPreferences,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// Validation rules
const profileUpdateValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("profile.phone")
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage("Invalid phone number"),
  body("profile.address.street")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Street address too long"),
  body("profile.address.city")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("City name too long"),
  body("profile.address.country")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Country name too long"),
];

const preferencesValidation = [
  body("currency")
    .optional()
    .isIn(["USD", "EUR", "GBP", "CAD", "AUD"])
    .withMessage("Invalid currency"),
  body("notifications.email")
    .optional()
    .isBoolean()
    .withMessage("Email notification must be boolean"),
  body("notifications.sms")
    .optional()
    .isBoolean()
    .withMessage("SMS notification must be boolean"),
];

// Routes
router.get("/profile", getUserProfile);
router.put("/profile", profileUpdateValidation, updateUserProfile);
router.delete("/account", deleteUserAccount);
router.get("/stats", getUserStats);
router.put("/preferences", preferencesValidation, updateUserPreferences);

export default router;
