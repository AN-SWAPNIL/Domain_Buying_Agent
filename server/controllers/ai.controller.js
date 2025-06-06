import { validationResult } from "express-validator";
import { v4 as uuidv4 } from "uuid";
import AIConversation from "../models/AIConversation.model.js";
import aiService from "../services/ai.service.js";

// Suggest domains using AI
export const suggestDomains = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      business,
      industry,
      keywords = [],
      budget,
      extensions = [".com", ".net", ".org"],
      audience,
      context = "",
    } = req.body;

    const requirements = {
      business,
      industry,
      keywords,
      budget,
      extensions,
      audience,
      context,
    };

    const suggestions = await aiService.suggestDomains(requirements);

    res.status(200).json({
      success: true,
      data: {
        suggestions,
        requirements,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Analyze domain with AI
export const analyzeDomain = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { domain, context = "" } = req.body;

    const analysis = await aiService.analyzeDomain(domain, context);

    res.status(200).json({
      success: true,
      data: {
        domain,
        analysis,
        analyzedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Chat with AI assistant
export const chatWithAI = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { message, sessionId } = req.body;
    const currentSessionId = sessionId || uuidv4();

    // Find or create conversation
    let conversation = await AIConversation.findOne({
      sessionId: currentSessionId,
      user: req.user.id,
    });

    if (!conversation) {
      conversation = new AIConversation({
        user: req.user.id,
        sessionId: currentSessionId,
        messages: [],
        status: "active",
      });
    }

    // Add user message
    conversation.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    // Get AI response
    const context = {
      conversation: conversation.messages
        .slice(-10)
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n"),
      preferences: req.user.preferences,
      domains: [], // Could be populated with user's domains
    };

    const aiResponse = await aiService.consultUser(message, context);

    // Add AI response
    conversation.messages.push({
      role: "assistant",
      content: aiResponse.response,
      timestamp: new Date(),
      metadata: {
        model: "gemini-pro",
        confidence: 0.9,
      },
    });

    // Update context and recommendations
    if (aiResponse.suggestions && aiResponse.suggestions.length > 0) {
      conversation.recommendations = aiResponse.suggestions.map(
        (suggestion) => ({
          domain: suggestion.domain || "",
          reasoning: suggestion,
          confidence: 0.8,
          available: true,
        })
      );
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      data: {
        sessionId: currentSessionId,
        message: aiResponse.response,
        suggestions: aiResponse.suggestions,
        conversation: {
          id: conversation._id,
          messageCount: conversation.messages.length,
          lastMessage: conversation.messages[conversation.messages.length - 1],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get conversation history
export const getConversationHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sessionId } = req.query;

    const query = { user: req.user.id };
    if (sessionId) {
      query.sessionId = sessionId;
    }

    const conversations = await AIConversation.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit * page)
      .skip((page - 1) * limit)
      .select("sessionId status messages recommendations createdAt updatedAt");

    // If sessionId is provided, return full conversation
    if (sessionId) {
      const conversation = conversations[0];
      if (conversation) {
        res.status(200).json({
          success: true,
          data: {
            conversation: {
              sessionId: conversation.sessionId,
              status: conversation.status,
              messages: conversation.messages,
              recommendations: conversation.recommendations,
              createdAt: conversation.createdAt,
              updatedAt: conversation.updatedAt,
            },
          },
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }
    } else {
      // Return conversation summaries
      const conversationSummaries = conversations.map((conv) => ({
        sessionId: conv.sessionId,
        status: conv.status,
        messageCount: conv.messages.length,
        lastMessage:
          conv.messages[conv.messages.length - 1]?.content.substring(0, 100) +
          "...",
        recommendationCount: conv.recommendations.length,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }));

      res.status(200).json({
        success: true,
        data: {
          conversations: conversationSummaries,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: await AIConversation.countDocuments(query),
          },
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// Generate business names
export const generateBusinessName = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { industry, keywords, style = "modern" } = req.body;

    const businessNames = await aiService.generateBusinessName(
      industry,
      keywords,
      style
    );

    res.status(200).json({
      success: true,
      data: {
        businessNames,
        criteria: {
          industry,
          keywords,
          style,
        },
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};
