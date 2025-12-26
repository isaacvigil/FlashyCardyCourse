# Setup Instructions - AI Feature Access

## ✅ Solution Implemented

I've created a **robust feature access system** that works in multiple scenarios:

1. **Clerk Billing** (if configured in Clerk Dashboard)
2. **User Metadata** (fallback if Clerk Billing isn't set up)
3. **Development Mode** (for testing without Clerk Billing)

## 🚀 Quick Start - Enable AI Features for Testing

### Option 1: Development Mode (Easiest - No Clerk Config Needed)

Create a `.env.local` file in your project root:

```bash
# Clerk Authentication (you should already have these)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# OpenAI API Key (you should already have this)
OPENAI_API_KEY=sk-...

# Neon Database (you should already have this)
DATABASE_URL=postgresql://...

# 🔧 Enable Development Mode - Allows all Pro features
DEV_MODE_ALLOW_ALL_FEATURES=true
```

**That's it!** With `DEV_MODE_ALLOW_ALL_FEATURES=true`, all users will have access to:
- ✅ AI flashcard generation
- ✅ Unlimited decks
- ✅ All Pro features

⚠️ **Important**: Set this to `false` or remove it in production!

### Option 2: Clerk Billing (Production-Ready)

Follow the detailed guide in `CLERK_BILLING_SETUP.md` to set up Clerk Billing with plans and features.

### Option 3: User Metadata (Alternative to Clerk Billing)

If you don't want to use Clerk Billing, you can set user plans via metadata:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Users** → Select a user
3. Go to the **Metadata** tab
4. Under **Public metadata**, add:

```json
{
  "plan": "pro"
}
```

5. Save changes
6. The user now has Pro features!

For free users, set:
```json
{
  "plan": "free"
}
```

Or don't set any metadata (defaults to free).

---

## 🧪 Testing

### Test the Implementation

1. **Start your development server:**
```bash
npm run dev
```

2. **Sign in to your app**

3. **Navigate to any deck detail page** (`/decks/[id]`)

4. **Check the debug component** (blue card at the top)
   - Should show: ✅ Has AI Feature: Yes
   - Should show: ✅ Is Pro User: Yes
   - Should show: ✅ Has Unlimited Decks: Yes

5. **Check your terminal/console**
   - You should see logs like:
   ```
   🔧 DEV MODE: Allowing access to ai_flashcard_generation
   🔍 Feature Access Debug: { aiFeature: { hasAccess: true, ... }, ... }
   ```

6. **Try generating AI flashcards:**
   - Add a description to your deck
   - Click "Generate Cards with AI"
   - Should generate 20 flashcards!

### Test Different Scenarios

#### Scenario 1: Development Mode ON
```env
DEV_MODE_ALLOW_ALL_FEATURES=true
```
- ✅ All users have Pro features
- ✅ AI generation works
- ✅ Unlimited decks

#### Scenario 2: Development Mode OFF + User Metadata = "pro"
```env
DEV_MODE_ALLOW_ALL_FEATURES=false
```
- Set user metadata to `{ "plan": "pro" }` in Clerk Dashboard
- ✅ User has Pro features
- ✅ AI generation works

#### Scenario 3: Development Mode OFF + User Metadata = "free"
```env
DEV_MODE_ALLOW_ALL_FEATURES=false
```
- Set user metadata to `{ "plan": "free" }` or leave blank
- ❌ User does NOT have Pro features
- ❌ AI generation redirects to pricing
- ❌ Limited to 3 decks

---

## 📁 Files Changed

### New Files
- `src/lib/feature-access.ts` - Robust feature checking with multiple fallbacks
- `SETUP_INSTRUCTIONS.md` - This file
- `CLERK_BILLING_SETUP.md` - Detailed Clerk Billing setup guide

### Modified Files
- `src/app/decks/[id]/page.tsx` - Uses new feature access helper
- `src/app/dashboard/page.tsx` - Uses new feature access helper  
- `src/app/actions/card-actions.ts` - Uses new feature access helper
- `src/app/actions/deck-actions.ts` - Uses new feature access helper

### Debug Files (can be removed later)
- `src/components/debug-clerk-features.tsx` - Shows feature status

---

## 🔧 How It Works

The new `feature-access.ts` module checks features in this priority order:

1. **Development Mode**
   - If `DEV_MODE_ALLOW_ALL_FEATURES=true` → ✅ Allow all features
   - Logs: `🔧 DEV MODE: Allowing access to [feature]`

2. **Clerk Billing** (if configured)
   - Checks `has({ feature: "ai_flashcard_generation" })`
   - If feature granted → ✅ Allow access
   - Logs: `Feature granted via Clerk Billing`

3. **User Metadata** (fallback)
   - Checks user's `metadata.plan` field
   - If plan = "pro" → ✅ Allow access
   - Logs: `Feature granted via user plan: pro`

4. **Default**
   - If none of the above → ❌ Deny access (free tier)
   - Logs: `Feature not available on free plan`

---

## 🗑️ Cleanup (After Testing)

Once everything works, you can optionally clean up:

1. **Remove debug component:**
   - Delete `<DebugClerkFeatures>` from `/src/app/decks/[id]/page.tsx`
   - Delete `src/components/debug-clerk-features.tsx`

2. **Remove console logs:**
   - Remove `console.log` statements from action files
   - Or leave them for production debugging

3. **Set production environment:**
```env
# Production .env
DEV_MODE_ALLOW_ALL_FEATURES=false  # or remove this line entirely
```

---

## 🐛 Troubleshooting

### AI Generation Still Not Working?

**Check your terminal for logs:**

Look for lines like:
```
🔧 DEV MODE: Allowing access to ai_flashcard_generation
✅ AI Generation allowed: Development mode enabled (via dev_mode)
```

If you see:
```
❌ AI Generation blocked: Feature not available on free plan
```

**Solutions:**

1. **Verify `.env.local` exists** and has:
   ```env
   DEV_MODE_ALLOW_ALL_FEATURES=true
   ```

2. **Restart your dev server** after changing `.env.local`:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

3. **Check that you have OpenAI API key** in `.env.local`:
   ```env
   OPENAI_API_KEY=sk-...
   ```

4. **Check that deck has a description** - AI generation requires a deck description

### Debug Component Not Showing?

Make sure you're on a deck detail page (`/decks/[id]`), not the dashboard.

### Feature Still Shows ❌ in Debug Component?

1. Clear browser cache and cookies
2. Sign out and sign back in
3. Restart development server
4. Check terminal for error messages

---

## 📚 Additional Resources

- **Clerk Dashboard**: https://dashboard.clerk.com
- **Clerk Billing Docs**: https://clerk.com/docs/guides/billing
- **OpenAI API Keys**: https://platform.openai.com/api-keys
- **Clerk Metadata Docs**: https://clerk.com/docs/users/metadata

---

## Summary

### To Enable AI Features Right Now:

1. Create `.env.local` with `DEV_MODE_ALLOW_ALL_FEATURES=true`
2. Restart dev server: `npm run dev`
3. Try generating AI flashcards!

That's it! No Clerk configuration needed for development. 🎉

