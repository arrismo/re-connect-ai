
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
   git clone https://github.com/yourusername/supportmatch.git
   cd supportmatch
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
   PGDATABASE=supportmatch
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

1. **User 1**:
   - Email: `david@gmail.com`
   - Password: `password123`
   - Profile: Recovery mentor with 100+ days sober

2. **User 2**:
   - Email: `test2@example.com`
   - Password: `test123`
   - Profile: Recovery enthusiast seeking support

## System Architecture

```
┌─────────────────┐     ┌───────────────────┐     ┌─────────────────┐
│                 │     │                   │     │                 │
│  React Frontend │────▶│  Express Backend  │────▶│  PostgreSQL DB  │
│                 │◀────│                   │◀────│                 │
└─────────────────┘     └───────────────────┘     └─────────────────┘
       │    ▲                  │      ▲
       │    │                  │      │
       ▼    │                  ▼      │
┌─────────────────┐     ┌─────────────────────┐
│                 │     │                     │
│   WebSockets    │     │   Google Gemini AI  │
│   (Real-time)   │     │                     │
└─────────────────┘     └─────────────────────┘
```

The application follows a modern full-stack architecture:

1. **Frontend**: React application with responsive design for both desktop and mobile experiences
2. **Backend**: Express.js server managing authentication, business logic, and data persistence
3. **Database**: PostgreSQL with Drizzle ORM for type-safe data operations
4. **AI Integration**: Google Gemini AI for intelligent matching, username generation, and contextual suggestions
5. **Real-time Communication**: WebSockets for instant notifications and live chat functionality
6. **Mobile Optimization**: Fully responsive design with drawer navigation and touch-friendly UI components

## Project Structure

- `/client`: React frontend application
  - `/src/components`: Reusable UI components
    - `/src/components/challenges`: Challenge-related components
    - `/src/components/meetings`: Meeting finder components
    - `/src/components/matches`: Match-related components
    - `/src/components/messages`: Messaging components
    - `/src/components/ui`: Shadcn UI components  
  - `/src/pages`: Application routes/pages
    - `/src/pages/auth`: Authentication pages (login, registration)
    - `/src/pages/dashboard.tsx`: Main user dashboard
    - `/src/pages/settings.tsx`: User profile and settings
    - `/src/pages/group-challenges.tsx`: Group challenges page
    - `/src/pages/meetings.tsx`: Meeting finder page
  - `/src/hooks`: Custom React hooks
    - `/src/hooks/useAuth.tsx`: Authentication hook
    - `/src/hooks/useToast.tsx`: Toast notifications
    - `/src/hooks/useWebSocket.tsx`: WebSocket connection management
  - `/src/lib`: Utility functions and client-side configs
  - `/src/layouts`: Layout components including AppShell for consistent UI

- `/server`: Express backend
  - `routes.ts`: API endpoints and request handlers
  - `auth.ts`: Authentication logic with Passport.js
  - `ai.ts`: AI matching service with Gemini integration
  - `DatabaseStorage.ts`: Database implementation of storage interface
  - `storage.ts`: Storage interface definition
  - `db.ts`: Database connection configuration
  - `seed.ts`: Initial data seeding
  - `challenge-generator.ts`: Challenge generation with AI
  - `research-service.ts`: Research content generation

- `/shared`: Shared TypeScript types and schemas
  - `schema.ts`: Database schema definitions with Drizzle ORM
    - User, Match, Challenge, Message models
    - Meeting, MeetingAttendee models
    - GroupChallenge, GroupChallengeParticipant models

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

### Meeting Finder
- Location-based search for AA meetings in your area
- Interactive map display with meeting details
- Calendar integration for scheduling and reminders
- Meeting check-in functionality to track attendance
- Community ratings and reviews for meeting locations
- Filtering options by meeting type, time, and accessibility

### Group Challenges
- Community-wide challenges open to multiple participants
- Leaderboards to track progress among participants
- Challenge categories focused on sobriety and wellness
- Public and private challenge options
- Step-based progress tracking
- Achievement rewards and point system
- Customizable challenge parameters (duration, difficulty)

### Research & Resources
- Evidence-based articles on recovery principles
- Information about the effectiveness of accountability partnerships
- Context-sensitive suggestions throughout the app
- AI-powered content recommendations based on user journey
- Searchable resource library for self-education

### Mobile Optimization
- Responsive layout adapts to different screen sizes
- Slide-out drawer navigation for mobile devices
- Bottom navigation bar for quick access to key features
- Touch-friendly UI elements with appropriate sizing
- Optimized forms and inputs for mobile interaction
- Efficient data loading for limited bandwidth scenarios
- High contrast design for outdoor readability
- Swipe gestures for common actions
- Native-like experience through PWA capabilities

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
