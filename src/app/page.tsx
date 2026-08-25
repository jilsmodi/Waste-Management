// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowRight, Leaf, Recycle, Users, Coins, MapPin, ChevronRight, 
  Sparkles, Camera, BrainCircuit, Truck, Award, ShieldCheck, Flame, 
  CheckCircle2, ArrowUpRight, BarChart3, Route 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getRecentReports, getAllRewards, getWasteCollectionTasks, getPlatformStats } from '@/utils/db/actions'

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState('citizen')
  const [impactData, setImpactData] = useState({
    wasteCollected: 468.5,
    reportsSubmitted: 28,
    activeCitizens: 14,
    tokensEarned: 14250,
    co2Offset: 234.2,
  })

  useEffect(() => {
    const syncAuth = () => {
      const email = localStorage.getItem('userEmail')
      const role = localStorage.getItem('userRole') || 'citizen'
      setLoggedIn(!!email)
      setUserRole(role)
    }

    syncAuth()
    window.addEventListener('loginStateChanged', syncAuth)
    return () => window.removeEventListener('loginStateChanged', syncAuth)
  }, [])

  useEffect(() => {
    async function fetchStats() {
      try {
        const stats = await getPlatformStats()
        if (stats) {
          setImpactData({
            wasteCollected: stats.wasteCollectedKg || 468.5,
            reportsSubmitted: stats.totalReports || 28,
            activeCitizens: stats.totalUsers || 14,
            tokensEarned: stats.totalPoints || 14250,
            co2Offset: stats.co2OffsetKg || 234.2,
          })
        }
      } catch (err) {
        console.error("Error loading stats:", err)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative overflow-hidden pt-4 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Smart City Cleanliness Infrastructure</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.1]">
              Turn Waste Into a <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
                Cleaner, Smarter City.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-600 max-w-xl leading-relaxed">
              AI-powered waste reporting, intelligent collection dispatch, real-time city hotspot insights, and gamified eco rewards for responsible citizens.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href={loggedIn ? (userRole === 'employee' ? '/collect' : userRole === 'admin' ? '/admin' : '/report') : '/login'}>
                <Button className="h-12 px-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/25 hover:shadow-xl transition-all duration-200 active:scale-95">
                  <span>{loggedIn ? 'Go to Action Portal' : 'Start Reporting'}</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <Link href="/hotspots">
                <Button variant="outline" className="h-12 px-6 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-2xl font-semibold">
                  <MapPin className="mr-2 h-4 w-4 text-emerald-600" />
                  Explore Live Map
                </Button>
              </Link>

              <Link href="/signup">
                <Button variant="ghost" className="h-12 px-5 text-gray-600 hover:text-emerald-700 font-semibold rounded-2xl">
                  Join as Collector <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Social Trust Metrics */}
            <div className="pt-4 flex items-center gap-6 text-xs text-gray-500 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">AI Severity Verification</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">Instant Token Rewards</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">Municipal Dispatch</span>
              </div>
            </div>
          </div>

          {/* Right Hero Visual Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md bg-gradient-to-b from-white to-gray-50/80 p-6 sm:p-7 rounded-3xl border border-gray-200/90 shadow-2xl space-y-5">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  AI SCANNER ACTIVE
                </Badge>
              </div>

              {/* Simulation Screen */}
              <div className="bg-gray-900 rounded-2xl p-4 text-white space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1 font-mono text-emerald-400">
                    <Sparkles className="w-3 h-3" /> Groq Vision Model
                  </span>
                  <span>Gandhinagar Sector 21</span>
                </div>
                <div className="p-3 bg-gray-800/80 rounded-xl border border-gray-700/80 text-xs space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-300">Detected Material:</span>
                    <span className="text-emerald-400 font-bold">Plastic & Packaging</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-300">Estimated Volume:</span>
                    <span className="text-white font-bold">15 kg (High Density)</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-300">AI Confidence:</span>
                    <span className="text-emerald-400 font-bold">96.8%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-gray-400">Reward Assigned</span>
                  <span className="text-xs font-black text-amber-400">+50 Eco Points</span>
                </div>
              </div>

              {/* Mini Dispatcher Preview */}
              <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Vehicle Dispatched</p>
                    <p className="text-[11px] text-gray-500">Route #4 · ETA 6 mins</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700">En Route</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== IMPACT METRICS SECTION ==================== */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950 text-white p-8 sm:p-12 rounded-3xl shadow-xl">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-xs">
            LIVE METRICS
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Our Environmental Impact</h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Real-time cleanliness metrics recorded across participating sectors and urban collection routes.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl w-fit mb-3">
              <Recycle className="w-5 h-5" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">{impactData.wasteCollected} <span className="text-sm font-normal text-emerald-400">kg</span></p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Waste Collected</p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl w-fit mb-3">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">{impactData.activeCitizens}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Active Eco Citizens</p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="p-2.5 bg-green-500/20 text-green-400 rounded-xl w-fit mb-3">
              <Leaf className="w-5 h-5" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">{impactData.co2Offset} <span className="text-sm font-normal text-green-400">kg</span></p>
            <p className="text-xs text-gray-400 mt-1 font-medium">CO₂ Offset</p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl w-fit mb-3">
              <Coins className="w-5 h-5" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">{impactData.tokensEarned}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Rewards Distributed</p>
          </div>
        </div>
      </section>

      {/* ==================== HOW ROOTX WORKS ==================== */}
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1 text-xs font-bold tracking-wider uppercase">
            STEP-BY-STEP PROCESS
          </Badge>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">How RootX Works</h2>
          <p className="text-sm text-gray-500">
            A seamless four-step loop connecting conscious citizens with municipal waste logistics.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">01</span>
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
                <Camera className="w-6 h-6" />
              </div>
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Snap & Report</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Citizen captures a photo of any roadside or community waste dump and tags its location.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl">02</span>
              <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
                <BrainCircuit className="w-6 h-6" />
              </div>
            </div>
            <h3 className="font-bold text-gray-900 text-lg">AI Detects Waste</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Vision AI automatically calculates waste category, severity level, volume, and priority score.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-xl">03</span>
              <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl">
                <Truck className="w-6 h-6" />
              </div>
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Collector Picks It Up</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Municipal trucks receive optimized TSP routes, collect waste, and upload proof of cleanup.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-xl">04</span>
              <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl">
                <Award className="w-6 h-6" />
              </div>
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Citizen Earns Rewards</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Points are credited upon verified collection, unlocking leaderboard ranks and badges.
            </p>
          </div>
        </div>
      </section>

      {/* ==================== FEATURE SHOWCASE ==================== */}
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1 text-xs font-bold tracking-wider uppercase">
            INTELLIGENT MODULES
          </Badge>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Core Platform Capabilities</h2>
          <p className="text-sm text-gray-500">
            End-to-end technology stack designed for urban cleanliness and circular economy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: AI Vision */}
          <div className="bg-white p-7 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-100 text-emerald-700 rounded-2xl w-fit">
                <BrainCircuit className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">AI Waste Detection</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Groq LLM / Gemini Vision analyzes imagery to pinpoint material recyclable value and assign triage priorities.
              </p>
            </div>
            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs space-y-1 font-medium">
              <p className="text-emerald-800 font-bold">Image ➔ AI Analysis</p>
              <p className="text-emerald-700/80">Waste Category ➔ Severity Matrix</p>
            </div>
          </div>

          {/* Card 2: Smart Logistics */}
          <div className="bg-white p-7 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-100 text-blue-700 rounded-2xl w-fit">
                <Route className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Smart Collection Routing</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Dynamic route optimization dynamically re-routes trucks in real-time when critical waste alerts emerge.
              </p>
            </div>
            <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs space-y-1 font-medium">
              <p className="text-blue-800 font-bold">Report ➔ Task Allocation</p>
              <p className="text-blue-700/80">Dynamic TSP Route ➔ Verified Pickup</p>
            </div>
          </div>

          {/* Card 3: Eco Rewards */}
          <div className="bg-white p-7 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-100 text-amber-700 rounded-2xl w-fit">
                <Coins className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Eco-Token Incentives</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Gamified contribution incentives that award points, badges, and top-performer rankings on community leaderboards.
              </p>
            </div>
            <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-100 text-xs space-y-1 font-medium">
              <p className="text-amber-800 font-bold">Verified Cleanup ➔ Points Earned</p>
              <p className="text-amber-700/80">Tier Progression ➔ City Leaderboard</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== BOTTOM CTA BANNER ==================== */}
      <section className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-8 sm:p-12 rounded-3xl shadow-2xl border border-emerald-800/40 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Join 14,000+ Eco Citizens</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Ready to clean up your neighborhood?</h2>
          <p className="text-gray-300 text-xs sm:text-sm max-w-lg">
            Join thousands of active citizens and municipal teams using RootX to build sustainable cities.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/report">
            <Button className="h-12 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-extrabold shadow-lg shadow-emerald-500/30 transition-transform active:scale-95">
              Report Waste Now
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button className="h-12 px-6 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-2xl font-semibold backdrop-blur-sm transition-all">
              View Leaderboard
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
