import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

interface Transaction {
  date: string
  description: string
  amount: number
  currency: string
}

interface Category {
  id: string
  name: string
  currency: string
  is_fixed: boolean
}

interface CategorizationResult {
  transaction: Transaction
  category_id: string | null
  category_suggested: string | null
  confidence: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { transactions, currency } = await req.json()

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid transactions array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenRouter API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get categories from Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, currency, is_fixed')
      .eq('currency', currency)

    if (catError) {
      throw catError
    }

    // Categorize transactions using OpenRouter
    const results = await categorizeTransactions(transactions, categories, currency)

    return new Response(
      JSON.stringify({ results }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})

async function categorizeTransactions(
  transactions: Transaction[],
  categories: Category[],
  currency: string
): Promise<CategorizationResult[]> {
  const categoryNames = categories.map(c => c.name).join(', ')
  
  const currencySymbol = currency === 'GBP' ? '£' : 'R'

  // Build prompt for AI
  const systemPrompt = `You are a financial transaction categorizer. Your task is to categorize transactions into one of these predefined categories: ${categoryNames}.

For each transaction, return ONLY a JSON object with:
- "category": the exact category name from the list above, or null if none match
- "suggested": a suggested new category name if no match (or null)
- "confidence": a number 0-1 indicating confidence

Rules:
1. Match transactions to existing categories when possible
2. Use exact category names from the list
3. If no category fits well, suggest a new category name
4. Consider transaction descriptions carefully - similar merchants should map to same category
5. Fixed expenses (rent, subscriptions) should match fixed categories`

  // Batch transactions for efficiency
  const batchSize = 20
  const results: CategorizationResult[] = []

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize)
    
    const userPrompt = `Categorize these ${currency} transactions:

${batch.map((t, idx) => 
  `${idx + 1}. ${t.description} - ${currencySymbol}${t.amount.toFixed(2)} (${t.date})`
).join('\n')}

Return a JSON array with one object per transaction in the same order.`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://github.com/kalenyoung/budget-app',
        'X-Title': 'Budget App',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini', // Using OpenRouter with GPT-4o-mini for cost efficiency
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent categorization
        response_format: { type: 'json_object' }
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenRouter API error: ${error}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) {
      throw new Error('No response from OpenRouter')
    }

    // Parse AI response
    let aiResults: Array<{category: string | null, suggested: string | null, confidence: number}>
    try {
      const parsed = JSON.parse(content)
      // Handle both array and object responses
      if (Array.isArray(parsed)) {
        aiResults = parsed
      } else if (parsed.results && Array.isArray(parsed.results)) {
        aiResults = parsed.results
      } else {
        // Single object or wrapped
        aiResults = [parsed]
      }
    } catch (e) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        aiResults = JSON.parse(jsonMatch[1])
      } else {
        throw new Error(`Failed to parse OpenRouter response: ${content}`)
      }
    }

    // Map AI results to transactions
    for (let j = 0; j < batch.length; j++) {
      const transaction = batch[j]
      const aiResult = aiResults[j] || { category: null, suggested: null, confidence: 0 }
      
      // Find matching category ID
      let categoryId: string | null = null
      if (aiResult.category) {
        const matchedCategory = categories.find(
          c => c.name.toLowerCase() === aiResult.category?.toLowerCase()
        )
        if (matchedCategory) {
          categoryId = matchedCategory.id
        }
      }

      results.push({
        transaction,
        category_id: categoryId,
        category_suggested: aiResult.suggested || null,
        confidence: aiResult.confidence || 0.5
      })
    }

    // Rate limiting - small delay between batches
    if (i + batchSize < transactions.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return results
}
