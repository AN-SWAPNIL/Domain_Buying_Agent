import { validationResult } from "express-validator";
import User from "../models/User.model.js";
import Domain from "../models/Domain.model.js";
import Transaction from "../models/Transaction.model.js";

// Get user profile
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: user.profile,
          preferences: user.preferences,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateUserProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const allowedFields = ["name", "profile"];
    const updates = {};

    // Only include allowed fields
    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.status(200).json({
      success: true,
      data: {
        user,
        message: "Profile updated successfully",
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete user account
export const deleteUserAccount = async (req, res, next) => {
  try {
    const { confirmDelete } = req.body;

    if (confirmDelete !== "DELETE") {
      return res.status(400).json({
        success: false,
        message:
          'Please confirm account deletion by sending "DELETE" in confirmDelete field',
      });
    }

    // Check for active domains
    const activeDomains = await Domain.countDocuments({
      owner: req.user.id,
      status: { $in: ["registered", "pending"] },
    });

    if (activeDomains > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete account with ${activeDomains} active domains. Please transfer or cancel domains first.`,
      });
    }

    // Check for pending transactions
    const pendingTransactions = await Transaction.countDocuments({
      user: req.user.id,
      status: "pending",
    });

    if (pendingTransactions > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete account with ${pendingTransactions} pending transactions. Please complete or cancel them first.`,
      });
    }

    // Deactivate user instead of deleting (soft delete)
    await User.findByIdAndUpdate(req.user.id, {
      isActive: false,
      email: `deleted_${Date.now()}_${req.user.email}`, // Prevent email conflicts
    });

    res.status(200).json({
      success: true,
      message: "Account deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get user statistics
export const getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get domain statistics
    const domainStats = await Domain.aggregate([
      { $match: { owner: userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$pricing.sellingPrice" },
        },
      },
    ]);

    // Get transaction statistics
    const transactionStats = await Transaction.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount.value" },
        },
      },
    ]);

    // Get monthly spending
    const monthlySpending = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          status: "completed",
          createdAt: {
            $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000), // Last 12 months
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalSpent: { $sum: "$amount.value" },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Recent activity
    const recentDomains = await Domain.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("fullDomain status pricing createdAt");

    const recentTransactions = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("domain", "fullDomain")
      .select("type status amount createdAt");

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalDomains: await Domain.countDocuments({ owner: userId }),
          activeDomains: await Domain.countDocuments({
            owner: userId,
            status: "registered",
          }),
          totalSpent: await Transaction.aggregate([
            { $match: { user: userId, status: "completed" } },
            { $group: { _id: null, total: { $sum: "$amount.value" } } },
          ]).then((result) => result[0]?.total || 0),
          accountAge: Math.floor(
            (Date.now() - req.user.createdAt) / (1000 * 60 * 60 * 24)
          ), // days
        },
        domainStats: domainStats.reduce((acc, stat) => {
          acc[stat._id] = {
            count: stat.count,
            totalValue: stat.totalValue,
          };
          return acc;
        }, {}),
        transactionStats: transactionStats.reduce((acc, stat) => {
          acc[stat._id] = {
            count: stat.count,
            totalAmount: stat.totalAmount,
          };
          return acc;
        }, {}),
        monthlySpending,
        recentActivity: {
          domains: recentDomains,
          transactions: recentTransactions,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user preferences
export const updateUserPreferences = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { currency, notifications } = req.body;
    const updates = {};

    if (currency) {
      updates["preferences.currency"] = currency;
    }

    if (notifications) {
      if (notifications.email !== undefined) {
        updates["preferences.notifications.email"] = notifications.email;
      }
      if (notifications.sms !== undefined) {
        updates["preferences.notifications.sms"] = notifications.sms;
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.status(200).json({
      success: true,
      data: {
        preferences: user.preferences,
        message: "Preferences updated successfully",
      },
    });
  } catch (error) {
    next(error);
  }
};
