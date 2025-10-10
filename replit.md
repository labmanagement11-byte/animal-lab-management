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
- **Mobile Optimization**: Mobile-first responsive design with dedicated mobile navigation components
  - Bottom navigation bar (h-13) for easy thumb access on mobile devices
  - Mobile header with menu drawer and quick search
  - Compact Floating Action Button (FAB) for primary actions on mobile
  - Touch-optimized inputs and controls (48px minimum touch targets)
  - Smooth animations and transitions for app-like experience
  - Responsive view mode selectors (buttons on desktop, dropdown on mobile)
  - **Responsive Layout System** (October 2025):
    - All pages use responsive padding: `p-4 md:p-6` instead of fixed large margins
    - Headers use responsive text sizes: `text-lg md:text-2xl` or `text-xl md:text-3xl`
    - Icons use responsive sizes: `h-6 w-6 md:h-8 md:w-8`
    - Spacing is responsive: `mb-4 md:mb-6` and `space-y-4 md:space-y-6`
    - Mobile CSS optimizations with reduced font sizes and spacing for better mobile experience
    - No horizontal scrolling on mobile devices (viewport properly configured)

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
- Three user roles: Employee, Director, and Admin
- Session-based authentication with secure cookie handling
- Protected API routes with middleware validation

### Multi-Tenancy Architecture (Latest Implementation)
- **Company-based data isolation**: Every data table includes a `companyId` foreign key for strict tenant separation
- **Admin role bypass**: Admin users can access all companies' data; non-admin users are restricted to their own company
- **Security model**:
  - All READ operations filter by companyId (Admin gets undefined for global access)
  - All CREATE operations require valid companyId assignment
  - All UPDATE/DELETE operations validate resource ownership before mutation
  - RESTORE and PERMANENT-DELETE operations validate from deleted items list
  - Global search and reports filter results by company
- **Company management**: Admin-only UI at `/companies` route for managing organizations
- **Data isolation enforcement**: Users without companyId assignment receive 403 errors to prevent unauthorized access

### QR Code Integration
- Dynamic QR code generation containing animal and cage metadata
- QR code scanning interface for mobile-friendly data access
- Persistent storage of generated QR codes for tracking and management
- **Blank QR Code Generation with Custom Labels** (October 2025):
  - **Updated**: Batch generation of exactly 30 QR codes (changed from 72)
  - **Label Format**: Avery 8160 (1" × 2⅝") labels on 8.5" × 11" sheets
  - **Print Layout**: 3 columns × 10 rows = 30 labels per sheet
  - **Custom Text Labels**: Each QR code can have personalized text (stored in `labelText` field)
  - **Auto-fill Feature**: Quick generation with pattern "OT-1" through "OT-30"
  - **Horizontal Label Design**: Text label | QR code (0.6") | Metadata
  - **Custom Print CSS**: Precise Avery 8160 margins and dimensions (0.5in × 0.19in margins)
  - **Interactive UI**: 30 individual text inputs with auto-fill and clear options
  - **Validation**: Requires at least one non-empty label text before generation
  - Batch selection, printing, and deletion interface
  - Soft delete functionality for QR code management
- **QR Code Export** (October 2025):
  - Multi-format export: CSV, Excel (XLSX), and PDF
  - Context-aware export: exports only QR codes from active tab (Used, Blank, or Trash)
  - Automated file naming with tab type and date stamp
  - Export includes: QR ID, Type, Cage, Room, Created Date, and Status
  - PDF export with professional formatting and auto-table generation
  - Toast notifications for export success feedback

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