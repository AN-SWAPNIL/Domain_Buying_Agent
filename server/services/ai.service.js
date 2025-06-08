import { GoogleGenerativeAI } from "@google/generative-ai";

class AIService {
  constructor() {
    try {
      // Debug environment loading
      console.log("🔍 Checking Google API Key...");
      console.log("API Key present:", !!process.env.GOOGLE_API_KEY);
      console.log("API Key length:", process.env.GOOGLE_API_KEY?.length || 0);

      // Temporary hardcoded key for testing
      const apiKey =
        process.env.GOOGLE_API_KEY || "AIzaSyDTIx0PLphILmcqVpc5ooEW6Fo0Ogl596I";

      if (!apiKey || apiKey === "demo-key") {
        throw new Error("Google API Key not configured");
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log("✅ AI Service initialized successfully");
    } catch (error) {
      console.warn("⚠️ AI Service initialization failed:", error.message);
      this.model = null;
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
      if (!this.model) {
        throw new Error("AI Service not available");
      }

      const prompt = `You are an expert domain name consultant. Based on the user's requirements, suggest relevant domain names.

User Requirements:
- Business/Project: ${requirements.business || "General Business"}
- Industry: ${requirements.industry || "Technology"}
- Keywords: ${requirements.keywords?.join(", ") || ""}
- Budget: ${requirements.budget || "$50-100"}
- Preferred Extensions: ${
        requirements.extensions?.join(", ") || ".com, .net, .org"
      }
- Target Audience: ${requirements.audience || "General Public"}

Additional Context: ${requirements.context || ""}

Please suggest 10 creative, memorable, and brandable domain names that:
1. Are relevant to the business/industry
2. Are easy to remember and spell
3. Are SEO-friendly
4. Are within budget range
5. Use preferred extensions

Return the response as a JSON object with this structure:
{
  "suggestions": [
    {
      "domain": "example.com",
      "reasoning": "Why this domain is good",
      "score": 8.5,
      "category": "brandable"
    }
  ],
  "analysis": "Brief analysis of the suggestions"
}`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      // Try to parse JSON response
      try {
        const suggestions = JSON.parse(
          response.replace(/```json\n?/g, "").replace(/```\n?/g, "")
        );
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
      if (!this.model) {
        throw new Error("AI Service not available");
      }

      const prompt = `Analyze the following domain name and provide detailed insights:

Domain: ${domain}
User Context: ${context}

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

Format as JSON with this structure:
{
  "domain": "${domain}",
  "scores": {
    "brandability": 8,
    "memorability": 7,
    "seo": 8,
    "relevance": 9,
    "overall": 8
  },
  "analysis": {
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "targetMarket": "description",
    "alternatives": ["alt1.com", "alt2.com"]
  }
}`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      try {
        return JSON.parse(
          response.replace(/```json\n?/g, "").replace(/```\n?/g, "")
        );
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
      if (!this.model) {
        throw new Error("AI Service not available");
      }

      const prompt = `You are a domain expert consultant. The user is asking: ${question}

User Context:
- Previous conversation: ${context.conversation || "First interaction"}
- User preferences: ${JSON.stringify(context.preferences || {})}
- Current domains of interest: ${
        context.domains?.join(", ") || "None specified"
      }

Provide helpful, expert advice about domain names, web presence, branding, or related topics.
Be conversational, helpful, and provide actionable insights.

If the user is asking about pricing, availability, or technical aspects, provide general guidance
but recommend they check current data through our system.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

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
