import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

class AIService {
  constructor() {
    try {
      this.model = new ChatGoogleGenerativeAI({
        modelName: "gemini-pro",
        apiKey: process.env.GOOGLE_API_KEY || "demo-key",
        temperature: 0.7,
      });
      this.outputParser = new StringOutputParser();
      this.initializePrompts();
    } catch (error) {
      console.warn("AI Service initialization failed:", error.message);
      this.model = null;
      this.outputParser = new StringOutputParser();
    }
  }

  initializePrompts() {
    // Domain suggestion prompt
    this.domainSuggestionPrompt = PromptTemplate.fromTemplate(`
      You are an expert domain name consultant. Based on the user's requirements, suggest relevant domain names.
      
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
      
      Format your response as a JSON array of objects with keys: domain, reasoning, brandabilityScore, extension.
    `);

    // Domain analysis prompt
    this.domainAnalysisPrompt = PromptTemplate.fromTemplate(`
      Analyze the following domain name and provide detailed insights:
      
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
      
      Format as JSON with scores and detailed analysis.
    `);

    // Business consultation prompt
    this.consultationPrompt = PromptTemplate.fromTemplate(`
      You are a domain expert consultant. The user is asking: {question}
      
      User Context:
      - Previous conversation: {conversation}
      - User preferences: {preferences}
      - Current domains of interest: {domains}
      
      Provide helpful, expert advice about domain names, web presence, branding, or related topics.
      Be conversational, helpful, and provide actionable insights.
      
      If the user is asking about pricing, availability, or technical aspects, provide general guidance
      but recommend they check current data through our system.
    `);
  }

  async suggestDomains(requirements) {
    try {
      const chain = RunnableSequence.from([
        this.domainSuggestionPrompt,
        this.model,
        this.outputParser,
      ]);

      const response = await chain.invoke({
        business: requirements.business || "General Business",
        industry: requirements.industry || "Technology",
        keywords: requirements.keywords?.join(", ") || "",
        budget: requirements.budget || "$50-100",
        extensions: requirements.extensions?.join(", ") || ".com, .net, .org",
        audience: requirements.audience || "General Public",
        context: requirements.context || "",
      });

      // Parse JSON response
      try {
        const suggestions = JSON.parse(response);
        return suggestions;
      } catch (parseError) {
        // Fallback: extract domains from text response
        return this.extractDomainsFromText(response);
      }
    } catch (error) {
      console.error("AI Domain Suggestion Error:", error);
      throw new Error("Failed to generate domain suggestions");
    }
  }

  async analyzeDomain(domain, context = "") {
    try {
      const chain = RunnableSequence.from([
        this.domainAnalysisPrompt,
        this.model,
        this.outputParser,
      ]);

      const response = await chain.invoke({
        domain,
        context,
      });

      try {
        return JSON.parse(response);
      } catch (parseError) {
        return {
          domain,
          analysis: response,
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
      throw new Error("Failed to analyze domain");
    }
  }

  async consultUser(question, context = {}) {
    try {
      const chain = RunnableSequence.from([
        this.consultationPrompt,
        this.model,
        this.outputParser,
      ]);

      const response = await chain.invoke({
        question,
        conversation: context.conversation || "",
        preferences: JSON.stringify(context.preferences || {}),
        domains: context.domains?.join(", ") || "",
      });

      return {
        response,
        suggestions: this.extractActionableItems(response),
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("AI Consultation Error:", error);
      throw new Error("Failed to provide consultation");
    }
  }

  async generateBusinessName(industry, keywords, style = "modern") {
    try {
      const prompt = PromptTemplate.fromTemplate(`
        Generate creative business names for a {industry} business.
        Keywords to incorporate: {keywords}
        Style preference: {style}
        
        Generate 10 unique, brandable business names that:
        1. Are memorable and catchy
        2. Reflect the industry
        3. Are available as domains (likely)
        4. Sound professional
        
        For each name, suggest the best domain extension and explain why it works.
        
        Format as JSON array with: name, domain, extension, reasoning.
      `);

      const chain = RunnableSequence.from([
        prompt,
        this.model,
        this.outputParser,
      ]);

      const response = await chain.invoke({
        industry,
        keywords: keywords.join(", "),
        style,
      });

      try {
        return JSON.parse(response);
      } catch (parseError) {
        return this.extractBusinessNamesFromText(response);
      }
    } catch (error) {
      console.error("AI Business Name Generation Error:", error);
      throw new Error("Failed to generate business names");
    }
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
