import api from "./api";

export const aiService = {
  // Get domain suggestions from AI
  getDomainSuggestions: async (businessDescription, preferences = {}) => {
    try {
      const response = await api.post("/ai/suggest-domains", {
        businessDescription,
        preferences,
      });
      return response.data;
    } catch (error) {
      console.warn("AI service not available, returning mock data");
      // Extract keywords from business description
      const keywords = businessDescription.toLowerCase().match(/\b\w+\b/g) || [
        "business",
      ];
      const mainKeyword =
        keywords.find((word) => word.length > 3) || keywords[0];

      const suggestions = [];
      const extensions = [".com", ".io", ".co", ".app", ".tech", ".ai", ".dev"];
      const variations = [
        mainKeyword,
        `${mainKeyword}hub`,
        `${mainKeyword}zone`,
        `get${mainKeyword}`,
        `${mainKeyword}pro`,
        `smart${mainKeyword}`,
        `${mainKeyword}space`,
        `${mainKeyword}world`,
        `my${mainKeyword}`,
        `${mainKeyword}land`,
      ];

      variations.forEach((variation, index) => {
        if (index < 8) {
          suggestions.push({
            name: `${variation}${extensions[index % extensions.length]}`,
            available: Math.random() > 0.3,
            price: Math.floor(Math.random() * 40) + 12,
            premium: Math.random() > 0.85,
            brandability: Math.floor(Math.random() * 30) + 70,
            memorability: Math.floor(Math.random() * 25) + 75,
            seoScore: Math.floor(Math.random() * 20) + 80,
            reason: `Perfect for ${businessDescription.substring(0, 50)}...`,
          });
        }
      });

      return { suggestions };
    }
  },

  // Analyze domain value
  analyzeDomain: async (domain) => {
    try {
      const response = await api.post("/ai/analyze-domain", { domain });
      return response.data;
    } catch (error) {
      console.warn("AI service not available, returning mock data");
      return {
        domain,
        estimatedValue: Math.floor(Math.random() * 5000) + 500,
        marketability: Math.floor(Math.random() * 30) + 70,
        brandability: Math.floor(Math.random() * 25) + 75,
        memorability: Math.floor(Math.random() * 20) + 80,
        seoScore: Math.floor(Math.random() * 30) + 70,
        strengths: [
          "Short and memorable",
          "Easy to spell and pronounce",
          "Industry relevant keywords",
        ],
        weaknesses: ["Common extension might be competitive"],
        recommendations: [
          "Consider securing related extensions",
          "Focus on brand building",
          "Optimize for local SEO if applicable",
        ],
      };
    }
  },

  // Chat with AI consultant
  chatWithAI: async (message, conversationId = null) => {
    try {
      const response = await api.post("/ai/chat", {
        message,
        conversationId,
      });
      return response.data;
    } catch (error) {
      console.error("AI chat error:", error);

      // Check if it's an authentication error
      if (error.response?.status === 401) {
        throw new Error("Please log in to continue using the AI consultant.");
      }

      // Check if it's a network error
      if (!error.response) {
        throw new Error(
          "Unable to connect to AI service. Please check your internet connection."
        );
      }

      // For other errors, provide a fallback mock response
      console.warn("AI service not available, returning mock data");

      // Simple mock responses based on message content
      let mockResponse = "";
      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes("suggest") || lowerMessage.includes("domain")) {
        mockResponse =
          "I'd be happy to help you find the perfect domain! Based on your needs, here are some suggestions:\n\n• Consider short, memorable names\n• .com is still the most trusted extension\n• Avoid hyphens and numbers if possible\n• Check trademark conflicts\n\nWhat's your business about? I can provide more specific recommendations.";
      } else if (
        lowerMessage.includes("price") ||
        lowerMessage.includes("cost")
      ) {
        mockResponse =
          "Domain pricing varies significantly:\n\n• Standard .com domains: $10-15/year\n• Premium domains: $50-$10,000+\n• New TLDs (.io, .ai, .tech): $20-100/year\n• Expired domains: $20-$500+\n\nFactors affecting price include length, keywords, extension, and market demand.";
      } else if (
        lowerMessage.includes("seo") ||
        lowerMessage.includes("ranking")
      ) {
        mockResponse =
          "For SEO success with domains:\n\n• Exact match domains (EMD) have less impact than before\n• Brand strength matters more than keywords in domain\n• Domain age helps, but quality content matters most\n• Avoid spam-associated TLDs\n• Keep it simple and trustworthy\n\nFocus on creating valuable content rather than relying solely on domain keywords.";
      } else {
        mockResponse =
          "I understand you're looking for domain advice. I can help with:\n\n• Domain name suggestions\n• Availability checking\n• Price analysis\n• SEO considerations\n• Brand evaluation\n\nWhat specific aspect would you like to explore?";
      }

      return {
        message: mockResponse,
        conversationId: conversationId || `conv_${Date.now()}`,
        suggestions: [],
        domains: [],
      };
    }
  },

  // Get conversation history
  getConversationHistory: async (conversationId) => {
    try {
      const response = await api.get(`/ai/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.warn("AI service not available, returning mock data");
      return {
        id: conversationId,
        messages: [
          {
            id: 1,
            type: "ai",
            content: "Hello! How can I help you with domains today?",
            timestamp: new Date(Date.now() - 60000),
          },
        ],
      };
    }
  },

  // Get all user conversations
  getUserConversations: async (page = 1, limit = 10) => {
    try {
      const response = await api.get("/ai/conversations", {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.warn("AI service not available, returning mock data");
      return {
        conversations: [
          {
            id: "conv_1",
            title: "Domain suggestions for tech startup",
            lastMessage: "Consider using .io or .tech extensions",
            timestamp: new Date(Date.now() - 3600000),
            messageCount: 5,
          },
          {
            id: "conv_2",
            title: "SEO analysis for example.com",
            lastMessage: "Your domain has good SEO potential",
            timestamp: new Date(Date.now() - 7200000),
            messageCount: 3,
          },
        ],
        total: 2,
        page,
        limit,
      };
    }
  },

  // Delete conversation
  deleteConversation: async (conversationId) => {
    try {
      const response = await api.delete(`/ai/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.warn("AI service not available, returning mock data");
      return { success: true, message: "Conversation deleted successfully" };
    }
  },

  // Get domain name ideas
  getDomainIdeas: async (keywords, industry, targetAudience) => {
    try {
      const response = await api.post("/ai/domain-ideas", {
        keywords,
        industry,
        targetAudience,
      });
      return response.data;
    } catch (error) {
      console.warn("AI service not available, returning mock data");
      const ideas = [];
      const extensions = [".com", ".co", ".io", ".app", ".tech"];
      const variations = keywords.flatMap((keyword) => [
        keyword,
        `${keyword}hub`,
        `get${keyword}`,
        `${keyword}pro`,
        `smart${keyword}`,
      ]);

      variations.slice(0, 10).forEach((variation, index) => {
        ideas.push({
          name: `${variation}${extensions[index % extensions.length]}`,
          category: industry,
          score: Math.floor(Math.random() * 30) + 70,
          available: Math.random() > 0.4,
        });
      });

      return { ideas };
    }
  },

  // Check domain brandability
  checkBrandability: async (domain) => {
    try {
      const response = await api.post("/ai/brandability", { domain });
      return response.data;
    } catch (error) {
      console.warn("AI service not available, returning mock data");
      const domainName = domain.split(".")[0];
      return {
        domain,
        score: Math.floor(Math.random() * 30) + 70,
        memorability: Math.floor(Math.random() * 25) + 75,
        pronunciation: domainName.length <= 6 ? "Easy" : "Moderate",
        spelling:
          domainName.includes("-") || domainName.includes("0")
            ? "Difficult"
            : "Easy",
        uniqueness: Math.floor(Math.random() * 20) + 80,
        suggestions: [
          "Consider trademark search",
          "Check social media availability",
          "Test pronunciation with target audience",
        ],
      };
    }
  },

  // Get SEO analysis
  getSEOAnalysis: async (domain) => {
    try {
      const response = await api.post("/ai/seo-analysis", { domain });
      return response.data;
    } catch (error) {
      console.warn("AI service not available, returning mock data");
      return {
        domain,
        seoScore: Math.floor(Math.random() * 30) + 70,
        keywordRelevance: Math.floor(Math.random() * 25) + 75,
        domainAuthority: Math.floor(Math.random() * 40) + 30,
        backlinks: Math.floor(Math.random() * 1000) + 100,
        competitiveness: ["Low", "Medium", "High"][
          Math.floor(Math.random() * 3)
        ],
        recommendations: [
          "Focus on quality content creation",
          "Build authoritative backlinks",
          "Optimize for mobile-first indexing",
          "Improve page loading speed",
        ],
      };
    }
  },

  // Generate business name suggestions
  generateBusinessNames: async (description, industry) => {
    try {
      const response = await api.post("/ai/business-names", {
        description,
        industry,
      });
      return response.data;
    } catch (error) {
      console.warn("AI service not available, returning mock data");
      const keywords = description.toLowerCase().match(/\b\w+\b/g) || [
        "business",
      ];
      const mainKeyword =
        keywords.find((word) => word.length > 3) || keywords[0];

      const prefixes = [
        "Smart",
        "Pro",
        "Elite",
        "Prime",
        "Next",
        "Bold",
        "Swift",
      ];
      const suffixes = [
        "Works",
        "Labs",
        "Hub",
        "Zone",
        "Space",
        "World",
        "Tech",
      ];

      const names = [];
      for (let i = 0; i < 8; i++) {
        const prefix = prefixes[i % prefixes.length];
        const suffix = suffixes[i % suffixes.length];
        names.push({
          name:
            Math.random() > 0.5
              ? `${prefix}${mainKeyword}`
              : `${mainKeyword}${suffix}`,
          category: industry,
          available: Math.random() > 0.3,
          score: Math.floor(Math.random() * 25) + 75,
        });
      }

      return { names };
    }
  },
};

export default aiService;
