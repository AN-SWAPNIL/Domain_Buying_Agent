import { GoogleGenerativeAI } from "@google/generative-ai";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// Custom error classes
class AIServiceError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "AIServiceError";
    this.code = code;
  }
}

class AIService {
  constructor() {
    try {
      // Debug environment loading
      console.log("🔍 Checking Google API Key...");
      console.log("API Key present:", !!process.env.GOOGLE_API_KEY);
      console.log("API Key length:", process.env.GOOGLE_API_KEY?.length || 0);

      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new AIServiceError(
          "Google API Key not configured",
          "CONFIG_ERROR"
        );
      }

      // Initialize LangChain chat model
      this.chatModel = new ChatGoogleGenerativeAI({
        modelName: "gemini-1.5-flash",
        maxOutputTokens: 1024,
        temperature: 0.7,
        googleApiKey: apiKey,
      });

      // Initialize output parser for structured responses
      this.outputParser = StructuredOutputParser.fromZodSchema(
        z.array(
          z.object({
            name: z.string(),
            domain: z.string(),
            extension: z.string(),
            reasoning: z.string(),
          })
        )
      );

      // Initialize prompts
      this.initializePrompts();

      // Initialize conversation history
      this.conversationHistory = new Map();

      console.log("✅ AI Service initialized successfully");
    } catch (error) {
      console.error("⚠️ AI Service initialization failed:", error.message);
      throw error;
    }
  }

  async initializePrompts() {
    try {
      // Domain suggestion prompt
      this.domainSuggestionPrompt = new PromptTemplate({
        template: `You are an expert domain name consultant. Based on the user's requirements, suggest relevant domain names.
        
        User Requirements:
        - Business/Project: {business}
        - Industry: {industry}
        - Keywords: {keywords}
        - Budget: {budget}
        - Preferred Extensions: {extensions}
        - Target Audience: {audience}
        
        Additional Context: {context}
        
        Please suggest 10 creative, memorable, and brandable domain names that:
        1. Are relevant to the business/industry
        2. Are easy to remember and spell
        3. Are SEO-friendly
        4. Sound professional
        5. Are likely to be available
        
        For each suggestion, provide:
        - Domain name
        - Why it's a good fit (1-2 sentences)
        - Estimated brandability score (1-10)
        - Target extension preference
        
        Format your response as a JSON array of objects with keys: domain, reasoning, brandabilityScore, extension.`,
        inputVariables: [
          "business",
          "industry",
          "keywords",
          "budget",
          "extensions",
          "audience",
          "context",
        ],
      });

      // Domain analysis prompt
      this.domainAnalysisPrompt = new PromptTemplate({
        template: `Analyze the following domain name and provide detailed insights:
        
        Domain: {domain}
        User Context: {context}
        
        Please analyze:
        1. Brandability (1-10)
        2. Memorability (1-10)
        3. SEO potential (1-10)
        4. Industry relevance (1-10)
        5. Overall recommendation (1-10)
        
        Provide insights on:
        - Strengths of this domain
        - Potential weaknesses
        - Target market suitability
        - Alternative suggestions if score is low
        
        Format as JSON with scores and detailed analysis.`,
        inputVariables: ["domain", "context"],
      });

      // Business consultation prompt
      this.consultationPrompt = new PromptTemplate({
        template: `You are a domain expert consultant. The user is asking: {question}
        
        User Context:
        - Previous conversation: {conversation}
        - User preferences: {preferences}
        - Current domains of interest: {domains}
        
        Provide helpful, expert advice about domain names, web presence, branding, or related topics.
        Be conversational, helpful, and provide actionable insights.
        
        If the user is asking about pricing, availability, or technical aspects, provide general guidance
        but recommend they check current data through our system.`,
        inputVariables: ["question", "conversation", "preferences", "domains"],
      });
    } catch (error) {
      throw new AIServiceError(
        "Failed to initialize prompts: " + error.message,
        "INIT_ERROR"
      );
    }
  }

  async suggestDomains(requirements) {
    try {
      if (!this.domainSuggestionPrompt) {
        await this.initializePrompts();
      }

      const formattedPrompt = await this.domainSuggestionPrompt.format({
        business: requirements.business || "General Business",
        industry: requirements.industry || "Technology",
        keywords: requirements.keywords?.join(", ") || "",
        budget: requirements.budget || "$50-100",
        extensions: requirements.extensions?.join(", ") || ".com, .net, .org",
        audience: requirements.audience || "General Public",
        context: requirements.context || "",
      });

      const result = await this.chatModel.predict(formattedPrompt);

      try {
        return JSON.parse(
          result.replace(/```json\n?/g, "").replace(/```\n?/g, "")
        );
      } catch (parseError) {
        console.warn(
          "Failed to parse JSON response, extracting domains from text"
        );
        return this.extractDomainsFromText(result);
      }
    } catch (error) {
      console.error("AI Domain Suggestion Error:", error);
      throw new AIServiceError(
        "Failed to generate domain suggestions: " + error.message,
        "SUGGESTION_ERROR"
      );
    }
  }

  async analyzeDomain(domain, context = "") {
    try {
      if (!this.domainAnalysisPrompt) {
        await this.initializePrompts();
      }

      const formattedPrompt = await this.domainAnalysisPrompt.format({
        domain,
        context,
      });

      const result = await this.chatModel.predict(formattedPrompt);

      try {
        return JSON.parse(
          result.replace(/```json\n?/g, "").replace(/```\n?/g, "")
        );
      } catch (parseError) {
        return {
          domain,
          analysis: result,
          scores: {
            brandability: 7,
            memorability: 7,
            seo: 7,
            relevance: 7,
            overall: 7,
          },
        };
      }
    } catch (error) {
      console.error("AI Domain Analysis Error:", error);
      throw new AIServiceError(
        "Failed to analyze domain: " + error.message,
        "ANALYSIS_ERROR"
      );
    }
  }

  async consultUser(question, context = {}) {
    try {
      if (!this.consultationPrompt) {
        await this.initializePrompts();
      }

      // Get conversation history for the user
      const conversationHistory = this.getConversationHistory(context.userId);

      const formattedPrompt = await this.consultationPrompt.format({
        question,
        conversation: conversationHistory || "First interaction",
        preferences: JSON.stringify(context.preferences || {}),
        domains: context.domains?.join(", ") || "None specified",
      });

      const result = await this.chatModel.predict(formattedPrompt);

      // Update conversation history
      this.updateConversationHistory(context.userId, question, result);

      return {
        message: result,
        suggestions: this.extractActionableItems(result),
        domains: this.extractDomainsFromText(result),
      };
    } catch (error) {
      console.error("AI Consultation Error:", error);
      throw new AIServiceError(
        "Failed to process consultation request: " + error.message,
        "CONSULTATION_ERROR"
      );
    }
  }

  async generateBusinessName(industry, keywords, style = "modern") {
    try {
      if (!this.chatModel) {
        throw new AIServiceError("AI Service not available", "SERVICE_ERROR");
      }

      const prompt = new PromptTemplate({
        template: `Generate creative business names for a {industry} business.
        Keywords to incorporate: {keywords}
        Style preference: {style}
        
        Generate 10 unique, brandable business names that:
        1. Are memorable and catchy
        2. Reflect the industry
        3. Are available as domains (likely)
        4. Sound professional
        
        For each name, suggest the best domain extension and explain why it works.
        
        Format as JSON array with: name, domain, extension, reasoning.`,
        inputVariables: ["industry", "keywords", "style"],
      });

      const formattedPrompt = await prompt.format({
        industry,
        keywords: keywords.join(", "),
        style,
      });

      const result = await this.chatModel.predict(formattedPrompt);

      try {
        const parsed = await this.outputParser.parse(result);
        return parsed;
      } catch (parseError) {
        console.warn("Failed to parse structured output, extracting from text");
        return this.extractBusinessNamesFromText(result);
      }
    } catch (error) {
      console.error("AI Business Name Generation Error:", error);
      throw new AIServiceError(
        "Failed to generate business names: " + error.message,
        "GENERATION_ERROR"
      );
    }
  }

  // Conversation history management
  getConversationHistory(userId) {
    return this.conversationHistory.get(userId) || [];
  }

  updateConversationHistory(userId, question, answer) {
    const history = this.getConversationHistory(userId);
    history.push({ question, answer, timestamp: new Date() });
    this.conversationHistory.set(userId, history);
  }

  clearConversationHistory(userId) {
    this.conversationHistory.delete(userId);
  }

  // Helper methods
  extractDomainsFromText(text) {
    const domainRegex = /([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/g;
    const matches = text.match(domainRegex) || [];

    return matches.map((domain, index) => ({
      domain,
      reasoning: `Suggested domain option ${index + 1}`,
      brandabilityScore: 7,
      extension: domain.split(".").pop(),
    }));
  }

  extractActionableItems(text) {
    const suggestions = [];
    const lines = text.split("\n");

    lines.forEach((line) => {
      if (
        line.includes("recommend") ||
        line.includes("suggest") ||
        line.includes("consider")
      ) {
        suggestions.push(line.trim());
      }
    });

    return suggestions;
  }

  extractBusinessNamesFromText(text) {
    const lines = text.split("\n");
    const names = [];

    lines.forEach((line) => {
      if (
        line.includes(".com") ||
        line.includes(".net") ||
        line.includes(".org")
      ) {
        const parts = line.split(/[:\-]/);
        if (parts.length >= 2) {
          names.push({
            name: parts[0].trim(),
            domain: parts[1].trim(),
            extension: ".com",
            reasoning: "Generated business name option",
          });
        }
      }
    });

    return names;
  }
}

export default new AIService();
