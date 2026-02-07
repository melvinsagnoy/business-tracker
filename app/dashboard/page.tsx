'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '../../lib/supabase'

export default function DashboardPage() {
  const [summary, setSummary] = useState<{
    totalRevenue: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    inventoryValue: number;
    productCount: number;
  } | null>(null)
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [lowStock, setLowStock] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      // Fetch summary stats
      const today = new Date()
      const last30Days = new Date(today)
      last30Days.setDate(today.getDate() - 30)
      const last30DaysStr = last30Days.toISOString().split('T')[0]

      // Total expenses
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', last30DaysStr)
      
      const totalExpenses = expensesData?.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0) || 0

      // Sales data
      const { data: salesData } = await supabase
        .from('sales')
        .select('total_revenue, total_cost, profit')
        .gte('date', last30DaysStr)
      
      const totalRevenue = salesData?.reduce((sum: number, s: any) => sum + parseFloat(s.total_revenue), 0) || 0
      const totalProductCost = salesData?.reduce((sum: number, s: any) => sum + parseFloat(s.total_cost), 0) || 0
      const grossProfit = salesData?.reduce((sum: number, s: any) => sum + parseFloat(s.profit), 0) || 0

      // Net profit = Gross Profit - Total Expenses
      const netProfit = grossProfit - totalExpenses

      // Inventory value
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select(`
          quantity,
          products (
            cost_per_unit
          )
        `)
      
      const inventoryValue = inventoryData?.reduce((sum: number, i: any) => {
        return sum + (i.quantity * (i.products?.cost_per_unit || 0))
      }, 0) || 0

      // Product count
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      setSummary({
        totalRevenue,
        totalExpenses,
        grossProfit,
        netProfit,
        inventoryValue,
        productCount: productCount || 0
      })

      // Recent sales (last 5)
      const { data: recentSalesData } = await supabase
        .from('sales')
        .select(`
          *,
          products (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5)
      
      setRecentSales(recentSalesData || [])

      // Low stock items
      const { data: lowStockData } = await supabase
        .from('inventory')
        .select(`
          quantity,
          reorder_level,
          products (
            name
          )
        `)
        .order('quantity', { ascending: true })
        .limit(10)
      
      const lowStockFiltered = lowStockData?.filter((i: any) => i.quantity <= i.reorder_level) || []
      setLowStock(lowStockFiltered)

    } catch (err) {
      console.error(err)
      alert('Failed to fetch dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto pb-24 sm:pb-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold">📈 Business Dashboard</h1>
      </div>

      {/* Main Summary Cards - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-green-100 p-4 sm:p-6 rounded-lg border border-green-300">
          <h3 className="text-xs sm:text-sm text-green-800 font-medium mb-1 sm:mb-2">Total Revenue (30 days)</h3>
          <p className="text-2xl sm:text-3xl font-bold text-green-900">₱{summary?.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-red-100 p-4 sm:p-6 rounded-lg border border-red-300">
          <h3 className="text-xs sm:text-sm text-red-800 font-medium mb-1 sm:mb-2">Total Expenses (30 days)</h3>
          <p className="text-2xl sm:text-3xl font-bold text-red-900">₱{summary?.totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-purple-100 p-4 sm:p-6 rounded-lg border border-purple-300">
          <h3 className="text-xs sm:text-sm text-purple-800 font-medium mb-1 sm:mb-2">Net Profit (30 days)</h3>
          <p className={`text-2xl sm:text-3xl font-bold ${summary?.netProfit >= 0 ? 'text-purple-900' : 'text-red-700'}`}>
            ₱{summary?.netProfit.toFixed(2)}
          </p>
          <p className="text-xs text-purple-700 mt-1">Gross Profit - Expenses</p>
        </div>
      </div>

      {/* Secondary Stats - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
          <h3 className="text-xs sm:text-sm text-blue-800 font-medium">Inventory Value</h3>
          <p className="text-xl sm:text-2xl font-bold text-blue-900">₱{summary?.inventoryValue.toFixed(2)}</p>
        </div>
        <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-200">
          <h3 className="text-xs sm:text-sm text-yellow-800 font-medium">Active Products</h3>
          <p className="text-xl sm:text-2xl font-bold text-yellow-900">{summary?.productCount}</p>
        </div>
        <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-200">
          <h3 className="text-xs sm:text-sm text-orange-800 font-medium">Profit Margin</h3>
          <p className="text-xl sm:text-2xl font-bold text-orange-900">
            {summary?.totalRevenue > 0 ? ((summary.netProfit / summary.totalRevenue) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Business Formula Explanation - Mobile Responsive */}
      <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 border border-blue-200">
        <h3 className="font-bold text-blue-900 mb-2 text-sm sm:text-base">📊 Profit Calculation:</h3>
        <div className="text-blue-800 space-y-1 text-xs sm:text-sm">
          <p><strong>Gross Profit</strong> = Sales Revenue - Product Cost = ₱{summary?.grossProfit.toFixed(2)}</p>
          <p><strong>Net Profit</strong> = Gross Profit - All Expenses = ₱{summary?.netProfit.toFixed(2)}</p>
          <p className="text-xs sm:text-sm mt-2 text-blue-700">
            💡 Net Profit shows your true earnings after all costs (materials, rent, utilities, etc.)
          </p>
        </div>
      </div>

      {/* Recent Sales & Low Stock - Mobile Stacked, Desktop Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Sales */}
        <div className="bg-white p-3 sm:p-4 rounded-lg border">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Recent Sales</h2>
          <div className="space-y-2">
            {recentSales.length > 0 ? (
              recentSales.map((sale: any) => (
                <div key={sale.id} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{sale.products?.name}</p>
                    <p className="text-xs sm:text-sm text-gray-600">{new Date(sale.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-semibold text-green-600 text-sm sm:text-base">₱{parseFloat(sale.total_revenue).toFixed(2)}</p>
                    <p className="text-xs text-gray-600">Profit: ₱{parseFloat(sale.profit).toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4 text-sm">No sales yet</p>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white p-3 sm:p-4 rounded-lg border">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">⚠️ Low Stock Alert</h2>
          <div className="space-y-2">
            {lowStock.length > 0 ? (
              lowStock.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-2 sm:p-3 bg-red-50 rounded border border-red-200 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-red-900 truncate">{item.products?.name}</p>
                    <p className="text-xs sm:text-sm text-red-600">Reorder level: {item.reorder_level}</p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-semibold text-red-700 text-sm sm:text-base">{parseFloat(item.quantity).toFixed(2)} left</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4 text-sm">All stock levels good ✓</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}