# SalonTakvim Client (Admin & Staff Panel) - Development Roadmap

## 📋 Project Overview

Multi-tenant admin and staff management panel for SalonTakvim booking system. This web application provides a comprehensive dashboard for salon owners (admins) to manage their business and staff members to manage their appointments and schedules.

**Tech Stack**: React 19.1.1 + TypeScript + Vite + TailwindCSS + shadcn/ui

**Target Users**:

- **Admin (Salon Owners)**: Full business management capabilities
- **Staff (Employees)**: Personal schedule and appointment management

---

## 🎯 Core Features Overview

### Admin Panel Features

1. Dashboard & Analytics
2. Store Settings Management
3. Service & Category Management
4. Staff Management (Invitations, Assignments)
5. Location Management
6. Widget Configuration
7. Appointment Management
8. Customer Management
9. Notification Settings
10. Reports & Analytics

### Staff Panel Features

1. Personal Dashboard
2. My Appointments (View & Manage)
3. My Schedule (Working Hours)
4. Time Off Management (Breaks)
5. Profile Settings
6. Availability Calendar

---

## 📊 Development Phases

## Phase 1: Project Setup & Authentication (Week 1)

### 1.1 Project Initialization

- [x] Create Vite + React + TypeScript project
- [x] Install and configure TailwindCSS
- [x] Setup shadcn/ui components
- [x] Configure ESLint + Prettier
- [x] Setup folder structure
- [x] Configure path aliases (@/)

**Folder Structure**:

```
client/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   ├── layout/       # Layout components (Sidebar, Header, etc.)
│   │   ├── dashboard/    # Dashboard-specific components
│   │   ├── services/     # Service management components
│   │   ├── staff/        # Staff management components
│   │   ├── appointments/ # Appointment components
│   │   └── shared/       # Shared/common components
│   ├── pages/
│   │   ├── auth/         # Login, Register
│   │   ├── admin/        # Admin pages
│   │   └── staff/        # Staff pages
│   ├── contexts/         # React Context (Auth, Theme)
│   ├── hooks/            # Custom hooks
│   ├── services/         # API service layer
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── lib/              # Third-party lib configs
│   └── assets/           # Static assets
├── public/
└── package.json
```

### 1.2 Authentication Module

**Priority**: CRITICAL

**Features**:

- [x] Login page (email + password)
- [x] Register page (admin registration)
- [x] JWT token management (access + refresh)
- [x] Protected routes (role-based)
- [x] Auth context provider
- [x] Logout functionality
- [x] Remember me option
- [ ] "Forgot Password" flow (future)

**Components**:

```
/auth
  ├── LoginPage.tsx
  ├── RegisterPage.tsx
  ├── LoginForm.tsx
  └── RegisterForm.tsx
```

**API Endpoints Used**:

- `POST /api/auth/register` - Admin registration
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

**Context**:

```typescript
interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}
```

---

## Phase 2: Core Layout & Navigation (Week 1-2)

### 2.1 Layout Components

**Priority**: HIGH

**Features**:

- [x] Main layout with sidebar
- [x] Responsive navigation
- [x] Header with user menu
- [x] Breadcrumbs
- [ ] Theme toggle (light/dark)
- [x] Mobile menu

**Components**:

```
/layout
  ├── MainLayout.tsx        # Main app layout ✅
  ├── Sidebar.tsx           # Sidebar navigation ✅
  ├── Header.tsx            # Top header ✅
  ├── UserMenu.tsx          # User dropdown menu ✅
  ├── MobileNav.tsx         # Mobile navigation ✅
  └── Breadcrumbs.tsx       # Breadcrumb navigation ✅
```

**Navigation Structure**:

**Admin Menu**:

- Dashboard
- Appointments
- Services
  - All Services
  - Categories
  - Service Extras
- Staff
  - All Staff
  - Invitations
  - Working Hours
- Locations
- Customers
- Widget Settings
- Analytics
- Notifications
- Settings

**Staff Menu**:

- Dashboard
- My Appointments
- My Schedule
- Time Off
- Profile

---

## Phase 3: Admin Dashboard (Week 2) ✅

### 3.1 Dashboard Overview

**Priority**: HIGH

**Features**:

- [x] Key metrics cards (appointments, revenue, customers, staff)
- [x] Appointment status breakdown chart
- [x] Recent appointments list
- [x] Upcoming appointments widget
- [x] Quick actions (Create appointment, Invite staff, Analytics, Settings)
- [x] Activity timeline

**Components**:

```
/dashboard
  ├── AdminDashboard.tsx             ✅
  ├── MetricCard.tsx                 ✅
  ├── AppointmentStatusBreakdown.tsx ✅
  ├── QuickStats.tsx                 ✅
  ├── RecentActivityList.tsx         ✅
  ├── RecentAppointments.tsx         ✅
  ├── UpcomingAppointments.tsx       ✅
  └── QuickActions.tsx               ✅
```

**API Endpoints Used**:

- `GET /api/stores/my-store` - Get current store ✅
- `GET /api/stores/:storeId/analytics/dashboard` - Dashboard KPIs ✅
- `GET /api/stores/:storeId/appointments` - Appointments list ✅

**Metrics Displayed**:

- Total appointments (today/this week/this month) ✅
- Today's revenue ✅
- Total customers ✅
- Active staff count ✅
- Appointments by status (pending, confirmed, completed, cancelled) ✅
- Appointments today/tomorrow ✅
- Average appointment value ✅
- Cancellation rate ✅
- Popular time slot ✅
- Recent activity timeline ✅
- Recent 5 appointments with status badges ✅
- Tomorrow's upcoming appointments ✅
- Quick action buttons (4 actions) ✅

---

## Phase 4: Store & Settings Management (Week 2-3) ✅

### 4.1 Store Settings

**Priority**: HIGH

**Features**:

- [x] Store information form (name, description)
- [x] Contact information (email, phone)
- [x] Currency settings
- [x] Store status display (active/inactive)
- [x] Slug display (read-only)
- [x] Store statistics display
- [x] Edit/Save/Cancel functionality
- [x] Form validation with Zod
- [ ] Logo upload (future enhancement)

**Components**:

```
/admin
  └── StoreSettings.tsx              ✅
```

**API Endpoints Used**:

- `GET /api/stores/my-store` - Get store details ✅
- `PATCH /api/stores/:id` - Update store ✅

**Form Fields**:

- Store name (required) ✅
- Store slug (read-only display) ✅
- Description (optional, max 1000 chars) ✅
- Email (optional, validated) ✅
- Phone (optional, max 50 chars) ✅
- Currency (3-letter code: USD, EUR, TRY) ✅
- Store status badge (read-only) ✅
- Total appointments & customers (read-only) ✅
- Created/Updated dates (read-only) ✅

---

## Phase 5: Service Management (Week 3-4) ✅

### 5.1 Services Module

**Priority**: CRITICAL

**Features**:

- [x] Services list with search
- [x] Create/edit service dialog
- [x] Service card with details
- [x] Category assignment
- [x] Duration & price settings
- [x] Capacity settings (max people)
- [x] Buffer time configuration
- [x] Service visibility toggle
- [x] Delete service
- [x] Color picker for services
- [ ] Service extras management (future)
- [ ] Image upload for services (future)
- [ ] Drag & drop reordering (future)
- [ ] Bulk actions (future)

**Components**:

```
/services
  ├── ServicesList.tsx          ✅
  ├── ServiceCard.tsx            ✅
  └── ServiceFormDialog.tsx      ✅
```

**API Endpoints Used**:

- `GET /api/stores/:storeId/services` - List services ✅
- `POST /api/stores/:storeId/services` - Create service ✅
- `PATCH /api/stores/:storeId/services/:id` - Update service ✅
- `DELETE /api/stores/:storeId/services/:id` - Delete service ✅
- `POST /api/stores/:storeId/services/:id/extras` - Add extra (ready)
- `PATCH /api/stores/:storeId/services/:id/extras/:extraId` - Update extra (ready)
- `DELETE /api/stores/:storeId/services/:id/extras/:extraId` - Delete extra (ready)

**Form Fields**:

- Name (required) ✅
- Description (optional, max 1000 chars) ✅
- Category selection ✅
- Duration in minutes (required) ✅
- Price (required) ✅
- Capacity (1-10 people) ✅
- Buffer time before/after (optional) ✅
- Color picker (hex) ✅
- Visibility toggle ✅
- "Allow bringing anyone" toggle ✅
- "Allow recurring appointments" toggle ✅

### 5.2 Categories Management

**Priority**: HIGH

**Features**:

- [x] Categories list
- [x] Create/edit category dialog
- [x] Color picker for categories
- [x] Icon field (text/emoji)
- [x] Category visibility toggle
- [x] Delete category
- [ ] Drag & drop reordering (future)

**Components**:

```
/categories
  ├── CategoriesList.tsx         ✅
  ├── CategoryCard.tsx           ✅
  └── CategoryFormDialog.tsx     ✅
```

**API Endpoints Used**:

- `GET /api/stores/:storeId/categories` - List categories ✅
- `POST /api/stores/:storeId/categories` - Create category ✅
- `PATCH /api/stores/:storeId/categories/:id` - Update category ✅
- `DELETE /api/stores/:storeId/categories/:id` - Delete category ✅
- `PATCH /api/stores/:storeId/categories` - Reorder categories (ready)

---

## Phase 6: Staff Management (Week 4-5) - 100% Complete ✅

### 6.1 Staff Module

**Priority**: CRITICAL

**Features**:

- [x] Staff members list
- [x] Staff profile view
- [x] Invite staff via email
- [x] Pending invitations list
- [x] Cancel invitation
- [x] Edit staff profile
- [x] Assign services to staff
- [x] Assign location to staff
- [x] Staff visibility toggle
- [x] Remove staff member
- [x] Invitation status tracking

**Components**:

```
/staff
  ├── StaffList.tsx              ✅
  ├── StaffCard.tsx              ✅
  ├── InvitationCard.tsx         ✅
  ├── InviteStaffDialog.tsx      ✅
  ├── StaffProfileDialog.tsx     ✅
  ├── ServiceAssignmentDialog.tsx ✅
  └── WorkingHoursDialog.tsx      ✅
```

**API Endpoints Used**:

- `GET /api/stores/:storeId/staff` - List staff ✅
- `POST /api/stores/:storeId/staff/invite` - Invite staff ✅
- `GET /api/stores/:storeId/staff/invitations` - List invitations ✅
- `DELETE /api/stores/:storeId/staff/invitations/:id` - Cancel invitation ✅
- `PATCH /api/stores/:storeId/staff/:id` - Update staff profile ✅
- `DELETE /api/stores/:storeId/staff/:id` - Remove staff ✅
- `POST /api/stores/:storeId/staff/:id/services` - Assign services ✅
- `GET /api/stores/:storeId/staff/:id/services` - Get staff services ✅
- `DELETE /api/stores/:storeId/staff/:id/services/:serviceId` - Remove service (ready)

**Invitation Flow**:

1. Admin enters staff email
2. System sends invitation email with token
3. Staff clicks link and accepts invitation (creates user account)
4. Staff appears in staff list with "Active" status

### 6.2 Working Hours Management

**Priority**: HIGH

**Features**:

- [x] Weekly schedule view
- [x] Set working hours per day
- [x] Multiple time slots per day
- [x] Copy schedule to other days
- [x] Activate/deactivate days
- [x] Visual time picker

**Components**:

```
/staff/schedule
  ├── WorkingHoursDialog.tsx     ✅
```

**API Endpoints Used**:

- `GET /api/stores/:storeId/staff/:id/working-hours` - Get working hours ✅
- `POST /api/stores/:storeId/staff/:id/working-hours` - Create working hour ✅
- `PATCH /api/stores/:storeId/staff/:id/working-hours/:hourId` - Update ✅
- `DELETE /api/stores/:storeId/staff/:id/working-hours/:hourId` - Delete ✅

**Schedule Display**:

```
Monday    [09:00 - 18:00] [Active] [Edit] [Delete] ✅
Tuesday   [09:00 - 18:00] [Active] [Edit] [Delete] ✅
Wednesday [Closed] ✅
...
```

### 6.3 Time Off Management

**Priority**: MEDIUM

**Features**:

- [x] View staff breaks/time off ✅
- [x] Create time off request ✅
- [x] Edit time off ✅
- [x] Delete time off ✅
- [x] Date range picker ✅
- [x] Time range picker (optional for partial day) ✅
- [x] Recurring breaks support ✅

**Components**:

```
/staff/breaks
  ├── TimeOffDialog.tsx           ✅ (Create/Edit time off)
  └── TimeOffList.tsx             ✅ (Display breaks list)
```

**API Endpoints Used**:

- `GET /api/stores/:storeId/staff/:id/breaks` - List breaks ✅
- `POST /api/stores/:storeId/staff/:id/breaks` - Create break ✅
- `PATCH /api/stores/:storeId/staff/:id/breaks/:breakId` - Update break ✅
- `DELETE /api/stores/:storeId/staff/:id/breaks/:breakId` - Delete break ✅

**Features Implemented**:

- Date range selection (start/end date) ✅
- Partial day option with time range (start/end time) ✅
- Reason field (optional, 500 char limit) ✅
- Recurring break toggle (annual repetition) ✅
- Visual date formatting with Turkish locale ✅
- Empty state with call-to-action ✅
- Edit and delete actions per break ✅
- Integration with StaffCard via "Time Off" button ✅
- Dialog-based time off list display ✅

---

## Phase 7: Location Management (Week 5) - 100% Complete ✅

### 7.1 Locations Module

**Priority**: MEDIUM

**Features**:

- [x] Locations list
- [x] Create/edit location modal
- [x] Location card with details
- [x] Address form with all fields
- [x] Contact information
- [x] Location visibility toggle
- [x] Delete location
- [x] Coordinates support (latitude/longitude)
- [ ] Assign services to location (future)
- [ ] Map preview (future enhancement)

**Components**:

```
/locations
  ├── LocationsList.tsx          ✅
  ├── LocationCard.tsx            ✅
  └── LocationFormDialog.tsx      ✅
```

**API Endpoints Used**:

- `GET /api/stores/:storeId/locations` - List locations ✅
- `GET /api/stores/:storeId/locations/visible` - List visible locations ✅
- `POST /api/stores/:storeId/locations` - Create location ✅
- `PATCH /api/stores/:storeId/locations/:id` - Update location ✅
- `DELETE /api/stores/:storeId/locations/:id` - Delete location ✅

**Form Fields**:

- Name (required) ✅
- Address (street, city, state, zip, country) ✅
- Phone, Email ✅
- Latitude, Longitude (optional) ✅
- Visibility toggle ✅

---

## Phase 8: Appointment Management (Week 6-7) - 85% Complete 🚧

### 8.1 Appointments Module (Admin View)

**Priority**: CRITICAL

**Features**:

- [x] Appointments list view
- [x] Status-based filtering (tabs)
- [x] Create appointment modal
- [x] Edit appointment
- [x] View appointment details
- [x] Delete appointment
- [x] Guest booking support
- [x] Service, staff, location selection
- [x] Customer information form
- [x] Date & time selection
- [x] Status badge with color coding
- [x] Update appointment status ✅
- [x] Appointments calendar view ✅ NEW!
- [ ] Advanced filters (date range, search) (future)
- [ ] Export appointments (CSV) (future)

**Components**:

```
/appointments
  ├── AppointmentsList.tsx           ✅ (Admin page)
  ├── AppointmentCard.tsx            ✅
  ├── AppointmentFormDialog.tsx      ✅ (Create/Edit)
  ├── AppointmentStatusBadge.tsx     ✅
  ├── AppointmentStatusDialog.tsx    ✅ (Status update)
  ├── CalendarAppointmentCard.tsx    ✅ NEW! (Compact calendar cell card)
  ├── AppointmentsCalendar.tsx       ✅ NEW! (Calendar view with month/week/day)
  ├── AppointmentFilters.tsx         # Advanced filters (future)
  └── AppointmentActions.tsx         # Bulk actions (future)
```

**Pages**:

```
/pages/admin
  ├── AppointmentsList.tsx           ✅ (List view with "Calendar View" button)
  └── AppointmentsCalendarPage.tsx   ✅ NEW! (Calendar view page)
```

**Utils**:

```
/utils
  └── calendar.utils.ts              ✅ NEW! (Calendar helper functions)
```

**API Endpoints Used**:

- `GET /api/stores/:storeId/appointments` - List appointments ✅
- `POST /api/stores/:storeId/appointments` - Create appointment ✅
- `GET /api/stores/:storeId/appointments/:id` - Get appointment ✅
- `PATCH /api/stores/:storeId/appointments/:id` - Update appointment ✅
- `PATCH /api/stores/:storeId/appointments/:id/status` - Update status ✅
- `DELETE /api/stores/:storeId/appointments/:id` - Delete appointment ✅

**Tab Filters**:

- All appointments ✅
- Pending ✅
- Confirmed ✅
- Completed ✅
- Cancelled ✅
- No Show ✅

**Calendar Features** ✅ NEW!:

- Month view with calendar grid (7x5-6)
- Week view with time slots
- Day view with detailed schedule
- View toggle (Month/Week/Day)
- Navigation controls (Previous/Next/Today)
- Dynamic title based on current view
- Appointments grouped by day
- Color-coded appointment cards by status
- Click appointment to view/edit details
- Filter appointments by date range
- Link to/from list view
- Responsive design

### 8.2 Appointments Module (Staff View)

**Priority**: HIGH

**Features**:

- [ ] My appointments calendar
- [ ] My appointments list
- [ ] View appointment details
- [ ] Update appointment status (complete, no-show)
- [ ] Add internal notes
- [ ] Today's schedule
- [ ] Tomorrow's schedule

**Components**:

```
/staff/appointments
  ├── MyAppointments.tsx
  ├── MyAppointmentsCalendar.tsx
  ├── TodaysSchedule.tsx
  └── AppointmentDetailsModal.tsx
```

**API Endpoints Used**:

- `GET /api/appointments` - My appointments (filtered by staff ID)
- `GET /api/appointments/:id` - Appointment details
- `PATCH /api/appointments/:id` - Update appointment (internal notes)

---

## Phase 9: Widget Configuration (Week 7-8) - 100% Complete ✅

### 9.1 Widget Settings

**Priority**: HIGH

**Features**:

- [x] Widget layout selection (list/steps)
- [x] Sidebar menu items toggle (7 items)
- [x] Field requirements configuration (5 toggles)
- [x] Color customization (6 colors with pickers)
- [x] Typography settings (font family, font size)
- [x] Button styling (border radius)
- [x] Progress bar toggle
- [x] Guest booking toggle
- [x] Redirect URL after booking
- [x] Widget key display with copy button
- [x] Regenerate widget key with confirmation
- [x] Embed code display (script + iframe)
- [x] Live update functionality
- [x] Tabbed interface for organization

**Components**:

```
/admin
  └── WidgetSettings.tsx              ✅ (580 lines, 5 tabs)
```

**API Endpoints Used**:

- `GET /api/stores/:storeId/widget-settings` - Get settings ✅
- `PATCH /api/stores/:storeId/widget-settings` - Update settings ✅
- `POST /api/stores/:storeId/widget-settings/regenerate-key` - Regenerate key ✅
- `GET /api/stores/:storeId/widget-settings/embed-code` - Get embed code ✅

**Widget Settings Sections**:

1. **Layout & Structure** ✅

   - Layout mode: List (single page) / Steps (multi-step wizard)
   - Show company email toggle
   - Company email input
   - Sidebar menu items (7 toggles):
     - Service selection
     - Employee selection
     - Location selection
     - Extras selection
     - Date & Time selection
     - Customer info
     - Payment
   - Field requirements (5 toggles):
     - Employee required
     - Location required
     - Last name required
     - Email required
     - Phone required

2. **Colors & Styling** ✅

   - Primary color (color picker + hex input)
   - Secondary color
   - Sidebar background color
   - Content background color
   - Text color
   - Heading color

3. **Typography** ✅

   - Font family dropdown (8 Google Fonts)
   - Font size slider (10-20px)
   - Button border radius slider (0-24px)

4. **Other Settings** ✅

   - Show progress bar toggle
   - Allow guest booking toggle
   - Redirect URL after booking input

5. **Widget Key & Embed Code** ✅
   - Display widget key with copy button
   - Regenerate key button with confirmation warning
   - Display JavaScript embed code with copy
   - Display iframe code with copy
   - Visual feedback for copy actions

---

## Phase 10: Analytics & Reports (Week 8-9) - 100% Complete ✅

### 10.1 Analytics Dashboard

**Priority**: MEDIUM

**Features**:

- [x] Date range selector with presets (7 presets)
- [x] Appointment analytics charts
- [x] Revenue charts and metrics
- [x] Customer analytics summary
- [x] Staff performance metrics
- [x] Service popularity charts
- [x] Summary cards with key metrics
- [x] Interactive charts with recharts
- [x] Tabbed interface (Appointments/Revenue)
- [ ] Export reports (PDF/Excel) - Future

**Components**:

```
/admin
  └── Analytics.tsx                  ✅ (420 lines, comprehensive analytics)
```

**API Endpoints Used**:

- `GET /api/stores/:storeId/analytics/appointments` - Appointment stats ✅
- `GET /api/stores/:storeId/analytics/revenue` - Revenue stats ✅

**Charts/Reports Implemented**:

1. **Summary Cards** ✅

   - Total appointments with completed count
   - Total revenue with average value
   - Collection rate with paid count
   - Top service with booking count

2. **Appointments Tab** ✅

   - Appointments over time (line chart)
   - Appointments by status (pie chart with percentages)
   - Top services by bookings (bar chart)

3. **Revenue Tab** ✅
   - Revenue over time (dual-line chart: revenue + appointments)
   - Revenue by service (bar chart, top 10)
   - Revenue summary card:
     - Total revenue
     - Average appointment value
     - Total appointments
     - Paid vs unpaid breakdown
     - Collection rate

**Date Range Presets**:

- Today ✅
- Yesterday ✅
- Last 7 Days ✅
- Last 30 Days ✅ (Default)
- This Month ✅
- Last Month ✅
- This Year ✅

**Chart Features**:

- Responsive design (adapts to container)
- Interactive tooltips
- Custom colors matching brand
- Legends for clarity
- Grid lines for readability
- Proper axis labels

---

## Phase 11: Notification Settings (Week 9) - 100% Complete ✅

### 11.1 Notifications Module

**Priority**: MEDIUM

**Features**:

- [x] Notification settings form
- [x] Per-notification-type toggles
- [x] Channel selection (email/sms/both)
- [x] Email configuration
- [x] SMS configuration
- [x] Auto-save functionality
- [x] Conditional rendering based on toggles
- [ ] Template management (future)
- [ ] Template editor (future)
- [ ] Test notification sender (future)
- [ ] Available variables helper (future)

**Components**:

```
/admin
  └── NotificationSettings.tsx       ✅ (Comprehensive settings page)
```

**API Endpoints Used**:

- `GET /api/stores/:storeId/notifications/settings` - Get settings ✅
- `PATCH /api/stores/:storeId/notifications/settings` - Update settings ✅
- `GET /api/stores/:storeId/notifications/templates` - List templates (ready)
- `GET /api/stores/:storeId/notifications/templates/:type` - Get template (ready)
- `PATCH /api/stores/:storeId/notifications/templates/:type` - Update template (ready)
- `POST /api/stores/:storeId/notifications/templates/:type/reset` - Reset (ready)
- `POST /api/stores/:storeId/notifications/test` - Send test (ready)

**Settings Sections Implemented**:

1. **Email Configuration** ✅

   - Sender name input
   - Sender email input
   - Reply-to email input (optional)
   - Email provider select (SMTP, SendGrid, AWS SES)

2. **SMS Configuration** ✅

   - SMS provider select (None, Twilio, AWS SNS)

3. **Appointment Confirmation** ✅

   - Enable/disable toggle
   - Channel selection (email/sms/both) when enabled

4. **Appointment Reminders** ✅

   - Enable/disable toggle
   - Channel selection when enabled
   - 24 hours before toggle (nested)
   - 1 hour before toggle (nested)

5. **Appointment Cancellation** ✅

   - Enable/disable toggle
   - Channel selection when enabled

6. **Appointment Rescheduled** ✅

   - Enable/disable toggle
   - Channel selection when enabled

7. **Staff Invitation** ✅
   - Enable/disable toggle (email only, no channel)

**Template Types** (7 templates available in backend):

- appointment_confirmation
- appointment_reminder_24h
- appointment_reminder_1h
- appointment_cancelled
- appointment_rescheduled
- staff_invitation
- password_reset

**Features**:

- Auto-save on every change ✅
- Conditional rendering (channel selectors appear only when notification enabled) ✅
- Loading and error states ✅
- Toast notifications for feedback ✅
- Success alert for confirmation ✅
- Responsive design ✅
- Icons for visual clarity (Bell, Mail, MessageSquare, CheckCircle2) ✅

---

## Phase 12: Customer Management (Week 10) - 100% Complete ✅

### 12.1 Customers Module

**Priority**: LOW

**Features**:

- [x] Customers list ✅
- [x] Customer profile view ✅
- [x] Appointment history ✅
- [ ] Customer notes (future)
- [ ] Customer tags (future)
- [x] Search/filter customers ✅
- [ ] Export customers (future)

**Components**:

```
/customers
  ├── CustomerCard.tsx            ✅ (Customer info card with stats)
  └── CustomerProfile.tsx         ✅ (Detailed profile dialog)
```

**Pages**:

```
/pages/admin
  └── CustomersList.tsx           ✅ (Main customers page)
```

**Types**:

```
/types
  └── customer.types.ts           ✅ (Customer interfaces and DTOs)
```

**Services**:

```
/services
  └── customer.service.ts         ✅ (Customer API methods)
```

**API Endpoints Used**:

- `GET /api/stores/:storeId/customers` - List customers ✅
- `GET /api/stores/:storeId/customers/:id` - Get customer profile ✅
- `PATCH /api/stores/:storeId/customers/:id` - Update customer ✅
- `DELETE /api/stores/:storeId/customers/:id` - Delete customer ✅
- `GET /api/stores/:storeId/customers/search` - Search customers ✅

**Features Implemented**:

1. **CustomerCard Component** ✅

   - Customer name, email, phone display
   - Active/verified status badges
   - Appointment statistics (total, completed)
   - Total spent amount
   - Last and next appointment dates
   - Member since date
   - View profile action
   - Dropdown menu for additional actions

2. **CustomerProfile Component** ✅

   - Full customer details dialog
   - Contact information
   - Statistics cards (total, completed, cancelled, spent)
   - Complete appointment history
   - Appointment status badges
   - Payment status display
   - Service and staff information
   - Customer notes display
   - Responsive design

3. **CustomersList Page** ✅

   - Customer grid view (3 columns)
   - Search by name, email, phone
   - Customer count display
   - Empty state messaging
   - Profile dialog integration
   - Loading states
   - Error handling

4. **Customer Service Layer** ✅

   - getCustomers with filters
   - getCustomerProfile with appointments
   - updateCustomer
   - deleteCustomer (soft delete)
   - searchCustomers
   - getCustomerAppointments

5. **Customer Types** ✅
   - Customer interface (extends User)
   - CustomerWithStats (with appointment stats)
   - CustomerProfile (with appointments)
   - CustomerNote interface
   - CustomerFilters for search
   - UpdateCustomerDto
   - CustomerStats interface

**Components**:

```
/customers
  ├── CustomersList.tsx
  ├── CustomerCard.tsx
  ├── CustomerProfile.tsx
  ├── CustomerAppointments.tsx
  ├── CustomerNotes.tsx
  └── CustomerFilters.tsx
```

---

## 🛠️ Technical Implementation

### API Service Layer

**Structure**:

```typescript
// src/services/api.ts
class ApiService {
  private baseURL: string;
  private token: string | null;

  // Auth
  login(email: string, password: string): Promise<AuthResponse>;
  register(data: RegisterDto): Promise<AuthResponse>;
  logout(): Promise<void>;
  refreshToken(): Promise<AuthResponse>;

  // Store
  getMyStore(): Promise<Store>;
  updateStore(id: number, data: UpdateStoreDto): Promise<Store>;

  // Services
  getServices(storeId: number): Promise<Service[]>;
  createService(storeId: number, data: CreateServiceDto): Promise<Service>;
  updateService(
    storeId: number,
    id: number,
    data: UpdateServiceDto
  ): Promise<Service>;
  deleteService(storeId: number, id: number): Promise<void>;

  // Categories
  getCategories(storeId: number): Promise<Category[]>;
  createCategory(storeId: number, data: CreateCategoryDto): Promise<Category>;
  // ... more endpoints

  // Staff
  getStaff(storeId: number): Promise<StaffMember[]>;
  inviteStaff(storeId: number, email: string): Promise<StaffInvitation>;
  // ... more endpoints

  // Appointments
  getAppointments(
    storeId: number,
    filters?: AppointmentFilters
  ): Promise<Appointment[]>;
  createAppointment(
    storeId: number,
    data: CreateAppointmentDto
  ): Promise<Appointment>;
  // ... more endpoints

  // Widget
  getWidgetSettings(storeId: number): Promise<WidgetSettings>;
  updateWidgetSettings(
    storeId: number,
    data: UpdateWidgetSettingsDto
  ): Promise<WidgetSettings>;
  // ... more endpoints

  // Analytics
  getDashboardStats(storeId: number): Promise<DashboardStats>;
  getAppointmentAnalytics(
    storeId: number,
    params: AnalyticsQuery
  ): Promise<AppointmentAnalytics>;
  // ... more endpoints
}

export const apiService = new ApiService();
```

### State Management

**Options**:

1. **React Context** (Recommended for MVP)

   - AuthContext
   - ThemeContext
   - StoreContext (current store info)

2. **Zustand** (If more complex state needed)

   - Lightweight, easy to use
   - Good TypeScript support

3. **TanStack Query (React Query)** (Highly Recommended)
   - Server state management
   - Caching, refetching, optimistic updates
   - Perfect for API-heavy app

**Recommended Approach**: React Context for global state + TanStack Query for API data

### Custom Hooks

```typescript
// Authentication
useAuth() - Auth context consumer
useRequireAuth() - Redirect if not authenticated
useRequireRole(role: UserRole) - Role-based access

// API Data Fetching (with TanStack Query)
useStore() - Current store data
useServices(storeId: number) - Services list
useCategories(storeId: number) - Categories list
useStaff(storeId: number) - Staff list
useAppointments(storeId: number, filters?: AppointmentFilters) - Appointments
useWidgetSettings(storeId: number) - Widget settings
useDashboardStats(storeId: number) - Dashboard KPIs

// Mutations (with TanStack Query)
useCreateService() - Create service mutation
useUpdateService() - Update service mutation
useInviteStaff() - Invite staff mutation
// ... more mutations

// UI State
useToast() - Toast notifications
useModal() - Modal state management
useSidebar() - Sidebar open/close state
```

### TypeScript Types

**Shared Types** (from API):

```typescript
// src/types/index.ts
export * from "./api.types";
export * from "./appointment.types";
export * from "./store.types";
export * from "./service.types";
export * from "./staff.types";
export * from "./widget.types";
export * from "./analytics.types";

// Response types match API DTOs
export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  paymentStatus: PaymentStatus;
  // ...
}

export interface Store {
  id: number;
  ownerId: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  email?: string;
  phone?: string;
  currency: string;
  // ...
}

export interface Service {
  id: number;
  storeId: number;
  categoryId?: number;
  name: string;
  description?: string;
  duration: number;
  price: number;
  capacity: number;
  // ...
}

// ... more types
```

---

## 🎨 UI/UX Design Guidelines

### Design System

**Colors**:

- Primary: #1A84EE (Blue)
- Success: #10B981 (Green)
- Warning: #F59E0B (Amber)
- Error: #EF4444 (Red)
- Gray scale: Tailwind default grays

**Components** (shadcn/ui):

- Button (all variants)
- Input, Textarea, Select
- Dialog (Modal)
- Dropdown Menu
- Card
- Badge
- Alert
- Calendar
- Date Picker
- Table
- Tabs
- Toast
- Switch
- Checkbox, Radio
- Avatar
- Skeleton (loading)
- Progress
- Sheet (drawer)

**Layout**:

- Sidebar: 260px fixed width on desktop
- Responsive breakpoints: Tailwind defaults (sm, md, lg, xl, 2xl)
- Mobile: Collapsible sidebar (drawer)

### Accessibility

- ARIA labels for all interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader friendly
- Color contrast compliance (WCAG AA)

---

## 📦 Package Dependencies

### Core

```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "react-router-dom": "^7.2.0",
  "typescript": "^5.9.3",
  "vite": "^7.1.7"
}
```

### UI & Styling

```json
{
  "tailwindcss": "^4.1.16",
  "@tailwindcss/forms": "^0.5.10",
  "@radix-ui/react-*": "latest", // shadcn/ui dependencies
  "lucide-react": "^0.468.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0"
}
```

### State & Data Fetching

```json
{
  "@tanstack/react-query": "^5.62.8",
  "axios": "^1.7.9",
  "zustand": "^5.0.3" // optional
}
```

### Forms & Validation

```json
{
  "react-hook-form": "^7.54.2",
  "zod": "^3.24.1",
  "@hookform/resolvers": "^3.10.0"
}
```

### Date & Time

```json
{
  "date-fns": "^4.1.0",
  "react-day-picker": "^9.4.4"
}
```

### Charts & Visualization

```json
{
  "recharts": "^2.15.0"
}
```

### Utilities

```json
{
  "react-hot-toast": "^2.4.1", // or sonner
  "cmdk": "^1.0.4", // Command palette
  "react-dropzone": "^14.3.5" // File uploads
}
```

---

## 🚀 Development Timeline

### Week 1: Setup & Auth

- Project initialization
- Authentication system
- Basic layout

### Week 2: Dashboard & Store Settings

- Admin dashboard
- Store settings page

### Week 3-4: Service Management

- Services CRUD
- Categories management
- Service extras

### Week 4-5: Staff Management

- Staff list & invitations
- Working hours
- Time off management

### Week 5: Location Management

- Locations CRUD

### Week 6-7: Appointments

- Admin appointment management
- Staff appointment view
- Calendar implementation

### Week 7-8: Widget Configuration

- Widget settings UI
- Live preview

### Week 8-9: Analytics & Reports

- Dashboard analytics
- Reports & charts

### Week 9: Notifications

- Notification settings
- Template management

### Week 10: Polish & Testing

- Customer management (optional)
- Bug fixes
- Performance optimization
- Documentation

---

## 🎯 MVP (Minimum Viable Product)

**Priority Features for Initial Launch**:

1. ✅ Authentication (Login/Register)
2. ✅ Basic Layout & Navigation
3. ✅ Admin Dashboard
4. ✅ Store Settings
5. ✅ Service Management (Basic)
6. ✅ Staff Management (Invitations, List)
7. ✅ Appointment Management (Admin View)
8. ✅ Widget Settings (Basic)

**Can be added later**:

- Advanced analytics
- Customer management
- Notification customization
- Staff schedule view (detailed)
- Export features
- Recurring appointments

---

## 📝 Notes

### Development Best Practices

- Use TypeScript strictly (no `any` types)
- Component composition over inheritance
- Custom hooks for reusable logic
- Proper error handling (try-catch, error boundaries)
- Loading states for all async operations
- Optimistic UI updates where possible
- Proper form validation (react-hook-form + zod)
- Responsive design (mobile-first)
- Accessibility compliance
- Clean code & comments

### Code Organization

- One component per file
- Barrel exports (index.ts) for clean imports
- Separate logic from UI (custom hooks)
- API service layer abstraction
- Type safety everywhere
- Consistent naming conventions

### Performance Optimization

- Code splitting (React.lazy)
- Image optimization
- Debounced search inputs
- Pagination for long lists
- Memoization (useMemo, useCallback) where needed
- TanStack Query caching

---

## 🔄 Current Status

**Phase**: Phase 12 - Customer Management (100% Complete) ✅  
**Progress**: 95% (All major features implemented)  
**Next Task**: Polish, testing, and optional enhancements (Advanced filters, Staff Dashboard)

**Recent Completion**:

- ✅ Customer Management Module (Phase 12)

  - Created customer.types.ts with comprehensive interfaces:
    - Customer (extends User)
    - CustomerWithStats (with appointment statistics)
    - CustomerProfile (with full appointment history)
    - CustomerNote, CustomerFilters, UpdateCustomerDto
    - CustomerStats for analytics
  - Created customer.service.ts with 6 API methods:
    - getCustomers (with filters and search)
    - getCustomerProfile (with appointments)
    - updateCustomer
    - deleteCustomer (soft delete)
    - searchCustomers
    - getCustomerAppointments
  - CustomerCard.tsx (180+ lines):
    - Customer info display with avatar placeholder
    - Email, phone contact info
    - Active/verified status badges
    - Appointment statistics (total, completed)
    - Total spent with $ formatting
    - Last and next appointment dates
    - Member since date
    - Dropdown menu (View, Edit, Deactivate)
    - Click to view profile
  - CustomerProfile.tsx (220+ lines):
    - Detailed customer profile dialog
    - Customer info section with badges
    - 4 statistics cards (Total, Completed, Cancelled, Spent)
    - Complete appointment history list
    - Appointment details with status badges
    - Service and staff IDs
    - Payment status display
    - Customer notes display
    - Date formatting
    - Empty state for no appointments
  - CustomersList.tsx (170+ lines):
    - Main customers page
    - Search bar with real-time filtering
    - Customer grid (3 columns, responsive)
    - Customer count display
    - Profile dialog integration
    - Loading spinner
    - Error alert
    - Empty state with icon
  - Route integration: /admin/customers
  - Component exports updated

- ✅ Appointments Calendar View (Phase 8.1)

  - Created calendar.utils.ts with helper functions:
    - getMonthDays, getWeekDays (day calculation)
    - navigateNext, navigatePrev (navigation)
    - formatCalendarTitle (dynamic titles)
    - Date range bounds for filtering
  - CalendarAppointmentCard.tsx (Compact appointment card for calendar cells):
    - Status-based color coding
    - Time and customer name display
    - Payment status indicator
    - Click handler for details
  - AppointmentsCalendar.tsx (Main calendar component - 380+ lines):
    - Three view modes: Month, Week, Day
    - Month view: 7x5-6 grid with all month days
    - Week view: Time slots with day columns
    - Day view: Detailed hourly schedule
    - Navigation controls (Prev/Next/Today)
    - View selector dropdown
    - Dynamic title based on current view and date
    - Appointments grouped by day
    - Color-coded cards by status
    - Click to view/edit appointment (opens FormDialog)
    - Date range filtering via TanStack Query
    - "List View" button to navigate back
  - AppointmentsCalendarPage.tsx:
    - Admin page wrapper
    - Store fetching and loading states
    - Error handling
  - Updated AppointmentsList.tsx:
    - Added "Calendar View" button in header
    - Navigation to /admin/appointments/calendar
  - Route integration: /admin/appointments/calendar
  - Component exports updated

- ✅ Time Off Management Feature (Phase 6.3)

  - Created break.service.ts with CRUD methods for staff breaks
  - TimeOffDialog.tsx (Create/edit time off with date and time ranges)
  - TimeOffList.tsx (Display and manage breaks)
  - Date range selection with native date inputs
  - Partial day option with time picker
  - Reason field (500 char limit)
  - Recurring break toggle for annual repetition
  - Turkish locale date formatting (date-fns/locale/tr)
  - Edit and delete functionality for each break
  - Empty state with "İlk İzni Ekle" CTA
  - Integration with StaffCard ("Time Off" button)
  - Dialog-based UI for time off management
  - Auto-invalidation of queries on CRUD operations

- ✅ Appointment Status Update Feature (Phase 8.1 Enhancement)

  - Created UpdateAppointmentStatusDto type in appointment.types.ts
  - Updated appointmentService.updateAppointmentStatus method
  - AppointmentStatusDialog.tsx (Status update dialog with cancellation reason)
  - Status options with icons and descriptions (5 states)
  - Conditional cancellation reason field for cancelled/no_show statuses
  - Internal notes field for staff communication
  - Status change preview with visual feedback
  - Integration with AppointmentCard dropdown menu
  - Auto-invalidation of queries on update
  - Toast notifications for success/error
  - Loading states and proper error handling

- ✅ Phase 11: Notification Settings (100% Complete)
  - Created notification.types.ts with NotificationSettings and NotificationChannel types
  - Created notification.service.ts with getNotificationSettings and updateNotificationSettings methods
  - NotificationSettings.tsx (Comprehensive notification configuration page)
  - Email configuration (sender name, email, reply-to, provider)
  - SMS configuration (provider selection)
  - 5 notification types with toggles and channel selection:
    - Appointment Confirmation
    - Appointment Reminders (with 24h/1h sub-toggles)
    - Appointment Cancellation
    - Appointment Rescheduled
    - Staff Invitation (email-only)
  - Auto-save functionality with mutations
  - Conditional rendering for enabled notifications
  - Loading and error states
  - Route integration (/admin/notifications)
  - Success feedback with alert component

**Implementation Order**:

1. ✅ Week 1: Project setup + Authentication
2. ✅ Week 2: Layout + Dashboard + Store Settings
3. ✅ Week 3-4: Services & Categories
4. ✅ Week 4-5: Staff Management (100% Complete - all features done)
5. ✅ Week 5: Locations (100% Complete)
6. ✅ Week 6-7: Appointments (85% Complete - list view, status update, calendar view done)
7. ✅ Week 7-8: Widget Settings (100% Complete)
8. ✅ Week 8-9: Analytics & Reports (100% Complete)
9. ✅ Week 9: Notifications (100% Complete)
10. ✅ Week 10: Customer Management (100% Complete)---

## 🎯 Success Metrics

- All CRUD operations working smoothly
- Role-based access control working
- Responsive on all devices
- < 2s page load time
- No critical bugs
- Proper error handling
- Intuitive UX (minimal training needed)
- 90%+ TypeScript coverage
