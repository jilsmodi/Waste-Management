'use client'

import { useState, useEffect } from 'react'
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { 
  MapPin, Trash, Coins, Medal, Home, Flame, Route, Truck, 
  LayoutDashboard, FileText, Users, ShieldCheck, Sparkles 
} from "lucide-react"

interface SidebarProps {
  open: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string>('citizen')

  const updateRole = () => {
    const role = localStorage.getItem('userRole') || 'citizen'
    setUserRole(role)
  }

  useEffect(() => {
    updateRole()
    window.addEventListener('loginStateChanged', updateRole)
    return () => {
      window.removeEventListener('loginStateChanged', updateRole)
    }
  }, [])

  // Role-specific nav items
  const getNavItems = () => {
    if (userRole === 'admin') {
      return [
        { href: "/", icon: Home, label: "Home" },
        { href: "/admin", icon: LayoutDashboard, label: "Admin Overview" },
        { href: "/admin/reports", icon: FileText, label: "All Reports" },
        { href: "/admin/vehicles", icon: Truck, label: "Vehicle Fleet" },
        { href: "/hotspots", icon: Flame, label: "Hotspot Forecast" },
        { href: "/routes", icon: Route, label: "Route Optimizer" },
        { href: "/admin/users", icon: Users, label: "User Directory" },
        { href: "/leaderboard", icon: Medal, label: "Leaderboard" },
      ]
    }

    if (userRole === 'employee') {
      return [
        { href: "/", icon: Home, label: "Home" },
        { href: "/collect", icon: Trash, label: "Collect Tasks" },
        { href: "/routes", icon: Route, label: "Smart Routes" },
        { href: "/admin/vehicles", icon: Truck, label: "Vehicle Tracking" },
        { href: "/leaderboard", icon: Medal, label: "Leaderboard" },
      ]
    }

    // Default: Citizen
    return [
      { href: "/", icon: Home, label: "Home" },
      { href: "/report", icon: MapPin, label: "Report Waste" },
      { href: "/hotspots", icon: Flame, label: "Hotspot Map" },
      { href: "/rewards", icon: Coins, label: "Rewards & Points" },
      { href: "/leaderboard", icon: Medal, label: "Leaderboard" },
    ]
  }

  const navItems = getNavItems()

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {open && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden transition-opacity"
        />
      )}

      <aside className={`bg-white border-r border-gray-200 text-gray-800 w-64 fixed inset-y-0 left-0 z-30 pt-16 transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-full flex flex-col justify-between p-4">
          <div className="space-y-1.5 pt-4">
            <div className="px-3 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {userRole === 'admin' ? 'Admin Portal' : userRole === 'employee' ? 'Collector Operations' : 'Citizen Menu'}
              </span>
            </div>

            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} passHref>
                  <Button 
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start py-2.5 px-3.5 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? "bg-emerald-100/90 text-emerald-900 font-bold shadow-sm" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium"
                    }`} 
                  >
                    <Icon className={`mr-3 h-4 w-4 ${isActive ? 'text-emerald-700 font-bold' : 'text-gray-500'}`} />
                    <span className="text-sm">{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* Quick Eco Badge at sidebar bottom */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-green-600" />
              <p className="text-xs font-bold text-green-900">RootX Live Demo</p>
            </div>
            <p className="text-[11px] text-green-700 leading-snug">
              Smart waste collection with AI detection & eco incentives.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}