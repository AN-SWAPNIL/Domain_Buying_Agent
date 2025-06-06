import express from "express";
import { body, query } from "express-validator";
import {
  searchDomains,
  checkAvailability,
  getDomainDetails,
  getUserDomains,
  purchaseDomain,
  renewDomain,
  transferDomain,
  updateDNS,
} from "../controllers/domain.controller.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Validation rules
const searchValidation = [
  query("q")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search query must be between 1 and 100 characters"),
  query("extensions")
    .optional()
    .isArray()
    .withMessage("Extensions must be an array"),
];

const purchaseValidation = [
  body("domain")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Domain name is required"),
  body("years")
    .isInt({ min: 1, max: 10 })
    .withMessage("Years must be between 1 and 10"),
  body("contactInfo").isObject().withMessage("Contact information is required"),
  body("contactInfo.firstName")
    .trim()
    .isLength({ min: 1 })
    .withMessage("First name is required"),
  body("contactInfo.lastName")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Last name is required"),
  body("contactInfo.email").isEmail().withMessage("Valid email is required"),
  body("contactInfo.phone")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Valid phone number is required"),
  body("contactInfo.address")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Address is required"),
  body("contactInfo.city")
    .trim()
    .isLength({ min: 1 })
    .withMessage("City is required"),
  body("contactInfo.country")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Country is required"),
];

const dnsValidation = [
  body("records").isArray().withMessage("DNS records must be an array"),
  body("records.*.type")
    .isIn(["A", "AAAA", "CNAME", "MX", "TXT", "NS"])
    .withMessage("Invalid DNS record type"),
  body("records.*.name")
    .trim()
    .isLength({ min: 1 })
    .withMessage("DNS record name is required"),
  body("records.*.value")
    .trim()
    .isLength({ min: 1 })
    .withMessage("DNS record value is required"),
];

// Public routes
router.get("/search", searchValidation, searchDomains);
router.get("/check/:domain", checkAvailability);
router.get("/details/:domain", getDomainDetails);

// Protected routes
router.use(protect);
router.get("/my-domains", getUserDomains);
router.post("/purchase", purchaseValidation, purchaseDomain);
router.post("/renew/:domainId", renewDomain);
router.post("/transfer", transferDomain);
router.put("/dns/:domainId", dnsValidation, updateDNS);

export default router;
