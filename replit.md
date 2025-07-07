# Smart E-learning System - Replit Agent Guide

## Overview

This is a Smart E-learning System powered by AI (Google Gemini) that provides personalized learning experiences with predictive analytics. The system features two main user roles: students who can enroll in courses and track their progress, and administrators who can manage courses and view analytics.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Chart.js for data visualization

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **AI Integration**: Google Gemini API for predictive analytics

### Database Design
- **ORM**: Drizzle ORM with schema-first approach
- **Database**: PostgreSQL (via Neon serverless)
- **Migrations**: Managed through Drizzle Kit
- **Session Storage**: PostgreSQL-backed sessions

## Key Components

### User Management
- **Authentication**: Replit Auth integration with session management
- **User Roles**: Admin and Student roles with different access levels
- **Profile Management**: User profiles with social login support

### Course Management
- **Course Structure**: Courses contain lessons and quizzes
- **Content Types**: Video lessons, text content, and interactive quizzes
- **Progress Tracking**: Detailed tracking of user progress through courses

### AI-Powered Features
- **Dropout Prediction**: Analyzes user engagement patterns
- **Performance Prediction**: Predicts future course performance
- **Content Recommendations**: Suggests relevant courses and materials
- **Learning Path Suggestions**: Recommends next courses based on progress
- **Quiz Hints**: AI-generated hints for quiz questions
- **Admin Analytics**: Comprehensive insights for administrators

### Assessment System
- **Quiz Types**: Multiple choice, text input, and essay questions
- **Attempt Tracking**: Records all quiz attempts with timestamps
- **Scoring**: Automatic scoring with detailed feedback

## Data Flow

1. **User Authentication**: Users log in through Replit Auth
2. **Course Enrollment**: Students browse and enroll in courses
3. **Learning Activity**: Users watch videos, complete lessons, take quizzes
4. **Progress Tracking**: System records all learning activities
5. **AI Analysis**: Gemini API analyzes user data for insights
6. **Recommendations**: AI generates personalized recommendations
7. **Admin Analytics**: Aggregated data presented to administrators

## External Dependencies

### Core Dependencies
- **@google/genai**: Google Gemini API integration
- **@neondatabase/serverless**: PostgreSQL database connection
- **@tanstack/react-query**: Server state management
- **express**: Web server framework
- **drizzle-orm**: Database ORM

### UI Dependencies
- **@radix-ui/***: Headless UI components
- **tailwindcss**: Utility-first CSS framework
- **chart.js**: Data visualization library
- **lucide-react**: Icon library

### Authentication
- **passport**: Authentication middleware
- **openid-client**: OpenID Connect implementation
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Development
- **Command**: `npm run dev`
- **Hot Reload**: Vite development server with HMR
- **Database**: Development database with schema pushing

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild bundles server code
- **Database**: Production PostgreSQL database
- **Environment**: NODE_ENV=production

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: Google Gemini API key
- `SESSION_SECRET`: Session encryption secret
- `REPLIT_DOMAINS`: Replit authentication domains
- `ISSUER_URL`: OpenID Connect issuer URL

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- July 07, 2025: Enhanced Smart E-learning Platform with Advanced Features
  - **Course Catalog Expansion**: Added 8 new courses covering JavaScript, Python, CSS, Database Design, Mobile Development, Cloud Computing, Cybersecurity, and AI Fundamentals
  - **Enhanced Course Browsing**: Implemented advanced filtering by category, difficulty, and sorting options with grid/list view modes
  - **Adaptive Quiz System**: Created AI-powered adaptive questioning that adjusts difficulty based on student performance history
  - **Advanced Video Player**: Added video navigation features including:
    - Chapter/segment navigation with timestamps
    - Playback speed controls (0.5x to 2x)
    - Bookmark system for important moments
    - Skip forward/backward (10s intervals)
    - Progress indicators for video segments
  - **Expanded Quiz Questions**: Added 26 total quiz questions across all courses with varying difficulty levels
  - **AI Learning Analytics**: Enhanced Gemini integration with adaptive question generation and learning pattern analysis
  - **Improved Student Dashboard**: Modern UI with comprehensive stats, search, and filtering capabilities
  - **Performance Optimizations**: Better TypeScript types and error handling throughout the application

## Sample Data Included

### Courses Available:
1. Introduction to Web Development (Beginner, Programming)
2. Data Science with Python (Intermediate, Data Science)
3. Advanced React Development (Advanced, Programming)
4. Digital Marketing Fundamentals (Beginner, Marketing)
5. Machine Learning Basics (Intermediate, Data Science)
6. UI/UX Design Principles (Beginner, Design)

### Features Demonstrated:
- Course browsing and enrollment
- Video lesson watching with progress tracking
- Interactive quizzes with multiple question types
- AI-powered personalized course recommendations
- Dropout risk prediction based on learning patterns
- Admin analytics dashboard with engagement metrics
- Real-time AI insights and alerts for administrators

## Changelog

Changelog:
- July 07, 2025: Smart E-learning Platform fully implemented with AI features