'use client'
import { useState, useEffect } from 'react'
import { Truck, Map as MapIcon, Users, Activity, Loader, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api'

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.75rem'
}

const center = {
  lat: 23.2156, // Gandhinagar
  lng: 72.6369
}

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
    { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] }
  ]
}

const mockVehicles = [
  { id: 'GJ-01-AB-1234', driver: 'Rahul', status: 'COLLECTING', load: 76, capacity: 5, eta: '12 min', lat: 23.2200, lng: 72.6400, speed: 32 },
  { id: 'GJ-01-CD-4567', driver: 'Amit', status: 'AVAILABLE', load: 12, capacity: 5, eta: '-', lat: 23.2350, lng: 72.6300, speed: 0 },
  { id: 'GJ-01-EF-7890', driver: 'Raj', status: 'FULL', load: 94, capacity: 5, eta: '8 min', lat: 23.2100, lng: 72.6500, speed: 40 },
  { id: 'GJ-18-XY-9999', driver: 'Vikram', status: 'ON_ROUTE', load: 45, capacity: 5, eta: '5 min', lat: 23.2450, lng: 72.6600, speed: 25 },
]

export default function AdminVehicleMonitoring() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCqnEpKQc4Ze4wSw0EvKyfDL-khebm07yQ'
  })

  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [vehicles, setVehicles] = useState(mockVehicles)

  // Simulate vehicle movement
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(prev => prev.map(v => {
        if (v.status === 'AVAILABLE' || v.status === 'OFFLINE') return v;
        const latChange = (Math.random() - 0.5) * 0.001;
        const lngChange = (Math.random() - 0.5) * 0.001;
        return { ...v, lat: v.lat + latChange, lng: v.lng + lngChange };
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'COLLECTING': return 'text-indigo-600 bg-indigo-100'
      case 'AVAILABLE': return 'text-green-600 bg-green-100'
      case 'FULL': return 'text-red-600 bg-red-100'
      case 'ON_ROUTE': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Activity className="mr-3 h-8 w-8 text-green-600" />
            Live Fleet Monitoring
          </h1>
          <p className="text-gray-500 mt-1">Real-time GPS tracking and capacity management</p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-gray-900">{vehicles.length}</span>
            <span className="text-xs text-gray-500 font-semibold uppercase">Active Vehicles</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
        {/* Left Panel: Table */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-gray-100 font-bold text-gray-800 flex justify-between items-center">
            Fleet Overview
          </div>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Load</th>
                  <th className="px-4 py-3">ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.map(v => (
                  <tr 
                    key={v.id} 
                    onClick={() => setSelectedVehicle(v)}
                    className={`cursor-pointer hover:bg-green-50 transition-colors ${selectedVehicle?.id === v.id ? 'bg-green-50/50' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <div className="font-bold text-gray-900">{v.id}</div>
                      <div className="text-xs text-gray-500">{v.driver}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${getStatusColor(v.status)}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 w-12">
                          <div className={`h-1.5 rounded-full ${v.load > 90 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${v.load}%` }}></div>
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{v.load}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-700 font-semibold text-xs">
                      {v.eta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel: Map */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 relative flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-gray-800 flex items-center">
              <MapIcon className="mr-2 h-5 w-5 text-green-600" />
              Live GPS Tracking
            </span>
          </div>
          <div className="flex-1 rounded-xl overflow-hidden border border-gray-200">
            {!isLoaded ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <Loader className="animate-spin h-8 w-8 text-green-600" />
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={selectedVehicle ? { lat: selectedVehicle.lat, lng: selectedVehicle.lng } : center}
                zoom={14}
                options={mapOptions}
              >
                {vehicles.map(v => (
                  <MarkerF
                    key={v.id}
                    position={{ lat: v.lat, lng: v.lng }}
                    onClick={() => setSelectedVehicle(v)}
                    icon={{
                      url: 'https://maps.google.com/mapfiles/ms/icons/truck.png',
                      scaledSize: new window.google.maps.Size(32, 32)
                    }}
                  />
                ))}

                {selectedVehicle && (
                  <InfoWindowF
                    position={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }}
                    onCloseClick={() => setSelectedVehicle(null)}
                  >
                    <div className="p-1 min-w-[200px]">
                      <h3 className="font-bold text-gray-900 mb-1">{selectedVehicle.id}</h3>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p><strong>Driver:</strong> {selectedVehicle.driver}</p>
                        <p><strong>Status:</strong> <span className={getStatusColor(selectedVehicle.status) + ' px-1 rounded'}>{selectedVehicle.status}</span></p>
                        <p><strong>Speed:</strong> {selectedVehicle.speed} km/h</p>
                        <p><strong>Load:</strong> {((selectedVehicle.load / 100) * selectedVehicle.capacity).toFixed(1)} / {selectedVehicle.capacity} Ton</p>
                        <p><strong>ETA:</strong> {selectedVehicle.eta}</p>
                      </div>
                    </div>
                  </InfoWindowF>
                )}
              </GoogleMap>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
