'use client'

import { useRouter, usePathname } from 'next/navigation'
import { getSupabaseClient } from '../lib/supabase'

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  // Don't show navigation on login page
  if (pathname === '/login' || pathname === '/') {
    return null
  }

  const navItems = [
    { path: '/dashboard', icon: '📈', label: 'Dashboard' },
    { path: '/expenses', icon: '💸', label: 'Expenses' },
    { path: '/products', icon: '📦', label: 'Products' },
    { path: '/inventory', icon: '📊', label: 'Inventory' },
    { path: '/sales', icon: '💰', label: 'Sales' },
  ]

  return (
    <>
      {/* Desktop Navigation - Top Bar */}
      <div className="hidden sm:block bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {navItems.map(item => (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`px-4 py-2 rounded transition-colors ${
                    pathname === item.path
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

     {/* Mobile Navigation - Bottom Bar */}
<div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
  <div className="grid grid-cols-6">
    {navItems.map(item => (
      <button
        key={item.path}
        onClick={() => router.push(item.path)}
        className={`flex flex-col items-center justify-center py-2 px-1 ${
          pathname === item.path
            ? 'text-blue-600 bg-blue-50'
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        <span className="text-xl mb-0.5">{item.icon}</span>
        <span className="text-xs font-medium">{item.label}</span>
      </button>
    ))}

    {/* Logout */}
    <button
      onClick={handleLogout}
      className="flex flex-col items-center justify-center py-2 px-1 text-red-600 hover:bg-red-50"
    >
      <span className="text-xl mb-0.5">🚪</span>
      <span className="text-xs font-medium">Logout</span>
    </button>
  </div>
</div>

    </>
  )
}