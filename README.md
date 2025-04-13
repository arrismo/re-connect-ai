
# Reconnect - Community Support Matchmaking

A web application that helps people find and connect with accountability partners who share their goals and have complementary experiences.

## Features

- 🤝 Smart Partner Matching: AI-powered matching system that considers goals, interests, and experiences
- 💪 Accountability Challenges: Create and participate in challenges with your matched partner
- 💬 Real-time Chat: Direct messaging with your accountability partner
- 🏆 Achievement System: Earn points and achievements as you progress
- 📊 Progress Tracking: Monitor your growth and engagement

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Express.js + TypeScript
- Database: PostgreSQL with Drizzle ORM
- AI: Google Gemini AI for intelligent matching
- UI: Tailwind CSS + Shadcn/ui components
- Authentication: Passport.js with local strategy

## Getting Started

1. Clone the project
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - `GEMINI_API_KEY`: Google Gemini API key
   - Database connection details

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Project Structure

- `/client`: React frontend application
  - `/src/components`: Reusable UI components
  - `/src/pages`: Application routes/pages
  - `/src/hooks`: Custom React hooks
  - `/src/lib`: Utility functions and configurations

- `/server`: Express backend
  - `routes.ts`: API endpoints
  - `auth.ts`: Authentication logic
  - `ai.ts`: AI matching service
  - `storage.ts`: Database operations

- `/shared`: Shared TypeScript types and schemas

## Features in Detail

### Match Making
- AI-powered compatibility scoring
- Interest-based filtering
- Match requests and acceptance flow

### Challenges
- Create custom challenges
- Track progress for both partners
- Achievement rewards upon completion

### Profile System
- Customizable user profiles
- Interest and goal settings
- Experience sharing

### Points & Achievements
- Earn points through engagement
- Unlock achievements for milestones
- Track progress and history

## Contributing

Feel free to submit issues and enhancement requests.
