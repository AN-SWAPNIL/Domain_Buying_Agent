import { validationResult } from "express-validator";
import Transaction from "../models/Transaction.model.js";
import Domain from "../models/Domain.model.js";
import stripeService from "../services/stripe.service.js";
import namecheapService from "../services/namecheap.service.js";
import emailService from "../services/email.service.js";

// Create payment intent
export const createPaymentIntent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { amount, currency = "usd", domain, metadata = {} } = req.body;

    // Find or create domain record for this user
    let domainRecord = await Domain.findOne({
      fullDomain: domain,
      owner: req.user.id,
    });

    if (!domainRecord) {
      // Parse domain name and extension
      const domainParts = domain.split(".");
      const domainName = domainParts[0];
      const extension = domainParts.slice(1).join(".");

      // Check if domain already exists with registered/pending status
      const existingDomain = await Domain.findOne({
        fullDomain: domain,
        status: { $in: ["registered", "pending"] },
      });

      if (existingDomain) {
        // Domain is already taken or being processed
        return res.status(400).json({
          success: false,
          message: "This domain is no longer available for purchase",
        });
      }

      // Create a clean domain record for this user
      domainRecord = new Domain({
        name: domainName,
        extension: extension,
        fullDomain: domain,
        owner: req.user.id,
        status: "pending",
        isAvailable: true,
        registrar: "namecheap",
        pricing: {
          cost: amount / 100, // Convert from cents to dollars
          markup: 0,
          sellingPrice: amount / 100,
          currency: currency.toUpperCase(),
        },
      });

      try {
        await domainRecord.save();
      } catch (error) {
        if (error.code === 11000) {
          // Handle duplicate key error - domain might be taken by another user
          return res.status(400).json({
            success: false,
            message: "This domain is no longer available for purchase",
          });
        } else {
          throw error;
        }
      }
    }

    // Get or create Stripe customer
    let customerId = req.user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeService.createCustomer({
        _id: req.user._id,
        email: req.user.email,
        name: req.user.name,
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      req.user.stripeCustomerId = customerId;
      await req.user.save();
    }

    // Create payment intent
    const paymentIntent = await stripeService.createPaymentIntent(
      amount,
      currency,
      customerId,
      {
        domainId: domainRecord._id.toString(),
        userId: req.user._id.toString(),
        domainName: domainRecord.fullDomain,
        ...metadata,
      }
    );

    // Create or update transaction record
    let transaction = await Transaction.findOne({
      domain: domainRecord._id,
      user: req.user.id,
      status: "pending",
    });

    if (!transaction) {
      transaction = new Transaction({
        user: req.user.id,
        domain: domainRecord._id,
        type: "purchase",
        amount: {
          value: amount / 100, // Convert from cents to dollars
          currency: currency.toUpperCase(),
        },
        status: "pending",
        paymentMethod: "stripe",
        paymentDetails: {
          stripePaymentIntentId: paymentIntent.id,
        },
      });
      await transaction.save();
    } else {
      transaction.paymentDetails.stripePaymentIntentId = paymentIntent.id;
      await transaction.save();
    }

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Confirm payment
export const confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "Payment intent ID is required",
      });
    }

    console.log("🔄 Processing payment intent:", paymentIntentId);

    // Get payment intent from Stripe
    const paymentIntent = await stripeService.confirmPayment(paymentIntentId);

    // Debug: Log the payment intent structure
    console.log("PaymentIntent status:", paymentIntent.status);
    console.log("PaymentIntent charges:", paymentIntent.charges);
    console.log("PaymentIntent keys:", Object.keys(paymentIntent));

    if (paymentIntent.status === "succeeded") {
      // Extract charge information safely
      let charge = null;
      let paymentMethodDetails = null;

      // Try to get charge information from the payment intent
      if (paymentIntent.charges?.data?.length > 0) {
        charge = paymentIntent.charges.data[0];
        paymentMethodDetails = charge?.payment_method_details?.card;
      } else {
        // If charges are not expanded, get them separately
        console.log(
          "Charges not found in PaymentIntent, fetching separately..."
        );
        try {
          const charges = await stripeService.getPaymentIntentCharges(
            paymentIntentId
          );
          if (charges.length > 0) {
            charge = charges[0];
            paymentMethodDetails = charge?.payment_method_details?.card;
          }
        } catch (chargeError) {
          console.error(
            "Failed to fetch charges separately:",
            chargeError.message
          );
        }
      }

      // Find and update transaction
      const transaction = await Transaction.findOneAndUpdate(
        { "paymentDetails.stripePaymentIntentId": paymentIntentId },
        {
          status: "completed",
          "paymentDetails.stripeChargeId": charge?.id || null,
          "paymentDetails.last4": paymentMethodDetails?.last4 || null,
          "paymentDetails.brand": paymentMethodDetails?.brand || null,
        },
        { new: true }
      ).populate("domain");

      if (transaction) {
        // Update domain status and process registration
        const domain = await Domain.findById(transaction.domain._id);

        try {
          // Register domain with Namecheap
          if (transaction.type === "purchase") {
            const registrationResult = await namecheapService.registerDomain(
              domain.fullDomain,
              1, // years
              {
                firstName: req.user.name.split(" ")[0] || "User",
                lastName: req.user.name.split(" ")[1] || "Name",
                email: req.user.email,
                phone: req.user.profile?.phone || "+1.1234567890",
                address: req.user.profile?.address?.street || "123 Main St",
                city: req.user.profile?.address?.city || "City",
                state: req.user.profile?.address?.state || "State",
                postalCode: req.user.profile?.address?.zipCode || "12345",
                country: req.user.profile?.address?.country || "US",
              }
            );

            if (registrationResult.success) {
              domain.status = "registered";
              domain.registrationDate = new Date();
              domain.expirationDate = new Date(
                Date.now() + 365 * 24 * 60 * 60 * 1000
              ); // 1 year
              await domain.save();

              // Send domain purchase confirmation email
              emailService
                .sendDomainPurchaseConfirmation(
                  req.user.email,
                  req.user.name,
                  domain.fullDomain,
                  transaction.amount.value
                )
                .catch((error) => {
                  console.error(
                    "Failed to send purchase confirmation email:",
                    error
                  );
                });
            }
          }
        } catch (registrationError) {
          console.error(
            "Domain registration failed:",
            registrationError.message
          );
          // Payment succeeded but registration failed - handle this case
          domain.status = "payment_completed";
          await domain.save();
        }

        res.status(200).json({
          success: true,
          data: {
            transaction,
            domain,
            paymentStatus: paymentIntent.status,
            message: "Payment completed successfully",
          },
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: "Payment not completed",
        paymentStatus: paymentIntent.status,
      });
    }
  } catch (error) {
    next(error);
  }
};

// Get payment history
export const getPaymentHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;

    const query = { user: req.user.id };
    if (status) query.status = status;
    if (type) query.type = type;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [{ path: "domain", select: "fullDomain status pricing" }],
    };

    const transactions = await Transaction.paginate(query, options);

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

// Handle Stripe webhooks
export const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Stripe signature",
      });
    }

    const event = await stripeService.webhookHandler(req.body, signature);

    switch (event.type) {
      case "payment_intent.succeeded":
        console.log("Payment succeeded via webhook:", event.data.object.id);
        // Handle successful payment
        break;

      case "payment_intent.payment_failed":
        console.log("Payment failed via webhook:", event.data.object.id);
        // Update transaction status
        await Transaction.findOneAndUpdate(
          { "paymentDetails.stripePaymentIntentId": event.data.object.id },
          { status: "failed" }
        );
        break;

      case "customer.subscription.created":
        console.log("Subscription created:", event.data.object.id);
        break;

      case "customer.subscription.deleted":
        console.log("Subscription cancelled:", event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.status(400).json({
      success: false,
      message: "Webhook error",
      error: error.message,
    });
  }
};

// Create refund
export const createRefund = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const { amount, reason } = req.body;

    const transaction = await Transaction.findOne({
      _id: transactionId,
      user: req.user.id,
      status: "completed",
    }).populate("domain");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found or cannot be refunded",
      });
    }

    if (!transaction.paymentDetails.stripeChargeId) {
      return res.status(400).json({
        success: false,
        message: "No charge ID found for refund",
      });
    }

    // Create refund in Stripe
    const refund = await stripeService.createRefund(
      transaction.paymentDetails.stripeChargeId,
      amount
    );

    if (refund.status === "succeeded") {
      // Update transaction
      transaction.status = "refunded";
      transaction.notes = reason || "Refund requested by user";
      await transaction.save();

      // Update domain status if full refund
      if (!amount || amount >= transaction.amount.value) {
        const domain = await Domain.findById(transaction.domain._id);
        if (domain) {
          domain.status = "refunded";
          await domain.save();
        }
      }

      res.status(200).json({
        success: true,
        data: {
          refund,
          transaction,
          message: "Refund processed successfully",
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Refund failed",
        refundStatus: refund.status,
      });
    }
  } catch (error) {
    next(error);
  }
};
