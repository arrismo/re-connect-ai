
# Reconnect - Community Support Matchmaking

A web application that intelligently connects people with accountability partners who share similar challenges and have complementary experiences, creating a supportive community for personal growth.

## Features

- 🤝 Smart Partner Matching: AI-powered matching system that considers goals, interests, and experiences
- 💪 Accountability Challenges: Create and participate in challenges with your matched partner
- 💬 Real-time Chat: Direct messaging with your accountability partner
- 🏆 Achievement System: Earn points and achievements as you progress
- 📊 Progress Tracking: Monitor your growth and engagement
- 🔒 Privacy-Focused: Designed to maintain user privacy while enabling meaningful connections

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Express.js + TypeScript
- Database: PostgreSQL with Drizzle ORM
- AI: Google Gemini AI (gemini-1.5-flash model) for intelligent matching
- UI: Tailwind CSS + Shadcn/ui components
- Authentication: Session-based auth with Passport.js
- State Management: TanStack Query (React Query)
- Routing: Wouter (lightweight router)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google Gemini API key (from Google AI Studio)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/reconnect.git
   cd reconnect
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables by creating a `.env` file in the root directory:
   ```
   # Database connection
   DATABASE_URL=url
   PGHOST=localhost
   PGUSER=username
   PGPASSWORD=password
   PGDATABASE=reconnect
   PGPORT=port
   
   # Google Gemini API
   GEMINI_API_KEY=your_gemini_api_key
   
   # Session secret
   SESSION_SECRET=your_random_secret_key
   ```

4. Initialize the database schema
   ```bash
   npm run db:push
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## System Architecture

```
┌─────────────────┐     ┌───────────────────┐     ┌─────────────────┐
│                 │     │                   │     │                 │
│  React Frontend │────▶│  Express Backend  │────▶│  PostgreSQL DB  │
│                 │◀────│                   │◀────│                 │
└─────────────────┘     └───────────────────┘     └─────────────────┘
                               │      ▲
                               │      │
                               ▼      │
                        ┌─────────────────────┐
                        │                     │
                        │   Google Gemini AI  │
                        │                     │
                        └─────────────────────┘
```

The application follows a modern full-stack architecture:

1. **Frontend**: React application handles UI rendering, state management and user interactions
2. **Backend**: Express.js server manages business logic, authentication, and data persistence
3. **Database**: PostgreSQL stores all application data with Drizzle ORM for type-safe queries
4. **AI Service**: Google Gemini AI provides intelligent match recommendations based on user profiles

## Project Structure

- `/client`: React frontend application
  - `/src/components`: Reusable UI components
  - `/src/pages`: Application routes/pages
  - `/src/hooks`: Custom React hooks (useAuth, useToast, etc.)
  - `/src/lib`: Utility functions and client-side configs
  - `/src/layouts`: Layout components like AppShell

- `/server`: Express backend
  - `routes.ts`: API endpoints and request handlers
  - `auth.ts`: Authentication logic with Passport.js
  - `ai.ts`: AI matching service with Gemini integration
  - `storage.ts`: Database operations interface
  - `db.ts`: Database connection configuration
  - `seed.ts`: Initial data seeding

- `/shared`: Shared TypeScript types and schemas
  - `schema.ts`: Database schema definitions with Drizzle

## Features in Detail

### AI-Powered Match Making
- Uses Google's Gemini AI (gemini-1.5-flash model) to analyze user profiles
- Performs deep analysis of shared interests, complementary experiences, and aligned goals
- Calculates compatibility scores based on multiple factors
- Provides personalized match recommendations with justification
- Includes fallback algorithm when AI service is unavailable or for low-latency initial results
- Interest-based filtering to find matches with specific shared interests
- Match requests and acceptance flow with notification system

### Accountability Challenges
- Create custom challenges with specific goals and timeframes
- Track progress for both partners with step completion tracking
- Joint rewards that incentivize mutual support and accountability
- Achievement rewards upon completion to gamify personal growth
- Challenge templates for common growth objectives

### Profile System
- Privacy-focused customizable user profiles
- Comprehensive interest and goal settings across multiple categories:
  - Mental Health (Anxiety, Depression, Stress)
  - Physical Health (Fitness, Nutrition, Weight Management)
  - Professional (Career Development, Time Management)
  - Personal Growth (Learning, Habits, Creativity)
  - Recovery (Addiction, Grief, Trauma)
- Experience sharing for peer support
- Activity tracking and engagement metrics

### Messaging & Communication
- Real-time private messaging between matched partners
- Read receipts and typing indicators
- Message history and search functionality
- Support for sharing challenge updates and progress



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

## Contributing

Contributions are welcome! Feel free to submit issues and enhancement requests.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request
