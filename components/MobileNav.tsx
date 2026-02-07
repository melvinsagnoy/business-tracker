'use client'

import { useRouter, usePathname } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

export default function MobileNav() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = getSupabaseClient()

  // Hide nav on login page
  if (pathname === '/login') return null

  const navItems = [
    { path: '/dashboard', icon: '📈', label: 'Home' },
    { path: '/expenses', icon: '💸', label: 'Expenses' },
    { path: '/products', icon: '📦', label: 'Products' },
    { path: '/inventory', icon: '📊', label: 'Stock' },
    { path: '/sales', icon: '💰', label: 'Sales' },
  ]

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout failed:', error.message)
      return
    }

    router.replace('/login')
  }

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="grid grid-cols-6">
        {navItems.map(item => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`flex flex-col items-center justify-center py-2 px-1 transition-colors ${
              pathname === item.path
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center py-2 px-1 text-red-600 hover:bg-red-50"
        >
          <span className="text-xl">🚪</span>
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>

      {/* Safe area (iPhone notch support) */}
      <div className="h-safe-area-inset-bottom" />
    </div>
  )
}
