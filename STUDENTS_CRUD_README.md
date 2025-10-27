# Student CRUD Implementation

This document describes the student CRUD implementation with role-based access control.

## Overview

A complete student management system has been implemented with the following features:

### ✅ Features Implemented

1. **Role-Based Access Control**
   - Created `ProtectedRoute` component for modular access control
   - Currently configured for `ADMIN` role only
   - Easily adjustable by modifying the `allowedRoles` prop

2. **Student Management Pages**
   - Full CRUD operations (Create, Read, Update, Delete)
   - Paginated list view
   - Search and filter functionality
   - Status management

3. **UI Components**
   - Dialog component for modals
   - Table component for data display
   - Student form component for create/edit
   - Search and filter UI

## File Structure

```
src/
├── components/
│   ├── protected-route.tsx       # Role-based access control
│   ├── student-form.tsx           # Create/Edit student form
│   └── ui/
│       ├── dialog.tsx             # Dialog/Modal component
│       └── table.tsx              # Table component

services/
└── student.service.ts              # Student API service (updated)

app/
└── dashboard/
    └── students/
        └── page.tsx               # Main student management page
```

## Access Control

### Current Configuration

The student management page is protected and only accessible to users with the `ADMIN` role. This is configured in:

```typescript
// app/dashboard/students/page.tsx
export default function StudentsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <StudentsPageContent />
    </ProtectedRoute>
  )
}
```

### Changing Access Permissions

To allow other roles to access the student management page, simply modify the `allowedRoles` array:

```typescript
// Allow ADMIN and TEACHER
<ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
  <StudentsPageContent />
</ProtectedRoute>

// Allow multiple roles
<ProtectedRoute allowedRoles={['ADMIN', 'TEACHER', 'STUDENT']}>
  <StudentsPageContent />
</ProtectedRoute>

// Allow all authenticated users
<ProtectedRoute allowedRoles={[]}>
  <StudentsPageContent />
</ProtectedRoute>
```

## API Integration

The implementation uses the following API endpoints (from Postman collection):

- `GET /api/v1/students` - Get all students (paginated)
- `GET /api/v1/students/search` - Search students with filters
- `GET /api/v1/students/:id` - Get student by ID
- `GET /api/v1/students/registration/:number` - Get student by registration number
- `POST /api/v1/students` - Create new student
- `PUT /api/v1/students/:id` - Update student
- `DELETE /api/v1/students/:id` - Delete student (soft delete)
- `POST /api/v1/students/:id/restore` - Restore deleted student
- `PATCH /api/v1/students/:id/status` - Update student status

All create, update, and delete operations include the `X-User-Id` header for audit purposes.

## Features

### Student List Page

- **Pagination**: Navigate through pages of students
- **Search**: Filter by student name
- **Course Filter**: Filter by course name
- **Status Filter**: Filter by student status (Active, Inactive, Graduated, Suspended)
- **Actions**: Edit or delete students
- **Real-time Statistics**: Display total number of students

### Create/Edit Form

Includes fields for:
- Personal information (name, CPF, email, phone, birth date)
- Academic information (course, semester, enrollment date, status)
- Address information (street, number, complement, neighborhood, city, state, zipcode)
- Emergency contact (name, phone, relationship)
- Notes

### Status Management

Student statuses:
- **ACTIVE**: Active student
- **INACTIVE**: Inactive student
- **GRADUATED**: Graduated student
- **SUSPENDED**: Suspended student

## Usage

1. Navigate to the dashboard
2. Click on "Estudantes" card (visible to ADMIN and TEACHER roles)
3. Use the students management page to:
   - View all students
   - Search and filter students
   - Create new students
   - Edit existing students
   - Delete students

## Customization

### Adding More Filter Options

To add more filter options, modify the search form in `app/dashboard/students/page.tsx` and update the `StudentSearchParams` type in `src/types/student.types.ts`.

### Changing UI Theme

The components use Tailwind CSS and are theme-aware. Modify the color scheme by updating `globals.css`.

## Dependencies

- `@radix-ui/react-dialog` - For modal dialogs
- `lucide-react` - For icons
- `tailwindcss` - For styling
- `next` - Framework

## Notes

- The student service uses the base path `/api/v1/students` to match the API Gateway configuration
- All operations include proper error handling
- The form validates required fields before submission
- Delete operations are confirmed before execution

