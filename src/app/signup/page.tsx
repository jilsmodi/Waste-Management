'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Leaf, Mail, Lock, User, Phone, ArrowRight, Truck, CheckCircle2, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { createUser, saveReward } from '@/utils/db/actions'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'citizen' | 'employee'>('citizen')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // 1. Create user in DB
      const user = await createUser(email, name, role, password, phone)
      
      // 2. Award welcome bonus points for eco citizens
      if (user && user.id) {
        try {
          await saveReward(user.id, 50)
        } catch (e) {
          console.log('Reward bonus saved or skipped', e)
        }
      }

      // 3. Store session
      localStorage.setItem('userEmail', email)
      localStorage.setItem('userName', name)
      localStorage.setItem('userRole', role)
      window.dispatchEvent(new CustomEvent('loginStateChanged', { detail: { loggedIn: true } }))

      toast.success(`Welcome to RootX, ${name}! +50 Welcome Eco Points added.`)
      const dest = role === 'employee' ? '/collect' : '/report'
      router.push(dest)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/10 text-green-600 mb-3">
            <Leaf className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Join the <span className="text-green-600">RootX Network</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Get rewarded for cleaning your city and reducing waste</p>
        </div>

        {/* Role Picker */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Select Your Role
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('citizen')}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                role === 'citizen'
                  ? 'border-green-600 bg-green-50/60 ring-2 ring-green-600/20 text-green-900'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className={`p-2 rounded-xl ${role === 'citizen' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Eco Citizen</p>
                <p className="text-xs text-gray-500">Report & Earn Points</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole('employee')}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                role === 'employee'
                  ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className={`p-2 rounded-xl ${role === 'employee' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Collector</p>
                <p className="text-xs text-gray-500">Pickup & Clean Tasks</p>
              </div>
            </button>
          </div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="e.g. Aarav Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="email"
                placeholder="aarav@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Bonus: You receive +50 Eco Points immediately on signup!</span>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium shadow-md shadow-green-600/20 transition-all active:scale-[0.98]"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-green-600 font-semibold hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  )
}
