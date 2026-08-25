'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  User, Mail, Phone, Shield, Award, Coins, MapPin, 
  Recycle, CheckCircle2, Calendar, Sparkles, ChevronRight, Truck 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getUserByEmail, getUserBalance, getRecentReports } from '@/utils/db/actions'

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState<{
    id?: number
    name: string
    email: string
    role: string
    phone?: string
  }>({
    name: 'Aarav Sharma',
    email: 'citizen.demo@rootx.eco',
    role: 'citizen',
    phone: '+91 98251 12345',
  })
  const [balance, setBalance] = useState(650)
  const [reportsCount, setReportsCount] = useState(3)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const email = localStorage.getItem('userEmail')
      if (email) {
        setLoading(true)
        try {
          const dbUser = await getUserByEmail(email)
          if (dbUser) {
            setUserInfo({
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
              role: dbUser.role || 'citizen',
              phone: dbUser.phone || '+91 98251 12345',
            })
            const bal = await getUserBalance(dbUser.id)
            setBalance(bal || 650)
          }
        } catch (e) {
          console.error(e)
        } finally {
          setLoading(false)
        }
      }
    }
    load()
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Profile Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-400 text-white flex items-center justify-center text-2xl sm:text-3xl font-extrabold shadow-lg shadow-emerald-500/20">
              {userInfo.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{userInfo.name}</h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-xs capitalize">
                  {userInfo.role}
                </Badge>
              </div>
              <p className="text-sm text-emerald-200/80 mt-0.5">{userInfo.email}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-300 mt-2 font-medium">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Clean City Contributor</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-right">
              <span className="text-xs text-gray-300 block">Eco Points Balance</span>
              <span className="text-2xl font-black text-amber-400">{balance} Pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Eco Rank Level</span>
            <p className="text-xl font-bold text-gray-900">Level 3 (Eco Guardian)</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Recycle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Waste Reported</span>
            <p className="text-xl font-bold text-gray-900">~45 kg Diverted</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Verification Rate</span>
            <p className="text-xl font-bold text-emerald-600">100% Success</p>
          </div>
        </div>
      </div>

      {/* Account Information & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Account Credentials</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-500 text-xs font-medium">Full Name</span>
              <span className="font-semibold text-gray-800">{userInfo.name}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-500 text-xs font-medium">Email Address</span>
              <span className="font-semibold text-gray-800">{userInfo.email}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-500 text-xs font-medium">Phone Number</span>
              <span className="font-semibold text-gray-800">{userInfo.phone || '+91 98251 12345'}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-500 text-xs font-medium">Role</span>
              <Badge className="bg-emerald-100 text-emerald-800 text-xs capitalize">{userInfo.role}</Badge>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Quick Navigation</h2>
            <div className="space-y-2">
              <Link href="/my-reports" className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-emerald-50 rounded-2xl border border-gray-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-gray-800">My Waste Reports</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700" />
              </Link>

              <Link href="/rewards" className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-emerald-50 rounded-2xl border border-gray-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-semibold text-gray-800">Redeem Eco Rewards</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700" />
              </Link>

              <Link href="/leaderboard" className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-emerald-50 rounded-2xl border border-gray-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-800">City Leaderboard</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700" />
              </Link>
            </div>
          </div>

          <Link href="/report" className="w-full">
            <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md shadow-emerald-600/20">
              Submit New Waste Report
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
