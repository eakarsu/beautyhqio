// OpenRouter AI Client for Beauty & Wellness AI
// Supports multiple AI models through OpenRouter API

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface AIGenerateOptions {
  messages: OpenRouterMessage[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

class OpenRouterClient {
  private apiKey: string;
  private model: string;
  private baseUrl = "https://openrouter.ai/api/v1";

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || "";
    this.model = process.env.OPENROUTER_MODEL || "anthropic/claude-3-haiku";
  }

  async generate(options: AIGenerateOptions): Promise<string> {
    const { messages, maxTokens = 1024, temperature = 0.7 } = options;

    if (!this.apiKey) {
      throw new Error("OpenRouter API key is not configured");
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "Beauty & Wellness AI",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const data: OpenRouterResponse = await response.json();
    return data.choices[0]?.message?.content || "";
  }

  // No-Show Prediction
  async predictNoShow(appointmentData: {
    clientName: string;
    clientHistory: {
      totalAppointments: number;
      noShows: number;
      lastVisit: string | null;
      averageSpend: number;
    };
    appointmentDetails: {
      service: string;
      date: string;
      time: string;
      dayOfWeek: string;
    };
  }): Promise<{
    riskLevel: "low" | "medium" | "high";
    probability: number;
    reasons: string[];
    recommendations: string[];
  }> {
    const prompt = `You are an AI assistant for a beauty and wellness salon. Analyze the following appointment data and predict the likelihood of a no-show.

Client: ${appointmentData.clientName}
Client History:
- Total appointments: ${appointmentData.clientHistory.totalAppointments}
- Previous no-shows: ${appointmentData.clientHistory.noShows}
- Last visit: ${appointmentData.clientHistory.lastVisit || "Never"}
- Average spend: $${appointmentData.clientHistory.averageSpend.toFixed(2)}

Appointment Details:
- Service: ${appointmentData.appointmentDetails.service}
- Date: ${appointmentData.appointmentDetails.date}
- Time: ${appointmentData.appointmentDetails.time}
- Day: ${appointmentData.appointmentDetails.dayOfWeek}

Respond in JSON format with:
{
  "riskLevel": "low" | "medium" | "high",
  "probability": number between 0 and 100,
  "reasons": ["reason1", "reason2"],
  "recommendations": ["recommendation1", "recommendation2"]
}`;

    const response = await this.generate({
      messages: [
        {
          role: "system",
          content: "You are an expert at analyzing customer behavior and predicting appointment attendance. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Could not parse AI response");
    } catch {
      return {
        riskLevel: "medium",
        probability: 50,
        reasons: ["Unable to analyze - insufficient data"],
        recommendations: ["Send reminder 24 hours before appointment"],
      };
    }
  }

  // Style Recommendation
  async getStyleRecommendation(clientData: {
    name: string;
    preferences?: string;
    previousServices: string[];
    hairType?: string;
    skinType?: string;
    lifestyle?: string;
  }): Promise<{
    recommendations: {
      service: string;
      description: string;
      reason: string;
      confidence: number;
    }[];
    personalizedTips: string[];
    productsToConsider: string[];
  }> {
    const prompt = `You are a professional beauty and wellness consultant. Based on the following client information, provide personalized style and service recommendations.

Client: ${clientData.name}
Preferences: ${clientData.preferences || "Not specified"}
Previous Services: ${clientData.previousServices.join(", ") || "None"}
Hair Type: ${clientData.hairType || "Not specified"}
Skin Type: ${clientData.skinType || "Not specified"}
Lifestyle: ${clientData.lifestyle || "Not specified"}

Provide 3-5 service recommendations with explanations. Respond in JSON format:
{
  "recommendations": [
    {
      "service": "service name",
      "description": "brief description",
      "reason": "why this suits the client",
      "confidence": number 1-100
    }
  ],
  "personalizedTips": ["tip1", "tip2"],
  "productsToConsider": ["product1", "product2"]
}`;

    const response = await this.generate({
      messages: [
        {
          role: "system",
          content: "You are a professional beauty consultant with expertise in hair, skin, nails, and wellness. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Could not parse AI response");
    } catch {
      return {
        recommendations: [],
        personalizedTips: ["Schedule a consultation for personalized recommendations"],
        productsToConsider: [],
      };
    }
  }

  // Analyze Face Photo for Style Recommendations
  async analyzePhotoForStyle(preferences: {
    hairLength?: string;
    hairType?: string;
    lifestyle?: string;
    maintenance?: string;
    notes?: string;
  }): Promise<{
    faceShape: string;
    recommendations: {
      id: string;
      name: string;
      description: string;
      confidence: number;
      tags: string[];
      colorSuggestions: string[];
    }[];
  }> {
    const prompt = `You are an expert hair stylist and beauty consultant. Based on the following client preferences, recommend 3 personalized hairstyles.

Client Preferences:
- Preferred Hair Length: ${preferences.hairLength || "Open to anything"}
- Hair Type: ${preferences.hairType || "Not specified"}
- Lifestyle: ${preferences.lifestyle || "Not specified"}
- Maintenance Level: ${preferences.maintenance || "Medium"}
- Additional Notes: ${preferences.notes || "None"}

Analyze the preferences and determine a likely face shape, then provide hairstyle recommendations.

Respond in JSON format:
{
  "faceShape": "Oval/Round/Square/Heart/Oblong/Diamond",
  "recommendations": [
    {
      "id": "1",
      "name": "Hairstyle Name",
      "description": "Detailed description of the style and why it suits the client",
      "confidence": 0.85,
      "tags": ["Length Tag", "Style Tag", "Maintenance Tag"],
      "colorSuggestions": ["Color 1", "Color 2"]
    }
  ]
}

Provide 3 recommendations sorted by confidence (highest first). Make the descriptions detailed and personalized based on the preferences provided.`;

    const response = await this.generate({
      messages: [
        {
          role: "system",
          content: "You are a professional hair stylist and beauty consultant with expertise in face shape analysis and personalized style recommendations. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 2048,
    });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Could not parse AI response");
    } catch {
      return {
        faceShape: "Oval",
        recommendations: [
          {
            id: "1",
            name: "Classic Layers",
            description: "A versatile layered cut that works with most face shapes and hair types.",
            confidence: 0.85,
            tags: ["Medium Length", "Layered", "Versatile"],
            colorSuggestions: ["Natural Highlights", "Balayage"],
          },
        ],
      };
    }
  }

  // Message Generator
  async generateMessage(options: {
    type: "appointment_reminder" | "follow_up" | "promotion" | "birthday" | "thank_you" | "reactivation";
    clientName: string;
    businessName: string;
    details?: Record<string, string>;
    tone?: "professional" | "friendly" | "casual";
    language?: string;
  }): Promise<{
    subject?: string;
    message: string;
    smsVersion: string;
  }> {
    const typeDescriptions = {
      appointment_reminder: "Remind the client about their upcoming appointment",
      follow_up: "Follow up after their recent visit",
      promotion: "Inform about a special promotion or offer",
      birthday: "Wish them a happy birthday with a special offer",
      thank_you: "Thank them for their visit or loyalty",
      reactivation: "Reach out to a client who hasn't visited in a while",
    };

    const prompt = `Generate a ${options.tone || "friendly"} ${options.type.replace("_", " ")} message for a beauty/wellness salon.

Business: ${options.businessName}
Client: ${options.clientName}
Purpose: ${typeDescriptions[options.type]}
${options.details ? `Additional Details: ${JSON.stringify(options.details)}` : ""}
${options.language ? `Language: ${options.language}` : "Language: English"}

Respond in JSON format:
{
  "subject": "email subject line",
  "message": "full email/message body (2-3 paragraphs)",
  "smsVersion": "short SMS version (under 160 characters)"
}`;

    const response = await this.generate({
      messages: [
        {
          role: "system",
          content: "You are a marketing expert for beauty and wellness businesses. Create engaging, professional messages that drive customer engagement. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
    });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Could not parse AI response");
    } catch {
      return {
        subject: "Message from " + options.businessName,
        message: `Dear ${options.clientName}, thank you for being a valued customer. We look forward to seeing you soon!`,
        smsVersion: `Hi ${options.clientName}! Thanks for choosing ${options.businessName}. See you soon!`,
      };
    }
  }

  // Review Response Generator
  async generateReviewResponse(review: {
    clientName: string;
    rating: number;
    reviewText: string;
    service?: string;
    staffMember?: string;
    businessName: string;
  }): Promise<{
    response: string;
    tone: string;
    keyPoints: string[];
  }> {
    const prompt = `Generate a professional response to this customer review for a beauty/wellness salon.

Business: ${review.businessName}
Client: ${review.clientName}
Rating: ${review.rating}/5 stars
Review: "${review.reviewText}"
${review.service ? `Service: ${review.service}` : ""}
${review.staffMember ? `Staff Member: ${review.staffMember}` : ""}

Guidelines:
- For positive reviews (4-5 stars): Express gratitude, mention specifics from review, invite back
- For negative reviews (1-2 stars): Apologize sincerely, address concerns, offer to make it right
- For neutral reviews (3 stars): Thank them, address any concerns, highlight improvements

Respond in JSON format:
{
  "response": "the full response text",
  "tone": "grateful/apologetic/understanding",
  "keyPoints": ["point addressed 1", "point addressed 2"]
}`;

    const response = await this.generate({
      messages: [
        {
          role: "system",
          content: "You are a customer service expert specializing in reputation management for beauty and wellness businesses. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Could not parse AI response");
    } catch {
      return {
        response: `Thank you for your feedback, ${review.clientName}. We appreciate you taking the time to share your experience with us.`,
        tone: "grateful",
        keyPoints: ["Thanked customer"],
      };
    }
  }

  // Translation
  async translate(text: string, targetLanguage: string, context?: string): Promise<{
    translation: string;
    detectedSourceLanguage: string;
  }> {
    const prompt = `Translate the following text to ${targetLanguage}.
${context ? `Context: This is for a beauty/wellness salon. ${context}` : "Context: This is for a beauty/wellness salon."}

Text to translate:
"${text}"

Respond in JSON format:
{
  "translation": "translated text",
  "detectedSourceLanguage": "detected language name"
}`;

    const response = await this.generate({
      messages: [
        {
          role: "system",
          content: "You are a professional translator specializing in beauty and wellness industry terminology. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Could not parse AI response");
    } catch {
      return {
        translation: text,
        detectedSourceLanguage: "Unknown",
      };
    }
  }

  // Smart Business Insights
  async getBusinessInsights(data: {
    revenue: { current: number; previous: number };
    appointments: { current: number; previous: number };
    topServices: string[];
    lowPerformingServices: string[];
    clientRetention: number;
    averageTicket: number;
  }): Promise<{
    summary: string;
    insights: { category: string; finding: string; impact: "positive" | "negative" | "neutral"; action: string }[];
    recommendations: string[];
  }> {
    const prompt = `Analyze the following salon business metrics and provide actionable insights.

Revenue: $${data.revenue.current.toLocaleString()} (previous period: $${data.revenue.previous.toLocaleString()})
Appointments: ${data.appointments.current} (previous period: ${data.appointments.previous})
Top Services: ${data.topServices.join(", ")}
Underperforming Services: ${data.lowPerformingServices.join(", ")}
Client Retention Rate: ${data.clientRetention}%
Average Ticket: $${data.averageTicket.toFixed(2)}

Provide business insights in JSON format:
{
  "summary": "2-3 sentence executive summary",
  "insights": [
    {
      "category": "Revenue/Appointments/Services/Retention",
      "finding": "specific finding",
      "impact": "positive/negative/neutral",
      "action": "recommended action"
    }
  ],
  "recommendations": ["prioritized recommendation 1", "recommendation 2", "recommendation 3"]
}`;

    const response = await this.generate({
      messages: [
        {
          role: "system",
          content: "You are a business analyst specializing in beauty and wellness industry. Provide data-driven insights and actionable recommendations. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
    });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Could not parse AI response");
    } catch {
      return {
        summary: "Analysis in progress. Please ensure sufficient data is available.",
        insights: [],
        recommendations: ["Continue monitoring key metrics"],
      };
    }
  }
}

// Export singleton instance
export const openRouter = new OpenRouterClient();
export default openRouter;

// Simple chat function for direct message arrays
export async function openRouterChat(
  messages: OpenRouterMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  return openRouter.generate({
    messages,
    maxTokens: options?.maxTokens ?? 2048,
    temperature: options?.temperature ?? 0.7,
  });
}
