# Budget Tracker - Personal Finance Management App

A full-stack personal finance tracking application built with Astro, Supabase, and AI-powered transaction categorization. Features both desktop and mobile-optimized interfaces with financial year tracking, budget management, and intelligent transaction categorization.

## Features

### Core Functionality
- **Financial Year Tracking**: April to March financial year with yearly and monthly overviews
- **Transaction Management**: Import CSV files from banks and categorize transactions
- **AI-Powered Categorization**: Automatically categorizes transactions using OpenAI via OpenRouter
- **Budget Tracking**: Set monthly budgets per category and track spending vs. budget
- **Income Management**: Track multiple income sources per month
- **Category Management**: Create and organize categories with groups (fixed/variable expenses)
- **Multi-Currency Support**: Support for ZAR, USD, GBP, and EUR with optional currency conversion
- **Progress Persistence**: Mobile sort progress is saved and restored across sessions

### User Experience
- **Dual Interface**: Desktop and mobile-optimized views with automatic detection
- **Display Modes**: Choose between desktop, mobile, or auto-detect display mode
- **Theme Support**: Dark and light themes with persistent preferences
- **Responsive Design**: Mobile-first design with fixed bottom navigation
- **Quick Sort**: Mobile-optimized transaction sorting with swipe gestures

### Pages & Views
- **Yearly Overview** (`/`): Financial year summary with income, budget, actual spending, and variance
- **Monthly Tracker** (`/month`): Detailed monthly view with category breakdowns and charts
- **Transactions** (`/transactions`): Full transaction list with filtering and search
- **Mobile Dashboard** (`/mobile-dashboard`): Mobile-optimized dashboard with current month overview
- **Quick Sort** (`/mobile-sort`): Mobile transaction categorization interface with progress saving
- **Settings** (`/settings`): User preferences, currency settings, category management, and theme

## Tech Stack

- **Frontend**: Astro 4.0+ (static site generation)
- **Backend**: Supabase (PostgreSQL database, authentication, edge functions)
- **AI**: OpenRouter API (access to OpenAI GPT models)
- **Styling**: Custom CSS with CSS variables for theming
- **Parsing**: PapaParse for CSV processing
- **TypeScript**: Type-safe development

## Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase account ([supabase.com](https://supabase.com))
- OpenRouter API key ([openrouter.ai](https://openrouter.ai))

### 1. Clone and Install

```bash
git clone <repository-url>
cd BudgetApp
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)

2. Run database migrations:
   ```bash
   # Using Supabase CLI
   supabase db reset
   
   # Or manually run SQL files in Supabase SQL Editor in order:
   # - supabase/migrations/001_initial_schema.sql
   # - supabase/migrations/002_*.sql
   # - ... (run all migrations in order)
   ```

3. Seed initial categories (optional):
   ```sql
   -- Copy and paste supabase/seed.sql into Supabase SQL Editor
   ```

### 3. Environment Configuration

Create a `.env` file in the project root (or configure in your deployment platform):

```env
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from your Supabase project:
- **Project URL** → `PUBLIC_SUPABASE_URL`
- **API Settings** → Project API keys → `anon` key → `PUBLIC_SUPABASE_ANON_KEY`

### 4. Edge Function Setup (AI Categorization)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Set OpenRouter API key as a secret:
   ```bash
   supabase secrets set OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. Deploy the Edge Function:
   ```bash
   supabase functions deploy categorize-transactions
   ```

   Or deploy from Supabase dashboard: **Functions** → **Create Function** → Upload code from `supabase/functions/categorize-transactions/index.ts`

   **Note**: The default model is `openai/gpt-4o-mini`. You can change this in the Edge Function code if needed.

### 5. Local Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:4321
```

### 6. Build for Production

```bash
# Build static site
npm run build

# Preview production build
npm run preview
```

## Usage

### First Time Setup

1. **Sign Up/In**: Navigate to `/auth` to create an account or sign in
2. **Configure Settings**: Go to `/settings` to set:
   - Preferred currency
   - Display mode (desktop/mobile/auto)
   - Theme preference
3. **Create Categories**: Add your expense categories in Settings
4. **Set Income**: Add income sources for each month in the Monthly Tracker

### Importing Transactions

1. **Desktop**: Go to `/transactions` and click "Import CSV"
2. **Mobile**: Go to `/mobile-sort` (Quick Sort) and upload your CSV
3. **CSV Format**: The app supports flexible CSV formats. Expected columns:
   - Date (DD/MM/YYYY, YYYY-MM-DD, or DD-MM-YYYY)
   - Description/Narrative
   - Amount (with or without currency symbols)
4. **Column Mapping**: Map your CSV columns to the expected fields
5. **AI Categorization**: Transactions are automatically categorized using AI
6. **Review & Adjust**: Review AI suggestions and manually adjust categories as needed

### Mobile Quick Sort

The mobile Quick Sort interface (`/mobile-sort`) provides:
- **Progress Saving**: Your sorting progress is automatically saved and restored
- **User-Specific**: Progress is tied to your account (no cross-contamination)
- **Swipe Gestures**: Navigate through transactions with intuitive controls
- **Category Suggestions**: AI-suggested categories appear highlighted
- **Skip Option**: Skip transactions you don't want to categorize

### Budget Management

1. **Set Monthly Budgets**: In Settings, set default monthly amounts per category
2. **Adjust Per Month**: In Monthly Tracker, adjust budgets for specific months
3. **Track Progress**: View actual spending vs. budget with visual indicators
4. **Financial Year View**: See yearly totals and variance in the Yearly Overview

## Database Schema

### Core Tables

- **`categories`**: Expense categories with type (fixed/variable), monthly defaults, and groups
- **`transactions`**: Imported transactions with dates, amounts, descriptions, and categories
- **`budgets`**: Monthly budget targets and actual spending per category
- **`incomes`**: Monthly income sources and amounts
- **`user_settings`**: User preferences (currency, display mode, theme, etc.)

### Key Features

- **Row Level Security (RLS)**: All tables have RLS enabled for user data isolation
- **Financial Year Logic**: Budgets and transactions organized by financial year (April–March)
- **Multi-Currency**: Support for multiple currencies with user preference storage

## Project Structure

```
BudgetApp/
├── src/
│   ├── pages/              # Astro pages (routes)
│   │   ├── index.astro    # Yearly overview
│   │   ├── month.astro    # Monthly tracker
│   │   ├── transactions.astro
│   │   ├── mobile-dashboard.astro
│   │   ├── mobile-sort.astro
│   │   ├── settings.astro
│   │   └── auth.astro
│   ├── components/         # Reusable Astro components
│   │   └── MobileNav.astro
│   └── lib/                # Shared utilities
│       ├── auth.ts         # Authentication helpers
│       ├── supabase.ts     # Supabase client
│       ├── currency.ts     # Currency formatting
│       ├── csv-parser.js   # CSV parsing logic
│       └── dialogs.ts     # UI dialogs
├── public/
│   └── styles/
│       ├── global.css      # Global styles
│       └── mobile.css      # Mobile-specific overrides
├── supabase/
│   ├── migrations/         # Database migrations
│   ├── functions/          # Edge functions
│   │   └── categorize-transactions/
│   └── seed.sql            # Initial category data
└── package.json
```

## API Keys & Services

### Required

- **Supabase**: Free tier available at [supabase.com](https://supabase.com)
- **OpenRouter API**: Paid, usage-based. Get key at [openrouter.ai](https://openrouter.ai)

### Security Notes

- **Environment Variables**: Never commit `.env` files or API keys to version control
- **RLS Policies**: Row Level Security is configured for user data isolation
- **Edge Functions**: API keys stored securely in Supabase secrets
- **Authentication**: Supabase Auth handles user authentication and sessions

## Troubleshooting

### CSV Not Parsing Correctly

- Check CSV format matches expected structure
- Ensure date format is recognized (DD/MM/YYYY recommended)
- Verify amount column contains numeric values
- Try mapping columns manually if auto-detection fails

### AI Categorization Failing

- Verify OpenRouter API key is set in Supabase secrets
- Check Edge Function logs in Supabase dashboard
- Ensure you have OpenRouter credits
- Verify the model name is correct (default: `openai/gpt-4o-mini`)

### Data Not Loading

- Verify Supabase URL and anon key in environment variables
- Check browser console for errors
- Ensure database schema is created and migrations are run
- Verify RLS policies allow your user to access data

### Mobile View Issues

- Check display mode setting in Settings
- Clear browser cache if styles aren't loading
- Verify mobile.css is being loaded (check Network tab)

### Progress Not Saving (Mobile Sort)

- Ensure you're signed in (progress is user-specific)
- Check browser localStorage is enabled
- Progress is cleared when switching accounts (by design)

## Development

### Adding New Features

- **Pages**: Add new `.astro` files in `src/pages/`
- **Components**: Create reusable components in `src/components/`
- **Database Changes**: Create new migration files in `supabase/migrations/`
- **Styling**: Update `public/styles/global.css` or `mobile.css`

### Code Style

- TypeScript for type safety
- Astro components use frontmatter for logic
- CSS variables for theming
- Mobile-first responsive design

## License

MIT
