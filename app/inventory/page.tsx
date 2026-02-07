'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '../../lib/supabase'

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addingItem, setAddingItem] = useState(null)
  const [addQuantity, setAddQuantity] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      // Fetch inventory with product details
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          products (
            id,
            name,
            category,
            selling_price,
            cost_per_unit
          )
        `)
        .order('quantity', { ascending: true })
      
      if (error) throw error
      setInventory(data || [])
    } catch (err) {
      console.error(err)
      alert('Failed to fetch inventory.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddStock = (item) => {
    setAddingItem(item)
    setAddQuantity('')
    setShowAddForm(true)
  }

  const handleSubmitAddStock = async (e) => {
    e.preventDefault()
    const supabase = getSupabaseClient()

    try {
      const newQuantity = parseFloat(addingItem.quantity) + parseFloat(addQuantity)
      
      const { error } = await supabase
        .from('inventory')
        .update({
          quantity: newQuantity,
          last_restocked_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', addingItem.id)
      
      if (error) throw error
      alert(`✅ Added ${addQuantity} units to inventory!`)
      setShowAddForm(false)
      setAddingItem(null)
      setAddQuantity('')
      fetchInventory()
    } catch (err) {
      console.error(err)
      alert('Failed to add stock.')
    }
  }

  const handleUpdateReorderLevel = async (itemId, newLevel) => {
    const supabase = getSupabaseClient()
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ reorder_level: parseFloat(newLevel) })
        .eq('id', itemId)
      
      if (error) throw error
      fetchInventory()
    } catch (err) {
      console.error(err)
      alert('Failed to update reorder level.')
    }
  }

  const lowStockItems = inventory.filter((item: any) => item.quantity <= item.reorder_level)
  const totalValue = inventory.reduce((sum: number, item: any) => {
    return sum + (item.quantity * (item.products?.cost_per_unit || 0))
  }, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📊 Inventory Monitor</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/expenses')}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            💸 Expenses
          </button>
          <button
            onClick={() => router.push('/products')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            📦 Products
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
        <div className="bg-purple-100 p-4 rounded-lg border border-purple-300">
          <h3 className="text-sm text-purple-800 font-medium">Total Products</h3>
          <p className="text-2xl font-bold text-purple-900">{inventory.length}</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg border border-red-300">
          <h3 className="text-sm text-red-800 font-medium">⚠️ Low Stock Items</h3>
          <p className="text-2xl font-bold text-red-900">{lowStockItems.length}</p>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg border border-blue-300">
          <h3 className="text-sm text-blue-800 font-medium">Inventory Value</h3>
          <p className="text-2xl font-bold text-blue-900">₱{totalValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Workflow Guide */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
        <p className="text-blue-800">
          <strong>📋 Step 3:</strong> After creating products, count your finished units and add them to inventory here.
          Inventory automatically decreases when you record sales.
        </p>
      </div>

      {showAddForm && addingItem && (
        <form onSubmit={handleSubmitAddStock} className="bg-gray-50 p-4 rounded mb-6 border">
          <h2 className="text-xl font-semibold mb-4">Add Stock - {addingItem.products?.name}</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Stock</label>
              <input
                type="text"
                value={parseFloat(addingItem.quantity).toFixed(2)}
                className="p-2 border rounded w-full bg-gray-100"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Units to Add</label>
              <input
                type="number"
                step="0.01"
                value={addQuantity}
                onChange={e => setAddQuantity(e.target.value)}
                className="p-2 border rounded w-full"
                placeholder="0"
                required
                min="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Total</label>
              <input
                type="text"
                value={(parseFloat(addingItem.quantity) + parseFloat(addQuantity || '0')).toFixed(2)}
                className="p-2 border rounded w-full bg-gray-100 font-semibold text-green-600"
                disabled
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
            >
              Add Stock
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setAddingItem(null)
                setAddQuantity('')
              }}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left">Product Name</th>
                <th className="border p-3 text-left">Category</th>
                <th className="border p-3 text-right">Current Stock</th>
                <th className="border p-3 text-left">Unit</th>
                <th className="border p-3 text-right">Reorder Level</th>
                <th className="border p-3 text-right">Value (Cost)</th>
                <th className="border p-3 text-center">Status</th>
                <th className="border p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item: any) => {
                const needsReorder = item.quantity <= item.reorder_level
                const stockValue = item.quantity * (item.products?.cost_per_unit || 0)
                
                return (
                  <tr key={item.id} className={needsReorder ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="border p-3 font-medium">{item.products?.name || 'Unknown'}</td>
                    <td className="border p-3">{item.products?.category || '-'}</td>
                    <td className="border p-3 text-right">
                      <span className={`font-bold text-lg ${needsReorder ? 'text-red-600' : 'text-green-600'}`}>
                        {parseFloat(item.quantity).toFixed(2)}
                      </span>
                    </td>
                    <td className="border p-3">{item.unit || 'pcs'}</td>
                    <td className="border p-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={item.reorder_level}
                        onChange={e => handleUpdateReorderLevel(item.id, e.target.value)}
                        className="w-20 p-1 border rounded text-right"
                      />
                    </td>
                    <td className="border p-3 text-right font-semibold">₱{stockValue.toFixed(2)}</td>
                    <td className="border p-3 text-center">
                      {needsReorder ? (
                        <span className="bg-red-500 text-white px-3 py-1 rounded text-sm font-medium">
                          ⚠️ Low Stock
                        </span>
                      ) : (
                        <span className="bg-green-500 text-white px-3 py-1 rounded text-sm font-medium">
                          ✓ Good
                        </span>
                      )}
                    </td>
                    <td className="border p-3 text-center">
                      <button
                        onClick={() => handleAddStock(item)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        + Add Stock
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {inventory.length === 0 && (
            <p className="text-center text-gray-500 mt-4">No inventory records. Add products first!</p>
          )}
        </div>
      )}
    </div>
  )
}