# Role-Based Access Control (RBAC) Documentation

## Overview

The Dwip Unnayan Sangstha project implements a comprehensive RBAC system with granular, module-action level permissions. Every backend feature is gated by permissions, and the frontend dashboard dynamically shows/hides sections based on user permissions.

---

## Core Concepts

### 1. Roles
Roles represent job functions or access levels. Each role has:
- **Name** — Human-readable label (e.g., "Super Admin", "Editor")
- **Slug** — Machine-readable identifier (e.g., "super-admin", "editor")
- **Level** — Hierarchical numeric value (higher = more access)
- **is_default** — Whether this is the default role for new users
- **is_active** — Whether the role is currently usable
- **created_by / updated_by** — Audit trail

### 2. Permissions
Permissions are granular, atomic actions grouped by module:
- **Module** — Functional area (e.g., "cms", "jobs", "applications", "users")
- **Action** — Specific operation (e.g., "view", "create", "update", "delete")
- **Slug** — Unique identifier: `{module}.{action}` (e.g., "cms.blogs.view")
- **Name** — Human-readable label
- **Description** — Detailed description
- **is_active** — Whether the permission is currently usable

### 3. Role-Permission Assignment
- Many-to-many relationship via `role_permissions` table
- Each assignment has a `granted` boolean (allows explicit deny)
- Permissions are inherited through role hierarchy (higher roles get all lower role permissions)

### 4. User-Role Assignment
- Many-to-many relationship via `user_roles` table
- Each assignment tracks: `assigned_by`, `assigned_at`, `expires_at`, `is_active`
- Users can have multiple roles simultaneously
- Role assignments can expire (time-limited access)

### 5. Module Access
- `role_module_access` table controls which modules a role can access
- Access levels: `none`, `read`, `write`, `admin`
- Provides coarse-grained access control on top of fine-grained permissions

---

## Database Schema

### Tables

```
roles
├── id (PK)
├── name
├── slug (unique)
├── description (nullable)
├── level (integer)
├── is_default (boolean)
├── is_active (boolean)
├── created_by (FK → users, nullable)
├── updated_by (FK → users, nullable)
├── created_at, updated_at, deleted_at
└── indexes: slug, level, is_active

permissions
├── id (PK)
├── name
├── slug (unique)
├── module (string)
├── action (string)
├── description (nullable)
├── is_active (boolean)
├── created_at, updated_at
└── indexes: module, action, is_active, unique(module, action)

role_permissions
├── id (PK)
├── role_id (FK → roles)
├── permission_id (FK → permissions)
├── granted (boolean, default true)
├── created_at, updated_at
└── unique(role_id, permission_id)

user_roles
├── id (PK)
├── user_id (FK → users)
├── role_id (FK → roles)
├── assigned_by (FK → users, nullable)
├── assigned_at (timestamp)
├── expires_at (timestamp, nullable)
├── is_active (boolean)
├── created_at, updated_at
└── unique(user_id, role_id)

role_module_access
├── id (PK)
├── role_id (FK → roles)
├── module (string)
├── access_level (enum: none, read, write, admin)
├── created_at, updated_at
└── unique(role_id, module)
```

---

## Permission Matrix

### Modules & Actions

| Module | Actions | Description |
|--------|---------|-------------|
| **dashboard** | view, admin, employer | Dashboard access and admin/employer views |
| **users** | view, create, update, delete | User management |
| **roles** | view, create, update, delete | Role management |
| **permissions** | view, create, update, delete | Permission management |
| **jobs** | view, create, update, delete | Job listing management |
| **job-categories** | view, create, update, delete | Job category management |
| **locations** | view, create, update, delete | Location management |
| **applications** | view, update, delete, export | Application management |
| **applicant-profiles** | view, update, delete | Applicant profile management |
| **cms.pages** | view, create, update, delete | CMS page management |
| **cms.sections** | view, create, update, delete | CMS section configuration |
| **cms.blogs** | view, create, update, delete, toggle_status, toggle_featured | Blog management |
| **cms.programs** | view, create, update, delete, toggle_status, toggle_featured | Program management |
| **cms.publications** | view, create, update, delete, toggle_status, toggle_featured | Publication management |
| **cms.about** | view, create, update, delete | About content management |
| **newsletter** | view, create, update, delete | Newsletter subscriber management |
| **newsletter-campaigns** | view, create, update, delete, send | Campaign management |
| **audit-logs** | view, export, prune | Audit log access |
| **logs** | view, prune | System log access |
| **backup** | view, create, restore | Database backup |
| **settings** | view, update | Application settings |
| **profile** | view, update | User profile management |

### Role Hierarchy (Example)

| Role | Level | Module Access |
|------|-------|---------------|
| Super Admin | 100 | All modules, all actions |
| Admin | 80 | All modules, most actions |
| Editor | 60 | CMS modules only |
| Employer | 40 | Jobs, applications, applicant profiles |
| Staff | 20 | Dashboard view, applications view |
| Job Seeker | 0 | Profile, apply, public pages |

---

## How Permissions Are Checked

### Backend (Controllers & Middleware)

```php
// In controllers - using permission middleware
Route::middleware(['permission:cms.blogs.view'])->group(function () {
    Route::get('/backend/cms/blogs', [BlogController::class, 'index']);
});

// In controllers - manual check
if (!$request->user()->hasPermission('cms.blogs.update')) {
    abort(403);
}
```

### Frontend (React)

```javascript
// Using the Can component
<Can permission="cms.blogs.create">
  <button onClick={handleCreate}>Add New</button>
</Can>

// Using hasPermission helper
const canViewCms = hasPermission('cms.blogs.view') || hasPermission('cms.programs.view');
```

### User Model Methods (via HasRoles trait)

```php
// Check single permission
$user->hasPermission('cms.blogs.view');

// Check any of multiple permissions
$user->hasAnyPermission(['cms.blogs.view', 'cms.programs.view']);

// Check all permissions
$user->hasAllPermissions(['cms.blogs.view', 'cms.blogs.create']);

// Check role
$user->hasRole('admin');
$user->hasAnyRole(['admin', 'editor']);

// Check module access
$user->hasModuleAccess('cms', 'write');
```

---

## Seeder Files

| Seeder | Purpose |
|--------|---------|
| `RBACSeeder.php` | Main orchestrator — calls all sub-seeders |
| `RolesSeeder.php` | Creates default roles (Super Admin, Admin, Editor, etc.) |
| `PermissionsSeeder.php` | Creates all permissions for all modules |
| `RolePermissionsSeeder.php` | Assigns permissions to roles |
| `ModuleAccessSeeder.php` | Sets module-level access for roles |
| `UserRolesSeeder.php` | Assigns roles to default users |

### Seeding Order

```
1. RolesSeeder → creates roles
2. PermissionsSeeder → creates permissions
3. RolePermissionsSeeder → assigns permissions to roles
4. ModuleAccessSeeder → sets module access levels
5. UserRolesSeeder → assigns roles to users
```

---

## Frontend Permission Gating

### Dashboard (`resources/js/pages/dashboard.jsx`)

The dashboard dynamically shows/hides sections based on user permissions:

```javascript
const hasPermission = (perm) => {
  if (!Array.isArray(permissions)) return false;
  if (permissions.includes('*') || permissions.includes('dashboard.admin')) return true;
  return permissions.includes(perm);
};

const canViewCms = hasPermission('cms.dashboard') || hasPermission('cms.view') || ...;
const canViewNewsletter = hasPermission('newsletter.view');
const canViewStatistics = hasPermission('dashboard.admin') || hasPermission('dashboard.employer') || hasPermission('statistics.view');
const canViewUsers = hasPermission('users.view');
const canViewJobs = hasPermission('jobs.view') || hasPermission('listing.view');
```

### AdminLayout Sidebar

The sidebar menu items are conditionally rendered based on role and permissions. Each menu item has:
- `permission` — Required permission to show
- `role` — Required role to show
- Dynamic filtering based on user's effective permissions

---

## Security Considerations

1. **Route-level enforcement** — All backend routes use permission middleware
2. **Controller-level checks** — Critical operations verify permissions in controller methods
3. **Frontend gating** — UI elements are hidden for unauthorized users (defense in depth)
4. **API protection** — All API endpoints require authentication + permission checks
5. **Audit trail** — All permission changes are logged via AuditMutations middleware
6. **Session security** — CSRF protection, session regeneration on login

---

## Adding New Permissions

To add a new permission to the system:

1. **Add to PermissionsSeeder.php:**
```php
['name' => 'View Reports', 'slug' => 'reports.view', 'module' => 'reports', 'action' => 'view', 'description' => 'View reports', 'is_active' => true],
```

2. **Assign to roles in RolePermissionsSeeder.php:**
```php
$role->permissions()->attach($permission->id, ['granted' => true]);
```

3. **Add module access in ModuleAccessSeeder.php:**
```php
$role->moduleAccess()->create(['module' => 'reports', 'access_level' => 'read']);
```

4. **Use in controllers:**
```php
Route::middleware(['permission:reports.view'])->group(function () {
    Route::get('/backend/reports', [ReportController::class, 'index']);
});
```

5. **Use in frontend:**
```jsx
<Can permission="reports.view">
  <Link to="/backend/reports">Reports</Link>
</Can>
```

6. **Re-seed:**
```bash
php artisan db:seed --class=RBACSeeder
```

---

## Testing RBAC

Tests should verify:
- Users with correct permissions can access endpoints
- Users without permissions receive 403 responses
- Role hierarchy is respected (higher roles inherit lower role permissions)
- Expired role assignments are not effective
- Permission changes take effect immediately (no caching of permissions)

Example test:
```php
it('denies access to users without permission', function () {
    $user = User::factory()->create();
    $user->roles()->attach(Role::where('slug', 'job-seeker')->first());

    $response = $this->actingAs($user)->get('/backend/cms/blogs');
    $response->assertStatus(403);
});
```
