'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, ArrowLeft, PlusCircle, CheckCircle2, Clock, Trash2, Calendar, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getRecentReports, getUserByEmail } from '@/utils/db/actions'

export default function MyReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('Citizen')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const email = localStorage.getItem('userEmail') || 'citizen.demo@rootx.eco'
        const user = await getUserByEmail(email)
        if (user) {
          setUserName(user.name)
        }
        const data = await getRecentReports(20)
        setReports(data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/profile" className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 mb-2">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Profile
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">My Waste Reports</h1>
          <p className="text-sm text-gray-500">Track cleanup statuses and reward earnings from your community contributions</p>
        </div>

        <Link href="/report">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm text-xs font-semibold">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            New Report
          </Button>
        </Link>
      </div>

      {/* Reports Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            Loading your submitted reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-200/80 text-center space-y-3 shadow-sm">
            <FileText className="w-10 h-10 mx-auto text-gray-300" />
            <h3 className="font-bold text-gray-800 text-base">No Reports Submitted Yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Help clean your city and earn eco tokens by photographing and submitting uncollected waste.
            </p>
            <Link href="/report">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold mt-2">
                Report Waste Now
              </Button>
            </Link>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl flex-shrink-0 mt-1">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-900">Report #{report.id}</span>
                    <Badge className={
                      report.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 text-[11px]' :
                      report.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 text-[11px]' :
                      'bg-amber-100 text-amber-800 text-[11px]'
                    }>
                      {report.status || 'SUBMITTED'}
                    </Badge>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      report.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      report.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {report.severity || 'Medium'} Severity
                    </span>
                  </div>

                  <p className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    {report.location}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Material: <strong className="text-gray-700">{report.wasteType}</strong></span>
                    <span>Volume: <strong className="text-gray-700">{report.amount}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>+50 Eco Pts</span>
                </div>
                <span className="text-[11px] text-gray-400 mt-1">
                  {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Recent'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
