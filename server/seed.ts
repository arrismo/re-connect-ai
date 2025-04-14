import { storage } from "./storage";
import { hashPassword } from "./auth";

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
    
    // Get current user count
    const allUsers = await storage.getAllUsers();
    if (allUsers.length <= 1) {
      // Seed test users for matching
      const testUsers = [
        {
          username: "testuser1",
          password: "password123",
          displayName: "Alex Johnson",
          email: "test1@example.com",
          bio: "Looking for support with anxiety and career growth",
          interests: ["Anxiety Management", "Career Development", "Time Management"],
          goals: ["Reduce anxiety levels", "Get a promotion"],
          experiences: ["5 years in IT industry", "Overcame public speaking fears"],
        },
        {
          username: "testuser2",
          password: "password123",
          displayName: "Sam Taylor",
          email: "test2@example.com",
          bio: "Fitness enthusiast dealing with work stress",
          interests: ["Fitness Goals", "Stress Reduction", "Nutrition"],
          goals: ["Improve work-life balance", "Run a marathon"],
          experiences: ["Personal trainer certification", "Meditation practice"],
        },
        {
          username: "testuser3",
          password: "password123",
          displayName: "Jordan Smith",
          email: "test3@example.com",
          bio: "Creative professional seeking personal growth",
          interests: ["Creative Projects", "Learning New Skills", "Work-Life Balance"],
          goals: ["Learn a new language", "Publish a book"],
          experiences: ["10 years in design", "Photography hobbyist"],
        }
      ];
      
      // Create test users
      for (const userData of testUsers) {
        const existingUser = await storage.getUserByUsername(userData.username);
        if (!existingUser) {
          const hashedPassword = await hashPassword(userData.password);
          await storage.createUser({
            ...userData,
            password: hashedPassword
          });
          console.log(`Created test user: ${userData.username}`);
        }
      }
    }
    
    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}