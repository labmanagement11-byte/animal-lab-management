# Lab Animal Management System

## Overview

The Lab Animal Management System is a full-stack web application for managing laboratory animals, their housing in cages, and QR code generation for identification and tracking. It allows researchers to track animal information (weight, disease, age, location) via a web interface and QR code scanning. The system also supports multi-tenancy, ensuring data isolation for different companies.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui for consistent, accessible design
- **Responsiveness**: Mobile-first design with dedicated mobile navigation, touch-optimized inputs, and responsive sizing for padding, text, icons, and spacing.
- **QR Code Printing**: Optimized CSS for Avery 8160 labels (3x10 grid per sheet) including custom text labels, QR code, and footer bar.

### Technical Implementations
- **Frontend**: React 18, Wouter for routing, TanStack React Query for server state, React Hook Form with Zod for forms, Vite for building.
- **Backend**: Node.js with Express.js, TypeScript, Drizzle ORM for database interactions.
- **Database**: PostgreSQL (Neon Database) as the primary data store.
- **Authentication**: Replit Auth (OpenID Connect) for external users and local email/password authentication for manually created users. Role-based access control (Employee, Director, Admin) with PostgreSQL-backed session management. Admins can manage users and companies.
- **Multi-Tenancy**: Company-based data isolation using `companyId` in all data tables. All operations are filtered or validated by `companyId`, with Admin users having global access.
- **API**: RESTful design with structured endpoints for authentication, animal, cage, and QR code management, dashboard statistics, and search.

### Feature Specifications
- **Animal Management**: Batch animal creation with auto-incrementing numbers, audit trail for each animal created.
- **Cage Management**: Conditional form fields for gender (Holding/Experimental cages) and breeding start date (Breeding cages). `breeding_start_date` moved from animal to cage form.
- **QR Code Integration**:
    - Dynamic QR code generation with metadata.
    - In-app camera-based QR code scanning using `html5-qrcode` to identify and fetch animal/QR data.
    - Generation of "blank" QR codes with custom labels for Avery 8160 sheets (30 per batch) with auto-fill option.
    - **Dashboard**: Summary cards for "Used", "Blank", and "Deleted" QR codes with real-time counts and interactive selection for export. "Used" and "Blank" counts differentiate between `status='used'` and `status='unused'/'available'`.
    - **Export**: Multi-format export (CSV, Excel, PDF) of selected QR code categories with automated naming and professional formatting.
    - **Lifecycle Management**: QR codes transition through `available` → `unused` → `used` states, enforced as one-way. "Mark as Used" functionality and correct status updates upon cage assignment.
    - **Strain Color Memory**: Automatic saving of strain-color associations upon QR code printing, with auto-completion and manual override.

## External Dependencies

### Database Services
- **PostgreSQL**: Primary database.
- **Neon Database**: Serverless PostgreSQL provider.
- **@neondatabase/serverless**: For optimized serverless database connections.

### Authentication Services
- **Replit Auth**: For OpenID Connect integration.

### UI Component Libraries
- **Radix UI**: Accessible component primitives.
- **Lucide React**: Icon library.
- **shadcn/ui**: Pre-built components.

### Development Tools
- **TypeScript**: For type safety.
- **Vite**: Frontend build tool.
- **ESBuild**: Backend bundling.
- **Drizzle Kit**: Database migration and schema management.

### Validation & Forms
- **Zod**: Schema validation.
- **React Hook Form**: Form state management.

### Styling & CSS
- **Tailwind CSS**: Utility-first CSS framework.
- **PostCSS**: CSS processing.

### Query & State Management
- **TanStack React Query**: Server state management.
- **React Context**: Local state management.