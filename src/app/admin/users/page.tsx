'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, ArrowLeft, Search, UserCheck, ShieldCheck, Truck, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getAllUsers } from '@/utils/db/actions'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getAllUsers(50)
        setUsers(data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = users.filter((u) => {
    const term = searchTerm.toLowerCase()
    return (u.name || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term)
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <Link href="/admin" className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 mb-2">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Admin Overview
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">User & Personnel Directory</h1>
        <p className="text-sm text-gray-500">Registered citizens, field collectors, and municipal dispatchers</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 flex items-center justify-between shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 rounded-xl text-xs bg-gray-50/50"
          />
        </div>
        <Badge variant="outline" className="text-xs font-semibold text-gray-600">
          Total: {users.length} Users
        </Badge>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Phone</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    Loading users registry...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-green-600 to-emerald-400 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          {(u.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-xs">{u.name || 'Unnamed User'}</p>
                          <p className="text-[11px] text-gray-400">ID #{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs font-medium">
                      {u.email}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {u.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'employee' ? 'bg-blue-100 text-blue-800' :
                        'bg-emerald-100 text-emerald-800'
                      }>
                        {u.role || 'citizen'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recent'}
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
