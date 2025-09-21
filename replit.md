# Lab Animal Management System

## Overview

The Lab Animal Management System is a full-stack web application designed to manage laboratory animals, their housing in cages, and QR code generation for easy identification and tracking. The system enables researchers to track animal information including weight, disease status, age, location, and other relevant data through an intuitive web interface and QR code scanning functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Styling**: Tailwind CSS with shadcn/ui components for consistent, accessible UI design
- **Routing**: Wouter for client-side routing with a lightweight footprint
- **State Management**: TanStack React Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for robust form management
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Language**: TypeScript for type safety across the entire stack
- **Database ORM**: Drizzle ORM for type-safe database operations and migrations
- **Authentication**: Replit Auth integration with OpenID Connect for secure user management
- **Session Management**: Express sessions with PostgreSQL storage for persistent authentication

### Database Design
- **Primary Database**: PostgreSQL with the following core entities:
  - Users: Authentication and role-based access control
  - Animals: Core animal data including health status, physical attributes, and tracking information
  - Cages: Housing information with capacity and location tracking
  - QR Codes: Generated codes linking to animal and cage information
  - Audit Logs: Activity tracking for compliance and monitoring
  - Sessions: Secure session storage for authentication persistence

### API Structure
- RESTful API design with consistent error handling and validation
- Protected routes requiring authentication for all data operations
- Structured endpoints for:
  - Authentication flows (`/api/auth/*`)
  - Animal management (`/api/animals/*`)
  - Cage management (`/api/cages/*`)
  - QR code generation and management (`/api/qr-codes/*`)
  - Dashboard statistics (`/api/dashboard/stats`)
  - Search functionality across entities

### Authentication & Authorization
- Replit-based authentication with role-based permissions
- Three user roles: Employee, Director, and Success Manager
- Session-based authentication with secure cookie handling
- Protected API routes with middleware validation

### QR Code Integration
- Dynamic QR code generation containing animal and cage metadata
- QR code scanning interface for mobile-friendly data access
- Persistent storage of generated QR codes for tracking and management

## External Dependencies

### Database Services
- **PostgreSQL**: Primary database using Neon Database serverless PostgreSQL
- **Database Connection**: `@neondatabase/serverless` for optimized serverless connections

### Authentication Services
- **Replit Auth**: OpenID Connect integration for user authentication
- **Session Storage**: PostgreSQL-backed session management

### UI Component Libraries
- **Radix UI**: Accessible component primitives for complex UI interactions
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library built on Radix UI and Tailwind CSS

### Development Tools
- **TypeScript**: Type safety across frontend and backend
- **Vite**: Frontend build tool with HMR and optimization
- **ESBuild**: Backend bundling for production deployment
- **Drizzle Kit**: Database migration and schema management tools

### Validation & Forms
- **Zod**: Schema validation for API endpoints and form validation
- **React Hook Form**: Form state management with validation integration

### Styling & CSS
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing with Autoprefixer
- **CSS Variables**: Dynamic theming support for light/dark modes

### Query & State Management
- **TanStack React Query**: Server state management, caching, and synchronization
- **React Context**: Local state management for UI components