'use client'
import { useState } from 'react'
import { MapPin, Navigation, CheckCircle, AlertTriangle, PhoneCall, Route, Clock, Weight, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

export default function DriverDashboard() {
  const [vehicleLoad, setVehicleLoad] = useState(4.3) // Current 4.3 tons
  const vehicleCapacity = 5.0
  const [pointsRemaining, setPointsRemaining] = useState(14)
  const [currentPoint, setCurrentPoint] = useState({
    id: 'CP-892',
    location: 'Sector 21, Shopping Center',
    distance: '850 m',
    eta: '3 min',
    priority: 'HIGH',
    type: 'Bin Overflow'
  })

  const handleMarkCollected = () => {
    const newLoad = vehicleLoad + 0.2;
    setVehicleLoad(newLoad);
    setPointsRemaining(prev => Math.max(0, prev - 1));
    toast.success("Collection point marked as completed!");

    if (newLoad >= vehicleCapacity * 0.9) {
      toast.error("⚠️ VEHICLE NEAR CAPACITY. Recommend visiting nearest disposal facility.", { duration: 5000 });
    }

    // Simulate moving to next point
    setCurrentPoint({
      id: 'CP-893',
      location: 'Sector 11, Vegetable Market',
      distance: '1.2 km',
      eta: '5 min',
      priority: 'MEDIUM',
      type: 'Routine Collection'
    })
  }

  return (
    <div className="bg-gray-100 min-h-screen pb-20">
      {/* Top Navigation Bar */}
      <div className="bg-indigo-600 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <div>
          <div className="text-xs font-bold text-indigo-200">Vehicle</div>
          <div className="text-lg font-extrabold tracking-wider">GJ-01-AB-1234</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-indigo-200">Driver</div>
          <div className="text-lg font-bold">Rahul</div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto mt-4">
        
        {/* Load Capacity Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-800 flex items-center">
              <Weight className="mr-2 h-5 w-5 text-gray-500" />
              Vehicle Capacity
            </h3>
            <span className={`text-sm font-bold ${vehicleLoad / vehicleCapacity > 0.85 ? 'text-red-600' : 'text-green-600'}`}>
              {Math.round((vehicleLoad / vehicleCapacity) * 100)}% Full
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
            <div 
              className={`h-3 rounded-full ${vehicleLoad / vehicleCapacity > 0.85 ? 'bg-red-500' : 'bg-green-500'}`} 
              style={{ width: `${Math.min((vehicleLoad / vehicleCapacity) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Current: <span className="text-gray-800 font-bold">{vehicleLoad.toFixed(1)} Ton</span> / {vehicleCapacity} Ton
          </div>
        </div>

        {/* Current Route Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl">
            {currentPoint.priority} PRIORITY
          </div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Next Collection Point</h2>
          
          <div className="flex items-start mb-4">
            <MapPin className="h-6 w-6 text-indigo-600 mr-3 mt-1" />
            <div>
              <div className="font-extrabold text-xl text-gray-900">{currentPoint.location}</div>
              <div className="text-sm text-gray-500 font-medium mt-1">{currentPoint.type}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center justify-center border border-gray-100">
              <Route className="h-5 w-5 text-gray-400 mb-1" />
              <div className="text-lg font-bold text-gray-800">{currentPoint.distance}</div>
              <div className="text-[10px] text-gray-500 font-bold uppercase">Distance</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center justify-center border border-gray-100">
              <Clock className="h-5 w-5 text-gray-400 mb-1" />
              <div className="text-lg font-bold text-indigo-600">{currentPoint.eta}</div>
              <div className="text-[10px] text-gray-500 font-bold uppercase">ETA</div>
            </div>
          </div>

          <div className="space-y-3">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 text-lg font-bold shadow-lg shadow-indigo-200">
              <Navigation className="mr-2 h-6 w-6" />
              START NAVIGATION
            </Button>
            <Button 
              onClick={handleMarkCollected}
              className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-6 text-lg font-bold shadow-lg shadow-green-200"
            >
              <CheckCircle className="mr-2 h-6 w-6" />
              MARK COLLECTED
            </Button>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="bg-white rounded-xl py-8 flex flex-col items-center justify-center border-gray-200 text-gray-700 hover:bg-gray-50">
            <AlertTriangle className="h-6 w-6 mb-2 text-amber-500" />
            <span className="text-xs font-bold">REPORT ISSUE</span>
          </Button>
          <Button variant="outline" className="bg-white rounded-xl py-8 flex flex-col items-center justify-center border-gray-200 text-gray-700 hover:bg-gray-50">
            <Route className="h-6 w-6 mb-2 text-blue-500" />
            <span className="text-xs font-bold">VIEW ROUTE ({pointsRemaining})</span>
          </Button>
        </div>

        <Button variant="destructive" className="w-full rounded-xl py-6 mt-4 font-bold bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 border-none shadow-none">
          <PhoneCall className="mr-2 h-5 w-5" />
          EMERGENCY
        </Button>

      </div>
    </div>
  )
}
