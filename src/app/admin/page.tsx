'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ShieldCheck, FileText, Truck, Flame, Route, Users, 
  CheckCircle2, Clock, AlertTriangle, ArrowUpRight, TrendingUp, 
  Coins, Recycle, Activity, RefreshCw 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getRecentReports, getPlatformStats, getAllIncidents } from '@/utils/db/actions'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>({
    totalReports: 28,
    totalUsers: 14,
    openTasks: 7,
    totalPoints: 14250,
    wasteCollectedKg: 468.5,
    co2OffsetKg: 234.2,
  })
  const [recentReports, setRecentReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const platformStats = await getPlatformStats()
      if (platformStats) {
        setStats(platformStats)
      }
      const reports = await getRecentReports(10)
      setRecentReports(reports || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-purple-500/30 text-purple-200 border-purple-400/30 text-xs font-semibold px-3 py-1">
              Command & Control
            </Badge>
            <span className="text-xs text-purple-200">Gandhinagar City Sector Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Municipal Admin Control Center</h1>
          <p className="text-sm text-purple-200 mt-1 max-w-2xl">
            Real-time urban waste monitoring, dynamic vehicle dispatch, and citizen eco-reward metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={loadData} 
            variant="outline" 
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Feeds
          </Button>
          <Link href="/admin/vehicles">
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg font-semibold">
              <Truck className="w-4 h-4 mr-2" />
              Live Fleet Map
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Total Reports</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900">{stats.totalReports || 28}</p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14% this week</span>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Open Tasks</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600">{stats.openTasks || 7}</p>
          <p className="text-xs text-gray-400 mt-2">Assigned to field collectors</p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Waste Collected</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Recycle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700">{stats.wasteCollectedKg || 468.5} <span className="text-sm font-semibold text-gray-500">kg</span></p>
          <p className="text-xs text-emerald-600 font-medium mt-2">~{stats.co2OffsetKg || 234.2} kg CO₂ offset</p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Eco Rewards</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-700">{stats.totalPoints || 14250}</p>
          <p className="text-xs text-purple-600 font-medium mt-2">Distributed to active citizens</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/admin/reports" className="group bg-white p-5 rounded-2xl border border-gray-200/80 hover:border-green-500 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Waste Reports</h3>
          <p className="text-xs text-gray-500 mt-1">Audit and filter citizen submissions</p>
        </Link>

        <Link href="/admin/vehicles" className="group bg-white p-5 rounded-2xl border border-gray-200/80 hover:border-blue-500 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-xl group-hover:scale-110 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Fleet Monitoring</h3>
          <p className="text-xs text-gray-500 mt-1">Live GPS tracking and truck capacity</p>
        </Link>

        <Link href="/hotspots" className="group bg-white p-5 rounded-2xl border border-gray-200/80 hover:border-amber-500 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl group-hover:scale-110 transition-transform">
              <Flame className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-amber-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Hotspot Forecast</h3>
          <p className="text-xs text-gray-500 mt-1">AI predictive accumulation zones</p>
        </Link>

        <Link href="/routes" className="group bg-white p-5 rounded-2xl border border-gray-200/80 hover:border-indigo-500 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl group-hover:scale-110 transition-transform">
              <Route className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Route Optimizer</h3>
          <p className="text-xs text-gray-500 mt-1">Smart TSP vehicle route simulations</p>
        </Link>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recent Waste Reports & Status</h2>
            <p className="text-xs text-gray-500">Live feed from citizen submissions across Gandhinagar</p>
          </div>
          <Link href="/admin/reports">
            <Button variant="ghost" size="sm" className="text-xs text-green-700 font-semibold hover:bg-green-50">
              View All Reports
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3.5">ID / Location</th>
                <th className="px-6 py-3.5">Waste Type</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Severity</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    Loading recent reports feed...
                  </td>
                </tr>
              ) : (
                recentReports.slice(0, 6).map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 text-sm">#{report.id}</div>
                      <div className="text-xs text-gray-500 max-w-xs truncate">{report.location}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">
                      {report.wasteType || 'General Waste'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-semibold">
                      {report.amount}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        report.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        report.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                        report.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {report.severity || 'Medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={
                        report.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        report.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }>
                        {report.status || 'SUBMITTED'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href="/collect">
                        <Button size="sm" variant="outline" className="text-xs rounded-xl hover:bg-green-50 hover:text-green-700">
                          Dispatch
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
