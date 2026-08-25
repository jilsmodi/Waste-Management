// @ts-nocheck
'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { 
  Menu, Coins, Leaf, Bell, User, LogIn, LogOut, ChevronDown, 
  Sparkles, ShieldCheck, Truck, UserCheck, PlusCircle, CheckCircle2 
} from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { getUserByEmail, getUserBalance, getUnreadNotifications, markNotificationAsRead } from "@/utils/db/actions"
import { toast } from "react-hot-toast"

interface HeaderProps {
  onMenuClick: () => void;
  totalEarnings: number;
}

export default function Header({ onMenuClick, totalEarnings }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [loggedIn, setLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState<{ email: string; name: string; role: string } | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [balance, setBalance] = useState<number>(0)

  const syncAuth = async () => {
    try {
      const email = localStorage.getItem('userEmail')
      const role = localStorage.getItem('userRole') || 'citizen'
      const storedName = localStorage.getItem('userName')

      if (email) {
        setLoggedIn(true)
        const dbUser = await getUserByEmail(email)
        const name = dbUser?.name || storedName || email.split('@')[0]
        const finalRole = dbUser?.role || role || 'citizen'

        setUserInfo({ email, name, role: finalRole })

        if (dbUser?.id) {
          try {
            const userBal = await getUserBalance(dbUser.id)
            setBalance(userBal || 0)
            const unread = await getUnreadNotifications(dbUser.id)
            setNotifications(unread || [])
          } catch (e) {
            console.error(e)
          }
        }
      } else {
        setLoggedIn(false)
        setUserInfo(null)
      }
    } catch (err) {
      console.error("Auth sync error:", err)
    }
  }

  useEffect(() => {
    syncAuth()

    const handleLoginChange = () => syncAuth()
    const handleBalanceUpdate = (e: CustomEvent) => setBalance(e.detail)

    window.addEventListener('loginStateChanged', handleLoginChange)
    window.addEventListener('balanceUpdated', handleBalanceUpdate as EventListener)

    return () => {
      window.removeEventListener('loginStateChanged', handleLoginChange)
      window.removeEventListener('balanceUpdated', handleBalanceUpdate as EventListener)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userName')
    localStorage.removeItem('userRole')
    setLoggedIn(false)
    setUserInfo(null)
    window.dispatchEvent(new CustomEvent('loginStateChanged', { detail: { loggedIn: false } }))
    toast.success("Successfully logged out.")
    router.push('/')
  }

  const handleQuickSwitch = (role: 'citizen' | 'employee' | 'admin') => {
    if (role === 'citizen') {
      localStorage.setItem('userEmail', 'citizen.demo@rootx.eco')
      localStorage.setItem('userName', 'Aarav Sharma')
      localStorage.setItem('userRole', 'citizen')
      window.dispatchEvent(new CustomEvent('loginStateChanged', { detail: { loggedIn: true } }))
      toast.success("Switched to Citizen Demo (Aarav)")
      router.push('/report')
    } else if (role === 'employee') {
      localStorage.setItem('userEmail', 'employee.demo@rootx.eco')
      localStorage.setItem('userName', 'Rajesh Patel')
      localStorage.setItem('userRole', 'employee')
      window.dispatchEvent(new CustomEvent('loginStateChanged', { detail: { loggedIn: true } }))
      toast.success("Switched to Collector Demo (Rajesh)")
      router.push('/collect')
    } else if (role === 'admin') {
      localStorage.setItem('userEmail', 'admin.demo@rootx.eco')
      localStorage.setItem('userName', 'Dr. Anita Desai')
      localStorage.setItem('userRole', 'admin')
      window.dispatchEvent(new CustomEvent('loginStateChanged', { detail: { loggedIn: true } }))
      toast.success("Switched to Admin Demo (Dr. Anita)")
      router.push('/admin')
    }
  }

  const getRoleBadge = (role?: string) => {
    if (role === 'admin') {
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 text-xs">Admin</Badge>
    }
    if (role === 'employee') {
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 text-xs">Collector</Badge>
    }
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 text-xs">Citizen</Badge>
  }

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left Side: Hamburger & Brand */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onMenuClick} 
            className="lg:hidden text-gray-700 hover:bg-gray-100 rounded-xl"
            aria-label="Toggle Navigation"
          >
            <Menu className="h-6 w-6" />
          </Button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="bg-gradient-to-tr from-green-600 to-emerald-400 p-2 rounded-xl text-white shadow-md shadow-green-600/20 group-hover:scale-105 transition-transform">
              <Leaf className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-gray-900 leading-none">
                Root<span className="text-green-600">X</span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Waste Management</span>
            </div>
          </Link>
        </div>

        {/* Right Side: Demo Switcher, Notifications, Balance, User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Switcher Dropdown for fast live presentation */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden sm:flex items-center gap-1.5 border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-semibold px-3 h-9"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Demo Switcher</span>
                <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl bg-white border border-gray-100">
              <DropdownMenuLabel className="text-xs text-gray-400 font-semibold uppercase px-2 py-1.5">
                Switch Active Persona
              </DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => handleQuickSwitch('citizen')}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-emerald-50 cursor-pointer text-emerald-950"
              >
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">Aarav Sharma</p>
                  <p className="text-[11px] text-gray-500">Eco Citizen (Report & Rewards)</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleQuickSwitch('employee')}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-blue-50 cursor-pointer text-blue-950"
              >
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">Rajesh Patel</p>
                  <p className="text-[11px] text-gray-500">Collector / Driver (Tasks)</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleQuickSwitch('admin')}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-purple-50 cursor-pointer text-purple-950"
              >
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">Dr. Anita Desai</p>
                  <p className="text-[11px] text-gray-500">City Admin (Fleet & Analytics)</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>



          {/* Notifications Dropdown */}
          {loggedIn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-gray-600 hover:bg-gray-100 rounded-xl h-9 w-9">
                  <Bell className="h-4 w-4" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-2 rounded-2xl shadow-xl bg-white border border-gray-100">
                <DropdownMenuLabel className="text-xs text-gray-500 font-bold px-2 py-1">
                  Notifications ({notifications.length})
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                    All caught up! No unread notices.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <DropdownMenuItem 
                      key={n.id} 
                      onClick={() => markNotificationAsRead(n.id)}
                      className="p-2 rounded-xl text-xs hover:bg-gray-50 cursor-pointer"
                    >
                      <p className="font-medium text-gray-800">{n.message}</p>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Authenticated User Menu or Sign In / Sign Up CTAs */}
          {loggedIn && userInfo ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-2xl hover:bg-gray-100 border border-gray-200/80 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-green-600 to-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[110px]">
                      {userInfo.name || 'User'}
                    </span>
                    <span className="text-[10px] text-gray-400 capitalize">{userInfo.role || 'Citizen'}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl bg-white border border-gray-100">
                <div className="p-2.5 border-b border-gray-100 mb-1">
                  <p className="text-xs font-bold text-gray-900 truncate">{userInfo.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{userInfo.email}</p>
                  <div className="mt-1.5">{getRoleBadge(userInfo.role)}</div>
                </div>

                {userInfo.role === 'citizen' && (
                  <DropdownMenuItem asChild>
                    <Link href="/report" className="flex items-center gap-2 p-2 rounded-xl text-xs text-gray-700 hover:bg-emerald-50 hover:text-emerald-900">
                      <PlusCircle className="w-4 h-4 text-emerald-600" />
                      Report Waste
                    </Link>
                  </DropdownMenuItem>
                )}

                {userInfo.role === 'employee' && (
                  <DropdownMenuItem asChild>
                    <Link href="/collect" className="flex items-center gap-2 p-2 rounded-xl text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-900">
                      <Truck className="w-4 h-4 text-blue-600" />
                      Collection Tasks
                    </Link>
                  </DropdownMenuItem>
                )}

                {userInfo.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center gap-2 p-2 rounded-xl text-xs text-gray-700 hover:bg-purple-50 hover:text-purple-900">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      Admin Control Center
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild>
                  <Link href="/leaderboard" className="flex items-center gap-2 p-2 rounded-xl text-xs text-gray-700 hover:bg-gray-50">
                    <Coins className="w-4 h-4 text-amber-500" />
                    Leaderboard & Rewards
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="flex items-center gap-2 p-2 rounded-xl text-xs text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-semibold h-9 px-3"
                >
                  <LogIn className="w-4 h-4 mr-1.5 text-gray-500" />
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold h-9 px-3.5 shadow-sm shadow-green-600/20"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}