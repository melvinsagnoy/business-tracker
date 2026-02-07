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

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto pb-24 sm:pb-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4">📦 Products</h1>
      </div>

      {/* Workflow Guide - Mobile Responsive */}
      <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 border border-blue-200">
        <h3 className="font-bold text-blue-900 mb-2 text-sm sm:text-base">📋 Business Workflow:</h3>
        <ol className="text-blue-800 space-y-1 ml-4 text-xs sm:text-sm">
          <li><strong>Step 1:</strong> Buy materials → Record in <strong>Expenses</strong></li>
          <li><strong>Step 2:</strong> Create products → Add here in <strong>Products</strong></li>
          <li><strong>Step 3:</strong> Count units → Update in <strong>Inventory</strong></li>
          <li><strong>Step 4:</strong> Sell products → Record in <strong>Sales</strong></li>
        </ol>
      </div>

      <button
        onClick={() => {
          setShowForm(!showForm)
          setEditingProduct(null)
          setFormData({ name: '', category: '', selling_price: '', cost_per_unit: '', description: '' })
        }}
        className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2.5 sm:py-2 rounded mb-4 hover:bg-blue-600 font-medium"
      >
        {showForm ? 'Cancel' : '+ Add New Product'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-3 sm:p-4 rounded mb-6 border">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <input
              type="text"
              placeholder="Product Name (e.g., Empanada)"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="p-2.5 sm:p-2 border rounded text-sm sm:text-base"
              required
            />
            <input
              type="text"
              placeholder="Category (e.g., Food)"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="p-2.5 sm:p-2 border rounded text-sm sm:text-base"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Selling Price (₱)"
              value={formData.selling_price}
              onChange={e => setFormData({ ...formData, selling_price: e.target.value })}
              className="p-2.5 sm:p-2 border rounded text-sm sm:text-base"
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Cost per Unit (₱)"
              value={formData.cost_per_unit}
              onChange={e => setFormData({ ...formData, cost_per_unit: e.target.value })}
              className="p-2.5 sm:p-2 border rounded text-sm sm:text-base"
              required
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="p-2.5 sm:p-2 border rounded col-span-1 sm:col-span-2 text-sm sm:text-base"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto bg-green-500 text-white px-6 py-2.5 sm:py-2 rounded mt-4 hover:bg-green-600 font-medium"
          >
            {editingProduct ? 'Update Product' : 'Create Product'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {products.map((product: any) => {
              const profitPerUnit = product.selling_price - product.cost_per_unit
              const marginNum = (profitPerUnit / product.selling_price) * 100
              
              return (
                <div key={product.id} className="bg-white border rounded-lg p-3 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-base">{product.name}</h3>
                      {product.category && (
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded inline-block mt-1">
                          {product.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Selling Price</p>
                      <p className="font-semibold">₱{parseFloat(product.selling_price).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Cost/Unit</p>
                      <p className="font-semibold">₱{parseFloat(product.cost_per_unit).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Profit/Unit</p>
                      <p className="font-semibold text-green-600">₱{profitPerUnit.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Margin</p>
                      <p className={`font-semibold ${marginNum > 40 ? 'text-green-600' : marginNum > 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {marginNum.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  {product.description && (
                    <p className="text-xs text-gray-600 mb-3">{product.description}</p>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded text-sm hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
            {products.length === 0 && (
              <p className="text-center text-gray-500 py-8 text-sm">No products yet. Add your first product!</p>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
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
        </>
      )}
    </div>
  )
}