'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '../../lib/supabase'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    selling_price: '',
    cost_per_unit: '',
    description: ''
  })
  const router = useRouter()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error(err)
      alert('Failed to fetch products.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const supabase = getSupabaseClient()

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({
            name: formData.name,
            category: formData.category,
            selling_price: parseFloat(formData.selling_price),
            cost_per_unit: parseFloat(formData.cost_per_unit),
            description: formData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProduct.id)
        
        if (error) throw error
        alert('✅ Product updated successfully!')
      } else {
        // Insert new product
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert([{
            name: formData.name,
            category: formData.category,
            selling_price: parseFloat(formData.selling_price),
            cost_per_unit: parseFloat(formData.cost_per_unit),
            description: formData.description
          }])
          .select()
        
        if (insertError) throw insertError
        
        // Create inventory record for new product
        if (newProduct && newProduct.length > 0) {
          const { error: invError } = await supabase
            .from('inventory')
            .insert([{
              product_id: newProduct[0].id,
              quantity: 0,
              unit: 'pcs',
              reorder_level: 10
            }])
          
          if (invError) throw invError
        }
        
        alert('✅ Product created successfully!')
      }

      setShowForm(false)
      setEditingProduct(null)
      setFormData({ name: '', category: '', selling_price: '', cost_per_unit: '', description: '' })
      fetchProducts()
    } catch (err) {
      console.error(err)
      alert('Failed to save product: ' + err.message)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category || '',
      selling_price: product.selling_price,
      cost_per_unit: product.cost_per_unit,
      description: product.description || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    const supabase = getSupabaseClient()
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id)
      
      if (error) throw error
      alert('Product deleted successfully!')
      fetchProducts()
    } catch (err) {
      console.error(err)
      alert('Failed to delete product.')
    }
  }

  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📦 Product Catalog</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/expenses')}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            💸 Expenses
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
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            📈 Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Workflow Guide */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
        <h3 className="font-bold text-blue-900 mb-2">📋 Business Workflow:</h3>
        <ol className="text-blue-800 space-y-1 ml-4">
          <li><strong>Step 1:</strong> Buy materials from grocery/supplier → Record in <strong>Expenses</strong></li>
          <li><strong>Step 2:</strong> Create finished products → Add here in <strong>Products</strong></li>
          <li><strong>Step 3:</strong> Count units produced → Update in <strong>Inventory</strong></li>
          <li><strong>Step 4:</strong> Sell products → Record in <strong>Sales</strong> (auto-deducts inventory)</li>
        </ol>
      </div>

      <button
        onClick={() => {
          setShowForm(!showForm)
          setEditingProduct(null)
          setFormData({ name: '', category: '', selling_price: '', cost_per_unit: '', description: '' })
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 hover:bg-blue-600"
      >
        {showForm ? 'Cancel' : '+ Add New Product'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded mb-6 border">
          <h2 className="text-xl font-semibold mb-4">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Product Name (e.g., Empanada, Juice)"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="p-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Category (e.g., Food, Beverages)"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="p-2 border rounded"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Selling Price per Unit (₱)"
              value={formData.selling_price}
              onChange={e => setFormData({ ...formData, selling_price: e.target.value })}
              className="p-2 border rounded"
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Cost per Unit (₱)"
              value={formData.cost_per_unit}
              onChange={e => setFormData({ ...formData, cost_per_unit: e.target.value })}
              className="p-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="p-2 border rounded col-span-2"
            />
          </div>
          <button
            type="submit"
            className="bg-green-500 text-white px-6 py-2 rounded mt-4 hover:bg-green-600"
          >
            {editingProduct ? 'Update Product' : 'Create Product'}
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
                <th className="border p-3 text-left">Product Name</th>
                <th className="border p-3 text-left">Category</th>
                <th className="border p-3 text-left">Description</th>
                <th className="border p-3 text-right">Selling Price</th>
                <th className="border p-3 text-right">Cost/Unit</th>
                <th className="border p-3 text-right">Profit/Unit</th>
                <th className="border p-3 text-right">Margin %</th>
                <th className="border p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product: any) => {
                const profitPerUnit = product.selling_price - product.cost_per_unit
                const marginNum = (profitPerUnit / product.selling_price) * 100
                const margin = marginNum.toFixed(1)
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="border p-3 font-medium">{product.name}</td>
                    <td className="border p-3">{product.category || '-'}</td>
                    <td className="border p-3 text-sm text-gray-600">{product.description || '-'}</td>
                    <td className="border p-3 text-right">₱{parseFloat(product.selling_price).toFixed(2)}</td>
                    <td className="border p-3 text-right">₱{parseFloat(product.cost_per_unit).toFixed(2)}</td>
                    <td className="border p-3 text-right font-semibold text-green-600">₱{profitPerUnit.toFixed(2)}</td>
                    <td className="border p-3 text-right">
                      <span className={`font-semibold ${marginNum > 40 ? 'text-green-600' : marginNum > 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {margin}%
                      </span>
                    </td>
                    <td className="border p-3 text-center">
                      <button
                        onClick={() => handleEdit(product)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded mr-2 hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {products.length === 0 && (
            <p className="text-center text-gray-500 mt-4">No products yet. Add your first product to get started!</p>
          )}
        </div>
      )}
    </div>
  )
}