import { storage } from "./storage";

/**
 * Seeds the database with initial data
 */
export async function seedDatabase() {
  try {
    console.log("Seeding database with initial data...");
    
    // Seed interests
    const interests = [
      { name: "Anxiety Management", category: "Mental Health" },
      { name: "Depression Support", category: "Mental Health" },
      { name: "Stress Reduction", category: "Mental Health" },
      { name: "Fitness Goals", category: "Health" },
      { name: "Weight Management", category: "Health" },
      { name: "Nutrition", category: "Health" },
      { name: "Career Development", category: "Professional" },
      { name: "Time Management", category: "Professional" },
      { name: "Work-Life Balance", category: "Professional" },
      { name: "Personal Finance", category: "Life Skills" },
      { name: "Relationship Issues", category: "Life Skills" },
      { name: "Parenting Support", category: "Life Skills" },
      { name: "Addiction Recovery", category: "Recovery" },
      { name: "Grief Processing", category: "Recovery" },
      { name: "Trauma Support", category: "Recovery" },
      { name: "Creative Projects", category: "Personal Growth" },
      { name: "Learning New Skills", category: "Personal Growth" },
      { name: "Habit Building", category: "Personal Growth" }
    ];
    
    // Check existing interests to avoid duplicates
    const existingInterests = await storage.getAllInterests();
    const existingNames = existingInterests.map(i => i.name);
    
    // Add any new interests
    for (const interest of interests) {
      if (!existingNames.includes(interest.name)) {
        await storage.createInterest(interest);
        console.log(`Created interest: ${interest.name}`);
      }
    }
    
    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}