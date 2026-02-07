'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '../../lib/supabase'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'materials',
    amount: '',
    notes: ''
  })
  const router = useRouter()

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })
      
      if (error) throw error
      setExpenses(data || [])
    } catch (err) {
      console.error(err)
      alert('Failed to fetch expenses.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const supabase = getSupabaseClient()

    try {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          date: formData.date,
          description: formData.description,
          category: formData.category,
          amount: parseFloat(formData.amount),
          notes: formData.notes
        }])
      
      if (error) throw error
      
      alert('✅ Expense recorded!')
      setShowForm(false)
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: 'materials',
        amount: '',
        notes: ''
      })
      fetchExpenses()
    } catch (err) {
      console.error(err)
      alert('Failed to save expense: ' + err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    const supabase = getSupabaseClient()
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      alert('Expense deleted!')
      fetchExpenses()
    } catch (err) {
      console.error(err)
      alert('Failed to delete expense.')
    }
  }

  const totalExpenses = expenses.reduce((sum: number, expense: any) => sum + parseFloat(expense.amount), 0)
  const materialExpenses = expenses.filter((e: any) => e.category === 'materials').reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0)
  const operationalExpenses = expenses.filter((e: any) => e.category !== 'materials').reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0)

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'materials': return 'bg-orange-100 text-orange-800'
      case 'utilities': return 'bg-blue-100 text-blue-800'
      case 'rent': return 'bg-purple-100 text-purple-800'
      case 'operational': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto pb-24 sm:pb-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4">💸 Expenses</h1>
      </div>

      {/* Summary Cards - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-red-100 p-3 sm:p-4 rounded-lg border border-red-300">
          <h3 className="text-xs sm:text-sm text-red-800 font-medium">Total Expenses</h3>
          <p className="text-xl sm:text-2xl font-bold text-red-900">₱{totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-orange-100 p-3 sm:p-4 rounded-lg border border-orange-300">
          <h3 className="text-xs sm:text-sm text-orange-800 font-medium">Materials Cost</h3>
          <p className="text-xl sm:text-2xl font-bold text-orange-900">₱{materialExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-yellow-100 p-3 sm:p-4 rounded-lg border border-yellow-300">
          <h3 className="text-xs sm:text-sm text-yellow-800 font-medium">Operational Cost</h3>
          <p className="text-xl sm:text-2xl font-bold text-yellow-900">₱{operationalExpenses.toFixed(2)}</p>
        </div>
      </div>

      {/* Workflow Guide */}
      <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 border border-blue-200">
        <p className="text-blue-800 text-xs sm:text-sm">
          <strong>📋 Step 1:</strong> Record all business expenses here - materials from grocery, rent, utilities, etc.
          This helps track your total business costs.
        </p>
      </div>

      <button
        onClick={() => {
          setShowForm(!showForm)
          setFormData({
            date: new Date().toISOString().split('T')[0],
            description: '',
            category: 'materials',
            amount: '',
            notes: ''
          })
        }}
        className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2.5 sm:py-2 rounded mb-4 hover:bg-blue-600 font-medium"
      >
        {showForm ? 'Cancel' : '+ Record Expense'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-3 sm:p-4 rounded mb-6 border">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">New Expense</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="p-2.5 sm:p-2 border rounded w-full"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="p-2.5 sm:p-2 border rounded w-full"
                required
              >
                <option value="materials">Materials (flour, meat, ingredients)</option>
                <option value="operational">Operational (supplies, packaging)</option>
                <option value="utilities">Utilities (electricity, water)</option>
                <option value="rent">Rent</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Amount (₱)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                className="p-2.5 sm:p-2 border rounded w-full"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                placeholder="e.g., Flour and eggs from market"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="p-2.5 sm:p-2 border rounded w-full"
                required
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea
                placeholder="Additional details..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="p-2.5 sm:p-2 border rounded w-full"
                rows={2}
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full sm:w-auto bg-green-500 text-white px-6 py-2.5 sm:py-2 rounded mt-4 hover:bg-green-600 font-medium"
          >
            Record Expense
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {expenses.map((expense: any) => (
              <div key={expense.id} className="bg-white border rounded-lg p-3 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-base">{expense.description}</h3>
                    <p className="text-xs text-gray-600">{new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ml-2 ${getCategoryColor(expense.category)}`}>
                    {expense.category}
                  </span>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs text-gray-600 mb-1">Amount</p>
                  <p className="text-2xl font-bold text-red-600">₱{parseFloat(expense.amount).toFixed(2)}</p>
                </div>
                
                {expense.notes && (
                  <p className="text-xs text-gray-600 mb-3 bg-gray-50 p-2 rounded">
                    <span className="font-medium">Notes:</span> {expense.notes}
                  </p>
                )}
                
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="w-full bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 font-medium"
                >
                  Delete
                </button>
              </div>
            ))}
            {expenses.length === 0 && (
              <p className="text-center text-gray-500 py-8 text-sm">No expenses recorded yet.</p>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-3 text-left">Date</th>
                  <th className="border p-3 text-left">Category</th>
                  <th className="border p-3 text-left">Description</th>
                  <th className="border p-3 text-right">Amount</th>
                  <th className="border p-3 text-left">Notes</th>
                  <th className="border p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense: any) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="border p-3">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="border p-3">
                      <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="border p-3">{expense.description}</td>
                    <td className="border p-3 text-right font-semibold text-red-600">₱{parseFloat(expense.amount).toFixed(2)}</td>
                    <td className="border p-3 text-sm text-gray-600">{expense.notes || '-'}</td>
                    <td className="border p-3 text-center">
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expenses.length === 0 && (
              <p className="text-center text-gray-500 mt-4">No expenses recorded yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}