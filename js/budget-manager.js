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
    try {
      // Load GBP categories
      const { data: gbpCategories, error: gbpError } = await this.supabase
        .from('categories')
        .select('*')
        .eq('currency', 'GBP')
        .order('name')

      if (gbpError) throw gbpError

      // Load ZAR categories
      const { data: zarCategories, error: zarError } = await this.supabase
        .from('categories')
        .select('*')
        .eq('currency', 'ZAR')
        .order('name')

      if (zarError) throw zarError

      // Calculate monthly averages for each category
      this.gbpData = await this.calculateCategoryAverages(gbpCategories, 'GBP')
      this.zarData = await this.calculateCategoryAverages(zarCategories, 'ZAR')

      // Load current month budgets
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
      await this.loadBudgets(currentMonth)

      return {
        gbp: this.gbpData,
        zar: this.zarData
      }
    } catch (error) {
      console.error('Error loading budget data:', error)
      throw error
    }
  }

  /**
   * Calculate monthly averages for categories based on transactions
   */
  async calculateCategoryAverages(categories, currency) {
    const results = []

    for (const category of categories) {
      // Get all transactions for this category
      const { data: transactions, error } = await this.supabase
        .from('transactions')
        .select('date, amount')
        .eq('category_id', category.id)
        .eq('currency', currency)
        .order('date', { ascending: true })

      if (error) {
        console.warn(`Error loading transactions for ${category.name}:`, error)
        continue
      }

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

      // Get current budget for this category
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
      const budget = this.getBudgetForCategory(category.id, currentMonth) || avg

      results.push({
        id: category.id,
        cat: category.name,
        avg: Math.round(avg * 100) / 100,
        budget: Math.round(budget * 100) / 100,
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
    const { data: budgets, error } = await this.supabase
      .from('budgets')
      .select('category_id, amount')
      .eq('month', month)

    if (error) {
      console.warn('Error loading budgets:', error)
      return
    }

    // Create a map for quick lookup
    const budgetMap = {}
    budgets.forEach(b => {
      budgetMap[b.category_id] = parseFloat(b.amount)
    })

    // Update budget values in data arrays
    this.gbpData.forEach(item => {
      if (budgetMap[item.id] !== undefined) {
        item.budget = budgetMap[item.id]
      }
    })

    this.zarData.forEach(item => {
      if (budgetMap[item.id] !== undefined) {
        item.budget = budgetMap[item.id]
      }
    })

    // Update budget arrays
    this.gbpBudgets = this.gbpData.map(r => r.budget)
    this.zarBudgets = this.zarData.map(r => r.budget)
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
if (typeof window !== 'undefined') {
  window.BudgetManager = BudgetManager
}
