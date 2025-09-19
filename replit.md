# Order Tracking System (نظام إدارة تتبع الطلبات)

## Overview

This is an Arabic-language order tracking application designed for orders management. The system provides a comprehensive solution for managing and tracking orders with note-taking capabilities and PDF export functionality. Built as a full-stack application with a React frontend and Express backend, it features user authentication, real-time order management, and a clean, RTL-optimized user interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component patterns
- **UI Framework**: Shadcn/ui components with Radix UI primitives for accessibility and consistent design
- **Styling**: Tailwind CSS with RTL (right-to-left) configuration for Arabic language support
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for robust form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Language**: TypeScript with ES modules for modern JavaScript features
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Session Management**: Connect-pg-simple for PostgreSQL-backed session storage
- **Validation**: Zod schemas shared between frontend and backend for consistent data validation

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon Database serverless platform
- **ORM**: Drizzle ORM with migrations managed through drizzle-kit
- **Schema**: Shared TypeScript schemas in `/shared/schema.ts` for type consistency
- **Session Storage**: PostgreSQL-backed sessions for user authentication state

### Authentication and Authorization
- **Method**: Simple username/password authentication with session-based storage
- **Session Persistence**: 24-hour client-side authentication caching with localStorage
- **Default Credentials**: Admin user with configurable credentials for system access (admin/admin123)
- **Security**: Session-based authentication with server-side validation
- **Task Management Access**: Direct access to task management without additional PIN authentication

### Development and Build Architecture
- **Build Tool**: Vite for fast development and optimized production builds
- **Development Server**: Hot module replacement with Vite middleware integration
- **Production Build**: Separate client and server builds with esbuild for server bundling
- **Code Quality**: TypeScript strict mode with comprehensive type checking

### Key Design Patterns
- **Shared Types**: Common schema definitions between client and server for type safety
- **API Layer**: Centralized API request handling with error management and response validation
- **Component Architecture**: Modular UI components with consistent prop interfaces
- **Error Handling**: Comprehensive error boundaries and toast notifications for user feedback

## External Dependencies

### Core Infrastructure
- **Database**: Neon Database (@neondatabase/serverless) for PostgreSQL hosting
- **ORM**: Drizzle ORM (drizzle-orm, drizzle-zod) for database operations and schema validation

### UI and Styling
- **Component Library**: Radix UI primitives for accessible, unstyled components
- **Styling**: Tailwind CSS with custom RTL configuration for Arabic layout
- **Icons**: Lucide React for consistent iconography
- **Fonts**: Google Fonts (Droid Arabic Kufi) for Arabic typography

### Development Tools
- **Build Tools**: Vite for development server and build process
- **Code Quality**: TypeScript for static type checking
- **PDF Generation**: html2pdf.js for client-side report generation

### State Management and Data Fetching
- **Server State**: TanStack Query for caching, synchronization, and background updates
- **Form Management**: React Hook Form with Hookform Resolvers for validation integration
- **Validation**: Zod for runtime type checking and schema validation

### Authentication and Session Management
- **Session Storage**: connect-pg-simple for PostgreSQL-backed session persistence
- **Security**: Built-in session management with configurable timeout and storage options

### Utility Libraries
- **Class Management**: clsx and class-variance-authority for conditional CSS classes
- **Date Handling**: date-fns for date manipulation and formatting
- **UUID Generation**: Built-in Node.js crypto module for unique identifier generation