import { validationResult } from "express-validator";
import Domain from "../models/Domain.model.js";
import Transaction from "../models/Transaction.model.js";
import namecheapService from "../services/namecheap.service.js";
import aiService from "../services/ai.service.js";
import emailService from "../services/email.service.js";

// Search domains with AI suggestions
export const searchDomains = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      q: query,
      extensions = [".com", ".net", ".org"],
      includeAI = true,
    } = req.query;

    // Basic domain search
    const searchResults = [];
    const extensionArray = Array.isArray(extensions)
      ? extensions
      : extensions.split(",");

    // Check availability for direct matches
    for (const ext of extensionArray) {
      const domain = `${query}${ext}`;
      try {
        // First check if domain is already registered in our database
        const existingDomain = await Domain.findOne({
          fullDomain: domain.toLowerCase(),
          status: { $in: ["registered", "pending", "payment_completed"] },
        });

        if (existingDomain) {
          searchResults.push({
            domain,
            available: false,
            price: 0,
            currency: "USD",
            message: "Domain is already registered",
          });
        } else {
          // Check with registrar if not in our database
          const availability = await namecheapService.checkDomainAvailability(
            domain
          );
          searchResults.push(availability);
        }
      } catch (error) {
        console.log(`Error checking ${domain}:`, error.message);
      }
    }

    // Get AI suggestions if requested
    let aiSuggestions = [];
    if (includeAI) {
      try {
        aiSuggestions = await aiService.suggestDomains({
          business: query,
          keywords: [query],
          extensions: extensionArray,
        });
      } catch (error) {
        console.log("AI suggestions failed:", error.message);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        query,
        directMatches: searchResults,
        aiSuggestions,
        searchedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Check single domain availability
export const checkAvailability = async (req, res, next) => {
  try {
    const { domain } = req.params;

    if (!domain || domain.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Valid domain name is required",
      });
    }

    // First check if domain is already registered in our database
    const existingDomain = await Domain.findOne({
      fullDomain: domain.toLowerCase(),
      status: { $in: ["registered", "pending", "payment_completed"] },
    });

    if (existingDomain) {
      return res.status(200).json({
        success: true,
        data: {
          domain,
          available: false,
          price: 0,
          currency: "USD",
          message: "Domain is already registered",
          registeredBy: existingDomain.owner ? "another user" : "system",
        },
      });
    }

    // If not in our database, check with registrar
    const availability = await namecheapService.checkDomainAvailability(domain);

    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    next(error);
  }
};

// Get domain details
export const getDomainDetails = async (req, res, next) => {
  try {
    const { domain } = req.params;

    // Check if domain exists in our database
    const existingDomain = await Domain.findOne({
      fullDomain: domain.toLowerCase(),
    });

    let domainInfo = {};

    if (existingDomain) {
      domainInfo = existingDomain;
    } else {
      // Get info from registrar
      try {
        domainInfo = await namecheapService.getDomainInfo(domain);
      } catch (error) {
        console.log("Failed to get domain info from registrar:", error.message);
      }
    }

    // Get AI analysis
    let analysis = {};
    try {
      analysis = await aiService.analyzeDomain(domain);
    } catch (error) {
      console.log("AI analysis failed:", error.message);
    }

    res.status(200).json({
      success: true,
      data: {
        domain,
        info: domainInfo,
        analysis,
        checkedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user's domains
export const getUserDomains = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const query = { owner: req.user.id };
    if (status) {
      query.status = status;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: order === "desc" ? -1 : 1 },
      populate: [{ path: "owner", select: "name email" }],
    };

    const domains = await Domain.paginate(query, options);

    res.status(200).json({
      success: true,
      data: domains,
    });
  } catch (error) {
    next(error);
  }
};

// Purchase domain
export const purchaseDomain = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { domain, years = 1, contactInfo } = req.body;

    // Check if domain is available
    const availability = await namecheapService.checkDomainAvailability(domain);
    if (!availability.available) {
      return res.status(400).json({
        success: false,
        message: "Domain is not available for registration",
      });
    }

    // Create domain record
    const domainParts = domain.split(".");
    const domainName = domainParts[0];
    const extension = domainParts.slice(1).join("."); // Handle multi-part extensions like .co.uk

    const newDomain = new Domain({
      name: domainName,
      extension: extension,
      fullDomain: domain.toLowerCase(),
      owner: req.user.id,
      status: "pending",
      pricing: {
        cost: availability.price || 12.99, // Default price if availability.price is 0 or undefined
        markup: (availability.price || 12.99) * 0.1, // 10% markup
        sellingPrice: (availability.price || 12.99) * 1.1,
      },
    });

    await newDomain.save();

    // Create transaction record
    const transaction = new Transaction({
      user: req.user.id,
      domain: newDomain._id,
      type: "purchase",
      status: "pending",
      amount: {
        value: newDomain.pricing.sellingPrice,
        currency: "USD",
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      },
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      data: {
        domain: newDomain,
        transaction,
        message: "Domain purchase initiated. Complete payment to finalize.",
      },
    });
  } catch (error) {
    next(error);
  }
};

// Renew domain
export const renewDomain = async (req, res, next) => {
  try {
    const { domainId } = req.params;
    const { years = 1 } = req.body;

    const domain = await Domain.findOne({
      _id: domainId,
      owner: req.user.id,
    });

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: "Domain not found",
      });
    }

    if (domain.status !== "registered") {
      return res.status(400).json({
        success: false,
        message: "Domain must be registered to renew",
      });
    }

    // Calculate renewal cost
    const renewalCost = domain.pricing.cost * years;
    const renewalPrice = renewalCost * 1.1; // 10% markup

    // Create renewal transaction
    const transaction = new Transaction({
      user: req.user.id,
      domain: domain._id,
      type: "renewal",
      status: "pending",
      amount: {
        value: renewalPrice,
        currency: "USD",
      },
      metadata: {
        years,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      },
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      data: {
        domain,
        transaction,
        renewalYears: years,
        message: "Domain renewal initiated. Complete payment to finalize.",
      },
    });
  } catch (error) {
    next(error);
  }
};

// Transfer domain
export const transferDomain = async (req, res, next) => {
  try {
    const { domain, authCode, contactInfo } = req.body;

    // Validate required fields
    if (!domain || !authCode) {
      return res.status(400).json({
        success: false,
        message: "Domain name and authorization code are required",
      });
    }

    // Create domain transfer record
    const domainParts = domain.split(".");
    const domainName = domainParts[0];
    const extension = domainParts.slice(1).join("."); // Handle multi-part extensions like .co.uk

    const transferDomain = new Domain({
      name: domainName,
      extension: extension,
      fullDomain: domain.toLowerCase(),
      owner: req.user.id,
      status: "pending",
      pricing: {
        cost: 12.99, // Standard transfer cost
        markup: 1.3,
        sellingPrice: 14.29,
      },
      metadata: {
        transferAuthCode: authCode,
        transferInitiated: new Date(),
      },
    });

    await transferDomain.save();

    // Create transfer transaction
    const transaction = new Transaction({
      user: req.user.id,
      domain: transferDomain._id,
      type: "transfer",
      status: "pending",
      amount: {
        value: transferDomain.pricing.sellingPrice,
        currency: "USD",
      },
      metadata: {
        authCode,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      },
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      data: {
        domain: transferDomain,
        transaction,
        message: "Domain transfer initiated. Complete payment to finalize.",
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get DNS records
export const getDNS = async (req, res, next) => {
  try {
    const { domainId } = req.params;

    const domain = await Domain.findOne({
      _id: domainId,
      owner: req.user.id,
    });

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: "Domain not found",
      });
    }

    // Return DNS records from database
    res.status(200).json({
      success: true,
      data: {
        domain: domain.fullDomain,
        dnsRecords: domain.dnsRecords || [],
        status: domain.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update DNS records
export const updateDNS = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { domainId } = req.params;
    const { records } = req.body;

    const domain = await Domain.findOne({
      _id: domainId,
      owner: req.user.id,
    });

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: "Domain not found",
      });
    }

    if (domain.status !== "registered") {
      return res.status(400).json({
        success: false,
        message: "DNS can only be updated for registered domains",
      });
    }

    // Update DNS records via registrar
    try {
      const dnsResult = await namecheapService.setDNSRecords(
        domain.fullDomain,
        records
      );

      if (dnsResult.success) {
        // Update domain record in database
        domain.dnsRecords = records;
        await domain.save();

        res.status(200).json({
          success: true,
          data: {
            domain,
            dnsRecords: domain.dnsRecords,
            message: "DNS records updated successfully",
          },
        });
      } else {
        throw new Error("DNS update failed");
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Failed to update DNS records",
        error: error.message,
      });
    }
  } catch (error) {
    next(error);
  }
};
