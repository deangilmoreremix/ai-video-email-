# Security Configuration Guide

This document describes additional security settings that must be configured in the Supabase Dashboard (not through migrations).

## Leaked Password Protection

**Status:** ⚠️ Currently Disabled (Recommended: Enable)

### What is it?
Supabase Auth can prevent users from using compromised passwords by checking against the HaveIBeenPwned.org database. This helps protect your users from using passwords that have been exposed in data breaches.

### How to Enable

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Click on "Policies" or "Security" tab

3. **Enable Password Protection**
   - Look for "Leaked Password Protection" or "HaveIBeenPwned Integration"
   - Toggle the setting to **ON/Enabled**
   - Save changes

### Benefits

✓ Prevents users from choosing compromised passwords
✓ Protects against credential stuffing attacks
✓ Improves overall account security
✓ No performance impact on your application
✓ Privacy-preserving (uses k-anonymity model)

### How it Works

When a user signs up or changes their password:
1. Supabase hashes the password
2. Sends first 5 characters of hash to HaveIBeenPwned API
3. Checks if full hash matches any known breaches
4. Rejects password if found in breach database

The actual password is never sent to HaveIBeenPwned - only a partial hash, preserving user privacy.

### Recommendation

**Enable this feature immediately** for production applications. It provides significant security benefits with no downside.

---

## Additional Security Best Practices

### 1. Email Confirmation (Currently Disabled by Default)

If you want to require email verification before users can log in:

**Dashboard → Authentication → Settings → Email Confirmation**
- Toggle "Enable email confirmations" to ON

### 2. Rate Limiting

Supabase provides built-in rate limiting for authentication endpoints. Review and adjust as needed:

**Dashboard → Authentication → Rate Limits**
- Sign up attempts per hour
- Password reset attempts per hour
- Email verification attempts per hour

### 3. JWT Expiration

Review your JWT token expiration settings:

**Dashboard → Settings → API → JWT Settings**
- Default: 1 hour
- Recommended: 1-24 hours depending on use case
- Shorter = more secure, but more frequent re-authentication

### 4. Row Level Security Audit

✅ All RLS policies have been optimized and secured through migrations
✅ All tables have RLS enabled
✅ All auth.uid() calls optimized with (SELECT auth.uid()) pattern

---

## Summary

| Security Feature | Status | Action Required |
|-----------------|--------|-----------------|
| RLS Policies | ✅ Enabled & Optimized | None - handled by migrations |
| Leaked Password Protection | ⚠️ Disabled | **Enable in Dashboard** |
| Email Confirmation | ℹ️ Optional | Configure if needed |
| Rate Limiting | ✅ Default Active | Review settings |
| JWT Expiration | ✅ Default Active | Review timeframe |

**Next Step:** Enable Leaked Password Protection in the Supabase Dashboard (takes 30 seconds).
