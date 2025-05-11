import { storage } from "./storage";
import { hashPassword } from "./auth";

/**
 * Seeds the database with initial data
 */console.log("Top of seed.ts");
// Call the seeding function when this script is executed directly
console.log("About to call seedDatabase()");
seedDatabase().catch(e => {
  console.error("Top-level error:", e);
});

export async function seedDatabase() {
  try {
    console.log("Seeding database with initial data...");
    
    // Seed interests
    const interests = [
      { name: "Cancer Support", category: "Cancer" },
      { name: "Cancer Survivorship", category: "Cancer" },
      { name: "Managing Treatment Side Effects", category: "Cancer" },
      { name: "Nutrition for Cancer Patients", category: "Health" },
      { name: "Physical Activity During Cancer", category: "Health" },
      { name: "Emotional Wellbeing (Cancer)", category: "Mental Health" },
      { name: "Peer Support (Cancer)", category: "Cancer" },
      { name: "Caregiver Support", category: "Cancer" },
      { name: "Financial Resources (Cancer)", category: "Cancer" },
      { name: "Mindfulness for Cancer", category: "Mental Health" },
      { name: "Returning to Work After Cancer", category: "Professional" },
      { name: "Body Image and Self-Esteem (Cancer)", category: "Personal Growth" },
      { name: "Grief and Loss (Cancer)", category: "Cancer" },
      { name: "Fertility and Cancer", category: "Health" },
      { name: "Genetic Counseling", category: "Cancer" },
      { name: "Managing Fatigue (Cancer)", category: "Health" }
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
        // Special test user for development login
        {
          username: "testuser",
          password: "test123",
          displayName: "Test User",
          email: "test@example.com",
          bio: "Test account for development",
          interests: ["Cancer Support", "Peer Support (Cancer)", "Managing Treatment Side Effects"],
          goals: ["Connect with other cancer survivors", "Learn to manage treatment side effects"],
          experiences: ["Cancer survivorship", "Peer support group participant"],
        },
        {
          username: "testuser1",
          password: "password123",
          displayName: "Alex Johnson",
          email: "test1@example.com",
          bio: "Looking for support with cancer diagnosis and treatment",
          interests: ["Cancer Support", "Nutrition for Cancer Patients", "Physical Activity During Cancer"],
          goals: ["Complete cancer treatment", "Improve physical health"],
          experiences: ["Cancer diagnosis", "Oncology treatment"],
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
          // For the special test user, use a pre-hashed password
          let hashedPassword;
          if (userData.username === 'testuser') {
            // This is a pre-hashed 'test123' password with known salt for easier testing
            hashedPassword = '83276b7e784cce9b492e31ace7ca8d8f5ded5d24d6c59a2b53b7d0852ec9a98e3409d1fe8414e0031b52791ad817b759bc4eddbe3d18ffd23abccb71fcbbee68.1234567890abcdef';
            console.log('Using pre-hashed password for test user');
          } else {
            // For other users, hash the password normally
            hashedPassword = await hashPassword(userData.password);
          }
          
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