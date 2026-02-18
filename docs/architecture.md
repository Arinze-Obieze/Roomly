# RoomFind Architecture Documentation

This document outlines the architectural decisions, project structure, and design patterns used in the RoomFind application.

## 1. Project Structure

The project follows a feature-based and centralized core structure to improve maintainability and scalability.

```
/
├── app/                  # Next.js App Router (Routes & Pages)
│   ├── (auth)/           # Authentication routes group
│   ├── (dashboard)/      # Protected dashboard routes group
│   └── api/              # API Routes (Controllers)
├── components/           # UI Components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components (Header, Sidebar)
│   └── ...               # Feature-specific components
├── core/                 # Centralized Business Logic & Utilities
│   ├── contexts/         # React Context Providers
│   ├── hooks/            # Custom React Hooks
│   ├── services/         # Business Logic & DB Interactions
│   ├── utils/            # Helper functions & external clients (Supabase)
│   └── validations/      # Zod Schemas for input validation
└── docs/                 # Project Documentation
```

### Key Decisions

- **`core/` Directory**: We moved shared logic (`utils`, `contexts`, `hooks`) and business logic (`services`) into a root-level `core` directory. This clearly separates "application code" from "framework code" (Next.js `app` directory) and UI (`components`).
- **Route Grouping**: We use Next.js Route Groups `(auth)` and `(dashboard)` to organize routes without affecting the URL structure, allowing for specific layouts per group.

## 2. Service Layer Pattern

We implemented a **Service Layer** pattern to separate business logic from the HTTP/Next.js API layer.

- **Location**: `core/services/`
- **Purpose**: Services handle database interactions, complex business rules, and error handling. They are agnostic of the HTTP request/response objects.
- **Example**: `AuthService` handles `login`, `signup`, `logout`, and `getSession`.
- **Benefit**: This makes logic reusable (can be called from Server Components, API routes, or Server Actions) and easier to test.

## 3. Data Flow & State Management

- **Server State**: Managed via Supabase clients in `core/services`.
- **Client State**:
  - **Context API**: Used for global auth state (`AuthContext`) and UI state (`FilterContext`, `NotificationsContext`).
  - **React Query / SWR**: (Recommended for future) Data fetching libraries should be used for caching server state on the client.

## 4. Authentication & Security

- **Supabase Auth**: We leverage Supabase for authentication.
- **Session Management**:
  - **Client-Side**: `createClient` (browser) for client interactions.
  - **Server-Side**: `createClient` (server) using cookies for SSR and API routes.
  - **Admin**: `createAdminClient` uses the `SERVICE_ROLE_KEY` for privileged operations (e.g., user management) and is strictly robust server-side only. API routes protecting admin actions must verify the user's role.
- **Validation**: All write operations in API routes are validated using **Zod** schemas located in `core/validations/`.

## 5. Performance Optimizations

- **Images**: We strictly use `next/image` for automatic image optimization (sizing, format conversion, lazy loading).
- **Code Splitting**: Heavy components (like animations or charts) are loaded via `next/dynamic` to reduce the initial bundle size. `ssr: false` is used for client-only heavy interactive components.

## 6. Development Standards

- **Imports**: verification of clean imports using aliases (`@/core/...`, `@/components/...`).
- **Naming**:
  - Components: PascalCase (e.g., `CreateListingForm.jsx`)
  - Utilities/Hooks: camelCase (e.g., `useAuth.js`, `formatDate.js`)
  - Directories: lowercase-kebab-case (mostly) or camelCase depending on context, standardized to lowercase for clear category folders (`components/forms`).
