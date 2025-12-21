# Complete Setup Guide for New Supabase Project

## Project Details
- **Project URL:** https://gakrmstptyljpaqwjtjj.supabase.co
- **Project ID:** gakrmstptyljpaqwjtjj
- **Anon Key:** sb_publishable_wBhi09YMCHTGRDOksKiC7A_NwRGgoFq

---

## Step 1: Get Your Service Role Key ⚙️

### How to Find It:
1. Go to: https://gakrmstptyljpaqwjtjj.supabase.co
2. Sign in with your Supabase account
3. Click **Settings** (bottom left) → **API**
4. Look for **Service Role Key** (NOT the Anon Key)
5. Copy it (it starts with `sbp_` or similar)

### Why You Need It:
- Required for Edge Functions
- Required for database migrations
- Keep it SECRET - never commit to Git

---

## Step 2: Update Your Environment Variables 📝

### Create `.env.local` in your project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://gakrmstptyljpaqwjtjj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_wBhi09YMCHTGRDOksKiC7A_NwRGgoFq
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Edge Function Secrets (get these from your accounts)
RESEND_API_KEY=your_resend_api_key_here
GITHUB_TOKEN=your_github_token_here
SITE_URL=http://localhost:5173  # For development
```

### For Production (Vercel):
Add these environment variables in Vercel project settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `GITHUB_TOKEN`
- `SITE_URL` (your production URL)

---

## Step 3: Run Database Migrations 🗄️

### Option A: Run All at Once (Recommended)

1. Go to your Supabase dashboard: https://gakrmstptyljpaqwjtjj.supabase.co
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open `MIGRATION_COMBINED.sql` from your project
5. Copy ALL the content
6. Paste into the SQL Editor
7. Click **Run** button (top right)
8. Wait for completion (should take 1-2 minutes)

### Option B: Run One by One

If you want to run migrations individually:

1. Go to **SQL Editor** → **New Query**
2. For each migration file in order (see `MIGRATION_LIST.md`):
   - Open the migration file
   - Copy the content
   - Paste into SQL Editor
   - Click **Run**
   - Wait for completion
   - Move to next migration

### Verify Migrations Worked:

1. Go to **Table Editor** (left sidebar)
2. You should see these tables:
   - categories
   - posts
   - tags
   - post_tags
   - subscribers
   - profiles
   - user_roles
   - post_likes
   - post_comments
   - projects
   - project_progress
   - github_cache
   - daily_progress
   - deleted_accounts
   - site_settings
   - post_notification_history

---

## Step 4: Deploy Edge Functions 🚀

### Prerequisites:
- Supabase CLI installed (or use Docker)
- Service Role Key from Step 1

### Deploy Functions:

```bash
# Option 1: Using Docker (if CLI won't install)
docker run -it -v ~/.supabase:/root/.supabase -v $(pwd):/workspace supabase/cli:latest functions deploy delete-user
docker run -it -v ~/.supabase:/root/.supabase -v $(pwd):/workspace supabase/cli:latest functions deploy send-welcome-email
docker run -it -v ~/.supabase:/root/.supabase -v $(pwd):/workspace supabase/cli:latest functions deploy notify-subscribers
docker run -it -v ~/.supabase:/root/.supabase -v $(pwd):/workspace supabase/cli:latest functions deploy generate-cover-image
docker run -it -v ~/.supabase:/root/.supabase -v $(pwd):/workspace supabase/cli:latest functions deploy suggest-category
docker run -it -v ~/.supabase:/root/.supabase -v $(pwd):/workspace supabase/cli:latest functions deploy github-api

# Option 2: Manual Deployment via Dashboard
# See "Manual Function Deployment" section below
```

---

## Step 5: Set Edge Function Secrets 🔐

### For Each Function:

1. Go to your Supabase dashboard
2. Click **Functions** (left sidebar)
3. Click on function name (e.g., `send-welcome-email`)
4. Click **Settings** tab
5. Add secrets:

### For `send-welcome-email`:
- `RESEND_API_KEY` = Your Resend API key
- `SITE_URL` = Your site URL (e.g., `https://yoursite.com`)

### For `notify-subscribers`:
- `RESEND_API_KEY` = Your Resend API key
- `SITE_URL` = Your site URL

### For `github-api`:
- `GITHUB_TOKEN` = Your GitHub personal access token

### For `generate-cover-image`:
- No secrets needed (uses Replicate API)

### For `suggest-category`:
- No secrets needed

### For `delete-user`:
- No secrets needed

---

## Step 6: Manual Function Deployment (If CLI Won't Work) 📤

### For Each Function:

1. Go to your Supabase dashboard
2. Click **Functions** (left sidebar)
3. Click **Create a new function**
4. Name: `delete-user`
5. Copy code from `supabase/functions/delete-user/index.ts`
6. Paste into the editor
7. Click **Deploy**
8. Repeat for other functions:
   - `send-welcome-email`
   - `notify-subscribers`
   - `generate-cover-image`
   - `suggest-category`
   - `github-api`

---

## Step 7: Test Locally 🧪

```bash
# Start your development server
npm run dev

# Test these features:
# 1. Sign up with a new account
# 2. Check if welcome email is sent (check Resend dashboard)
# 3. Create a blog post
# 4. Subscribe to newsletter
# 5. Like a post
# 6. Comment on a post
# 7. Delete your account
```

---

## Step 8: Deploy to Production 🌐

### If Using Vercel:

1. Go to your Vercel project settings
2. Click **Environment Variables**
3. Add all variables from Step 2
4. Redeploy your project
5. Test all features on production

### If Using Other Hosting:

1. Add environment variables to your hosting platform
2. Deploy your application
3. Test all features

---

## Troubleshooting 🔧

### Issue: "Migrations failed"
**Solution:**
1. Check the error message
2. Go to **SQL Editor** → **New Query**
3. Run the failing migration individually
4. Fix any syntax errors
5. Try again

### Issue: "Edge Functions not working"
**Solution:**
1. Check function logs: **Functions** → [Function Name] → **Logs**
2. Verify secrets are set correctly
3. Check environment variables in `.env.local`
4. Redeploy the function

### Issue: "Welcome email not sending"
**Solution:**
1. Check Resend API key is correct
2. Check `RESEND_API_KEY` is set in function secrets
3. Check function logs for errors
4. Verify email address is valid

### Issue: "Can't sign up"
**Solution:**
1. Check if profiles table exists
2. Check if `handle_new_user()` trigger exists
3. Check auth settings in Supabase dashboard
4. Try signing up again

### Issue: "Database reset needed"
**Solution:**
1. Go to **Settings** → **Danger Zone**
2. Click **Reset Database**
3. Run all migrations again
4. Redeploy functions

---

## Verification Checklist ✅

- [ ] Environment variables set in `.env.local`
- [ ] All 23 migrations ran successfully
- [ ] All 18 tables exist in Table Editor
- [ ] All Edge Functions deployed
- [ ] Function secrets set correctly
- [ ] Local development server runs without errors
- [ ] Can sign up with new account
- [ ] Welcome email received
- [ ] Can create blog posts
- [ ] Can subscribe to newsletter
- [ ] Can like posts
- [ ] Can comment on posts
- [ ] Can delete account
- [ ] Production environment variables set
- [ ] Production deployment successful

---

## Quick Reference

### Supabase Dashboard Links:
- **Main Dashboard:** https://gakrmstptyljpaqwjtjj.supabase.co
- **SQL Editor:** https://gakrmstptyljpaqwjtjj.supabase.co/project/default/sql
- **Table Editor:** https://gakrmstptyljpaqwjtjj.supabase.co/project/default/editor
- **Functions:** https://gakrmstptyljpaqwjtjj.supabase.co/project/default/functions
- **Settings:** https://gakrmstptyljpaqwjtjj.supabase.co/project/default/settings/general

### Important Files:
- **Combined Migrations:** `MIGRATION_COMBINED.sql`
- **Migration List:** `MIGRATION_LIST.md`
- **Environment Template:** `.env.local`

### API Keys:
- **Anon Key:** `sb_publishable_wBhi09YMCHTGRDOksKiC7A_NwRGgoFq`
- **Service Role Key:** Get from Settings → API
- **Resend API Key:** Get from https://resend.com
- **GitHub Token:** Get from https://github.com/settings/tokens

---

## Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Check function logs in Supabase dashboard
3. Check browser console for errors
4. Check `.env.local` for correct values
5. Try resetting the database and running migrations again

---

## Next Steps

After setup is complete:
1. ✅ Test all features locally
2. 📝 Update your blog content
3. 🎨 Customize site settings
4. 🚀 Deploy to production
5. 📊 Monitor function logs
6. 📧 Set up email notifications

Good luck! 🎉

