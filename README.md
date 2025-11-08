# SalonTakvim Client (Admin & Staff Panel)

Multi-tenant admin and staff management panel for SalonTakvim booking system.

## 📋 Overview

This is a comprehensive dashboard application built with React 19.1 + TypeScript + Vite that allows salon owners (admins) to manage their business and staff members to manage their appointments and schedules.

**Tech Stack:**

- React 19.1.1 + TypeScript 5.9.3
- Vite 7.1.7
- TailwindCSS 4.1.16
- shadcn/ui components
- TanStack Query (React Query) 5.90.7
- React Router DOM 7.9.5
- React Hook Form + Zod validation
- Axios for API calls
- date-fns for date formatting

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server (runs on port 3000)
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Layout components (Sidebar, Header, etc.)
│   ├── dashboard/       # Dashboard-specific components
│   └── shared/          # Shared/common components
├── pages/
│   ├── auth/            # Login, Register
│   ├── admin/           # Admin pages
│   └── staff/           # Staff pages
├── contexts/            # React Context (Auth, etc.)
├── hooks/               # Custom hooks
├── services/            # API service layer
├── types/               # TypeScript types
├── utils/               # Utility functions
└── lib/                 # Third-party lib configs
```

## 🎯 Features Implemented

### ✅ Phase 1: Authentication (Complete)

- User registration (admin only)
- Login with email/password
- JWT token management (access + refresh)
- Protected routes with role-based access
- Auto token refresh on 401
- Logout functionality

### ✅ Phase 2: Core Layout & Navigation (Complete)

- Responsive main layout with sidebar
- Desktop sidebar navigation (260px fixed)
- Mobile navigation drawer
- Header with breadcrumbs
- User menu dropdown
- Role-based navigation menus (admin/staff)
- Active link highlighting

### ✅ Phase 3: Admin Dashboard (Complete)

- Dashboard KPI metrics
  - Total appointments
  - Total revenue
  - Total customers
  - Active staff count
- Appointment status breakdown (visual bars)
- Quick stats panel
  - Today's appointments & revenue
  - Tomorrow's schedule
  - Average appointment value
  - Cancellation rate with trend
  - Popular time slot
- Recent activity timeline with relative timestamps
- Recent appointments list (last 5)
  - Status badges
  - Customer names
  - Date/time formatting
  - Price display
- Upcoming appointments (tomorrow's schedule)
  - Sorted by time
  - Status badges
  - Loading & empty states
- Quick action buttons
  - New Appointment
  - Invite Staff
  - Analytics
  - Settings
- Real-time data from backend API
- Error handling & loading states
- Responsive grid layout

### ✅ Phase 4: Store Settings (Complete)

- Store information management
  - Store name (required field)
  - Store description (textarea, max 1000 chars)
  - Store slug display (read-only, shows booking URL)
- Contact information
  - Email (validated)
  - Phone number
- Business settings
  - Currency code (3-letter: USD, EUR, TRY, etc.)
  - Store status badge (active/inactive)
- Store statistics display
  - Total appointments (all-time)
  - Total customers (registered)
- Metadata display
  - Created date
  - Last updated date
- Edit mode with form validation
  - Zod schema validation
  - Required field indicators
  - Error messages
  - Save/Cancel buttons
  - Loading state during save
- Success/Error notifications
- Responsive form layout

## 🔗 API Integration

### Authentication

- `POST /api/auth/register` - Register admin
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Store Management

- `GET /api/stores/my-store` - Get user's store
- `PATCH /api/stores/:id` - Update store

### Analytics

- `GET /api/stores/:storeId/analytics/dashboard` - Dashboard stats

### Appointments

- `GET /api/stores/:storeId/appointments` - List appointments (with filters)

## 🎨 UI Components (shadcn/ui)

Installed components:

- button, input, label, textarea
- card, checkbox, alert, badge
- dropdown-menu, sheet, avatar, separator, scroll-area

## 📊 State Management

- **React Context** for authentication state
- **TanStack Query** for server state management
  - Automatic caching
  - Background refetching
  - Optimistic updates

## 🔐 Authentication Flow

1. User logs in with email/password
2. Backend returns access token + refresh token
3. Tokens stored in localStorage
4. Access token sent in Authorization header
5. On 401 error, automatically refresh token
6. On refresh failure, redirect to login

## 🎯 Next Steps

### Phase 5: Service Management (CRITICAL)

- Services CRUD operations
- Categories management
- Service extras
- Pricing & duration settings
- Capacity settings
- Buffer time configuration

### Phase 6: Staff Management

- Staff invitations
- Working hours management
- Time off management
- Service assignments

### Phase 7: Appointment Management

- Calendar view
- List view with filters
- Create/edit appointments
- Status management

For full roadmap, see [ROADMAP.md](./ROADMAP.md)

## 📝 Development Notes

### Type Safety

- Strict TypeScript enabled
- All API responses properly typed
- No `any` types (except for specific cases)

### Code Style

- ESLint + Prettier configured
- Component composition pattern
- Custom hooks for reusable logic
- Barrel exports for clean imports

### Performance

- Code splitting with React.lazy (future)
- TanStack Query caching
- Optimized re-renders
- Responsive images

## 🤝 Contributing

1. Follow existing code structure
2. Use TypeScript strictly
3. Add proper error handling
4. Test on mobile devices
5. Update ROADMAP.md progress

## 📄 License

MIT License

---

**Current Progress**: 35% (Authentication + Layout + Dashboard + Store Settings Complete)  
**Last Updated**: January 2025
