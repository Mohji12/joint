# Admin users

Admin accounts cannot be created via the public registration form. They must be created directly in the database or via a one-off script.

## Creating an admin user

### Option 1: Direct database insert/update

1. Ensure you have a user row in the `users` table (or create one with a hashed password).
2. Set `role = 'ADMIN'` for that user.

Example (PostgreSQL), after hashing the password with your app’s password hasher:

```sql
-- If updating an existing user:
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';

-- If inserting a new admin (replace with your hashed password):
INSERT INTO users (id, email, name, hashed_password, role, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  'Admin',
  '<bcrypt-or-argon2-hashed-password>',
  'ADMIN',
  'true',
  NOW(),
  NOW()
);
```

### Option 2: One-off script

From `jointlly_backend`:

```bash
python scripts/seed_admin_dummy.py --email admin@jointlly.in --password "YourSecurePassword" --name "Jointlly Admin"
```

Creates or updates a user with `role = ADMIN` and `is_active = true`. Re-run with the same email to reset the password.

### Option 3: Environment-based first admin (optional)

You can add a startup/seeder that reads e.g. `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the environment and creates the first admin user if none exists. This should only run in a controlled environment and must use the same password hashing as the rest of the app.

## Accessing the admin dashboard

- Log in with an account that has `role = 'ADMIN'`.
- Open `/admin` (e.g. `https://your-domain.com/admin`).
- When logged in as admin, the profile dropdown also shows an “Admin dashboard” link.

## Change admin password (in dashboard)

While logged in as admin, open **Admin → Settings** (`/admin/settings`). Enter a new password and confirm it. No current password or email OTP is required; the change is recorded in the admin audit log.

Only users with the ADMIN role can access `/admin` and the admin API endpoints (`/api/v1/admin/*`).
