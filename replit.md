# Overview

This is a Korean local marketplace application called "모툰" (Motun) - a neighborhood-based second-hand marketplace similar to Karrot Market. The application allows users to buy and sell items within their local administrative district (행정동 단위), chat with other users, save items to favorites, and browse products by category. The platform emphasizes location-based transactions for safety and convenience.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with location-based navigation
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Form Handling**: React Hook Form with Zod for validation

The frontend follows a mobile-first design approach with responsive components optimized for mobile devices. The application uses a single-page application (SPA) architecture with protected routes requiring authentication.

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect (OIDC) integration
- **Session Management**: Express sessions with PostgreSQL session store
- **File Upload**: Multer for handling image uploads with Sharp for image processing
- **Real-time Communication**: WebSocket server for live chat functionality

The backend follows a RESTful API design with middleware for authentication, logging, and error handling. The server includes both API routes and static file serving in development/production modes.

## Data Storage
- **Primary Database**: PostgreSQL with Neon serverless database
- **Database Schema**: Structured with users, items, categories, chats, messages, and likes tables
- **Session Storage**: PostgreSQL-based session storage for authentication persistence
- **File Storage**: Local file system for uploaded images (processed with Sharp)

The database uses UUIDs for user identification and includes proper foreign key relationships with cascading deletes and indexes for performance.

## Authentication & Authorization
- **Authentication Provider**: Replit Auth with OIDC integration
- **Session Management**: Express-session with PostgreSQL store
- **Authorization Pattern**: Middleware-based route protection with user context
- **User Management**: Automatic user creation/update on authentication

The authentication system integrates seamlessly with Replit's identity provider and maintains user sessions across requests with proper CSRF protection.

# External Dependencies

## Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless database connection
- **drizzle-orm**: Type-safe database ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management and caching
- **passport**: Authentication middleware framework
- **openid-client**: OpenID Connect client for Replit Auth

## UI & Styling
- **@radix-ui/***: Headless UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **cmdk**: Command menu component

## Development Tools
- **vite**: Frontend build tool and development server
- **tsx**: TypeScript execution engine for Node.js
- **esbuild**: JavaScript bundler for production builds
- **sharp**: Image processing library for file uploads

## Runtime Services
- **WebSocket (ws)**: Real-time communication for chat functionality
- **multer**: File upload middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store adapter

The application is designed to run on Replit's infrastructure with automatic provisioning of PostgreSQL databases and seamless integration with Replit's authentication system.