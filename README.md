# Budget App - AI-Powered Finance Tracker

A full-stack budget tracking application with AI-powered transaction categorization using Supabase and OpenAI.

## Features

- **CSV Upload**: Upload FNB Easy Account or Monzo CSV exports
- **AI Categorization**: Automatically categorizes transactions using OpenAI GPT
- **Category Management**: Review AI suggestions and create new categories
- **Budget Tracking**: Set monthly budgets and track spending vs averages
- **Multi-Currency**: Support for GBP and ZAR
- **Real-time Updates**: All data stored in Supabase with live updates

## Setup

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migration file to create the database schema:
   ```bash
   # Using Supabase CLI
   supabase db reset
   # Or manually run the SQL files in Supabase SQL Editor
   ```
3. Run the seed file to populate predefined categories:
   ```sql
   -- Copy and paste supabase/seed.sql into Supabase SQL Editor
   ```

### 2. Edge Function Setup

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
   
   Note: Supabase automatically provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions, so you only need to set the OpenRouter key.
   
   The app uses OpenRouter to access various AI models. You can change the model in the Edge Function code if needed (default: `openai/gpt-4o-mini`).

4. Deploy the Edge Function:
   ```bash
   supabase functions deploy categorize-transactions
   ```
   
   Or deploy from the Supabase dashboard: Functions → Create Function → Upload the code from `supabase/functions/categorize-transactions/index.ts`

### 3. Frontend Configuration

1. Open `budget_app.html` and update the Supabase credentials:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL'
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'
   ```

2. Get these values from your Supabase project settings:
   - Project URL → `SUPABASE_URL`
   - API → Settings → Project API keys → `anon` key → `SUPABASE_ANON_KEY`

### 4. Local Development

1. Serve the HTML file using a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

2. Open `http://localhost:8000/budget_app.html` in your browser

## Usage

1. **Upload CSV**: Click the upload area or drag and drop a CSV file
2. **Select Currency**: Choose ZAR (FNB) or GBP (Monzo) before uploading
3. **AI Processing**: Transactions are automatically categorized using OpenAI
4. **Review Suggestions**: If AI suggests new categories, review and create them
5. **Set Budgets**: Adjust monthly budgets in the table
6. **Track Progress**: View averages, totals, and surplus/deficit

## CSV Format

The app supports FNB Easy Account CSV exports. Expected columns:
- Date (DD/MM/YYYY, YYYY-MM-DD, or DD-MM-YYYY)
- Description/Narrative
- Amount (with or without currency symbols)

The parser is flexible and will attempt to detect columns automatically.

## Database Schema

- **categories**: Predefined and user-created categories
- **transactions**: Imported CSV transactions with AI categorization
- **budgets**: Monthly budget targets per category

## API Keys

You'll need:
- **Supabase**: Free tier available
- **OpenRouter API**: Requires API key (paid, usage-based). Get one at [openrouter.ai](https://openrouter.ai)

## Security

- Row Level Security (RLS) is configured but currently allows public access
- For production, implement proper authentication
- Store API keys securely in Supabase secrets (Edge Functions)
- Never commit API keys to version control

## Troubleshooting

### CSV not parsing correctly
- Check CSV format matches FNB export
- Ensure date format is recognized (DD/MM/YYYY recommended)
- Verify amount column contains numeric values

### AI categorization failing
- Verify OpenRouter API key is set in Supabase secrets
- Check Edge Function logs in Supabase dashboard
- Ensure you have OpenRouter credits
- Verify the model name is correct (default: `openai/gpt-4o-mini`)

### Data not loading
- Verify Supabase URL and anon key are correct
- Check browser console for errors
- Ensure database schema is created and seeded

## License

MIT
