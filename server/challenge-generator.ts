import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { storage } from "./storage";
import { User, Match } from "@shared/schema";
import 'dotenv/config';

interface GeneratedChallenge {
  title: string;
  description: string;
  challengeType: 'generic' | 'days_sober' | 'check_in_streak';
  totalSteps: number;
  startDate?: string;
  endDate?: string;
}

/**
 * Generates challenge ideas using the Gemini API based on the match details
 */
export async function generateChallengeIdeas(prompt: string, matchId: number): Promise<GeneratedChallenge[]> {
  try {
    // Get match details to provide context
    const match = await storage.getMatch(matchId);
    if (!match) {
      throw new Error(`Match with ID ${matchId} not found`);
    }
    
    const user1 = await storage.getUser(match.userId1);
    const user2 = await storage.getUser(match.userId2);
    
    if (!user1 || !user2) {
      throw new Error("Could not find both users in this match");
    }
    
    // Use the Gemini API to generate challenge ideas
    const challengeIdeas = await generateWithGemini(user1, user2, match, prompt);
    
    // Return the ideas
    return challengeIdeas;
  } catch (error) {
    console.error("Error generating challenge ideas:", error);
    throw error;
  }
}

/**
 * Uses the Gemini API to generate challenge ideas based on user profiles and match details
 */
async function generateWithGemini(
  user1: User, 
  user2: User, 
  match: Match, 
  prompt?: string
): Promise<GeneratedChallenge[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Get the model
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { temperature: 0.7 },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
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
  
  // Extract relevant user information safely
  const userInfo1 = {
    displayName: user1.displayName,
    interests: user1.interests || [],
    goals: user1.goals || [],
    experiences: user1.experiences || [],
  };
  
  const userInfo2 = {
    displayName: user2.displayName,
    interests: user2.interests || [],
    goals: user2.goals || [],
    experiences: user2.experiences || [],
  };
  
  // Create a prompt for the Gemini API focused on alcohol addiction recovery
  const geminiPrompt = `
    You are an alcohol addiction recovery specialist and accountability partner expert. Generate 3 challenges specifically focused on supporting alcohol sobriety and recovery for two people who are working together as accountability partners.

    User 1: ${JSON.stringify(userInfo1)}
    User 2: ${JSON.stringify(userInfo2)}
    Match Score: ${match.matchScore}
    
    ${prompt || ""}
    
    Create 3 unique alcohol recovery-focused challenges they can do together. For each challenge, include:
    1. A title (keep it under 50 characters)
    2. A description (2-3 sentences explaining the challenge and how it helps with alcohol recovery)
    3. Challenge type (one of these three types):
       - "generic" (normal challenge with steps)
       - "days_sober" (for tracking sobriety days)
       - "check_in_streak" (for building a daily check-in habit)
    4. Total steps (a number between 3-7 for generic challenges, 4 for days_sober challenges to represent milestones at 7/30/90/365 days, or 3 for check_in_streak challenges to represent milestones at 7/30/100 days)
   
    Format your response as a valid JSON array of objects, with each object having these exact fields:
    [
      {
        "title": "Challenge title",
        "description": "Challenge description",
        "challengeType": "generic|days_sober|check_in_streak",
        "totalSteps": 5
      },
      ...
    ]
    
    IMPORTANT: All challenges MUST be directly related to alcohol addiction recovery. Always include at least one "days_sober" challenge to help users track their sobriety journey.
  `;

  try {
    const result = await model.generateContent(geminiPrompt);
    const text = result.response.text();
    
    // Try to parse the JSON response
    try {
      // Extract JSON from the response if needed - using non-s flag compatible regex
      const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      const jsonText = jsonMatch ? jsonMatch[0] : text;
      
      // Parse the JSON
      const challenges = JSON.parse(jsonText);
      
      // Validate and clean up the challenges
      return challenges.map((challenge: any) => ({
        title: challenge.title || "Untitled Challenge",
        description: challenge.description || "No description provided.",
        challengeType: ['generic', 'days_sober', 'check_in_streak'].includes(challenge.challengeType) 
          ? challenge.challengeType 
          : 'generic',
        totalSteps: typeof challenge.totalSteps === 'number' && challenge.totalSteps > 0 
          ? challenge.totalSteps 
          : 5,
      })).slice(0, 3); // Ensure we return at most 3 challenges
      
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.log("Raw response:", text);
      
      // Return fallback alcohol recovery challenges if we can't parse the JSON
      return [
        {
          title: "Sobriety Tracking",
          description: "Track your days of sobriety and celebrate key milestones together. Share daily wins and challenges to maintain accountability.",
          challengeType: "days_sober",
          totalSteps: 4  // Represents 7/30/90/365 day milestones
        },
        {
          title: "Trigger Identification & Management",
          description: "Work together to identify personal triggers for alcohol cravings and develop healthy coping strategies. Document and share your progress daily.",
          challengeType: "check_in_streak",
          totalSteps: 3
        },
        {
          title: "Sober Activities Discovery",
          description: "Discover and engage in five new activities that are enjoyable without alcohol. Share your experiences and feedback with your accountability partner.",
          challengeType: "generic",
          totalSteps: 5
        }
      ];
    }
  } catch (apiError) {
    console.error("Error calling Gemini API:", apiError);
    throw new Error("Failed to generate challenge ideas. Please try again later.");
  }
}