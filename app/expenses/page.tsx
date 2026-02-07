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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">💸 Business Expenses</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/products')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            📦 Products
          </button>
          <button
            onClick={() => router.push('/inventory')}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            📊 Inventory
          </button>
          <button
            onClick={() => router.push('/sales')}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            💰 Sales
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            📈 Dashboard
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-100 p-4 rounded-lg border border-red-300">
          <h3 className="text-sm text-red-800 font-medium">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-900">₱{totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-orange-100 p-4 rounded-lg border border-orange-300">
          <h3 className="text-sm text-orange-800 font-medium">Materials Cost</h3>
          <p className="text-2xl font-bold text-orange-900">₱{materialExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-300">
          <h3 className="text-sm text-yellow-800 font-medium">Operational Cost</h3>
          <p className="text-2xl font-bold text-yellow-900">₱{operationalExpenses.toFixed(2)}</p>
        </div>
      </div>

      {/* Workflow Guide */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
        <p className="text-blue-800">
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
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 hover:bg-blue-600"
      >
        {showForm ? 'Cancel' : '+ Record Expense'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded mb-6 border">
          <h2 className="text-xl font-semibold mb-4">New Expense</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="p-2 border rounded w-full"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="p-2 border rounded w-full"
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
                className="p-2 border rounded w-full"
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
                className="p-2 border rounded w-full"
                required
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea
                placeholder="Additional details..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="p-2 border rounded w-full"
                rows={2}
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="bg-green-500 text-white px-6 py-2 rounded mt-4 hover:bg-green-600"
          >
            Record Expense
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
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
                    <span className={`px-2 py-1 rounded text-xs ${
                      expense.category === 'materials' ? 'bg-orange-100 text-orange-800' :
                      expense.category === 'utilities' ? 'bg-blue-100 text-blue-800' :
                      expense.category === 'rent' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
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
      )}
    </div>
  )
}