'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '../../lib/supabase'

export default function SalesPage() {
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    product_id: '',
    quantity: '',
    price_per_unit: '',
    customer_name: '',
    notes: ''
  })
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      // Fetch sales with product details
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          products (
            id,
            name,
            category,
            selling_price
          )
        `)
        .order('date', { ascending: false })
      
      if (salesError) throw salesError

      // Fetch products with inventory
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          inventory (
            quantity
          )
        `)
        .eq('is_active', true)
        .order('name')
      
      if (productsError) throw productsError

      setSales(salesData || [])
      setProducts(productsData || [])
    } catch (err) {
      console.error(err)
      alert('Failed to fetch data.')
    } finally {
      setLoading(false)
    }
  }

  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      setFormData({
        ...formData,
        product_id: productId,
        price_per_unit: product.selling_price
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const supabase = getSupabaseClient()

    try {
      const product = products.find(p => p.id === formData.product_id)
      if (!product) {
        alert('Please select a product.')
        return
      }

      // Check inventory - handle both array and direct object
      let currentStock = 0
      if (Array.isArray(product.inventory)) {
        currentStock = product.inventory[0]?.quantity || 0
      } else if (product.inventory) {
        currentStock = product.inventory.quantity || 0
      }

      // If no inventory record exists at all, check database directly
      if (currentStock === 0) {
        const { data: invData, error: invError } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('product_id', formData.product_id)
          .single()
        
        if (!invError && invData) {
          currentStock = invData.quantity || 0
        }
      }

      if (currentStock <= 0) {
        alert(`⚠️ No stock available for this product!\n\nPlease add inventory first in the Inventory page.`)
        return
      }

      if (currentStock < parseFloat(formData.quantity)) {
        alert(`⚠️ Insufficient stock!\n\nRequested: ${formData.quantity} units\nAvailable: ${currentStock} units`)
        return
      }

      const { error } = await supabase
        .from('sales')
        .insert([{
          date: formData.date,
          product_id: formData.product_id,
          quantity: parseFloat(formData.quantity),
          price_per_unit: parseFloat(formData.price_per_unit),
          cost_per_unit: product.cost_per_unit,
          customer_name: formData.customer_name,
          notes: formData.notes
        }])
      
      if (error) throw error
      
      alert('✅ Sale recorded! Inventory has been updated automatically.')
      setShowForm(false)
      setFormData({
        date: new Date().toISOString().split('T')[0],
        product_id: '',
        quantity: '',
        price_per_unit: '',
        customer_name: '',
        notes: ''
      })
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Failed to record sale: ' + err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this sale? Inventory will be restored.')) return

    const supabase = getSupabaseClient()
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      alert('Sale deleted and inventory restored!')
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Failed to delete sale.')
    }
  }

  const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_revenue), 0)
  const totalCost = sales.reduce((sum, sale) => sum + parseFloat(sale.total_cost), 0)
  const totalProfit = sales.reduce((sum, sale) => sum + parseFloat(sale.profit), 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">💰 Sales Records</h1>
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
            onClick={() => router.push('/inventory')}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            📊 Inventory
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
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded-lg border border-blue-300">
          <h3 className="text-sm text-blue-800 font-medium">Total Sales</h3>
          <p className="text-2xl font-bold text-blue-900">{sales.length}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg border border-green-300">
          <h3 className="text-sm text-green-800 font-medium">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-900">₱{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-orange-100 p-4 rounded-lg border border-orange-300">
          <h3 className="text-sm text-orange-800 font-medium">Product Cost</h3>
          <p className="text-2xl font-bold text-orange-900">₱{totalCost.toFixed(2)}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg border border-purple-300">
          <h3 className="text-sm text-purple-800 font-medium">Gross Profit</h3>
          <p className="text-2xl font-bold text-purple-900">₱{totalProfit.toFixed(2)}</p>
        </div>
      </div>

      {/* Workflow Guide */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
        <p className="text-blue-800">
          <strong>📋 Step 4:</strong> Record your sales here. Inventory will automatically decrease when you record a sale.
        </p>
      </div>

      <button
        onClick={() => {
          setShowForm(!showForm)
          setFormData({
            date: new Date().toISOString().split('T')[0],
            product_id: '',
            quantity: '',
            price_per_unit: '',
            customer_name: '',
            notes: ''
          })
        }}
        className="bg-green-500 text-white px-4 py-2 rounded mb-4 hover:bg-green-600"
      >
        {showForm ? 'Cancel' : '+ Record Sale'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded mb-6 border">
          <h2 className="text-xl font-semibold mb-4">New Sale</h2>
          
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
              <label className="block text-sm font-medium mb-1">Product</label>
              <select
                value={formData.product_id}
                onChange={e => handleProductChange(e.target.value)}
                className="p-2 border rounded w-full"
                required
              >
                <option value="">Select Product</option>
                {products.map(product => {
                  // Handle both array and direct object inventory
                  let stock = 0
                  if (Array.isArray(product.inventory)) {
                    stock = product.inventory[0]?.quantity || 0
                  } else if (product.inventory) {
                    stock = product.inventory.quantity || 0
                  }
                  
                  const unit = product.inventory?.[0]?.unit || product.inventory?.unit || 'pcs'
                  const stockText = stock > 0 ? `Stock: ${stock} ${unit}` : 'No stock!'
                  
                  return (
                    <option key={product.id} value={product.id} disabled={stock <= 0}>
                      {product.name} - {stockText}
                    </option>
                  )
                })}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                className="p-2 border rounded w-full"
                required
                min="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Price per Unit (₱)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price_per_unit}
                onChange={e => setFormData({ ...formData, price_per_unit: e.target.value })}
                className="p-2 border rounded w-full"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Customer Name (optional)</label>
              <input
                type="text"
                placeholder="Customer name"
                value={formData.customer_name}
                onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                className="p-2 border rounded w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Total Amount</label>
              <input
                type="text"
                value={`₱${(parseFloat(formData.quantity || 0) * parseFloat(formData.price_per_unit || 0)).toFixed(2)}`}
                className="p-2 border rounded w-full bg-gray-100 font-semibold text-green-600"
                disabled
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="p-2 border rounded w-full"
                rows="2"
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="bg-green-500 text-white px-6 py-2 rounded mt-4 hover:bg-green-600"
          >
            Record Sale
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
                <th className="border p-3 text-left">Product</th>
                <th className="border p-3 text-left">Customer</th>
                <th className="border p-3 text-right">Qty</th>
                <th className="border p-3 text-right">Price/Unit</th>
                <th className="border p-3 text-right">Revenue</th>
                <th className="border p-3 text-right">Cost</th>
                <th className="border p-3 text-right">Profit</th>
                <th className="border p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="border p-3">{new Date(sale.date).toLocaleDateString()}</td>
                  <td className="border p-3 font-medium">{sale.products?.name || 'Unknown'}</td>
                  <td className="border p-3">{sale.customer_name || '-'}</td>
                  <td className="border p-3 text-right">{parseFloat(sale.quantity).toFixed(2)}</td>
                  <td className="border p-3 text-right">₱{parseFloat(sale.price_per_unit).toFixed(2)}</td>
                  <td className="border p-3 text-right font-semibold text-green-600">₱{parseFloat(sale.total_revenue).toFixed(2)}</td>
                  <td className="border p-3 text-right text-orange-600">₱{parseFloat(sale.total_cost).toFixed(2)}</td>
                  <td className="border p-3 text-right font-bold text-purple-600">₱{parseFloat(sale.profit).toFixed(2)}</td>
                  <td className="border p-3 text-center">
                    <button
                      onClick={() => handleDelete(sale.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sales.length === 0 && (
            <p className="text-center text-gray-500 mt-4">No sales recorded yet.</p>
          )}
        </div>
      )}
    </div>
  )
}