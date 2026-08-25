'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Coins, ArrowUpRight, ArrowDownRight, Gift, AlertCircle, Loader, Sparkles, User, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getUserByEmail, getRewardTransactions, getAvailableRewards, redeemReward, createTransaction, getUserBalance } from '@/utils/db/actions'
import { toast } from 'react-hot-toast'

type Transaction = {
  id: number
  type: 'earned_report' | 'earned_collect' | 'redeemed'
  amount: number
  description: string
  date: string
}

type Reward = {
  id: number
  name: string
  cost: number
  description: string | null
  collectionInfo: string
}

export default function RewardsPage() {
  const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null)
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUserDataAndRewards = async () => {
    setLoading(true)
    try {
      const userEmail = localStorage.getItem('userEmail')
      if (userEmail) {
        const fetchedUser = await getUserByEmail(userEmail)
        if (fetchedUser) {
          setUser(fetchedUser)
          const fetchedTransactions = await getRewardTransactions(fetchedUser.id)
          setTransactions((fetchedTransactions || []) as Transaction[])
          const fetchedRewards = await getAvailableRewards(fetchedUser.id)
          setRewards((fetchedRewards || []).filter((r: any) => r.cost > 0))
          const calculatedBalance = await getUserBalance(fetchedUser.id)
          const finalBalance = Math.max(calculatedBalance || 0, 0)
          setBalance(finalBalance)
        }
      }
    } catch (error) {
      console.error('Error fetching user data and rewards:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserDataAndRewards()

    const handleLoginChange = () => fetchUserDataAndRewards()
    window.addEventListener('loginStateChanged', handleLoginChange)
    return () => window.removeEventListener('loginStateChanged', handleLoginChange)
  }, [])

  const handleQuickCitizenLogin = () => {
    localStorage.setItem('userEmail', 'citizen.demo@rootx.eco')
    localStorage.setItem('userName', 'Aarav Sharma')
    localStorage.setItem('userRole', 'citizen')
    window.dispatchEvent(new CustomEvent('loginStateChanged', { detail: { loggedIn: true } }))
    toast.success("Switched to Citizen Demo (Aarav)")
  }

  const handleRedeemReward = async (rewardId: number) => {
    if (!user) {
      toast.error('Please sign in to redeem rewards.')
      return
    }

    const reward = rewards.find(r => r.id === rewardId)
    if (reward && balance >= reward.cost) {
      try {
        await redeemReward(user.id, reward.cost)
        await createTransaction(user.id, 'redeemed', reward.cost, `Redeemed ${reward.name}`)
        await refreshUserData()
        toast.success(`You have successfully redeemed: ${reward.name}`)
      } catch (error) {
        console.error('Error redeeming reward:', error)
        toast.error('Failed to redeem reward. Please try again.')
      }
    } else {
      toast.error('Insufficient balance or invalid reward cost')
    }
  }

  const handleRedeemAllPoints = async () => {
    if (!user) {
      toast.error('Please sign in to redeem points.')
      return
    }

    if (balance > 0) {
      try {
        await redeemReward(user.id, 0)
        await createTransaction(user.id, 'redeemed', balance, 'Redeemed all points')
        await refreshUserData()
        toast.success(`You have successfully redeemed all your points!`)
      } catch (error) {
        console.error('Error redeeming all points:', error)
        toast.error('Failed to redeem all points. Please try again.')
      }
    } else {
      toast.error('No points available to redeem')
    }
  }

  const refreshUserData = async () => {
    if (user) {
      const fetchedUser = await getUserByEmail(user.email)
      if (fetchedUser) {
        const fetchedTransactions = await getRewardTransactions(fetchedUser.id)
        setTransactions((fetchedTransactions || []) as Transaction[])
        const fetchedRewards = await getAvailableRewards(fetchedUser.id)
        setRewards((fetchedRewards || []).filter((r: any) => r.cost > 0))
        const calculatedBalance = await getUserBalance(fetchedUser.id)
        const finalBalance = Math.max(calculatedBalance || 0, 0)
        setBalance(finalBalance)
        window.dispatchEvent(new CustomEvent('balanceUpdated', { detail: finalBalance }))
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-green-600" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Eco Rewards & Points</h1>
          <p className="text-sm text-gray-500 mt-1">Earn tokens by reporting waste and redeem them for municipal perks</p>
        </div>
        <Link href="/leaderboard">
          <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-semibold">
            View Community Leaderboard
          </Button>
        </Link>
      </div>

      {/* If Not Logged In: Polite Banner */}
      {!user && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-3xl border border-emerald-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-emerald-950">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">Sign in to view your personalized rewards</h3>
              <p className="text-xs text-emerald-700 mt-0.5">Track your points balance, transaction receipts, and redeemable eco coupons.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleQuickCitizenLogin}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              1-Click Demo Citizen
            </Button>
            <Link href="/login">
              <Button variant="outline" className="border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50 rounded-xl text-xs font-semibold">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-400/30">
            <Coins className="w-10 h-10" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Available Eco Balance</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl sm:text-5xl font-black text-white">{user ? balance : 0}</span>
              <span className="text-emerald-400 font-semibold text-base">Eco Points</span>
            </div>
            <p className="text-xs text-gray-300 mt-1">
              {user ? `Logged in as ${user.name}` : 'Sign in to unlock token earnings'}
            </p>
          </div>
        </div>

        {user && balance > 0 && (
          <Button 
            onClick={handleRedeemAllPoints}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-5 rounded-2xl shadow-lg shadow-emerald-500/20"
          >
            <Gift className="w-4 h-4 mr-2" />
            Redeem All Points
          </Button>
        )}
      </div>

      {/* Transactions & Available Rewards Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden divide-y divide-gray-100">
            {transactions.length > 0 ? (
              transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 hover:bg-gray-50/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      t.type.startsWith('earned') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {t.type.startsWith('earned') ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-xs">{t.description}</p>
                      <p className="text-[11px] text-gray-400">{t.date}</p>
                    </div>
                  </div>
                  <span className={`font-black text-xs ${
                    t.type.startsWith('earned') ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {t.type.startsWith('earned') ? '+' : '-'}{t.amount} Pts
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-gray-400">
                {user ? "No transactions recorded yet. Submit a waste report to earn your first points!" : "Sign in to view your points activity."}
              </div>
            )}
          </div>
        </div>

        {/* Available Rewards Vouchers */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Redeemable Eco Vouchers</h2>
          <div className="space-y-3">
            {rewards.length > 0 ? (
              rewards.map((reward) => (
                <div key={reward.id} className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{reward.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{reward.description}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-full border border-amber-200/60 whitespace-nowrap ml-2">
                      {reward.cost} Pts
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-gray-400">{reward.collectionInfo}</span>
                    <Button 
                      onClick={() => handleRedeemReward(reward.id)}
                      disabled={!user || balance < reward.cost}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold disabled:opacity-40"
                    >
                      <Gift className="w-3.5 h-3.5 mr-1.5" />
                      Redeem
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-gray-200/80 text-center space-y-2">
                <Gift className="w-8 h-8 mx-auto text-emerald-500" />
                <p className="font-bold text-gray-800 text-sm">Eco Vouchers Active</p>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Earn points from reporting waste to redeem bus passes, composting kits, and city discounts.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}