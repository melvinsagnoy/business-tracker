'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '../lib/supabase'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          router.replace('/dashboard')
        } else {
          router.replace('/login')
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        router.replace('/login')
      }
    }
    
    checkAuth()
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-6xl mb-4">🏪</div>
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    </div>
  )
}