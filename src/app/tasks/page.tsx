'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader } from 'lucide-react'

export default function TasksPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/collect')
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader className="w-8 h-8 text-green-600 animate-spin" />
      <p className="text-sm text-gray-500 font-medium">Redirecting to Collection Tasks Portal...</p>
    </div>
  )
}
