[![Netlify Status](https://api.netlify.com/api/v1/badges/c7242398-ae5c-4e17-b652-62ebd587996f/deploy-status)](https://app.netlify.com/sites/reconnect-ai/deploys)

# ReConnect AI - Cancer Support Community Platform


1. **Frontend**: React application with responsive design for both desktop and mobile experiences
2. **Backend**: Express.js server managing authentication, business logic, and data persistence
3. **Database**: PostgreSQL with Drizzle ORM for type-safe data operations
4. **AI Integration**: Google Gemini AI for intelligent matching, username generation, and contextual suggestions

## Getting Started
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
   ```


4. Start the development server
   ```bash
   npm run dev
   ```

