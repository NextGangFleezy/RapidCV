# RapidCV - Resume Builder Application

## Overview

RapidCV is a modern, full-stack resume builder application that enables users to create professional resumes with AI-powered features. The application provides an intuitive interface for building resumes, generating cover letters, and analyzing job matches using AI technology. Now optimized for Vercel deployment with a flat folder structure.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds
- **Authentication**: Firebase Authentication integration

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for development, Vercel Functions for production
- **Database**: PostgreSQL with Drizzle ORM (in-memory storage for development)
- **Authentication**: Firebase Authentication (server-side verification)
- **AI Integration**: Anthropic Claude API for content generation
- **PDF Generation**: jsPDF for client and server-side PDF creation

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL adapter
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Migration Strategy**: Drizzle Kit for schema management

## Key Components

### Data Models
1. **Users**: Core user information with Firebase UID integration
2. **Resumes**: Complete resume data with JSON fields for structured content
3. **Cover Letters**: AI-generated cover letters linked to resumes and job descriptions
4. **Job Analyses**: AI-powered job matching and resume optimization suggestions

### Core Features
1. **Resume Builder**: Multi-step form with real-time preview
2. **Template System**: Professional and modern resume templates
3. **AI Cover Letter Generation**: Personalized cover letters based on job descriptions
4. **Job Analysis**: AI-powered resume-job matching with improvement suggestions
5. **PDF Export**: Client and server-side PDF generation capabilities

### UI Components
- Comprehensive component library using Radix UI primitives
- Responsive design with mobile-first approach
- Accessibility-focused implementation
- Dark/light theme support

## Data Flow

### User Authentication Flow
1. Firebase handles user authentication (sign-up/sign-in)
2. Backend creates/retrieves user record with Firebase UID
3. Frontend stores user session and handles protected routes

### Resume Creation Flow
1. User fills out multi-step resume form
2. Data is stored in structured JSON format in PostgreSQL
3. Real-time preview updates as user enters information
4. PDF generation available on-demand

### AI Integration Flow
1. **Cover Letter Generation**: Resume data + job description → Anthropic API → generated cover letter
2. **Job Analysis**: Resume data + job posting → Anthropic API → match analysis and suggestions

## External Dependencies

### Authentication & Database
- **Firebase**: User authentication and session management
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations

### AI & Content Generation
- **Anthropic Claude**: AI content generation for cover letters and job analysis
- **jsPDF**: PDF document generation

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless component primitives
- **Lucide React**: Icon library

### Development & Build Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the application
- **TanStack Query**: Server state management and caching

## Project Structure (Flat Folder for Vercel)

```
/
├── src/                    # React frontend code
│   ├── components/         # UI components
│   ├── pages/             # Route components
│   ├── lib/               # Utilities and configurations
│   └── hooks/             # Custom React hooks
├── server/                # Express backend (development)
├── api/                   # Vercel serverless functions
├── shared/                # Shared TypeScript schemas
├── public/                # Static assets
├── package.json           # Dependencies and scripts
├── vercel.json           # Vercel deployment config
├── vite.config.ts        # Frontend build configuration
└── index.html            # Entry point

```

## Deployment Strategy

### Development Environment
- Local development with Vite dev server
- In-memory storage for rapid prototyping
- Hot module replacement for rapid development

### Production Deployment (Vercel)
- **Frontend**: Static assets built with Vite
- **Backend**: Serverless functions in `/api` folder
- **Database**: PostgreSQL via Neon (when configured)
- **Build Process**: `vercel-build` script compiles frontend and backend

### Build Process
1. Frontend assets built with Vite to `dist/public`
2. API functions deployed as Vercel serverless functions
3. Static assets served from Vercel CDN

## Changelog
- July 1, 2025: Fixed post-authentication routing - all sign-in methods now properly redirect users to dashboard page after successful login
- July 1, 2025: Fixed PDF upload and live preview system - implemented proper pdf-parse library for reliable text extraction and immediate preview updates with forced state refresh mechanisms
- June 29, 2025: Enhanced resume builder with integrated job analyzer and file upload (PDF/Word docs up to 50MB) for streamlined resume optimization workflow
- June 29, 2025: Created comprehensive dashboard page with user overview, quick actions, recent documents, and account summary sections
- June 29, 2025: Implemented test account system (test@rapidcv.com / test123) for easy authentication testing
- June 29, 2025: Enhanced authentication with popup/redirect fallback system and improved error handling for better user experience
- June 29, 2025: Fixed Google sign-in by switching from redirect-based to popup-based authentication for better reliability and user experience
- June 29, 2025: Removed AI-powered career tools section and job match analyzer from landing page for maximum simplicity
- June 29, 2025: Simplified landing page by removing all demo samples and interactive elements, focusing on clear explanations of tool functionality
- June 29, 2025: Replaced complex resume builder demo with simple 3-step "How It Works" section
- June 29, 2025: Converted AI tools section from interactive demos to feature benefit lists with clear call-to-action buttons
- June 29, 2025: Created comprehensive debugging system in admin panel with Firebase debug, performance monitoring, error tracking, and diagnostic tools
- June 29, 2025: Added error boundaries and performance monitoring components for system stability
- June 29, 2025: Moved all debugging components from homepage to dedicated admin panel for proper organization
- June 27, 2025: Implemented dual authentication system with email/password and Google sign-in options to resolve Firebase redirect issues
- June 27, 2025: Added comprehensive authentication debugging tools and user-friendly error handling
- June 27, 2025: Fixed Firebase "invalid-continue-uri" error by providing fallback email authentication
- June 26, 2025: Updated business model to freemium with 2 free basic resume builds + upload, paid AI features ($5-15/mo)
- June 26, 2025: Implemented Google sign-in/sign-up with Firebase authentication system for user acquisition and trial management
- June 26, 2025: Added freemium model pricing section to landing page with clear Free ($0) and Pro ($5-15/mo) tier distinction
- June 26, 2025: COMPLETELY RESOLVED all runtime issues - corrected Vercel runtime configuration, fixed TypeScript errors, optimized build process
- June 26, 2025: FULLY RESOLVED Vercel build timeout issue - replaced Lucide React with React Icons, reducing build time from 60+ seconds to ~5 seconds  
- June 26, 2025: FULLY RESOLVED Vercel deployment issue - fixed function runtime configuration and optimized dependency installation
- June 26, 2025: Fixed ES module compatibility issue with import.meta.dirname  
- June 26, 2025: Created GitHub deployment files (README.md, LICENSE, .env.example, DEPLOYMENT.md)
- June 26, 2025: Updated to flat folder structure with centralized dependencies in root package.json
- June 26, 2025: Fixed DOM nesting issues in navigation component
- June 25, 2025: Initial setup

## User Preferences

- **Dependency Management**: Keep all package.json files and dependencies centralized in the root folder
- **Communication Style**: Simple, everyday language
- **Admin Features**: Created comprehensive admin dashboard with direct backend tool access, including data management buttons, API testing, system monitoring, and one-click administrative functions
- **Business Model**: Freemium with 2 free basic resume builds (with upload), then paid subscription ($5-15/mo) for unlimited resumes and AI features (cover letters, job analysis, content suggestions)