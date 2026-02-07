'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '../../lib/supabase'

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.replace('/dashboard')
        }
      } catch (error) {
        console.error('Error checking session:', error)
      }
    }
    checkSession()
  }, [router])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })

      if (error) {
        console.error('Login error:', error)
        
        if (error.message.includes('Invalid login credentials')) {
          alert('Invalid email or password.\n\nIf you just signed up, please check your email for a confirmation link first.')
        } else if (error.message.includes('Email not confirmed')) {
          alert('Please confirm your email address first. Check your inbox for a confirmation link.')
        } else {
          alert(`Login failed: ${error.message}`)
        }
        
        setLoading(false)
        return
      }

      if (data.session) {
        router.replace('/dashboard')
      } else {
        alert('Login failed. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Login exception:', err)
      alert('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined
        }
      })

      if (error) {
        console.error('Signup error:', error)
        alert(`Signup failed: ${error.message}`)
        setLoading(false)
        return
      }

      if (data.user) {
        if (data.session) {
          alert('✅ Account created successfully! Redirecting...')
          router.replace('/dashboard')
        } else {
          alert('✅ Account created!\n\n📧 Please check your email and click the confirmation link to activate your account.\n\nAfter confirming, come back here and login.')
          setIsSignup(false)
          setPassword('')
          setLoading(false)
        }
      } else {
        alert('Signup completed but no user was returned. Please contact support.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Signup exception:', err)
      alert('An unexpected error occurred during signup. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="w-full max-w-md">
        <form 
          onSubmit={isSignup ? handleSignup : handleLogin} 
          className="bg-white rounded-lg shadow-2xl p-8"
        >
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🏪</div>
            <h1 className="text-3xl font-bold text-gray-800">
              {isSignup ? 'Create Account' : 'Business Tracker'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isSignup ? 'Sign up to get started' : 'Login to manage your business'}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
                minLength={6}
                disabled={loading}
              />
              {isSignup && (
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 6 characters
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : (isSignup ? 'Sign Up' : 'Login')}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup)
                setEmail('')
                setPassword('')
              }}
              disabled={loading}
              className="text-blue-600 hover:text-blue-800 font-medium disabled:text-gray-400"
            >
              {isSignup 
                ? 'Already have an account? Login' 
                : "Don't have an account? Sign up"}
            </button>
          </div>

          {!isSignup && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <p className="text-yellow-800">
                💡 <strong>Can't login?</strong> If you just signed up, check your email for a confirmation link first.
              </p>
            </div>
          )}
        </form>

        <div className="text-center mt-6 text-white text-sm">
          <p>Business Tracker © 2025</p>
          <p className="text-xs mt-2 opacity-80">Track expenses, inventory, and sales easily</p>
        </div>
      </div>
    </div>
  )
}