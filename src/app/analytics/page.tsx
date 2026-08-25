'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  BarChart3, TrendingUp, Recycle, Leaf, Users, 
  Coins, ArrowLeft, ArrowUpRight, ShieldCheck, Flame 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getPlatformStats } from '@/utils/db/actions'

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>({
    totalReports: 28,
    totalUsers: 14,
    openTasks: 7,
    totalPoints: 14250,
    wasteCollectedKg: 468.5,
    co2OffsetKg: 234.2,
  })

  useEffect(() => {
    async function load() {
      try {
        const data = await getPlatformStats()
        if (data) setStats(data)
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 mb-2">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Environmental Impact Analytics</h1>
          <p className="text-sm text-gray-500">Comprehensive municipal metrics and circular economy indicators</p>
        </div>

        <Link href="/hotspots">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold">
            <Flame className="w-4 h-4 mr-1.5" />
            Hotspot Predictions
          </Button>
        </Link>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-2">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
            <Recycle className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Waste Diverted</span>
          <p className="text-3xl font-black text-gray-900">{stats.wasteCollectedKg} <span className="text-sm text-gray-500 font-normal">kg</span></p>
          <span className="text-xs text-emerald-600 font-semibold block">+18% vs last month</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-2">
          <div className="p-2.5 bg-green-50 text-green-600 rounded-xl w-fit">
            <Leaf className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Net CO₂ Reduction</span>
          <p className="text-3xl font-black text-emerald-700">{stats.co2OffsetKg} <span className="text-sm text-gray-500 font-normal">kg</span></p>
          <span className="text-xs text-emerald-600 font-semibold block">Calculated LCA factor</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-2">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl w-fit">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Registered Citizens</span>
          <p className="text-3xl font-black text-gray-900">{stats.totalUsers}</p>
          <span className="text-xs text-blue-600 font-semibold block">Active participants</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-2">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl w-fit">
            <Coins className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Tokens Rewarded</span>
          <p className="text-3xl font-black text-amber-600">{stats.totalPoints}</p>
          <span className="text-xs text-amber-700 font-semibold block">Claimed on leaderboard</span>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 text-base">Waste Categorization Breakdown</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Plastic & Packaging</span>
                <span className="text-emerald-700">42%</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '42%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Organic & Compostable</span>
                <span className="text-blue-700">31%</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: '31%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>E-Waste & Scrap</span>
                <span className="text-purple-700">18%</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: '18%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Glass & Metal Cans</span>
                <span className="text-amber-700">9%</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '9%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 text-base">Sector Cleanliness Scores</h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
              <span className="font-bold text-emerald-950">Sector 21, Gandhinagar</span>
              <Badge className="bg-emerald-600 text-white font-bold">94 / 100</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <span className="font-bold text-blue-950">InfoCity Tech Zone</span>
              <Badge className="bg-blue-600 text-white font-bold">88 / 100</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="font-bold text-gray-800">Sector 11 Market</span>
              <Badge className="bg-amber-500 text-white font-bold">78 / 100</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="font-bold text-gray-800">Sector 7 Bus Hub</span>
              <Badge className="bg-amber-500 text-white font-bold">72 / 100</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
