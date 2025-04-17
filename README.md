[![Netlify Status](https://api.netlify.com/api/v1/badges/c7242398-ae5c-4e17-b652-62ebd587996f/deploy-status)](https://app.netlify.com/sites/reconnect-ai/deploys)

# ReConnect AI - Alcohol Recovery Community Platform

A specialized web application for alcohol addiction recovery that intelligently connects users with accountability partners who share similar challenges and have complementary experiences, creating a supportive community focused on sobriety and personal growth.

## Features

- 🤝 AI-Powered Matching: Smart partner matching system that considers recovery goals, interests, and experiences
- 💪 Personalized Challenges: Create and participate in challenges with your matched partner, including specialized "days sober" and "check-in streak" tracking
- 🌟 Group Challenges: Join community-wide challenges with leaderboards and group accountability
- 💬 Real-time Chat: Private messaging with your accountability partner for ongoing support
- 🏆 Achievement System: Earn points and achievements as you progress through your recovery journey
- 📊 Progress Tracking: Monitor your sobriety streaks and engagement metrics
- 🔒 Privacy-Focused: Maintain anonymity with AI-generated usernames while enabling meaningful connections
- 🗺️ Meeting Finder: Discover local AA meetings with location search, calendar integration, and check-in capabilities
- 📚 Research Hub: Access evidence-based resources about AA principles and accountability partnerships
- 📱 Mobile-Friendly: Fully responsive design with touch-friendly interactions for on-the-go support

## Tech Stack

The application follows a modern full-stack architecture:

1. **Frontend**: React application with responsive design for both desktop and mobile experiences
2. **Backend**: Express.js server managing authentication, business logic, and data persistence
3. **Database**: PostgreSQL with Drizzle ORM for type-safe data operations
4. **AI Integration**: Google Gemini AI for intelligent matching, username generation, and contextual suggestions
5. **Real-time Communication**: WebSockets for instant notifications and live chat functionality
6. **Mobile Optimization**: Fully responsive design with drawer navigation and touch-friendly UI components

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google Gemini API key (from Google AI Studio)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/arrismo/re-connect-ai
   cd re-connect-ai
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables by creating a `.env` file in the root directory:
   ```
   # Database connection
   DATABASE_URL=postgres://username:password@hostname:port/database
   PGHOST=hostname
   PGUSER=username
   PGPASSWORD=password
   PGDATABASE=db
   PGPORT=5432
   
   # Google Gemini API
   GEMINI_API_KEY=your_gemini_api_key
   
   # Session secret (for secure cookies)
   SESSION_SECRET=your_random_secret_key
   ```

   Note: To obtain a Gemini API key:
   1. Visit [Google AI Studio](https://makersuite.google.com/)
   2. Create an account or sign in with your Google account
   3. Navigate to the API keys section
   4. Create a new API key for the Gemini model
   5. Copy the key to your `.env` file

4. Initialize the database schema
   ```bash
   npm run db:push
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

### Demo Accounts

For testing the application, you can use these pre-configured accounts:


   **User 2**:
   - Email: `test2@example.com`
   - Password: `test123`



## Deployment

The application can be deployed to any platform that supports Node.js and PostgreSQL:

1. Build the production version:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```
