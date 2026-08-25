'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, ArrowLeft, Search, Filter, CheckCircle2, Clock, AlertTriangle, Trash2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getRecentReports } from '@/utils/db/actions'

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getRecentReports(50)
        setReports(data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = reports.filter((r) => {
    const matchesSearch = (r.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.wasteType || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 mb-2">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Admin Overview
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">All Waste Reports Audit</h1>
          <p className="text-sm text-gray-500">Comprehensive municipal registry of citizen-reported waste piles</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/collect">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
              Go to Dispatcher
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by sector, landmark, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 rounded-xl text-xs bg-gray-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'SUBMITTED', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
            <Button
              key={st}
              size="sm"
              variant={statusFilter === st ? 'default' : 'outline'}
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl text-xs font-medium ${
                statusFilter === st ? 'bg-gray-900 text-white' : 'text-gray-600'
              }`}
            >
              {st === 'ALL' ? 'All Statuses' : st.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3.5">ID</th>
                <th className="px-6 py-3.5">Location & Landmark</th>
                <th className="px-6 py-3.5">Waste Category</th>
                <th className="px-6 py-3.5">Volume</th>
                <th className="px-6 py-3.5">Severity</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    Loading reports from Neon DB...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No reports matching current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 text-xs">
                      #{r.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900 text-xs">{r.location}</p>
                          {r.landmark && <p className="text-[11px] text-gray-400">{r.landmark}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 text-xs font-medium">
                      {r.wasteType}
                    </td>
                    <td className="px-6 py-4 text-gray-900 text-xs font-bold">
                      {r.amount}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        r.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        r.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                        r.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {r.severity || 'Medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`text-[11px] ${
                        r.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent'}
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
