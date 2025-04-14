import { User } from "@shared/schema";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

export interface MatchRecommendation {
  userId: number;
  displayName: string;
  profilePic?: string;
  matchScore: number;
  sharedInterests: string[];
  memberSince: string; // ISO date string
}

class AIService {
  private model: GenerativeModel | null = null;

  initialize(genAI: GoogleGenerativeAI) {
    try {
      // Initialize the model
      this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log("Gemini AI model initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Gemini AI model:", error);
      this.model = null;
    }
  }
  
  async generateAnonymousUsername(interests: string[] = [], characteristics: string[] = []): Promise<string> {
    if (!this.model) {
      console.warn("AI model not initialized, using fallback username generation");
      return this.fallbackUsernameGeneration(interests, characteristics);
    }
    
    try {
      // Create a prompt that will generate anonymous but meaningful usernames
      const prompt = `
        Generate a single anonymous but meaningful username for a person in a support community.
        
        ${interests.length > 0 ? `Their interests include: ${interests.join(', ')}` : ''}
        ${characteristics.length > 0 ? `Their personality traits include: ${characteristics.join(', ')}` : ''}
        
        The username should:
        - Be anonymous (no real names)
        - Be supportive and positive in tone
        - Not contain any numbers
        - Be between 8-15 characters
        - Not contain inappropriate words
        - Be a single word or words connected by underscores
        - Not be generic like "anonymous_user" or "support_seeker"
        - Be unique and memorable
        
        IMPORTANT: You must ONLY return the username as plain text without quotes, explanations, or additional text.
        DO NOT include any explanations, quotes, or additional text. Just return the username and nothing else.
      `;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let username = response.text().trim();
      
      // Remove any quotes or explanations, focusing just on a potential username
      username = username.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
      username = username.split(/[\n\r]/)[0]; // Take only the first line
      
      // If the username is too long or contains spaces, clean it up
      if (username.includes(' ')) {
        username = username.replace(/\s+/g, '_');
      }
      
      // Remove any special characters except underscores
      username = username.replace(/[^a-zA-Z0-9_]/g, '');
      
      // Ensure username is not too long or too short
      if (username.length > 15) {
        username = username.substring(0, 15);
      } else if (username.length < 8) {
        // Add a suffix to make it longer
        const suffixes = ['_journey', '_path', '_hope', '_support', '_growth'];
        username += suffixes[Math.floor(Math.random() * suffixes.length)];
      }
      
      console.log("Generated username:", username);
      return username;
    } catch (error) {
      console.error("Error generating username with AI:", error);
      return this.fallbackUsernameGeneration(interests, characteristics);
    }
  }
  
  private fallbackUsernameGeneration(interests: string[] = [], characteristics: string[] = []): string {
    // Use predefined components to create a username when AI fails
    const prefixes = ['brave', 'hope', 'healing', 'rising', 'steady', 'growing', 'journey', 'path', 'forward', 'upward'];
    const suffixes = ['seeker', 'walker', 'traveler', 'fighter', 'supporter', 'believer', 'dreamer', 'achiever'];
    
    // Try to incorporate interests if available
    let interestWord = '';
    if (interests.length > 0) {
      const interest = interests[Math.floor(Math.random() * interests.length)].toLowerCase();
      // Extract a relevant word from the interest (e.g., "Anxiety Management" -> "calm")
      if (interest.includes('anxiety')) interestWord = 'calm';
      else if (interest.includes('depression')) interestWord = 'bright';
      else if (interest.includes('addiction')) interestWord = 'free';
      else if (interest.includes('stress')) interestWord = 'peace';
      else if (interest.includes('grief')) interestWord = 'memory';
      else interestWord = '';
    }
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    // Combine components
    let username = interestWord ? 
      `${prefix}_${interestWord}_${suffix}` : 
      `${prefix}_${suffix}`;
    
    // Ensure username is not too long
    if (username.length > 15) {
      username = `${prefix}_${suffix}`;
    }
    
    console.log("Generated fallback username:", username);
    return username;
  }

  async findMatches(
    user: User,
    potentialMatches: User[],
    filterInterests: string[] = [],
  ): Promise<MatchRecommendation[]> {
    if (!this.model) {
      console.warn("AI model not initialized, using fallback match algorithm");
      return this.fallbackMatchAlgorithm(
        user,
        potentialMatches,
        filterInterests,
      );
    }

    try {
      // Filter potential matches if specific interests are provided
      let filteredMatches = potentialMatches;
      if (filterInterests.length > 0) {
        filteredMatches = potentialMatches.filter((match) => {
          if (!match.interests) return false;
          return filterInterests.some(
            (interest) => match.interests && match.interests.includes(interest),
          );
        });
      }

      // If no matches left after filtering, return empty array
      if (filteredMatches.length === 0) {
        return [];
      }

      // Prepare data for AI analysis
      const userProfile = {
        goals: user.goals || [],
        interests: user.interests || [],
        experiences: user.experiences || [],
      };

      const potentialMatchesProfiles = filteredMatches.map((match) => ({
        id: match.id,
        displayName: match.displayName,
        goals: match.goals || [],
        interests: match.interests || [],
        experiences: match.experiences || [],
        profilePic: match.profilePic,
        createdAt: match.createdAt?.toISOString(),
      }));

      // Craft prompt for the AI
      const prompt = `
        I need to find the best support matches for a user based on complementary experiences and shared goals.
        
        Here is the user's profile data:
        ${JSON.stringify(userProfile, null, 2)}
        
        Here are the potential matches:
        ${JSON.stringify(potentialMatchesProfiles, null, 2)}
        
        For each potential match, analyze:
        1. Goal alignment (are they trying to achieve similar things?)
        2. Complementary experiences (does one person have experience that could help the other?)
        3. Shared interests
        
        Calculate a match score (0-100) for each potential match.
        
        IMPORTANT: You must ONLY return a valid JSON array without any explanation or commentary.
        The response should be ONLY this JSON array and nothing else:
        [
          {
            "userId": number,
            "matchScore": number,
            "sharedInterests": string[]
          },
          {
            "userId": number,
            "matchScore": number,
            "sharedInterests": string[]
          }
        ]
        
        Sort by match score from highest to lowest, and return only matches with a score above 50.
        DO NOT INCLUDE ANY TEXT BEFORE OR AFTER THE JSON ARRAY. The response should start with '[' and end with ']'.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract the JSON array from the response
      // The AI might include explanatory text, so we need to carefully extract just the JSON part
      console.log("AI response:", text.substring(0, 100) + "..."); // Log the beginning of the response
      
      let aiRecommendations: any[] = [];
      
      // Try multiple JSON parsing strategies
      // Strategy 1: Direct JSON parsing
      try {
        aiRecommendations = JSON.parse(text);
        console.log("Successfully parsed direct JSON response");
      } catch (error) {
        console.log("Direct JSON parsing failed, trying alternative methods");
        
        // Strategy 2: Extract JSON array using regex
        try {
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            aiRecommendations = JSON.parse(jsonMatch[0]);
            console.log("Successfully parsed JSON using regex match");
          } else {
            console.log("Could not find JSON array pattern in response");
            
            // Strategy 3: Try to fix common JSON formatting issues
            // Remove markdown code blocks
            const cleanedText = text.replace(/```json|```/g, '').trim();
            try {
              aiRecommendations = JSON.parse(cleanedText);
              console.log("Successfully parsed JSON after removing markdown");
            } catch (cleanError) {
              console.log("Clean JSON parsing failed");
              
              // Strategy 4: Last resort - try to extract just the array portion with more aggressive cleaning
              try {
                const bracketMatch = cleanedText.match(/\[[\s\S]*\]/);
                if (bracketMatch) {
                  // Further clean the content inside brackets
                  const arrayText = bracketMatch[0]
                    .replace(/(\r\n|\n|\r)/gm, "") // Remove newlines
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .trim();
                  
                  aiRecommendations = JSON.parse(arrayText);
                  console.log("Successfully parsed JSON with aggressive cleaning");
                } else {
                  throw new Error("Could not extract JSON array");
                }
              } catch (finalError) {
                console.error("All JSON parsing strategies failed");
                // Fall back to fallback algorithm by throwing
                throw new Error("Unable to parse AI response");
              }
            }
          }
        } catch (regexError) {
          console.error("Regex JSON extraction failed");
          throw new Error("Unable to extract valid JSON from AI response");
        }
      }

      // Format and return results
      return aiRecommendations
        .map((rec: any) => {
          const match = filteredMatches.find((m) => m.id === rec.userId);
          if (!match) return null;

          return {
            userId: match.id,
            displayName: match.displayName || "User",
            profilePic: match.profilePic || "",
            matchScore: rec.matchScore,
            sharedInterests: rec.sharedInterests || [],
            memberSince: match.createdAt
              ? match.createdAt.toISOString().split("T")[0]
              : "recent",
          };
        })
        .filter((item): item is MatchRecommendation => item !== null);
    } catch (error) {
      console.error("AI matching error:", error);
      return this.fallbackMatchAlgorithm(
        user,
        potentialMatches,
        filterInterests,
      );
    }
  }

  // Fallback algorithm when AI is not available
  private fallbackMatchAlgorithm(
    user: User,
    potentialMatches: User[],
    filterInterests: string[] = [],
  ): MatchRecommendation[] {
    console.log(
      `Fallback algorithm called. User ID: ${user.id}, Potential matches: ${potentialMatches.length}, Filter interests: ${filterInterests.join(", ")}`,
    );

    // Validate user
    if (!user || typeof user.id !== "number" || isNaN(user.id)) {
      console.error("Invalid user in fallback algorithm:", user);
      return [];
    }

    // Filter by interests if specified
    let filteredMatches = potentialMatches;
    if (filterInterests.length > 0) {
      console.log(
        `Filtering matches by interests: ${filterInterests.join(", ")}`,
      );
      filteredMatches = potentialMatches.filter((match) => {
        // Skip invalid matches
        if (!match || typeof match.id !== "number" || isNaN(match.id)) {
          console.error("Invalid match found:", match);
          return false;
        }

        if (!match.interests) return false;
        return filterInterests.some(
          (interest) => match.interests && match.interests.includes(interest),
        );
      });
      console.log(`Filtered to ${filteredMatches.length} matches`);
    }

    // Calculate match scores with validation
    const safeRecommendations: MatchRecommendation[] = [];

    // Process each potential match
    for (const match of filteredMatches) {
      // Validate match ID
      if (typeof match.id !== "number" || isNaN(match.id)) {
        console.error(
          `Invalid match ID: ${match.id}, Type: ${typeof match.id}`,
        );
        continue; // Skip this match
      }

      // Count shared interests
      const userInterests = user.interests || [];
      const matchInterests = match.interests || [];
      const sharedInterests = userInterests.filter((interest) =>
        matchInterests.includes(interest),
      );

      // Count shared goals
      const userGoals = user.goals || [];
      const matchGoals = match.goals || [];
      const sharedGoals = userGoals.filter((goal) => matchGoals.includes(goal));

      // Calculate score (simple algorithm)
      let score = 0;
      if (userInterests.length > 0) {
        score += (sharedInterests.length / userInterests.length) * 50;
      }
      if (userGoals.length > 0) {
        score += (sharedGoals.length / userGoals.length) * 50;
      }

      // Add a small random factor (±10%)
      const randomFactor = 0.9 + Math.random() * 0.2;
      score = Math.min(100, Math.round(score * randomFactor));

      // Validate score
      if (isNaN(score)) {
        console.error("Invalid score calculation:", {
          userInterests: userInterests.length,
          matchInterests: matchInterests.length,
          sharedInterests: sharedInterests.length,
          userGoals: userGoals.length,
          matchGoals: matchGoals.length,
          sharedGoals: sharedGoals.length,
        });
        score = 50; // Default fallback score
      }

      // Only add if score is at least 50
      if (score >= 50) {
        const recommendation: MatchRecommendation = {
          userId: match.id,
          displayName: match.displayName || "User",
          profilePic: match.profilePic || "",
          matchScore: score,
          sharedInterests,
          memberSince: match.createdAt
            ? match.createdAt.toISOString().split("T")[0]
            : "recent",
        };

        console.log(
          `Generated recommendation for user ${match.id}: Score ${score}, Shared interests: ${sharedInterests.length}`,
        );
        safeRecommendations.push(recommendation);
      }
    }

    // Sort by match score (highest first)
    return safeRecommendations.sort((a, b) => b.matchScore - a.matchScore);
  }
}

export const aiService = new AIService();
