'use client'

import { useRouter, usePathname } from 'next/navigation'
import { getSupabaseClient } from '../lib/supabase'

export default function MobileNav() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const navItems = [
    { path: '/dashboard', icon: '📈', label: 'Home' },
    { path: '/expenses', icon: '💸', label: 'Expenses' },
    { path: '/products', icon: '📦', label: 'Products' },
    { path: '/inventory', icon: '📊', label: 'Stock' },
    { path: '/sales', icon: '💰', label: 'Sales' },
  ]

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex gap-3 flex-wrap">
        {navItems.map(item => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`px-4 py-2 rounded transition ${
              pathname === item.path
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {item.icon} {item.label}
          </button>
        ))}
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-inset">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center py-2 px-1 text-xs transition ${
                pathname === item.path
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-600'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Menu Button (Top Right) */}
      <div className="md:hidden">
        <button
          onClick={handleLogout}
          className="text-sm bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </>
  )
}