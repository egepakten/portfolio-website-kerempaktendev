# Migration Files - Ordered List

## How to Use This List

You have two options:

### Option 1: Run All at Once (Recommended)
1. Copy the entire content from `MIGRATION_COMBINED.sql`
2. Go to your Supabase dashboard: https://gakrmstptyljpaqwjtjj.supabase.co
3. Click **SQL Editor** → **New Query**
4. Paste the entire content
5. Click **Run**

### Option 2: Run One by One
Follow the list below and run each migration in order. This helps identify which migration causes issues if something fails.

---

## Migration Files in Order

### 1. **20251219155659** - Core Tables Setup
**What it does:** Creates the foundation tables for the blog
- `categories` - Blog post categories
- `posts` - Blog posts
- `tags` - Post tags
- `post_tags` - Junction table for post-tag relationships
- `subscribers` - Newsletter subscribers
- Enables RLS (Row Level Security)
- Creates `update_updated_at_column()` function

**File:** `supabase/migrations/20251219155659_9f7b6c87-e331-467c-b790-6f0bb7611c01.sql`

---

### 2. **20251219155720** - Security Fix
**What it does:** Fixes security issue on the timestamp update function
- Adds `SECURITY DEFINER` and `SET search_path = public`

**File:** `supabase/migrations/20251219155720_823c973a-286b-469f-9ab1-50a2740be07e.sql`

---

### 3. **20251219161321** - Post Management Policies
**What it does:** Adds RLS policies for managing posts and categories
- Allows insert/update/delete for posts
- Allows insert/update/delete for categories

**File:** `supabase/migrations/20251219161321_a18696ef-1ca6-4f9f-a1c4-550204d95efd.sql`

---

### 4. **20251219161347** - View All Posts Policy
**What it does:** Changes post visibility policy
- Allows viewing all posts (filtering happens in application code)

**File:** `supabase/migrations/20251219161347_a28eefb9-89e2-43b2-8ba7-922dcc0ddbf2.sql`

---

### 5. **20251219165003** - Tag Management Policies
**What it does:** Adds RLS policies for tag management
- Allows insert/update/delete for tags

**File:** `supabase/migrations/20251219165003_e93d911c-10a2-42e1-8ead-2b911441d978.sql`

---

### 6. **20251219170301** - Subscriber Email Constraint
**What it does:** Adds unique constraint on subscriber emails
- Prevents duplicate email subscriptions

**File:** `supabase/migrations/20251219170301_5905fbc1-875e-4bda-9ea0-3355a5d38dec.sql`

---

### 7. **20251219172238** - Authentication & User Tables
**What it does:** Creates user authentication infrastructure
- `profiles` - User profiles
- `user_roles` - User role assignments
- `post_likes` - Post likes
- `post_comments` - Post comments
- Creates `has_role()` function for role checking
- Creates `handle_new_user()` trigger for auto-profile creation
- Adds RLS policies for all new tables

**File:** `supabase/migrations/20251219172238_3cdb1506-4800-4684-9657-4c0b2be2a392.sql`

---

### 8. **20251219175441** - Subscriber Access Policies
**What it does:** Adds RLS policies for subscriber access
- Users can view/update their own subscription

**File:** `supabase/migrations/20251219175441_0b5246dc-61e7-482b-bc56-c06a2b63097f.sql`

---

### 9. **20251219181841** - Admin Subscriber Viewing
**What it does:** Allows admins to view all subscribers
- Admins can see subscriber count and list

**File:** `supabase/migrations/20251219181841_f2886924-8383-4738-af33-1c29a43fd176.sql`

---

### 10. **20251219190829** - Fix Admin Subscriber Policy
**What it does:** Fixes the admin subscriber viewing policy
- Uses `has_role()` function for consistency

**File:** `supabase/migrations/20251219190829_b74e3720-b258-42d6-aab1-38dbde0af0bb.sql`

---

### 11. **20251219232256** - Post-Tags Management
**What it does:** Adds management policies for post-tag relationships
- Admins can manage post-tag links

**File:** `supabase/migrations/20251219232256_fc027b2a-37c2-485d-aeb5-dcecef041aba.sql`

---

### 12. **20251220104823** - Realtime for Subscribers
**What it does:** Enables realtime updates for subscriber table
- Subscribers table changes are broadcast in real-time

**File:** `supabase/migrations/20251220104823_0f326adf-6ac2-4539-9641-50e37eb07fce.sql`

---

### 13. **20251220163230** - Auto-Subscribe on Signup
**What it does:** Updates user creation to auto-subscribe to newsletter
- New users are automatically added to subscribers table

**File:** `supabase/migrations/20251220163230_acf40277-c4c3-45fc-a984-d85b570bac3a.sql`

---

### 14. **20251220165647** - Avatar Storage Bucket
**What it does:** Creates storage bucket for user avatars
- Creates `avatars` bucket
- Adds RLS policies for avatar uploads

**File:** `supabase/migrations/20251220165647_1254399c-2804-432b-a0c9-bc2995ec72fb.sql`

---

### 15. **20251220165850** - Account Deletion Policies
**What it does:** Adds policies for account deletion
- Users can delete their own profile
- Users can delete their own subscription

**File:** `supabase/migrations/20251220165850_97133495-3840-416a-9439-da735a6a4383.sql`

---

### 16. **20251220170355** - Deleted Accounts Tracking
**What it does:** Creates table to track deleted accounts
- `deleted_accounts` - Records of deleted user accounts
- Admins can view deletion records

**File:** `supabase/migrations/20251220170355_1c7bac5a-d612-4532-a245-dcb6fcb1ff3f.sql`

---

### 17. **20251220171107** - Site Settings
**What it does:** Creates table for site configuration
- `site_settings` - Key-value pairs for site settings
- Default values: site_name, site_description

**File:** `supabase/migrations/20251220171107_e7754ca7-9abc-47ae-a424-55d8eca2ce1f.sql`

---

### 18. **20251220171804** - Email Notification Tracking
**What it does:** Adds columns to track email notifications
- `last_notified_at` - When post was last notified
- `notified_subscriber_count` - How many subscribers were notified

**File:** `supabase/migrations/20251220171804_6a26206e-23ad-4a15-943f-e85140092c85.sql`

---

### 19. **20251220172846** - Notification History
**What it does:** Creates table to track email notification history
- `post_notification_history` - Records of all notifications sent

**File:** `supabase/migrations/20251220172846_2994aa20-c2fd-426e-b0fc-ebe9e28e4059.sql`

---

### 20. **20251220174137** - Comment Replies & Pinning
**What it does:** Adds support for comment replies and pinning
- `parent_id` - For nested comment replies
- `is_pinned` - For pinned comments
- Admins can pin/unpin comments

**File:** `supabase/migrations/20251220174137_d7c450b7-698d-4f7a-9e65-650b22ebf693.sql`

---

### 21. **20251220180950** - Projects & Tracking
**What it does:** Creates tables for project management
- `projects` - GitHub projects
- `project_progress` - Project progress updates
- `github_cache` - Cached GitHub data

**File:** `supabase/migrations/20251220180950_e181976a-b6d5-4e61-bd12-5d700c08967b.sql`

---

### 22. **20251220191437** - Project Status
**What it does:** Adds status column to projects
- Status options: in_progress, testing, deployed, archived, paused

**File:** `supabase/migrations/20251220191437_ce4e42dd-f501-4014-9d6d-99f302b6df4e.sql`

---

### 23. **20251220195018** - Daily Progress Tracking
**What it does:** Creates table for daily learning progress
- `daily_progress` - Daily progress entries for projects

**File:** `supabase/migrations/20251220195018_febe7d50-0988-4dae-b396-4cde49b86f5c.sql`

---

## Summary

- **Total Migrations:** 23
- **Total Tables Created:** 18
- **Total Functions Created:** 2
- **Total Triggers Created:** 5
- **Total Enums Created:** 2

## Next Steps After Running Migrations

1. ✅ Run all migrations (use `MIGRATION_COMBINED.sql`)
2. 📝 Deploy Edge Functions
3. 🔑 Set environment variables for functions
4. 🧪 Test your application locally
5. 🚀 Deploy to production

---

## Troubleshooting

If a migration fails:
1. Check the error message
2. Note which migration number failed
3. Fix the issue in that specific migration file
4. Run only that migration again
5. Continue with the next migrations

If you need to start over:
1. Go to Supabase dashboard
2. Click **Settings → Danger Zone**
3. Click **Reset Database**
4. Run all migrations again

