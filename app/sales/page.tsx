'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '../../lib/supabase'

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
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
    const product = products.find((p: any) => p.id === productId)
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
      const product = products.find((p: any) => p.id === formData.product_id)
      if (!product) {
        alert('Please select a product.')
        return
      }

      let currentStock = 0
      if (Array.isArray(product.inventory)) {
        currentStock = product.inventory[0]?.quantity || 0
      } else if (product.inventory) {
        currentStock = product.inventory.quantity || 0
      }

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

  const totalRevenue = sales.reduce((sum: number, sale: any) => sum + parseFloat(sale.total_revenue), 0)
  const totalCost = sales.reduce((sum: number, sale: any) => sum + parseFloat(sale.total_cost), 0)
  const totalProfit = sales.reduce((sum: number, sale: any) => sum + parseFloat(sale.profit), 0)

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto pb-24 sm:pb-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4">💰 Sales</h1>
      </div>

      {/* Summary Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-blue-100 p-3 sm:p-4 rounded-lg border border-blue-300">
          <h3 className="text-xs sm:text-sm text-blue-800 font-medium">Total Sales</h3>
          <p className="text-lg sm:text-2xl font-bold text-blue-900">{sales.length}</p>
        </div>
        <div className="bg-green-100 p-3 sm:p-4 rounded-lg border border-green-300">
          <h3 className="text-xs sm:text-sm text-green-800 font-medium">Revenue</h3>
          <p className="text-lg sm:text-2xl font-bold text-green-900">₱{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-orange-100 p-3 sm:p-4 rounded-lg border border-orange-300">
          <h3 className="text-xs sm:text-sm text-orange-800 font-medium">Cost</h3>
          <p className="text-lg sm:text-2xl font-bold text-orange-900">₱{totalCost.toFixed(2)}</p>
        </div>
        <div className="bg-purple-100 p-3 sm:p-4 rounded-lg border border-purple-300">
          <h3 className="text-xs sm:text-sm text-purple-800 font-medium">Profit</h3>
          <p className="text-lg sm:text-2xl font-bold text-purple-900">₱{totalProfit.toFixed(2)}</p>
        </div>
      </div>

      {/* Workflow Guide */}
      <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 border border-blue-200">
        <p className="text-blue-800 text-xs sm:text-sm">
          <strong>📋 Step 4:</strong> Record your sales here. Inventory will automatically decrease.
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
        className="w-full sm:w-auto bg-green-500 text-white px-4 py-2.5 sm:py-2 rounded mb-4 hover:bg-green-600 font-medium"
      >
        {showForm ? 'Cancel' : '+ Record Sale'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-3 sm:p-4 rounded mb-6 border">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">New Sale</h2>
          
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
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Product</label>
              <select
                value={formData.product_id}
                onChange={e => handleProductChange(e.target.value)}
                className="p-2.5 sm:p-2 border rounded w-full"
                required
              >
                <option value="">Select Product</option>
                {products.map((product: any) => {
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
                className="p-2.5 sm:p-2 border rounded w-full"
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
                className="p-2.5 sm:p-2 border rounded w-full"
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
                className="p-2.5 sm:p-2 border rounded w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Total Amount</label>
              <input
                type="text"
                value={`₱${(parseFloat(formData.quantity || '0') * parseFloat(formData.price_per_unit || '0')).toFixed(2)}`}
                className="p-2.5 sm:p-2 border rounded w-full bg-gray-100 font-semibold text-green-600"
                disabled
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea
                placeholder="Additional notes..."
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
            Record Sale
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {sales.map((sale: any) => (
              <div key={sale.id} className="bg-white border rounded-lg p-3 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-base">{sale.products?.name || 'Unknown'}</h3>
                    <p className="text-xs text-gray-600">{new Date(sale.date).toLocaleDateString()}</p>
                    {sale.customer_name && (
                      <p className="text-xs text-gray-500">Customer: {sale.customer_name}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <p className="text-xs text-gray-600">Quantity</p>
                    <p className="font-semibold">{parseFloat(sale.quantity).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Price/Unit</p>
                    <p className="font-semibold">₱{parseFloat(sale.price_per_unit).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Revenue</p>
                    <p className="font-semibold text-green-600">₱{parseFloat(sale.total_revenue).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Profit</p>
                    <p className="font-semibold text-purple-600">₱{parseFloat(sale.profit).toFixed(2)}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDelete(sale.id)}
                  className="w-full bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            ))}
            {sales.length === 0 && (
              <p className="text-center text-gray-500 py-8 text-sm">No sales recorded yet.</p>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
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
                {sales.map((sale: any) => (
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
        </>
      )}
    </div>
  )
}