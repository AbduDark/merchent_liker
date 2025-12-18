# CampaignPro - Campaign Management Platform

## Overview

CampaignPro is a social media campaign management platform designed for merchants, with a focus on Arabic RTL interface. The platform enables merchants to manage Facebook marketing campaigns, automate engagement (likes/comments), and track campaign performance through a dashboard. The system uses encrypted storage for social account credentials and includes subscription-based access control.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, built with Vite
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state, React Context for auth and theme
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming, supporting light/dark modes
- **Design System**: RTL-first Arabic interface using Cairo font, following Linear/Material/Stripe hybrid design principles

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON API with session-based authentication
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **Build Tool**: esbuild for server bundling, Vite for client

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` - shared between client and server
- **Tables**: merchants, social_accounts, campaigns with proper relations
- **Migrations**: Drizzle Kit with `db:push` command

### Authentication & Security
- **Method**: Session-based authentication with express-session
- **Password Hashing**: bcrypt for merchant passwords
- **Credential Encryption**: AES-256-CBC encryption for stored social account credentials
- **Session Secret**: Environment variable `SESSION_SECRET`

### Automation System
- **Browser Automation**: Puppeteer with stealth plugin for Facebook automation
- **Worker Pattern**: Background campaign worker processes active campaigns
- **Account Rotation**: Uses encrypted social accounts for automated engagement

## External Dependencies

### Database
- **PostgreSQL**: Required, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries with schema validation via drizzle-zod

### Third-Party Services
- **Puppeteer/Chromium**: Headless browser for Facebook automation (path configured for Nix environment)
- **Google Fonts**: Cairo font for Arabic typography

### Key NPM Packages
- **UI**: @radix-ui/* primitives, class-variance-authority, tailwind-merge
- **Forms**: react-hook-form with @hookform/resolvers and zod validation
- **HTTP Client**: Native fetch with custom apiRequest wrapper
- **Date Handling**: date-fns

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for session encryption and credential encryption
- `PUPPETEER_EXECUTABLE_PATH`: (optional) Custom Chromium path for automation