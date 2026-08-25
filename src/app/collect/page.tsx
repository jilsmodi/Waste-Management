'use client'
import { useState, useEffect, useCallback } from 'react'
import { 
  Trash2, MapPin, CheckCircle, Clock, ArrowRight, Camera, Upload, 
  Loader, Calendar, Weight, Search, AlertTriangle, Shield, BarChart3, 
  Plus, Truck, User, Award, Info, RefreshCw, X, ChevronRight, Navigation 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { getWasteCollectionTasks, updateTaskStatus, saveReward, saveCollectedWaste, getUserByEmail, createReport } from '@/utils/db/actions'
import { GoogleGenerativeAI } from "@google/generative-ai"

interface CollectionTask {
  id: string; // e.g. "WT-1024" or DB ID
  reportId?: number;
  wasteType: string;
  wasteImage?: string;
  location: string;
  latitude: string;
  longitude: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  quantity: string;
  status: 'pending' | 'assigned' | 'en_route' | 'arrived' | 'collecting' | 'completed' | 'unable_to_collect' | 'in_progress';
  assignedVehicle?: string;
  assignedWorker?: string;
  createdAt: string;
  assignedAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  beforeImage?: string;
  afterImage?: string;
  aiVerificationScore?: number;
  failureReason?: string;
  citizenNotified?: boolean;
  reporterName?: string;
}

interface SmartRecommendation {
  vehicle: string;
  driver: string;
  distance: number;
  eta: number;
  capacity: string;
  workload: number;
}

const GANDHINAGAR_SECTORS = [
  "Sector 7", "Sector 11", "Sector 21", "Sector 22", 
  "Sector 24", "Sector 26", "Sector 28", "Sector 30"
];

const VEHICLE_FLEET = [
  { vehicle: "GJ-18-AB-4521", driver: "Raj Patel", baseSector: "Sector 21" },
  { vehicle: "GJ-18-CD-2842", driver: "Amit Shah", baseSector: "Sector 11" },
  { vehicle: "GJ-01-XY-7812", driver: "Rahul Patel", baseSector: "Sector 7" },
  { vehicle: "GJ-18-JK-9021", driver: "Vikram Sharma", baseSector: "Sector 22" },
  { vehicle: "GJ-18-EF-5678", driver: "Sanjay Mehta", baseSector: "Sector 28" }
];

const INITIAL_SEEDS: CollectionTask[] = [
  {
    id: "WT-1024",
    wasteType: "Plastic Waste",
    location: "Sector 21, near Shopping Center",
    latitude: "23.2383",
    longitude: "72.6468",
    priority: "high",
    quantity: "4.5 kg",
    status: "en_route",
    assignedVehicle: "GJ-18-AB-4521",
    assignedWorker: "Raj Patel",
    createdAt: "2026-08-17 08:30",
    assignedAt: "2026-08-17 09:15",
    wasteImage: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop",
    reporterName: "Raj Patel"
  },
  {
    id: "WT-1025",
    wasteType: "Organic Waste",
    location: "Sector 11, Vegetable Market",
    latitude: "23.2241",
    longitude: "72.6392",
    priority: "medium",
    quantity: "12.0 kg",
    status: "pending",
    createdAt: "2026-08-17 09:00",
    wasteImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop",
    reporterName: "Aarav Sharma"
  },
  {
    id: "WT-1026",
    wasteType: "E-Waste",
    location: "Sector 7, Electronics Hub",
    latitude: "23.2429",
    longitude: "72.6598",
    priority: "critical",
    quantity: "2.1 kg",
    status: "assigned",
    assignedVehicle: "GJ-01-XY-7812",
    assignedWorker: "Rahul Patel",
    createdAt: "2026-08-17 09:12",
    assignedAt: "2026-08-17 09:30",
    wasteImage: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop",
    reporterName: "Aditya Rao"
  },
  {
    id: "WT-1027",
    wasteType: "Paper Waste",
    location: "Sector 22, Government Offices",
    latitude: "23.2356",
    longitude: "72.6289",
    priority: "low",
    quantity: "8.5 kg",
    status: "completed",
    assignedVehicle: "GJ-18-JK-9021",
    assignedWorker: "Vikram Sharma",
    createdAt: "2026-08-17 07:15",
    assignedAt: "2026-08-17 07:30",
    arrivedAt: "2026-08-17 08:00",
    completedAt: "2026-08-17 08:15",
    wasteImage: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop",
    reporterName: "Subham Dey"
  },
  {
    id: "WT-1028",
    wasteType: "Metal Waste",
    location: "Sector 24, Industrial Area",
    latitude: "23.2505",
    longitude: "72.6174",
    priority: "high",
    quantity: "15.2 kg",
    status: "pending",
    createdAt: "2026-08-17 09:45",
    wasteImage: "https://images.unsplash.com/photo-1505705694340-019e1e335916?w=800&auto=format&fit=crop",
    reporterName: "Vihaan Patel"
  },
  {
    id: "WT-1029",
    wasteType: "Organic Waste",
    location: "Sector 26, Residential Block A",
    latitude: "23.2592",
    longitude: "72.6311",
    priority: "medium",
    quantity: "6.0 kg",
    status: "arrived",
    assignedVehicle: "GJ-18-CD-2842",
    assignedWorker: "Amit Shah",
    createdAt: "2026-08-17 09:05",
    assignedAt: "2026-08-17 09:20",
    arrivedAt: "2026-08-17 09:50",
    wasteImage: "https://images.unsplash.com/photo-1606166325012-7da4a0911526?w=800&auto=format&fit=crop",
    reporterName: "Amit Shah"
  },
  {
    id: "WT-1030",
    wasteType: "Glass Waste",
    location: "Sector 28, Commercial Zone",
    latitude: "23.2647",
    longitude: "72.6481",
    priority: "medium",
    quantity: "4.0 kg",
    status: "collecting",
    assignedVehicle: "GJ-18-EF-5678",
    assignedWorker: "Sanjay Mehta",
    createdAt: "2026-08-17 08:50",
    assignedAt: "2026-08-17 09:00",
    arrivedAt: "2026-08-17 09:30",
    wasteImage: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&auto=format&fit=crop",
    reporterName: "Sanjay Mehta"
  },
  {
    id: "WT-1031",
    wasteType: "Mixed Waste",
    location: "Sector 30, Park Side",
    latitude: "23.2721",
    longitude: "72.6552",
    priority: "low",
    quantity: "9.3 kg",
    status: "unable_to_collect",
    assignedVehicle: "GJ-18-GH-1234",
    assignedWorker: "Jayesh Patel",
    createdAt: "2026-08-17 08:00",
    assignedAt: "2026-08-17 08:15",
    completedAt: "2026-08-17 08:45",
    failureReason: "Location inaccessible",
    wasteImage: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800&auto=format&fit=crop",
    reporterName: "Jayesh Patel"
  },
  {
    id: "WT-1032",
    wasteType: "Construction Debris",
    location: "Sector 7, New Building Site",
    latitude: "23.2451",
    longitude: "72.6588",
    priority: "high",
    quantity: "50.0 kg",
    status: "pending",
    createdAt: "2026-08-17 10:00",
    wasteImage: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&auto=format&fit=crop",
    reporterName: "Rahul Patel"
  },
  {
    id: "WT-1033",
    wasteType: "Plastic Waste",
    location: "Sector 11, Community Hall",
    latitude: "23.2265",
    longitude: "72.6371",
    priority: "critical",
    quantity: "7.2 kg",
    status: "completed",
    assignedVehicle: "GJ-18-AB-4521",
    assignedWorker: "Raj Patel",
    createdAt: "2026-08-17 06:30",
    assignedAt: "2026-08-17 06:45",
    arrivedAt: "2026-08-17 07:10",
    completedAt: "2026-08-17 07:30",
    wasteImage: "https://images.unsplash.com/photo-1526951914846-7a95ebd61349?w=800&auto=format&fit=crop",
    reporterName: "Vikram Sharma"
  }
];

export default function CollectPage() {
  const [tasks, setTasks] = useState<CollectionTask[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const tasksPerPage = 5
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sectorFilter, setSectorFilter] = useState('all')

  // Modals / Details
  const [selectedTask, setSelectedTask] = useState<CollectionTask | null>(null)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [showSmartAssign, setShowSmartAssign] = useState(false)
  
  // Smart Assignment Recommends
  const [smartRecommendations, setSmartRecommendations] = useState<SmartRecommendation[]>([])

  // AI Verification uploads
  const [beforeImage, setBeforeImage] = useState<string | null>(null)
  const [afterImage, setAfterImage] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle')
  const [simulateFailedCleanup, setSimulateFailedCleanup] = useState(false)
  const [cleanupScore, setCleanupScore] = useState<number | null>(null)
  const [unableReason, setUnableReason] = useState('Location inaccessible')

  // Admin New Task state
  const [newTask, setNewTask] = useState({
    wasteType: 'Plastic Waste',
    location: '',
    sector: 'Sector 21',
    priority: 'medium',
    quantity: '5.0 kg',
    wasteImage: ''
  })

  // GPS Simulation coordinate tracking
  const [gpsPositions, setGpsPositions] = useState<Record<string, { lat: number; lng: number; dist: number; eta: number }>>({})

  // Gemini API Key from localStorage/process.env
  const [geminiApiKey, setGeminiApiKey] = useState<string>('')

  // 1. Fetch data on mount
  useEffect(() => {
    const savedGeminiKey = localStorage.getItem('geminiApiKey') || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
    setGeminiApiKey(savedGeminiKey)

    const initDashboard = async () => {
      setLoading(true)
      try {
        const userEmail = localStorage.getItem('userEmail')
        if (userEmail) {
          const fetchedUser = await getUserByEmail(userEmail)
          if (fetchedUser) setUser(fetchedUser)
        }

        // Fetch Drizzle reports
        const dbReports = await getWasteCollectionTasks(30)
        
        // Map Drizzle tasks & combine with Seeds
        const formattedDbTasks: CollectionTask[] = dbReports.map(item => ({
          id: `WT-${item.id}`,
          reportId: item.id,
          wasteType: item.wasteType,
          location: item.location,
          latitude: item.latitude || '23.2383',
          longitude: item.longitude || '72.6468',
          priority: (item.severity as CollectionTask['priority']) || 'medium',
          quantity: item.amount,
          status: (item.status as CollectionTask['status']) || 'pending',
          createdAt: item.date,
          assignedVehicle: item.collectorId ? 'GJ-18-AB-4521' : undefined,
          assignedWorker: item.collectorId ? 'Raj Patel' : undefined,
          reporterName: item.reporterName
        }))

        // Dedup task ids
        const combined = [...INITIAL_SEEDS]
        formattedDbTasks.forEach(dbT => {
          if (!combined.some(c => c.id === dbT.id)) {
            combined.unshift(dbT)
          }
        })

        setTasks(combined)
      } catch (err) {
        console.error("Error seeding tasks:", err)
        setTasks(INITIAL_SEEDS)
      } finally {
        setLoading(false)
      }
    }
    initDashboard()
  }, [])

  // 2. Simulated Live Coordinate Movement
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prevTasks => 
        prevTasks.map(task => {
          if (task.status === 'en_route') {
            const destLat = parseFloat(task.latitude)
            const destLng = parseFloat(task.longitude)
            
            // Generate starting position slightly offset
            const activePos = gpsPositions[task.id]
            let currLat = activePos ? activePos.lat : destLat + 0.012
            let currLng = activePos ? activePos.lng : destLng - 0.010

            // Move closer by 20%
            currLat = currLat + (destLat - currLat) * 0.20
            currLng = currLng + (destLng - currLng) * 0.20

            // Calculate rough distance
            const latDiff = destLat - currLat
            const lngDiff = destLng - currLng
            const dist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111.32
            const eta = Math.max(Math.ceil(dist * 6), 1)

            setGpsPositions(prev => ({
              ...prev,
              [task.id]: { lat: currLat, lng: currLng, dist, eta }
            }))

            if (dist < 0.1) {
              toast.success(`Vehicle ${task.assignedVehicle} has arrived at ${task.location}!`, { duration: 4000 })
              
              // If selected task is this task, update details popup
              if (selectedTask?.id === task.id) {
                setSelectedTask(prev => prev ? { ...prev, status: 'arrived', arrivedAt: new Date().toISOString().split('T')[0] } : null)
              }

              return {
                ...task,
                status: 'arrived',
                arrivedAt: new Date().toISOString().split('T')[0]
              }
            }
          }
          return task
        })
      )
    }, 4500)

    return () => clearInterval(interval)
  }, [gpsPositions, selectedTask])

  // 3. Smart assignment recommender
  const handleSmartAssignRequest = (task: CollectionTask) => {
    const taskLat = parseFloat(task.latitude)
    const taskLng = parseFloat(task.longitude)

    const recs: SmartRecommendation[] = VEHICLE_FLEET.map(fleetItem => {
      // Mock worker details & base coords
      const baseLat = taskLat + (Math.random() - 0.5) * 0.03
      const baseLng = taskLng + (Math.random() - 0.5) * 0.03
      
      const latDiff = taskLat - baseLat
      const lngDiff = taskLng - baseLng
      const dist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111.32

      return {
        vehicle: fleetItem.vehicle,
        driver: fleetItem.driver,
        distance: parseFloat(dist.toFixed(1)),
        eta: Math.max(Math.ceil(dist * 5), 2),
        capacity: `${Math.floor(Math.random() * 40) + 50}% free`,
        workload: Math.floor(Math.random() * 3)
      }
    }).sort((a, b) => a.distance - b.distance)

    setSmartRecommendations(recs)
    setShowSmartAssign(true)
  }

  // 4. Update task status flow
  const handleUpdateStatus = async (taskId: string, newStatus: CollectionTask['status'], extraFields = {}) => {
    const targetTask = tasks.find(t => t.id === taskId)
    if (!targetTask) return

    try {
      // Sync back to Neon Postgres if it was originally a db report
      if (targetTask.reportId) {
        await updateTaskStatus(targetTask.reportId, newStatus)
      }

      setTasks(prev => 
        prev.map(t => {
          if (t.id === taskId) {
            const updated = {
              ...t,
              status: newStatus,
              ...extraFields
            }
            if (newStatus === 'assigned') updated.assignedAt = new Date().toISOString().split('T')[0]
            if (newStatus === 'arrived') updated.arrivedAt = new Date().toISOString().split('T')[0]
            if (newStatus === 'completed') updated.completedAt = new Date().toISOString().split('T')[0]
            
            // Sync selected popup if open
            if (selectedTask?.id === taskId) {
              setSelectedTask(updated)
            }
            return updated
          }
          return t
        })
      )
      toast.success(`Task status updated to ${newStatus.replace('_', ' ')}`)
    } catch (err) {
      console.error(err)
      toast.error("Failed to update database task status.")
    }
  }

  // 5. SmartAssign save
  const handleSmartAssignSelect = (rec: SmartRecommendation) => {
    if (!selectedTask) return
    handleUpdateStatus(selectedTask.id, 'assigned', {
      assignedVehicle: rec.vehicle,
      assignedWorker: rec.driver,
      assignedAt: new Date().toISOString().split('T')[0]
    })
    setShowSmartAssign(false)
  }

  // 6. Creating new task from Admin Panel
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Gandhinagar relative coordinate mock
    const mockCoordinates: Record<string, {lat: string, lng: string}> = {
      "Sector 7": { lat: "23.2429", lng: "72.6598" },
      "Sector 11": { lat: "23.2241", lng: "72.6392" },
      "Sector 21": { lat: "23.2383", lng: "72.6468" },
      "Sector 22": { lat: "23.2356", lng: "72.6289" },
      "Sector 24": { lat: "23.2505", lng: "72.6174" },
      "Sector 26": { lat: "23.2592", lng: "72.6311" },
      "Sector 28": { lat: "23.2647", lng: "72.6481" },
      "Sector 30": { lat: "23.2721", lng: "72.6552" },
    }

    const sectorCoords = mockCoordinates[newTask.sector] || { lat: "23.2400", lng: "72.6400" }

    try {
      let reportId: number | undefined = undefined
      if (user) {
        const created = await createReport(
          user.id,
          `${newTask.sector}, ${newTask.location}`,
          newTask.wasteType,
          newTask.quantity,
          newTask.wasteImage || 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800&auto=format&fit=crop',
          sectorCoords.lat,
          sectorCoords.lng,
          newTask.priority
        )
        if (created) reportId = created.id
      }

      const randomId = reportId ? `WT-${reportId}` : `WT-${Math.floor(Math.random() * 9000) + 1000}`
      
      const createdTask: CollectionTask = {
        id: randomId,
        reportId,
        wasteType: newTask.wasteType,
        location: `${newTask.sector}, ${newTask.location}`,
        latitude: sectorCoords.lat,
        longitude: sectorCoords.lng,
        priority: newTask.priority as CollectionTask['priority'],
        quantity: newTask.quantity,
        status: 'pending',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        wasteImage: newTask.wasteImage || 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800&auto=format&fit=crop'
      }

      setTasks(prev => [createdTask, ...prev])
      setIsCreatingTask(false)
      toast.success(`Task ${randomId} successfully created!`)
    } catch (err) {
      console.error(err)
      toast.error("Failed to create task in DB.")
    }
  }

  // 7. Verify collection photos using Gemini (or simulated)
  const handleAiCleanupVerify = async () => {
    if (!selectedTask) return
    setVerificationStatus('verifying')

    // Simulate AI delay
    setTimeout(() => {
      if (simulateFailedCleanup) {
        setCleanupScore(43)
        setVerificationStatus('failed')
        toast.error("Collection Verification Failed: AI detected remaining waste!")
      } else {
        setCleanupScore(96)
        setVerificationStatus('success')
        toast.success("AI Verification Successful: 96% Cleanup Confirmed!")
      }
    }, 2000)
  }

  // Save reward & finalize task on verification success
  const handleFinalizeVerification = async () => {
    if (!selectedTask || !user) return

    try {
      // Award reward tokens (random 20-40)
      const earned = 20
      await saveReward(user.id, earned)
      
      // Update task status in list
      await handleUpdateStatus(selectedTask.id, 'completed', {
        beforeImage: beforeImage || selectedTask.wasteImage,
        afterImage: afterImage || 'https://images.unsplash.com/photo-1616886220360-a2b25866f7f6?w=800&auto=format&fit=crop',
        aiVerificationScore: cleanupScore || 96,
        citizenNotified: true
      })

      toast.success(`Rewards awarded! Citizen notified that reported waste is collected.`)
      setSelectedTask(null)
      setBeforeImage(null)
      setAfterImage(null)
      setVerificationStatus('idle')
      setCleanupScore(null)
    } catch (err) {
      console.error(err)
      toast.error("Failed to complete task collection verification.")
    }
  }

  // Dynamic statistics counts
  const stats = {
    pending: tasks.filter(t => t.status === 'pending').length,
    assigned: tasks.filter(t => t.status === 'assigned').length,
    inProgress: tasks.filter(t => ['en_route', 'arrived', 'collecting'].includes(t.status)).length,
    completed: tasks.filter(t => t.status === 'completed').length
  }

  // Filters application
  const filteredTasks = tasks.filter(task => {
    // Search query match
    const query = searchTerm.toLowerCase()
    const matchesSearch = 
      task.id.toLowerCase().includes(query) ||
      task.location.toLowerCase().includes(query) ||
      (task.assignedWorker && task.assignedWorker.toLowerCase().includes(query)) ||
      (task.assignedVehicle && task.assignedVehicle.toLowerCase().includes(query))

    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    const matchesType = typeFilter === 'all' || task.wasteType.toLowerCase().includes(typeFilter.toLowerCase())
    const matchesSector = sectorFilter === 'all' || task.location.includes(sectorFilter)

    return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesSector
  })

  // Coords translation helper for custom Interactive SVG Map placeholder
  const getRelativeCoords = (latStr?: string, lngStr?: string) => {
    const lat = parseFloat(latStr || '23.2400')
    const lng = parseFloat(lngStr || '72.6400')
    
    const minLat = 23.2100
    const maxLat = 23.2800
    const minLng = 72.6000
    const maxLng = 72.6700
    
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100
    const x = ((lng - minLng) / (maxLng - minLng)) * 100
    
    return { 
      x: Math.max(5, Math.min(95, x)), 
    }
  }

  // Pagination logic
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage) || 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 min-h-screen">
      
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin h-8 w-8 text-green-600" />
          </div>
        ) : currentTasks.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No tasks found.</div>
        ) : (
          currentTasks.map((task) => (
            <div key={task.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-600" />
                  <span className="font-semibold text-gray-800 text-lg">{task.location}</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold capitalize flex items-center gap-1 ${
                  task.status === 'completed' ? 'bg-green-100 text-green-700' :
                  task.status === 'in_progress' || task.status === 'en_route' || task.status === 'assigned' || task.status === 'collecting' ? 'bg-indigo-100 text-indigo-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {task.status === 'completed' ? (
                    <><CheckCircle className="h-3 w-3" /> Verified</>
                  ) : (
                    <><Trash2 className="h-3 w-3" /> {task.status.replace('_', ' ')}</>
                  )}
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 mt-2 gap-8">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  {task.wasteType}
                </div>
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4" />
                  Approximately {task.quantity}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {task.createdAt.split(' ')[0]}
                </div>
              </div>

              {task.reporterName && (
                <div className="text-sm text-green-600 font-medium flex items-center mt-4">
                  <User className="h-4 w-4 mr-1.5" />
                  Reported by: {task.reporterName}
                </div>
              )}

              <div className="flex justify-end mt-2">
                {task.status === 'completed' ? (
                  <span className="text-green-600 font-bold text-sm">Reward Earned</span>
                ) : (
                  <Button 
                    onClick={() => {
                      setSelectedTask(task);
                      setBeforeImage(task.wasteImage || null);
                    }}
                    variant="outline" size="sm" className="bg-white text-gray-800 border border-gray-300 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Complete & Verify
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 mb-4">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="bg-gray-500 text-white hover:bg-gray-600 hover:text-white border-none px-6 disabled:opacity-50 disabled:bg-gray-400"
          >
            Previous
          </Button>
          <span className="text-sm font-semibold text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="bg-gray-500 text-white hover:bg-gray-600 hover:text-white border-none px-6 disabled:opacity-50 disabled:bg-gray-400"
          >
            Next
          </Button>
        </div>
      )}

      {/* 5. Create Task Dialog Modal */}
      {isCreatingTask && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-100 shadow-2xl relative">
            <button 
              onClick={() => setIsCreatingTask(false)}
              className="absolute right-4 top-4 p-1 rounded-full text-gray-400 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-gray-800 flex items-center mb-1">
              <Plus className="mr-2 h-5 w-5 text-green-600" />
              Create Task
            </h3>
            <p className="text-xs text-gray-400 mb-4">Add a new waste collection point to the city dispatch registry.</p>
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Waste Type</label>
                <select
                  value={newTask.wasteType}
                  onChange={(e) => setNewTask({ ...newTask, wasteType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Plastic Waste">Plastic Waste</option>
                  <option value="Organic Waste">Organic Waste</option>
                  <option value="Paper Waste">Paper Waste</option>
                  <option value="Metal Waste">Metal Waste</option>
                  <option value="E-Waste">E-Waste</option>
                  <option value="Glass Waste">Glass Waste</option>
                  <option value="Construction Debris">Construction Debris</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Sector Block</label>
                  <select
                    value={newTask.sector}
                    onChange={(e) => setNewTask({ ...newTask, sector: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {GANDHINAGAR_SECTORS.map((sec, i) => (
                      <option key={i} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Est. Amount</label>
                  <input
                    type="text"
                    value={newTask.quantity}
                    onChange={(e) => setNewTask({ ...newTask, quantity: e.target.value })}
                    placeholder="e.g. 5.0 kg"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Landmark / Sub-Location</label>
                <input
                  type="text"
                  value={newTask.location}
                  onChange={(e) => setNewTask({ ...newTask, location: e.target.value })}
                  placeholder="e.g. near Green Park Gate"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Image URL (Optional)</label>
                <input
                  type="text"
                  value={newTask.wasteImage}
                  onChange={(e) => setNewTask({ ...newTask, wasteImage: e.target.value })}
                  placeholder="Paste waste preview photo URL"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Priority</label>
                <div className="flex gap-2">
                  {['low', 'medium', 'high', 'critical'].map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setNewTask({ ...newTask, priority: p })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize border ${
                        newTask.priority === p 
                          ? 'bg-green-600 text-white border-green-600' 
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-bold mt-4 shadow-sm"
              >
                Register Task
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* 6. Task Details Popup Modal / Drawer */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full border border-gray-100 shadow-2xl relative max-h-[90vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Close Button */}
            <button 
              onClick={() => {
                setSelectedTask(null)
                setBeforeImage(null)
                setAfterImage(null)
                setVerificationStatus('idle')
                setCleanupScore(null)
              }}
              className="absolute right-4 top-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left Column: Media & Info Metadata */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedTask.id} Details</h3>
                  <div className="text-xs text-gray-400 mt-0.5">Reported: {selectedTask.createdAt}</div>
                </div>
                <PriorityBadge priority={selectedTask.priority} />
              </div>

              {selectedTask.wasteImage && (
                <div className="relative h-44 w-full rounded-xl overflow-hidden border border-gray-100 shadow-inner">
                  <img 
                    src={selectedTask.wasteImage} 
                    alt="Reported waste" 
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Report Image
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100 text-xs">
                <div className="grid grid-cols-2 gap-2 text-gray-700">
                  <div>Type: <span className="font-bold text-gray-900">{selectedTask.wasteType}</span></div>
                  <div>Quantity: <span className="font-bold text-gray-900">{selectedTask.quantity}</span></div>
                  <div>Confidence: <span className="font-bold text-gray-900">92% (AI Verified)</span></div>
                  <div>Status: <span className="font-bold text-indigo-700 capitalize">{selectedTask.status.replace('_', ' ')}</span></div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="font-semibold text-gray-600 flex items-center mb-0.5">
                    <MapPin className="h-3 w-3 mr-1" />
                    Coordinates
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">
                    Lat: {selectedTask.latitude} | Lng: {selectedTask.longitude}
                  </div>
                  <div className="text-gray-900 mt-1 font-semibold">{selectedTask.location}</div>
                </div>
              </div>

              {/* Smart assignment controller panel */}
              {['pending', 'assigned'].includes(selectedTask.status) && (
                <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-green-900 uppercase">Assignment Controls</span>
                    <Button 
                      onClick={() => handleSmartAssignRequest(selectedTask)}
                      size="sm"
                      className="bg-green-700 hover:bg-green-800 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg"
                    >
                      Smart Assign
                    </Button>
                  </div>
                  
                  {selectedTask.assignedVehicle ? (
                    <div className="text-xs space-y-1">
                      <div className="text-gray-700">Vehicle: <span className="font-bold text-gray-900">{selectedTask.assignedVehicle}</span></div>
                      <div className="text-gray-700">Worker: <span className="font-bold text-gray-900">{selectedTask.assignedWorker}</span></div>
                    </div>
                  ) : (
                    <div className="text-xs text-green-700 italic">Click Smart Assign to dispatch recommended vehicle.</div>
                  )}

                  {showSmartAssign && (
                    <div className="pt-3 border-t border-green-200 space-y-2">
                      <div className="text-[10px] font-bold text-green-900 uppercase">Recommended Vehicles:</div>
                      {smartRecommendations.slice(0, 2).map((rec, i) => (
                        <div key={i} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border border-green-100">
                          <div>
                            <div className="font-bold text-green-800">{rec.vehicle} ({rec.driver})</div>
                            <div className="text-[10px] text-gray-400">{rec.distance} km away | Free Capacity: {rec.capacity}</div>
                          </div>
                          <Button 
                            onClick={() => handleSmartAssignSelect(rec)}
                            className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded"
                          >
                            Assign
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Timeline, Status changes & Photo AI Verification */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Timeline & Verification</h4>
              
              {/* Task workflow updater */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Driver Status Control</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Dispatch En Route", status: "en_route" },
                    { label: "Arrived Site", status: "arrived" },
                    { label: "Collecting Waste", status: "collecting" },
                    { label: "Unable to Collect", status: "unable_to_collect" }
                  ].map((btn, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => {
                        if (btn.status === 'unable_to_collect') {
                          handleUpdateStatus(selectedTask.id, 'unable_to_collect', { failureReason: unableReason })
                        } else {
                          handleUpdateStatus(selectedTask.id, btn.status as CollectionTask['status'])
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                        selectedTask.status === btn.status 
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {selectedTask.status === 'unable_to_collect' && (
                  <div className="mt-3 space-y-2">
                    <label className="block text-[10px] font-bold text-red-700 uppercase">Reason for failure:</label>
                    <select
                      value={unableReason}
                      onChange={(e) => {
                        setUnableReason(e.target.value)
                        handleUpdateStatus(selectedTask.id, 'unable_to_collect', { failureReason: e.target.value })
                      }}
                      className="w-full px-2 py-1.5 border border-red-200 rounded-lg text-xs bg-white text-gray-800"
                    >
                      <option value="Location inaccessible">Location inaccessible</option>
                      <option value="Waste not found">Waste not found</option>
                      <option value="Vehicle issue">Vehicle issue</option>
                      <option value="Wrong location">Wrong location</option>
                      <option value="Excessive waste quantity">Excessive waste quantity</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Timeline graphic steps */}
              <div className="p-3 bg-white border border-gray-100 rounded-xl space-y-2.5 text-[11px] text-gray-600 font-medium">
                <div className="text-[10px] font-bold text-gray-500 uppercase">Task Timeline</div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className={`p-1 rounded ${selectedTask.createdAt ? 'bg-green-50 text-green-700 font-bold' : ''}`}>
                    Reported
                  </div>
                  <div className={`p-1 rounded ${selectedTask.assignedAt ? 'bg-green-50 text-green-700 font-bold' : ''}`}>
                    Assigned
                  </div>
                  <div className={`p-1 rounded ${selectedTask.arrivedAt ? 'bg-green-50 text-green-700 font-bold' : ''}`}>
                    Arrived
                  </div>
                  <div className={`p-1 rounded ${selectedTask.completedAt ? 'bg-green-50 text-green-700 font-bold' : ''}`}>
                    Completed
                  </div>
                </div>
              </div>

              {/* Complete & Verify section */}
              {['arrived', 'collecting', 'completed'].includes(selectedTask.status) && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-3">
                  <span className="text-xs font-bold text-indigo-900 uppercase flex items-center">
                    <Award className="mr-1 h-4 w-4" />
                    AI Collection Cleanup Verification
                  </span>
                  
                  {/* Photo comparison setup */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Before Photo</span>
                      <div className="h-20 bg-gray-100 rounded-lg flex items-center justify-center text-[10px] text-gray-400 font-bold border border-dashed border-gray-300">
                        {beforeImage ? (
                          <img src={beforeImage} className="w-full h-full object-cover rounded-lg" />
                        ) : 'No photo'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">After Photo</span>
                      <button 
                        onClick={() => setAfterImage('https://images.unsplash.com/photo-1616886220360-a2b25866f7f6?w=800&auto=format&fit=crop')}
                        className="h-20 w-full bg-white hover:bg-gray-50 rounded-lg flex flex-col items-center justify-center text-[9px] text-gray-400 font-bold border border-dashed border-gray-300 transition-colors"
                      >
                        {afterImage ? (
                          <img src={afterImage} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <>
                            <Camera className="h-4 w-4 text-gray-400 mb-1" />
                            Upload After
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="simulateFailedCleanup" 
                      checked={simulateFailedCleanup} 
                      onChange={(e) => setSimulateFailedCleanup(e.target.checked)} 
                      className="h-3.5 w-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2"
                    />
                    <label htmlFor="simulateFailedCleanup" className="text-[11px] text-indigo-900 font-semibold select-none cursor-pointer">
                      Simulate Remaining Waste (Failed verification check)
                    </label>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={handleAiCleanupVerify}
                      disabled={!afterImage || verificationStatus === 'verifying'}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg"
                    >
                      {verificationStatus === 'verifying' ? 'AI Comparing Images...' : 'Verify Cleanup with AI'}
                    </Button>
                  </div>

                  {/* Verification Results Panel */}
                  {verificationStatus === 'success' && cleanupScore !== null && (
                    <div className="bg-green-100 border border-green-200 text-green-900 rounded-lg p-3 space-y-1 text-xs">
                      <div className="font-bold flex items-center">
                        <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-600" />
                        Collection Cleanup Verified! ({cleanupScore}% score)
                      </div>
                      <p className="text-[10px] text-green-700">AI verified that reported waste has been fully removed from Sector block.</p>
                      
                      <Button
                        onClick={handleFinalizeVerification}
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 mt-2 rounded-lg"
                      >
                        Submit Completed Task (+20 Reward)
                      </Button>
                    </div>
                  )}

                  {verificationStatus === 'failed' && cleanupScore !== null && (
                    <div className="bg-red-100 border border-red-200 text-red-900 rounded-lg p-3 space-y-1 text-xs">
                      <div className="font-bold flex items-center">
                        <AlertTriangle className="h-3.5 w-3.5 mr-1 text-red-600" />
                        Collection Verification Failed! ({cleanupScore}% cleanup)
                      </div>
                      <p className="text-[10px] text-red-700">AI detected remaining waste at the reported location. Please upload a new after-cleanup photo.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Completed view citizen alerts */}
              {selectedTask.status === 'completed' && selectedTask.citizenNotified && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-xs text-green-950 font-medium">
                  <div className="font-bold text-green-800">✉️ Citizen Notified:</div>
                  <p className="mt-1">"Waste Collected: Your reported waste at {selectedTask.location} has been successfully collected."</p>
                  <div className="text-[10px] text-green-600 mt-2 font-mono">Time: {selectedTask.completedAt || new Date().toISOString().split('T')[0]}</div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

function PriorityBadge({ priority }: { priority: CollectionTask['priority'] }) {
  const configs = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize border ${configs[priority]}`}>
      {priority}
    </span>
  )
}

function StatusBadge({ status }: { status: CollectionTask['status'] }) {
  const configs: Record<string, { color: string; text: string }> = {
    pending: { color: 'bg-amber-100 text-amber-800 border-amber-200', text: 'Pending' },
    assigned: { color: 'bg-blue-100 text-blue-800 border-blue-200', text: 'Assigned' },
    en_route: { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', text: 'En Route' },
    arrived: { color: 'bg-cyan-100 text-cyan-800 border-cyan-200', text: 'Arrived' },
    collecting: { color: 'bg-purple-100 text-purple-800 border-purple-200', text: 'Collecting' },
    in_progress: { color: 'bg-blue-100 text-blue-800 border-blue-200', text: 'In Progress' },
    completed: { color: 'bg-green-100 text-green-800 border-green-200', text: 'Completed' },
    unable_to_collect: { color: 'bg-gray-100 text-gray-800 border-gray-200', text: 'Unable to Collect' }
  }

  const badge = configs[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', text: status }

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.color}`}>
      {badge.text}
    </span>
  )
}