# Lead Tracker CRM System

A comprehensive CRM system with Google Sheets integration, built with Next.js, TypeScript, and Supabase.

## 🚀 Features

### Lead Quality Tracking
- **Hot 🔥** - High interest, ready to close
- **Warm ☁️** - Interested, needs nurturing  
- **Cool 🌡️** - Some interest, long-term
- **Cold 🧊** - No interest or unresponsive

### Multi-Stage Pipeline
- Visual pipeline tracker with 10+ stages
- Automatic progress calculation
- Stage history tracking
- Mobile-responsive design

### Conditional Field System
- **Contact Status**: Answered, Not Answered, Busy, Invalid, etc.
- **Interest Level**: High, Medium, Low, No Interest, Not Qualified
- **Smart Follow-ups**: Automatic scheduling based on status
- **Lost Reason Tracking**: Detailed reasons for lost leads

### Dashboard Features
- Separate Food and Boutique lead tracking
- Agent/User assignment counts
- Status distribution charts
- Click-to-filter functionality
- Sorting by Name, Status, Assignment, Created date

## 📋 Prerequisites

1. Node.js 18+ and npm
2. Supabase account
3. Google Sheets with public CSV export enabled
4. Vercel account for deployment

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd lead-tracker-crm
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create `.env.local` file:
```env
# Google Sheets IDs
GOOGLE_SHEET_ID=your_food_sheet_id
GOOGLE_SHEET_ID_2=your_boutique_sheet_id

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🗄️ Database Setup

1. Go to Supabase SQL Editor
2. Run these SQL files in order:
   - `/supabase/schema.sql` - Creates initial tables
   - `/supabase/sync_metadata.sql` - Creates sync tracking
   - `/supabase/schema-updates.sql` - Adds new tracking fields

## 🚀 Deployment to Vercel

### Method 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts and add environment variables
```

### Method 2: GitHub Integration

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Method 3: Direct Import

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import Git repository
3. Configure:
   - Framework: Next.js
   - Root Directory: `lead-tracker-crm`
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Add environment variables
5. Deploy

## 🔧 Configuration

### Environment Variables in Vercel

Go to Project Settings → Environment Variables and add:

| Variable | Description |
|----------|-------------|
| `GOOGLE_SHEET_ID` | Food leads Google Sheet ID |
| `GOOGLE_SHEET_ID_2` | Boutique leads Google Sheet ID |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

## 📱 Mobile Responsiveness

All components are mobile-optimized:
- Responsive grid layouts
- Touch-friendly buttons
- Horizontal scrolling for tables
- Compact views for small screens
- Mobile-specific navigation

## 🔄 Data Sync

### Initial Import
1. Go to `/test-supabase`
2. Click "Initial Import (All Leads)"
3. Click "Sync Assignments from Sheets"

### Ongoing Sync
- Automatic checking for new leads
- Quick import functionality
- Row-based tracking for performance

## 📊 Usage

### Main Dashboard
- **URL**: `/leads-dashboard`
- View Food and Boutique lead counts
- Click cards to see detailed views

### Food Leads
- **URL**: `/leads-dashboard/food`
- Filter by status, assignment, search
- Sort by any column
- Click dashboard stats to filter

### Boutique Leads  
- **URL**: `/leads-dashboard/boutique`
- Same features as Food leads
- Separate tracking

### Test Pages
- `/test-sheets` - View raw Google Sheets data
- `/test-supabase` - Sync and user management

## 🎯 Lead Stages

1. **New** - Fresh lead, not contacted
2. **Contacted** - Initial contact made
3. **Qualified** - Interest confirmed
4. **Demo Scheduled** - Demo appointment set
5. **Demo Completed** - Demo done successfully
6. **Trial Started** - POC in progress
7. **Proposal Sent** - Commercial proposal sent
8. **Negotiation** - Discussing terms
9. **Contract Sent** - Agreement pending signature
10. **Won** - Deal closed successfully
11. **Lost** - Lead did not convert

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues
- Verify Supabase URL and keys
- Check if tables are created
- Ensure RLS policies are disabled or configured

### Google Sheets Access
- Ensure sheets are publicly accessible
- Check CSV export is enabled
- Verify sheet IDs are correct

## 📈 Performance

- Row-based sync for fast updates
- Limit of 1000 leads per page
- Indexed database queries
- Optimized React components
- Lazy loading for modals

## 🔐 Security

- Environment variables for sensitive data
- Supabase RLS for data protection
- No direct Google Sheets write access
- Secure API endpoints

## 📝 License

Private project - All rights reserved

## 🤝 Support

For issues or questions, contact your development team.

---

Built with ❤️ using Next.js, TypeScript, Tailwind CSS, and Supabase