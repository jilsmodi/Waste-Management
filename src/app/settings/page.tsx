'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Settings, Bell, Shield, Moon, Globe, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

export default function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [geoTracking, setGeoTracking] = useState(true)

  const handleSave = () => {
    toast.success('Settings updated successfully!')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <Link href="/profile" className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 mb-2">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Profile
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Application Settings</h1>
        <p className="text-sm text-gray-500">Configure alert preferences and platform parameters</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-6">
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Notifications & Dispatch Alerts</h3>
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
            <div>
              <p className="text-sm font-semibold text-gray-900">Task Assignment Alerts</p>
              <p className="text-xs text-gray-500">Receive instant alerts when a cleanup task is assigned to your vehicle</p>
            </div>
            <input 
              type="checkbox" 
              checked={notificationsEnabled} 
              onChange={() => setNotificationsEnabled(!notificationsEnabled)}
              className="w-5 h-5 accent-emerald-600 rounded" 
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
            <div>
              <p className="text-sm font-semibold text-gray-900">Weekly Eco Impact Digest</p>
              <p className="text-xs text-gray-500">Email summary of points earned and community rank changes</p>
            </div>
            <input 
              type="checkbox" 
              checked={emailAlerts} 
              onChange={() => setEmailAlerts(!emailAlerts)}
              className="w-5 h-5 accent-emerald-600 rounded" 
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
            <div>
              <p className="text-sm font-semibold text-gray-900">High Precision GPS Geolocation</p>
              <p className="text-xs text-gray-500">Auto-detect nearest sector coordinates during waste photo uploads</p>
            </div>
            <input 
              type="checkbox" 
              checked={geoTracking} 
              onChange={() => setGeoTracking(!geoTracking)}
              className="w-5 h-5 accent-emerald-600 rounded" 
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold px-6">
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  )
}
