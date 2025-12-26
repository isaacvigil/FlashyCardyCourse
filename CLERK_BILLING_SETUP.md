# 🐛 Debugging Clerk Billing Configuration

## Problem
Pro users are unable to generate flashcards with AI, even though they should have access.

## What We Added

1. **Debug Component** (`src/components/debug-clerk-features.tsx`): Shows what features Clerk is detecting
2. **Console Logging** in the AI generation server action to see what's happening server-side
3. **Temporary debug display** on the deck detail page

## How to Debug

### Step 1: View the Debug Component

1. Run your development server: `npm run dev`
2. Sign in as a user
3. Go to any deck detail page (`/decks/[id]`)
4. Look for the blue **"Debug: Clerk Feature Status"** card
5. Check what values are showing:

**For a Pro user, you should see:**
- ✅ Is Pro User: Yes
- ✅ Has AI Feature: Yes
- ✅ Has Unlimited Decks: Yes

**If you see ❌ (No) for any of these, the issue is in Clerk configuration.**

### Step 2: Check Server Console

1. Open your terminal where `npm run dev` is running
2. Click the "Generate Cards with AI" button on a deck
3. Look for the console log that starts with `🐛 AI Generation Debug:`
4. This will show you what Clerk is returning server-side

### Step 3: Fix Clerk Configuration

Go to your [Clerk Dashboard](https://dashboard.clerk.com) and follow these steps:

#### A. Verify Plans Exist

1. Go to **Billing** → **Plans**
2. Ensure you have these plans:
   - **free_user** (or similar name for free tier)
   - **pro** (for paid tier)

#### B. Verify Features Exist

1. Go to **Billing** → **Features**
2. Ensure you have these features with **exact names**:
   - `ai_flashcard_generation` (exactly this name, case-sensitive)
   - `unlimited_decks` (exactly this name, case-sensitive)
   - `3_deck_limit` (optional, for free users)

**⚠️ IMPORTANT:** The feature names must match EXACTLY:
- ✅ `ai_flashcard_generation` (correct)
- ❌ `ai-flashcard-generation` (wrong - has dashes)
- ❌ `AI_flashcard_generation` (wrong - different case)
- ❌ `aiFlashcardGeneration` (wrong - camelCase)

#### C. Assign Features to Plans

1. Go to **Billing** → **Plans**
2. Click on the **pro** plan
3. Make sure these features are assigned:
   - ✅ `ai_flashcard_generation`
   - ✅ `unlimited_decks`
4. Click on the **free_user** plan (if you have one)
5. Make sure it has:
   - ✅ `3_deck_limit` (if using this feature)
   - ❌ Should NOT have `ai_flashcard_generation`
   - ❌ Should NOT have `unlimited_decks`

#### D. Subscribe a Test User

1. In Clerk Dashboard, go to **Users**
2. Find your test user
3. Click on the user
4. Go to the **Subscriptions** tab
5. Manually subscribe them to the **pro** plan for testing

### Step 4: Test Again

1. Refresh your browser
2. Check the debug component again
3. All three should now be ✅ Yes
4. Try clicking "Generate Cards with AI"
5. Check the server console logs

---

## Expected Feature Configuration

### Plans

| Plan Name | Description |
|-----------|-------------|
| `free_user` | Free tier with limited features |
| `pro` | Paid tier with full features |

### Features

| Feature Name | Description | Assigned to |
|--------------|-------------|-------------|
| `3_deck_limit` | Limits users to 3 decks | `free_user` |
| `unlimited_decks` | Allows unlimited deck creation | `pro` |
| `ai_flashcard_generation` | Enables AI-powered flashcard generation | `pro` |

### Feature Checks in Code

The code checks features using Clerk's `has()` helper:

```typescript
// Check if user is on pro plan
const isProUser = has({ plan: "pro" });

// Check if user has specific features
const hasAIGeneration = has({ feature: "ai_flashcard_generation" });
const hasUnlimitedDecks = has({ feature: "unlimited_decks" });
```

---

## Common Issues & Solutions

### Issue 1: Feature name mismatch
**Symptom:** Debug shows ❌ even though user is subscribed to pro

**Solution:** 
- Feature names in Clerk Dashboard must EXACTLY match:
  - `ai_flashcard_generation` (underscores, lowercase)
  - `unlimited_decks` (underscores, lowercase)

### Issue 2: Features not assigned to plan
**Symptom:** User is on pro plan, but features still show ❌

**Solution:**
- In Clerk Dashboard → Billing → Plans → pro
- Make sure features are checked/assigned

### Issue 3: User not subscribed
**Symptom:** Debug shows "Is Pro User: ❌ No"

**Solution:**
- In Clerk Dashboard → Users → [Your User] → Subscriptions
- Manually subscribe to pro plan for testing

### Issue 4: Cached authentication
**Symptom:** Changed Clerk settings but still not working

**Solution:**
1. Clear browser cookies
2. Sign out completely
3. Restart your dev server
4. Sign in again

---

## Remove Debug Code After Fixing

Once everything is working, remove the debug code:

1. Remove `<DebugClerkFeatures>` from `/src/app/decks/[id]/page.tsx`
2. Remove the `console.log` statements from `/src/app/actions/card-actions.ts`
3. Optionally delete `/src/components/debug-clerk-features.tsx`

---

## Testing Checklist

### Free User Tests
- [ ] Can create up to 3 decks
- [ ] Cannot create a 4th deck
- [ ] "Generate Cards with AI" button redirects to pricing page
- [ ] Debug shows: Is Pro User = ❌, Has AI Feature = ❌

### Pro User Tests
- [ ] Can create unlimited decks
- [ ] "Generate Cards with AI" button works (doesn't redirect)
- [ ] AI generation actually creates cards
- [ ] Debug shows: Is Pro User = ✅, Has AI Feature = ✅
- [ ] Server console shows "✅ AI Generation allowed"

---

## Need More Help?

1. **Check Clerk Docs:** https://clerk.com/docs/guides/billing
2. **Verify your setup matches this guide exactly**
3. **Share the output from the debug component**
4. **Share the server console logs when clicking the AI button**

