import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { storage } from './storage';

interface GeneratedChallenge {
  title: string;
  description: string;
  challengeType: 'generic' | 'days_sober' | 'check_in_streak';
  totalSteps: number;
  startDate?: string;
  endDate?: string;
}

export async function generateChallengeIdeas(prompt: string, matchId: number): Promise<GeneratedChallenge[]> {
  try {
    // Get API key and initialize AI
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
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

    // Get match details to provide context
    const match = await storage.getMatch(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    // Get both users in the match
    const user1 = await storage.getUser(match.userId1);
    const user2 = await storage.getUser(match.userId2);
    
    if (!user1 || !user2) {
      throw new Error('One or both users in match not found');
    }

    // Create a system prompt with context about the users
    const systemPrompt = `
    You are a supportive accountability coach who creates personalized challenges for partners working on self-improvement.
    
    Here's information about the partners:
    User 1 interests: ${JSON.stringify(user1.interests || [])}
    User 2 interests: ${JSON.stringify(user2.interests || [])}
    
    I want you to create 3 challenge ideas based on the user's prompt.
    The challenges should be supportive, encouraging, and realistic.
    
    Your response should be in JSON format with an array of challenges objects with these fields:
    - title: A concise, motivating title for the challenge
    - description: A detailed description explaining the challenge purpose and how it will work
    - challengeType: Either "generic", "days_sober", or "check_in_streak"
    - totalSteps: Number of steps/milestones to complete the challenge (typically 3-5)
    
    Here are the challenge types:
    - generic: Standard challenge with defined steps
    - days_sober: For tracking sobriety. The system will automatically create milestones at 7, 30, 90, and 365 days.
    - check_in_streak: For daily check-ins. The system will track streaks and create milestones at 7, 30, and 100 days.
    
    For "days_sober" challenges, set totalSteps to 4.
    For "check_in_streak" challenges, set totalSteps to 3.
    For "generic" challenges, set an appropriate number between 3-10.
    
    Make sure each challenge is different and addresses the user's prompt.
    `;

    // Combine system prompt with user's prompt
    const fullPrompt = `${systemPrompt}
    
    User's prompt: ${prompt}
    
    Response (JSON format only):`;

    // Generate content
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonPattern = /```json([\s\S]*?)```|(\[[\s\S]*\])/;
    const match1 = text.match(jsonPattern);
    
    let jsonText = '';
    if (match1) {
      // Get the matched JSON string
      jsonText = match1[1] ? match1[1].trim() : match1[2].trim();
    } else {
      // If no JSON pattern, try to extract the entire response
      jsonText = text.trim();
    }

    // Try to parse the JSON
    let challenges: GeneratedChallenge[] = [];
    try {
      // Handle the case where the model might wrap the JSON in backticks or other formatting
      const cleanedJsonText = jsonText.replace(/^```json/, '').replace(/```$/, '');
      challenges = JSON.parse(cleanedJsonText);
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      // Try again with a more lenient approach - look for arrays
      const arrayPattern = /\[\s*{[\s\S]*}\s*\]/;
      const arrayMatch = text.match(arrayPattern);
      if (arrayMatch) {
        try {
          challenges = JSON.parse(arrayMatch[0]);
        } catch (innerError) {
          console.error('Failed to parse JSON with array extraction:', innerError);
          throw new Error('Failed to generate challenge suggestions. Please try again.');
        }
      } else {
        throw new Error('Failed to generate challenge suggestions. Please try again.');
      }
    }

    // Add start and end dates
    const now = new Date();
    const thirtyDaysLater = new Date(now);
    thirtyDaysLater.setDate(now.getDate() + 30);

    return challenges.map(challenge => ({
      ...challenge,
      startDate: now.toISOString(),
      endDate: thirtyDaysLater.toISOString()
    }));
  } catch (error) {
    console.error('Error in challenge generation:', error);
    throw error;
  }
}