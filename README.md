# AMS Frontend - Asset Management System Dashboard

A modern React TypeScript dashboard for asset management with cameras, users, incidents, and file management.

## Features

- 🔐 **Authentication & Authorization** - JWT-based authentication with role-based access
- 📊 **Dashboard** - Real-time analytics and monitoring
- 📹 **Camera Management** - Monitor and manage security cameras
- 👥 **User Management** - Handle user accounts and permissions  
- 🚨 **Incident Tracking** - Track and manage security incidents
- 📁 **File Management** - Upload and organize files
- 📱 **Mobile Responsive** - Works on all device sizes
- ✅ **Data Validation** - Comprehensive data validation utilities
- 🎨 **Modern UI** - Clean and intuitive interface with Tailwind CSS

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Charts**: Recharts
- **State Management**: React Context API
- **Authentication**: JWT tokens with localStorage
- **Data Validation**: Custom validation utilities

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd track_facility_ams_frontend-main

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React Context providers
├── data/              # Mock data and data access
├── hooks/             # Custom React hooks
├── services/          # API service layer
├── types/             # TypeScript type definitions
├── utils/             # Utility functions and validation
├── constants/         # Application constants
└── assets/           # Static assets
```

## Data Validation

The application includes comprehensive data validation utilities located in `src/utils/validation.ts`:

### Available Validators

- `validateUser()` - Validates user objects
- `validateCamera()` - Validates camera objects  
- `validateIncident()` - Validates incident objects
- `validateAttendanceRecord()` - Validates attendance records

### Usage Example

```typescript
import { validateUser, withValidation } from './utils/validation';

// Validate a single user
const result = validateUser(userData);
if (!result.isValid) {
  console.error('Validation errors:', result.errors);
}

// Use with async data fetching
const fetchValidatedUsers = withValidation(
  async () => fetchUsersFromAPI(),
  validateUsers
);
```

### Validation Features

- Email format validation
- Required field checking
- Type validation (strings, numbers, booleans)
- Array validation for bulk data
- Development-time warnings for invalid mock data

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
```
    ...reactDom.configs.recommended.rules,
  },
})
```
