# Create Super Admin User

## Method 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **Add User** button
5. Enter:
   - Email: `dean@smartcrm.vip`
   - Password: `VideoRemix2025`
   - Auto Confirm User: **YES** (check this box)
6. Click **Create User**
7. Copy the User ID that is generated

## Method 2: Set Super Admin Role via SQL

After creating the user through the dashboard, run this SQL in the Supabase SQL Editor:

```sql
-- Replace 'USER_ID_HERE' with the actual user ID from step 7 above
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'super_admin')
ON CONFLICT (user_id)
DO UPDATE SET role = 'super_admin', updated_at = now();
```

## Method 3: Using Supabase CLI (If installed)

If you have Supabase CLI installed locally, you can run:

```bash
# Create the user
supabase auth users create dean@smartcrm.vip --password VideoRemix2025

# Then get the user ID and run the SQL from Method 2
```

## Verify Super Admin Access

After creating the user and setting the role, verify by running this SQL:

```sql
SELECT
  u.id,
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email = 'dean@smartcrm.vip';
```

You should see:
- Email: dean@smartcrm.vip
- Role: super_admin

## Login to the App

Once created, you can login to the application with:
- **Email**: dean@smartcrm.vip
- **Password**: VideoRemix2025

As a super admin, this user will have full access to all features and data in the system.

## What Super Admin Can Do

With the super_admin role, this user can:
- View all user data
- Manage user roles
- Access all videos and content
- View all analytics across all users
- Manage system-wide settings
- Approve/reject all viewer interactions
- Access all branding configurations

## Security Note

The super_admin role has elevated privileges. Make sure to:
- Keep the password secure
- Use strong authentication
- Consider enabling 2FA once logged in
- Monitor admin actions via audit logs
