'use client'
import { useState, useEffect } from 'react'
import { MapIcon, Route as RouteIcon, Truck, Play, AlertCircle, Info, CheckCircle, Zap, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GoogleMap, useJsApiLoader, MarkerF, PolylineF, InfoWindowF } from '@react-google-maps/api'
import { toast } from 'react-hot-toast'

const mapContainerStyle = { width: '100%', height: '100%', borderRadius: '0.75rem' }
const center = { lat: 23.2156, lng: 72.6369 }

const mapOptions = {
  disableDefaultUI: true, zoomControl: true,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
  ]
}

// Simulated data
const collectionPoints = [
  { id: 1, lat: 23.2160, lng: 72.6370, type: 'bin', fill: 87, priority: 'HIGH' },
  { id: 2, lat: 23.2200, lng: 72.6400, type: 'complaint', fill: 100, priority: 'CRITICAL' },
  { id: 3, lat: 23.2100, lng: 72.6300, type: 'bin', fill: 65, priority: 'MEDIUM' },
  { id: 4, lat: 23.2300, lng: 72.6450, type: 'bin', fill: 30, priority: 'LOW' },
]

const initialRoutePath = [
  { lat: 23.2100, lng: 72.6300 }, // Start (Point 3)
  { lat: 23.2160, lng: 72.6370 }, // Point 1
  { lat: 23.2200, lng: 72.6400 }, // Point 2
  { lat: 23.2300, lng: 72.6450 }, // Point 4
]

const recalculatedRoutePath = [
  { lat: 23.2100, lng: 72.6300 }, // Start
  { lat: 23.2160, lng: 72.6370 }, // Point 1
  { lat: 23.2180, lng: 72.6420 }, // NEW CRITICAL COMPLAINT!
  { lat: 23.2200, lng: 72.6400 }, // Point 2
  { lat: 23.2300, lng: 72.6450 }, // Point 4
]

export default function SmartRouteOptimizer() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCqnEpKQc4Ze4wSw0EvKyfDL-khebm07yQ'
  })

  const [points, setPoints] = useState(collectionPoints)
  const [routePath, setRoutePath] = useState(initialRoutePath)
  const [isDemoActive, setIsDemoActive] = useState(false)
  const [vehiclePos, setVehiclePos] = useState({ lat: 23.2100, lng: 72.6300 })
  const [routeStats, setRouteStats] = useState({ dist: 18.4, time: 42, fuel: 2.1 })
  const [demoStep, setDemoStep] = useState(0)

  // SIH DEMO SIMULATION
  useEffect(() => {
    if (!isDemoActive) return;

    let timer: NodeJS.Timeout;
    
    if (demoStep === 0) {
      toast.success("Demo Started: Vehicle dispatching...", { icon: '🚛' });
      timer = setTimeout(() => setDemoStep(1), 2000);
    } else if (demoStep === 1) {
      // Move vehicle along path
      setVehiclePos({ lat: 23.2130, lng: 72.6335 });
      timer = setTimeout(() => setDemoStep(2), 2000);
    } else if (demoStep === 2) {
      // Arrive at Point 1
      setVehiclePos({ lat: 23.2160, lng: 72.6370 });
      timer = setTimeout(() => setDemoStep(3), 2000);
    } else if (demoStep === 3) {
      // Critical Complaint Injection
      toast.error("⚠️ CRITICAL COMPLAINT DETECTED 1.5 km away!", { duration: 5000 });
      setPoints([...points, { id: 5, lat: 23.2180, lng: 72.6420, type: 'complaint', fill: 100, priority: 'CRITICAL' }]);
      timer = setTimeout(() => setDemoStep(4), 3000);
    } else if (demoStep === 4) {
      toast.success("Recalculating optimized route...");
      setRoutePath(recalculatedRoutePath);
      setRouteStats({ dist: 19.1, time: 45, fuel: 2.2 });
      timer = setTimeout(() => setDemoStep(5), 2000);
    } else if (demoStep === 5) {
      setVehiclePos({ lat: 23.2180, lng: 72.6420 }); // Move to new critical complaint
      toast.success("Route Updated. Driver notified.", { icon: '✅' });
      setTimeout(() => setIsDemoActive(false), 4000);
    }

    return () => clearTimeout(timer);
  }, [isDemoActive, demoStep]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <RouteIcon className="mr-3 h-8 w-8 text-indigo-600" />
            Smart Route Optimizer
          </h1>
          <p className="text-gray-500 mt-1">AI-driven dynamic routing for waste collection fleet</p>
        </div>
        <Button 
          onClick={() => {
            setIsDemoActive(true);
            setDemoStep(0);
            setPoints(collectionPoints);
            setRoutePath(initialRoutePath);
            setVehiclePos({ lat: 23.2100, lng: 72.6300 });
            setRouteStats({ dist: 18.4, time: 42, fuel: 2.1 });
          }}
          disabled={isDemoActive}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2.5 flex items-center font-bold shadow-lg shadow-indigo-200 transition-all duration-200"
        >
          {isDemoActive ? <Loader className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
          SIH DEMO SIMULATION
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
        
        {/* Left Panel */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col overflow-y-auto">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center">
            <Truck className="mr-2 h-5 w-5 text-gray-500" />
            Active Vehicle
          </h3>
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-6">
            <div className="font-bold text-indigo-900 text-lg">GJ-01-AB-1234</div>
            <div className="text-sm text-indigo-700 font-medium">Capacity: 5 Ton</div>
            <div className="mt-2 w-full bg-indigo-200 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <div className="text-xs text-indigo-600 mt-1">Current Load: 45%</div>
          </div>

          <h3 className="font-bold text-gray-900 mb-3 flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
            Collection Priorities
          </h3>
          <div className="space-y-3 flex-1">
            {points.map(p => (
              <div key={p.id} className="p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-gray-800 text-sm">
                    {p.type === 'bin' ? 'Garbage Bin' : 'Citizen Complaint'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    p.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                    p.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    p.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {p.priority}
                  </span>
                </div>
                <div className="text-xs text-gray-500">Fill Level: {p.fill}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Map */}
        <div className="lg:col-span-6 bg-gray-900 rounded-2xl border border-gray-800 shadow-xl p-2 relative">
          {!isLoaded ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader className="animate-spin h-8 w-8 text-indigo-500" />
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={13}
              options={mapOptions}
            >
              {/* Route Path */}
              <PolylineF 
                path={routePath} 
                options={{ strokeColor: '#6366f1', strokeOpacity: 0.8, strokeWeight: 5 }} 
              />

              {/* Points */}
              {points.map(p => (
                <MarkerF
                  key={p.id}
                  position={{ lat: p.lat, lng: p.lng }}
                  icon={{
                    url: p.type === 'complaint' 
                      ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' 
                      : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                  }}
                />
              ))}

              {/* Moving Vehicle */}
              <MarkerF
                position={vehiclePos}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/truck.png',
                  scaledSize: new window.google.maps.Size(40, 40)
                }}
                zIndex={100}
              />
            </GoogleMap>
          )}
        </div>

        {/* Right Panel: Analytics & Savings */}
        <div className="lg:col-span-3 space-y-6 flex flex-col">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <Zap className="mr-2 h-5 w-5 text-amber-500" />
              Optimization Results
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-gray-100 pb-3">
                <div className="text-sm text-gray-500 font-medium">Distance</div>
                <div className="text-xl font-bold text-gray-900">{routeStats.dist} km</div>
              </div>
              <div className="flex justify-between items-end border-b border-gray-100 pb-3">
                <div className="text-sm text-gray-500 font-medium">Est. Time</div>
                <div className="text-xl font-bold text-gray-900">{routeStats.time} min</div>
              </div>
              <div className="flex justify-between items-end pb-1">
                <div className="text-sm text-gray-500 font-medium">Est. Fuel</div>
                <div className="text-xl font-bold text-gray-900">{routeStats.fuel} L</div>
              </div>
            </div>
          </div>

          {/* Before vs After Comparison */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl shadow-lg p-6 text-white flex-1 flex flex-col justify-center">
            <h3 className="font-bold text-lg mb-6 text-center">Before vs After Comparison</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black/20 rounded-xl p-3 text-center">
                <div className="text-[10px] text-green-100 font-bold uppercase mb-1">Existing Route</div>
                <div className="text-lg font-bold">27.8 km</div>
                <div className="text-sm opacity-80">65 min</div>
              </div>
              <div className="bg-white/20 rounded-xl p-3 text-center border border-white/40">
                <div className="text-[10px] text-green-50 font-bold uppercase mb-1">Optimized</div>
                <div className="text-lg font-bold">{routeStats.dist} km</div>
                <div className="text-sm opacity-90">{routeStats.time} min</div>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-xs font-bold uppercase text-green-100 mb-2">Total Savings</div>
              <div className="flex justify-between items-center text-sm font-semibold mb-1">
                <span>Distance:</span> <span className="text-green-200">33.8%</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold mb-1">
                <span>Time:</span> <span className="text-green-200">35.4%</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold">
                <span>Fuel:</span> <span className="text-green-200">50%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
