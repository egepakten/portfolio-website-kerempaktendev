# Edge Functions Troubleshooting Guide

## Current Issues

### Error 1: 401 Unauthorized - notify-admin-new-subscriber
**Cause**: The Edge Function hasn't been deployed to Supabase yet.

**Solution**:
```bash
# Deploy the function
supabase functions deploy notify-admin-new-subscriber

# Or deploy all functions at once
./deploy-functions.sh
```

### Error 2: Failed to fetch - send-welcome-email
**Cause**: Could be CORS, network issue, or function timeout.

**Solution**:
```bash
# Redeploy the function
supabase functions deploy send-welcome-email
```

## Quick Deployment

### Deploy All Functions
```bash
./deploy-functions.sh
```

### Deploy Individual Functions
```bash
# Deploy welcome email function
supabase functions deploy send-welcome-email

# Deploy admin notification function
supabase functions deploy notify-admin-new-subscriber
```

## Required Environment Variables

Set these in your Supabase Dashboard:
1. Go to: **Project Settings → Edge Functions → Secrets**
2. Add the following:
   - `RESEND_API_KEY` - Your Resend API key (required)
   - `SITE_URL` - Your website URL (optional, defaults to https://kerempakten.dev)
   - `SUPABASE_URL` - Your Supabase project URL (for subscriber count)
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for subscriber count)

## Testing

### Test Admin Notification
After deploying, sign up with a new account and check:
1. **Console logs** - Should show "Admin notified about new subscriber: email@example.com"
2. **Your email** (egepakten@icloud.com) - Should receive notification
3. **No 401 errors** - Function should respond with 200 OK

### Test Welcome Email
After deploying, sign up with a new account and check:
1. **New user's email** - Should receive welcome email
2. **Console logs** - Should show "Welcome email sent successfully"
3. **No "Failed to fetch" errors**

## Common Issues

### Issue: 401 Unauthorized
- **Cause**: Function not deployed or authentication issue
- **Fix**: Deploy the function using `supabase functions deploy <function-name>`

### Issue: Failed to fetch
- **Cause**: Network/CORS issue or function timeout
- **Fix**:
  1. Check function is deployed: `supabase functions list`
  2. Check Supabase project status
  3. Verify RESEND_API_KEY is set correctly

### Issue: Email not received
- **Cause**: RESEND_API_KEY not set or incorrect
- **Fix**:
  1. Verify API key in Supabase Dashboard → Edge Functions → Secrets
  2. Check Resend dashboard for delivery status
  3. Check spam folder

### Issue: Function timeout
- **Cause**: Resend API taking too long or network issues
- **Fix**:
  1. Check Resend API status
  2. Increase function timeout (if needed)
  3. Check function logs in Supabase Dashboard

## Viewing Function Logs

To view logs for debugging:
1. Go to: **Supabase Dashboard → Edge Functions**
2. Click on the function name
3. View **Logs** tab

Or use CLI:
```bash
# View logs for a specific function
supabase functions logs notify-admin-new-subscriber --tail

# View logs for all functions
supabase functions logs --tail
```

## Verify Deployment

Check if functions are deployed:
```bash
supabase functions list
```

You should see:
- send-welcome-email
- notify-admin-new-subscriber
- (and other functions)

## Next Steps

1. ✅ Deploy both Edge Functions
2. ✅ Set RESEND_API_KEY environment variable
3. ✅ Test with a new signup
4. ✅ Verify emails are received
5. ✅ Check console for errors

## Contact

If issues persist after following this guide:
- Check Supabase Dashboard for detailed error logs
- Verify Resend API key is valid
- Check Resend dashboard for email delivery status
