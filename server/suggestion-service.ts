import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { User, Match, Challenge, ChallengeProgress, Message } from "@shared/schema";

export interface SuggestionContext {
  contextType: 'chat' | 'challenge' | 'match' | 'dashboard';
  user?: User;
  match?: Match;
  otherUser?: User;
  challenge?: Challenge;
  userProgress?: ChallengeProgress;
  partnerProgress?: ChallengeProgress;
  recentMessages?: Message[];
  additionalContext?: Record<string, any>;
}

export interface Suggestion {
  id: string;
  text: string;
  type: 'encouragement' | 'tip' | 'question' | 'reminder' | 'resource';
  priority: 'low' | 'medium' | 'high';
  expiresAt?: Date;
}

class SuggestionService {
  private model: any = null;
  private initialized = false;

  async initialize(apiKey: string) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      this.model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro", // Updated to use the latest model name
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });
      
      this.initialized = true;
      console.log("Suggestion service initialized with Gemini AI model");
      return true;
    } catch (error) {
      console.error("Failed to initialize suggestion service:", error);
      return false;
    }
  }

  async generateSuggestions(context: SuggestionContext): Promise<Suggestion[]> {
    if (!this.initialized || !this.model) {
      console.warn("Suggestion service not initialized");
      return [];
    }

    try {
      // Build prompt based on context
      const prompt = this.buildContextualPrompt(context);
      
      // Generate suggestions using Gemini AI
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Parse response into suggestion objects
      return this.parseSuggestions(text);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      return [];
    }
  }

  private buildContextualPrompt(context: SuggestionContext): string {
    let prompt = '';
    const { contextType, user, match, otherUser, challenge, userProgress, partnerProgress, recentMessages } = context;

    // Base instructions
    prompt = `Generate 2-3 contextually relevant, supportive, and helpful suggestion bubbles for a recovery support app user focused on alcohol addiction recovery. 
Format each suggestion as a JSON array with objects having these fields:
- text: The actual suggestion text (30-60 characters) that provides support for alcohol addiction recovery
- type: One of these categories: "encouragement", "tip", "question", "reminder", or "resource"
- priority: "low", "medium", or "high" based on relevance

Focus on sobriety maintenance, coping strategies for alcohol cravings, celebrating milestones in recovery, and general wellbeing during recovery.

Current context: ${contextType}\n\n`;

    // Add user context
    if (user) {
      prompt += `User: ${user.displayName} (interests: ${user.interests?.join(', ') || 'None specified'})\n`;
    }

    // Add match context
    if (match && otherUser) {
      prompt += `Current match: ${otherUser.displayName}\n`;
      prompt += `Match status: ${match.status}\n`;
      
      if (match.matchDetails) {
        prompt += `Match details: ${match.matchDetails}\n`;
      }
    }

    // Add challenge context
    if (challenge) {
      prompt += `Current challenge: "${challenge.title}"\n`;
      prompt += `Challenge description: ${challenge.description}\n`;
      prompt += `Challenge type: ${challenge.challengeType}\n`;
      
      // Add progress information
      if (userProgress) {
        const stepsCompleted = userProgress.stepsCompleted || 0;
        const completion = (stepsCompleted / challenge.totalSteps) * 100;
        prompt += `User progress: ${stepsCompleted}/${challenge.totalSteps} steps (${completion.toFixed(0)}%)\n`;
        
        if (challenge.challengeType === 'days_sober') {
          prompt += `Days sober: ${userProgress.daysSober || 0}\n`;
        } else if (challenge.challengeType === 'check_in_streak') {
          prompt += `Current streak: ${userProgress.currentStreak || 0} days\n`;
          prompt += `Longest streak: ${userProgress.longestStreak || 0} days\n`;
        }
      }
      
      if (partnerProgress) {
        const stepsCompleted = partnerProgress.stepsCompleted || 0;
        const partnerCompletion = (stepsCompleted / challenge.totalSteps) * 100;
        prompt += `Partner progress: ${stepsCompleted}/${challenge.totalSteps} steps (${partnerCompletion.toFixed(0)}%)\n`;
      }
    }

    // Add recent messages context (for chat)
    if (contextType === 'chat' && recentMessages && recentMessages.length > 0) {
      prompt += `\nRecent conversation (last ${Math.min(recentMessages.length, 5)} messages):\n`;
      
      // Only include the last 5 messages for context
      const messages = recentMessages.slice(-5);
      
      for (const msg of messages) {
        const sender = msg.senderId === user?.id ? "User" : "Partner";
        prompt += `${sender}: ${msg.content}\n`;
      }
    }

    // Add dashboard-specific context
    if (contextType === 'dashboard') {
      prompt += `\nThis is for the dashboard view where the user sees an overview of their activity.\n`;
      prompt += `Focus on overall encouragement, reminders about recovery principles, and general wellness tips.\n`;
    }

    // Add additional instructions based on context type
    switch (contextType) {
      case 'chat':
        prompt += `\nFor chat context, provide suggestions to deepen conversation, encourage meaningful exchange, or prompt supportive communication related to recovery topics.`;
        break;
      case 'challenge':
        prompt += `\nFor challenge context, provide suggestions that motivate progress, overcome barriers, or celebrate milestones.`;
        break;
      case 'match':
        prompt += `\nFor match context, provide suggestions that help build connections, find common ground, or spark meaningful interactions.`;
        break;
      case 'dashboard':
        prompt += `\nFor dashboard context, provide general wellness tips, reminders about recovery principles, or encouragement to engage with the app features.`;
        break;
    }

    prompt += `\n\nResponse should ONLY include the JSON array with 2-3 suggestion objects and nothing else.`;
    
    return prompt;
  }

  private parseSuggestions(text: string): Suggestion[] {
    try {
      // Try to find the JSON array directly in the text
      let jsonText = text;
      
      // Find where JSON array starts and ends
      const startBracket = text.indexOf('[');
      const endBracket = text.lastIndexOf(']');
      
      if (startBracket >= 0 && endBracket > startBracket) {
        jsonText = text.substring(startBracket, endBracket + 1);
      }
      
      // Clean up any markdown formatting or text outside the JSON
      jsonText = jsonText.replace(/```json|```|`/g, '').trim();
      
      // Parse the JSON
      const suggestions = JSON.parse(jsonText);
      
      // Validate and transform the suggestions
      return Array.isArray(suggestions) ? suggestions.map((suggestion, index) => ({
        id: `sugg_${Date.now()}_${index}`,
        text: suggestion.text || 'No suggestion text',
        type: this.validateType(suggestion.type),
        priority: this.validatePriority(suggestion.priority),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60) // Expire after 1 hour
      })) : [];
    } catch (error) {
      console.error('Error parsing suggestions:', error);
      console.error('Response text:', text);
      return [];
    }
  }

  private validateType(type: string): Suggestion['type'] {
    const validTypes: Suggestion['type'][] = ['encouragement', 'tip', 'question', 'reminder', 'resource'];
    return validTypes.includes(type as any) ? type as Suggestion['type'] : 'tip';
  }

  private validatePriority(priority: string): Suggestion['priority'] {
    const validPriorities: Suggestion['priority'][] = ['low', 'medium', 'high'];
    return validPriorities.includes(priority as any) ? priority as Suggestion['priority'] : 'medium';
  }
}

export const suggestionService = new SuggestionService();