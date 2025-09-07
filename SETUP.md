# 🚀 Lead Tracker CRM - Setup Instructions

Your Lead Tracker CRM is **READY TO DEPLOY**! Follow these steps to get it live:

## ✅ What's Been Built

1. **Complete Next.js Application** with TypeScript & Tailwind CSS
2. **Supabase Database Schema** ready to run
3. **Google Sheets Sync Service** that reads public sheets
4. **Authentication System** with login/logout
5. **Lead Management Dashboard** with real-time updates
6. **Lead Pipeline** (New → Contacted → Interested → Demo → Negotiation → Won/Lost)
7. **WhatsApp Integration** for click-to-chat
8. **Analytics & Reporting** features
9. **Vercel Cron Job** for automatic 5-minute sync

## 📋 Step-by-Step Setup

### Step 1: Create Supabase Project (5 minutes)

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Enter project details:
   - Name: `lead-tracker-crm`
   - Database Password: (save this!)
   - Region: Choose closest to you
4. Wait for project to be created

### Step 2: Run Database Schema (2 minutes)

1. In Supabase Dashboard, click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Copy ALL content from `supabase/schema.sql` file
4. Paste and click "Run"
5. You should see "Success" message

### Step 3: Get Supabase Credentials (1 minute)

1. In Supabase Dashboard, go to Settings → API
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Public Key**: `eyJhbGc...` (long string)
   - **Service Role Key**: `eyJhbGc...` (different long string)

### Step 4: Make Your Google Sheet Public (2 minutes)

1. Open your Google Sheet with leads
2. Click "Share" button (top right)
3. Click "Change to anyone with the link"
4. Set to "Viewer" permission
5. Copy the sheet ID from URL:
   - URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit`
   - Copy only: `YOUR_SHEET_ID_HERE`

### Step 5: Update Environment Variables (2 minutes)

Edit `.env.local` file and replace with your actual values:

```env
# Supabase (from Step 3)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your_service_role_key

# Google Sheets (from Step 4)
GOOGLE_SHEET_ID=your_actual_sheet_id

# Cron Secret (make up any random string)
CRON_SECRET=any_random_string_like_abc123xyz
```

### Step 6: Create First User (3 minutes)

1. In Supabase Dashboard, go to "Authentication" → "Users"
2. Click "Add User" → "Create new user"
3. Enter email and password
4. Click "Create User"
5. Go to "Table Editor" → "users" table
6. Click "Insert Row"
7. Fill in:
   - `email`: Same as auth user
   - `name`: Your name
   - `role`: `admin`
   - `is_active`: true
8. Click "Save"

### Step 7: Test Locally (Optional)

```bash
npm run dev
```
Open http://localhost:3000 and login with your user

### Step 8: Deploy to Vercel (5 minutes)

1. Push code to GitHub:
```bash
git add .
git commit -m "Initial CRM setup"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Add Environment Variables (same as .env.local)
6. Click "Deploy"

## 🎉 YOU'RE LIVE!

Your CRM will be available at: `https://your-project.vercel.app`

## 📊 How to Use

1. **Login**: Use the email/password you created in Supabase
2. **View Leads**: Dashboard shows all leads from your Google Sheet
3. **Update Status**: Click on status dropdown to change lead status
4. **WhatsApp**: Click WhatsApp icon to chat with leads
5. **Auto Sync**: Leads sync from Google Sheets every 5 minutes automatically

## 🔧 Troubleshooting

### "Invalid URL" Error
- Make sure Supabase URL starts with `https://` and doesn't end with `/`

### No Leads Showing
- Check if Google Sheet is public
- Manually trigger sync: visit `https://your-app.vercel.app/api/sync`
- Check Supabase logs for errors

### Can't Login
- Verify user exists in both Authentication and users table
- Check email/password are correct

### Sync Not Working
- Verify CRON_SECRET is set in Vercel environment variables
- Check Vercel Functions logs for errors

## 📝 Next Steps

1. **Add Team Members**: Create more users in Supabase
2. **Multiple Sheets**: Add `GOOGLE_SHEET_ID_2`, `GOOGLE_SHEET_ID_3` for more campaigns
3. **Customize**: Modify components in `/components` folder
4. **Analytics**: Enhance dashboard with more metrics

## 🆘 Need Help?

- Check Supabase logs: Dashboard → Logs → API
- Check Vercel logs: Dashboard → Functions → Logs
- Review `.env.local` for correct values

## 🎯 Quick Checklist

- [ ] Supabase project created
- [ ] Database schema executed
- [ ] Environment variables updated
- [ ] Google Sheet made public
- [ ] First user created
- [ ] Deployed to Vercel
- [ ] Tested login
- [ ] Verified sync works

**Your CRM is ready! Start managing your leads efficiently!** 🚀