/**
 * Budget Manager - Handles budget calculations and display logic
 */

class BudgetManager {
  constructor(supabaseClient) {
    this.supabase = supabaseClient
    this.gbpData = []
    this.zarData = []
    this.gbpBudgets = []
    this.zarBudgets = []
  }

  /**
   * Load categories and calculate averages from transactions
   */
  async loadData() {
    console.log('[DEBUG BudgetManager] loadData() called');
    console.log('[DEBUG BudgetManager] Supabase client:', this.supabase);
    
    try {
      // Load GBP categories
      console.log('[DEBUG BudgetManager] Loading GBP categories...');
      const { data: gbpCategories, error: gbpError } = await this.supabase
        .from('categories')
        .select('*')
        .eq('currency', 'GBP')
        .order('name')

      console.log('[DEBUG BudgetManager] GBP categories result:', { data: gbpCategories, error: gbpError });
      if (gbpError) {
        console.error('[DEBUG BudgetManager] GBP categories error:', gbpError);
        throw gbpError;
      }

      // Load ZAR categories
      console.log('[DEBUG BudgetManager] Loading ZAR categories...');
      const { data: zarCategories, error: zarError } = await this.supabase
        .from('categories')
        .select('*')
        .eq('currency', 'ZAR')
        .order('name')

      console.log('[DEBUG BudgetManager] ZAR categories result:', { data: zarCategories, error: zarError });
      if (zarError) {
        console.error('[DEBUG BudgetManager] ZAR categories error:', zarError);
        throw zarError;
      }

      console.log('[DEBUG BudgetManager] Categories loaded:', {
        gbpCount: gbpCategories?.length || 0,
        zarCount: zarCategories?.length || 0
      });

      // Calculate monthly averages for each category
      console.log('[DEBUG BudgetManager] Calculating averages...');
      this.gbpData = await this.calculateCategoryAverages(gbpCategories, 'GBP')
      this.zarData = await this.calculateCategoryAverages(zarCategories, 'ZAR')

      console.log('[DEBUG BudgetManager] Averages calculated:', {
        gbpDataLength: this.gbpData.length,
        zarDataLength: this.zarData.length
      });

      // Load current month budgets, fallback to April 2026 if none exist
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
      const april2026 = '2026-04-01'
      console.log('[DEBUG BudgetManager] Loading budgets for:', currentMonth);
      await this.loadBudgets(currentMonth)
      
      // If no budgets found for current month, try April 2026
      if (this.gbpBudgets.every(b => b === 0) && this.zarBudgets.every(b => b === 0)) {
        console.log('[DEBUG BudgetManager] No budgets found for current month, trying April 2026...');
        await this.loadBudgets(april2026)
      }

      console.log('[DEBUG BudgetManager] Final data:', {
        gbp: this.gbpData,
        zar: this.zarData
      });

      return {
        gbp: this.gbpData,
        zar: this.zarData
      }
    } catch (error) {
      console.error('[DEBUG BudgetManager] Error loading budget data:', error)
      console.error('[DEBUG BudgetManager] Error stack:', error.stack)
      throw error
    }
  }

  /**
   * Calculate monthly averages for categories based on transactions
   */
  async calculateCategoryAverages(categories, currency) {
    const results = []
    console.log(`[DEBUG BudgetManager] Calculating averages for ${categories.length} ${currency} categories`);

    for (const category of categories) {
      // Get all transactions for this category
      const { data: transactions, error } = await this.supabase
        .from('transactions')
        .select('date, amount')
        .eq('category_id', category.id)
        .eq('currency', currency)
        .order('date', { ascending: true })

      if (error) {
        console.warn(`[DEBUG BudgetManager] Error loading transactions for ${category.name}:`, error)
        continue
      }

      console.log(`[DEBUG BudgetManager] Category ${category.name}: ${transactions?.length || 0} transactions`);

      if (!transactions || transactions.length === 0) {
        results.push({
          id: category.id,
          cat: category.name,
          avg: 0,
          budget: 0,
          fixed: category.is_fixed,
          note: ''
        })
        continue
      }

      // Group by month and calculate average
      const monthlyTotals = {}
      transactions.forEach(t => {
        const month = t.date.slice(0, 7) // YYYY-MM
        monthlyTotals[month] = (monthlyTotals[month] || 0) + parseFloat(t.amount)
      })

      const monthlyValues = Object.values(monthlyTotals)
      const avg = monthlyValues.length > 0
        ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length
        : 0

      console.log(`[DEBUG BudgetManager] Category ${category.name}: avg=${avg}, months=${monthlyValues.length}`);

      // Budget will be set by loadBudgets, default to 0 for now
      results.push({
        id: category.id,
        cat: category.name,
        avg: Math.round(avg * 100) / 100,
        budget: 0, // Will be updated by loadBudgets
        fixed: category.is_fixed,
        note: ''
      })
    }

    // Sort by average descending
    return results.sort((a, b) => b.avg - a.avg)
  }

  /**
   * Load budgets for a specific month
   */
  async loadBudgets(month) {
    console.log('[DEBUG BudgetManager] loadBudgets() called for month:', month, 'type:', typeof month);
    
    // Try querying all budgets first to see what's in the database
    const { data: allBudgets, error: allError } = await this.supabase
      .from('budgets')
      .select('category_id, month, amount')
      .limit(10);
    
    console.log('[DEBUG BudgetManager] Sample budgets in DB:', { data: allBudgets, error: allError });
    
    // Now query for the specific month
    const { data: budgets, error } = await this.supabase
      .from('budgets')
      .select('category_id, amount')
      .eq('month', month)

    console.log('[DEBUG BudgetManager] Budgets query result:', { 
      data: budgets, 
      error,
      queryMonth: month,
      budgetsFound: budgets?.length || 0
    });

    if (error) {
      console.warn('[DEBUG BudgetManager] Error loading budgets:', error)
      return
    }

    // Create a map for quick lookup
    const budgetMap = {}
    budgets?.forEach(b => {
      budgetMap[b.category_id] = parseFloat(b.amount)
    })

    console.log('[DEBUG BudgetManager] Budget map:', budgetMap);
    console.log('[DEBUG BudgetManager] Category IDs in data:', {
      gbpIds: this.gbpData.map(d => d.id),
      zarIds: this.zarData.map(d => d.id)
    });

    // Update budget values in data arrays
    this.gbpData.forEach(item => {
      if (budgetMap[item.id] !== undefined) {
        item.budget = budgetMap[item.id]
        console.log(`[DEBUG BudgetManager] Set budget for ${item.cat}: ${budgetMap[item.id]}`);
      }
    })

    this.zarData.forEach(item => {
      if (budgetMap[item.id] !== undefined) {
        item.budget = budgetMap[item.id]
        console.log(`[DEBUG BudgetManager] Set budget for ${item.cat}: ${budgetMap[item.id]}`);
      }
    })

    // Update budget arrays
    this.gbpBudgets = this.gbpData.map(r => r.budget || 0)
    this.zarBudgets = this.zarData.map(r => r.budget || 0)
    
    console.log('[DEBUG BudgetManager] Budgets loaded:', {
      gbpBudgets: this.gbpBudgets,
      zarBudgets: this.zarBudgets,
      gbpDataBudgets: this.gbpData.map(d => ({ name: d.cat, budget: d.budget })),
      zarDataBudgets: this.zarData.map(d => ({ name: d.cat, budget: d.budget }))
    });
  }

  /**
   * Get budget for a specific category and month
   */
  getBudgetForCategory(categoryId, month) {
    // This would be called from loadBudgets, but kept for compatibility
    return null
  }

  /**
   * Update budget for a category
   */
  async updateBudget(categoryId, month, amount) {
    const { error } = await this.supabase
      .from('budgets')
      .upsert({
        category_id: categoryId,
        month: month,
        amount: amount
      }, {
        onConflict: 'category_id,month'
      })

    if (error) throw error

    // Update local data
    const gbpItem = this.gbpData.find(item => item.id === categoryId)
    if (gbpItem) {
      gbpItem.budget = amount
      const index = this.gbpData.indexOf(gbpItem)
      this.gbpBudgets[index] = amount
    }

    const zarItem = this.zarData.find(item => item.id === categoryId)
    if (zarItem) {
      zarItem.budget = amount
      const index = this.zarData.indexOf(zarItem)
      this.zarBudgets[index] = amount
    }
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const gbpAvg = this.gbpData.reduce((sum, item) => sum + item.avg, 0)
    const zarAvg = this.zarData.reduce((sum, item) => sum + item.avg, 0)
    const gbpBudget = this.gbpBudgets.reduce((sum, b) => sum + b, 0)
    const zarBudget = this.zarBudgets.reduce((sum, b) => sum + b, 0)

    // Find biggest opportunity (highest spending category)
    const biggestOpportunity = [...this.gbpData, ...this.zarData]
      .sort((a, b) => b.avg - a.avg)[0]

    return {
      gbpAvg,
      zarAvg,
      gbpBudget,
      zarBudget,
      biggestOpportunity: biggestOpportunity ? {
        name: biggestOpportunity.cat,
        avg: biggestOpportunity.avg,
        currency: this.gbpData.includes(biggestOpportunity) ? 'GBP' : 'ZAR'
      } : null
    }
  }
}

// Export for use in other modules
export { BudgetManager }
if (typeof window !== 'undefined') {
  window.BudgetManager = BudgetManager
}
