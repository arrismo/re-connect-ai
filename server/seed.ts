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
        // Special test user for development login
        {
          username: "testuser",
          password: "test123",
          displayName: "Test User",
          email: "test@example.com",
          bio: "Test account for development",
          interests: ["Addiction Recovery", "Habit Building"],
          goals: ["Stay sober", "Build healthy habits"],
          experiences: ["Recovery journey", "Community support"],
        },
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

    // Get all meetings to check if we need to seed
    const allMeetings = await storage.getAllMeetings();
    if (allMeetings.length === 0) {
      // Seed sample AA meetings with realistic coordinates for testing
      const sampleMeetings = [
        {
          name: "Early Birds AA Group",
          description: "Morning meeting focused on daily meditation and sharing",
          meetingType: "aa",
          address: "123 Recovery Way",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "USA",
          latitude: 40.7128,
          longitude: -74.0060,
          dayOfWeek: 1, // Monday
          startTime: "07:30",
          endTime: "08:30",
          isRecurring: true,
          frequency: "weekly",
          contactPhone: "212-555-1234",
          contactEmail: "earlybirds@example.com",
          website: "https://aarecovery.org/earlybirds"
        },
        {
          name: "Serenity Now Group",
          description: "Discussion-based meeting with focus on step work",
          meetingType: "aa",
          address: "456 Serenity Boulevard",
          city: "New York",
          state: "NY",
          zipCode: "10002",
          country: "USA",
          latitude: 40.7282,
          longitude: -73.9942,
          dayOfWeek: 2, // Tuesday
          startTime: "19:00",
          endTime: "20:30",
          isRecurring: true,
          frequency: "weekly",
          contactPhone: "212-555-5678",
          contactEmail: "serenitynow@example.com",
          website: "https://aarecovery.org/serenitynow"
        },
        {
          name: "Gratitude AA Group",
          description: "Beginner-friendly open discussion meeting",
          meetingType: "aa",
          address: "789 Thankful Street",
          city: "Brooklyn",
          state: "NY",
          zipCode: "11201",
          country: "USA",
          latitude: 40.6958,
          longitude: -73.9850,
          dayOfWeek: 3, // Wednesday
          startTime: "18:00",
          endTime: "19:30",
          isRecurring: true,
          frequency: "weekly",
          contactPhone: "718-555-1212",
          contactEmail: "gratitude@example.com",
          website: "https://aarecovery.org/gratitude"
        },
        {
          name: "One Day at a Time Group",
          description: "Speaker meeting with sharing time afterward",
          meetingType: "aa",
          address: "321 Present Avenue",
          city: "Jersey City",
          state: "NJ",
          zipCode: "07302",
          country: "USA",
          latitude: 40.7216,
          longitude: -74.0437,
          dayOfWeek: 4, // Thursday
          startTime: "19:30",
          endTime: "21:00",
          isRecurring: true,
          frequency: "weekly",
          contactPhone: "201-555-3434",
          contactEmail: "onedayatatime@example.com",
          website: "https://aarecovery.org/onedayatatime"
        },
        {
          name: "Higher Power Fellowship",
          description: "Spiritual focus with meditation and prayer",
          meetingType: "aa",
          address: "555 Faith Circle",
          city: "Hoboken",
          state: "NJ",
          zipCode: "07030",
          country: "USA",
          latitude: 40.7439,
          longitude: -74.0323,
          dayOfWeek: 5, // Friday
          startTime: "20:00",
          endTime: "21:30",
          isRecurring: true,
          frequency: "weekly",
          contactPhone: "201-555-8787",
          contactEmail: "higherpower@example.com",
          website: "https://aarecovery.org/higherpower"
        }
      ];

      // Create sample meetings
      for (const meetingData of sampleMeetings) {
        await storage.createMeeting(meetingData);
        console.log(`Created sample meeting: ${meetingData.name}`);
      }
    }
    
    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}