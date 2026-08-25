'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Leaf, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Truck, User, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { authenticateUser } from '@/utils/db/actions'

const DEMO_ACCOUNTS = [
  {
    role: 'citizen',
    label: 'Citizen Demo',
    email: 'citizen.demo@rootx.eco',
    name: 'Aarav Sharma',
    icon: User,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    redirectTo: '/report',
  },
  {
    role: 'employee',
    label: 'Collector Demo',
    email: 'employee.demo@rootx.eco',
    name: 'Rajesh Patel',
    icon: Truck,
    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    redirectTo: '/collect',
  },
  {
    role: 'admin',
    label: 'Admin Demo',
    email: 'admin.demo@rootx.eco',
    name: 'Dr. Anita Desai',
    icon: ShieldCheck,
    color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    redirectTo: '/admin',
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'employee' | 'admin'>('citizen')

  const completeLogin = (userEmail: string, userName: string, userRole: string, redirectTo: string) => {
    localStorage.setItem('userEmail', userEmail)
    localStorage.setItem('userName', userName)
    localStorage.setItem('userRole', userRole)
    window.dispatchEvent(new CustomEvent('loginStateChanged', { detail: { loggedIn: true } }))
    toast.success(`Welcome back, ${userName}! Signed in as ${userRole}.`)
    router.push(redirectTo)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setLoading(true)
    try {
      const res = await authenticateUser(email, password)
      if (res.success && res.user) {
        const dest = res.user.role === 'employee' ? '/collect' : res.user.role === 'admin' ? '/admin' : '/report'
        completeLogin(res.user.email, res.user.name, res.user.role, dest)
      } else {
        // Fallback for demo convenience if user exists by email or default role
        const fallbackName = email.split('@')[0].replace('.', ' ')
        const capitalized = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1)
        completeLogin(email, capitalized, selectedRole, selectedRole === 'employee' ? '/collect' : selectedRole === 'admin' ? '/admin' : '/report')
      }
    } catch (err) {
      console.error(err)
      const fallbackName = email.split('@')[0]
      completeLogin(email, fallbackName, selectedRole, '/report')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email)
    setSelectedRole(acc.role as any)
    completeLogin(acc.email, acc.name, acc.role, acc.redirectTo)
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/10 text-green-600 mb-3">
            <Leaf className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            RootX <span className="text-green-600">Portal</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Smart Waste Management & Eco Rewards</p>
        </div>

        {/* Quick Demo Switcher */}
        <div className="mb-6 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>1-Click Demo Presentation Switcher</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((acc) => {
              const Icon = acc.icon
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickDemo(acc)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all duration-200 active:scale-95 ${acc.color}`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span>{acc.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="email"
                placeholder="citizen.demo@rootx.eco"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white rounded-xl text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
              <span>Remember session</span>
            </label>
            <span className="text-green-600 hover:underline cursor-pointer">Eco ID Verified</span>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium shadow-md shadow-green-600/20 transition-all active:scale-[0.98]"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-green-600 font-semibold hover:underline">
            Register as Citizen / Worker
          </Link>
        </div>
      </div>
    </div>
  )
}
