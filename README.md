# Computing Society Attendance Monitoring System

A comprehensive web-based attendance monitoring system designed for SORS University's Computing Society. This application streamlines member registration, event management, and attendance tracking through QR code and barcode scanning.

## Domain Link
https://comsoc-attendance-monitoring.lovable.app/

## API Documentation
📘 **[Complete API Documentation](./API_DOCUMENTATION.md)** - Detailed endpoint reference with examples  
📦 **[Postman Collection](./postman_collection.json)** - Import into Postman for immediate testing

## Submitted by:
Daniel Ely Gojar
BS Computer Science 4-1

## Features

### 🔐 Authentication
- Secure email-based authentication restricted to @sorsu.edu.ph domains
- Auto-confirmed email signups for seamless onboarding
- Protected routes ensuring secure access to system features

### 📊 Dashboard
- Real-time statistics display:
  - Total registered members
  - Total events created
  - Today's attendance count
  - Active events
- Quick action shortcuts for efficient navigation

### 👥 Members Management
- View all registered members in a searchable table
- Bulk member upload functionality via data import
- Automatic duplicate detection to prevent re-uploads
- Individual member profile management

### 📅 Events Management
- Create, edit, and delete society events
- Track event details including name, description, and date
- View comprehensive event listings
- Manage event lifecycle from creation to completion

### 📷 Scanner
- Real-time QR code and Code 39 barcode scanning
- Optimized for long-distance scanning with 80% viewport coverage
- Native Barcode Detection API support for enhanced performance
- Automatic member validation on scan
- Instant attendance recording with timestamp

### 📈 Reports
- Generate and export attendance reports
- PDF export functionality for record-keeping
- Comprehensive attendance analytics

## Technology Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible component library

### Backend (Lovable Cloud)
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Row Level Security (RLS) policies
  - Real-time capabilities
  - Authentication system

### Key Libraries
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **html5-qrcode** - QR/barcode scanning
- **jsPDF** - PDF generation
- **date-fns** - Date manipulation
- **Zod** - Schema validation
- **React Hook Form** - Form management

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── DashboardLayout.tsx
│   └── ProtectedRoute.tsx
├── contexts/           # React context providers
│   └── AuthContext.tsx
├── data/              # Static data and constants
├── hooks/             # Custom React hooks
├── integrations/      # External service integrations
│   └── supabase/      # Supabase client and types
├── lib/               # Utility functions
├── pages/             # Application pages/routes
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   ├── Scanner.tsx
│   ├── Events.tsx
│   ├── Members.tsx
│   ├── UploadMembers.tsx
│   └── Reports.tsx
└── utils/             # Helper functions
```

## Usage

### For Administrators

1. **Sign In/Sign Up**
   - Navigate to the authentication page
   - Use your @sorsu.edu.ph email address
   - Create an account or sign in

2. **Managing Members**
   - Go to Members page to view all registered members
   - Use Upload Members to bulk import member data
   - System automatically prevents duplicate entries

3. **Managing Events**
   - Navigate to Events page
   - Click "Create Event" to add new events
   - Edit or delete events as needed

4. **Recording Attendance**
   - Go to Scanner page
   - Grant camera permissions when prompted
   - Point camera at member's QR code or barcode
   - System automatically validates and records attendance

5. **Viewing Reports**
   - Access Reports page for attendance analytics
   - Export data as PDF for record-keeping

## Database Schema

### Members Table
- Stores member information including names and ID numbers
- User association for access control

### Events Table
- Event details with name, description, and date
- Created by and for tracking

### Attendance Table
- Records attendance with member and event relationships
- Timestamp tracking for check-in times

## API Access

### Base URL
```
https://lojxwobotbkwwiccxnwk.supabase.co/rest/v1
```

### Authentication
All API requests require authentication using a Bearer token. Get your token by signing in through the authentication endpoint.

### Quick Start
1. Sign up with your @sorsu.edu.ph email
2. Sign in to get your access token
3. Use the token in the Authorization header for all requests
4. See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete endpoint reference

### Test Data Available
The database includes seed data for immediate testing:
- 5 sample members
- 4 sample events
- Ready for attendance recording

### Postman Testing
Import `postman_collection.json` into Postman to test all endpoints immediately. The collection includes:
- Pre-configured requests for all CRUD operations
- Automatic token management after sign-in
- Sample data for testing

### Environment Variables
```env
VITE_SUPABASE_URL=https://lojxwobotbkwwiccxnwk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<redacted>
VITE_SUPABASE_PROJECT_ID=<redacted>
```
⚠️ **Note:** `.env` file is included in `.gitignore` to prevent committing sensitive data.

## Security

- Row Level Security (RLS) enabled on all tables
- Authentication required for all operations
- Email domain restriction (@sorsu.edu.ph)
- Protected routes prevent unauthorized access
- Role-based permissions (Officer/Admin)

## License

This project is developed for Sorsogon State University-Computing Society and in project requirement for Software Development 2.
