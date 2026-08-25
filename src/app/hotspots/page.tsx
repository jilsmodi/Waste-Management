'use client'

import { useState } from 'react'
import { GoogleMap, useJsApiLoader, OverlayViewF, InfoWindowF } from '@react-google-maps/api'
import { Flame, MapPin, AlertTriangle, TrendingUp, TrendingDown, Minus, Info, Loader } from 'lucide-react'

// Mock Data for Gandhinagar sectors
const hotspotData = [
  { id: 1, name: "Sector 21", lat: 23.2382, lng: 72.6510, risk: "High", probability: 85, trend: "increasing", activeReports: 12 },
  { id: 2, name: "InfoCity", lat: 23.1882, lng: 72.6280, risk: "High", probability: 78, trend: "increasing", activeReports: 9 },
  { id: 3, name: "Sector 11", lat: 23.2200, lng: 72.6550, risk: "Medium", probability: 55, trend: "stable", activeReports: 4 },
  { id: 4, name: "Sector 16", lat: 23.2300, lng: 72.6400, risk: "Medium", probability: 40, trend: "decreasing", activeReports: 2 },
  { id: 5, name: "Sector 2", lat: 23.2000, lng: 72.6600, risk: "Low", probability: 15, trend: "stable", activeReports: 0 },
]

export default function HotspotPredictionPage() {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCqnEpKQc4Ze4wSw0EvKyfDL-khebm07yQ';
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey
  });

  const [center, setCenter] = useState({ lat: 23.2156, lng: 72.6369 });
  const [zoom, setZoom] = useState(12.5);
  const [selectedHotspot, setSelectedHotspot] = useState<typeof hotspotData[0] | null>(null);

  const getMarkerColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'text-red-500';
      case 'Medium': return 'text-amber-500';
      default: return 'text-green-500';
    }
  }

  const getMarkerBg = (risk: string) => {
    switch (risk) {
      case 'High': return 'bg-red-100';
      case 'Medium': return 'bg-amber-100';
      default: return 'bg-green-100';
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  }

  if (!googleMapsApiKey) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-amber-900 text-lg">Google Maps API Key Required</h3>
            <p className="text-amber-800 mt-1">Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file to view the hotspot predictions map.</p>
          </div>
        </div>
      </div>
    );
  }

  const containerStyle = {
    width: '100%',
    height: '100%',
    minHeight: '500px'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Flame className="w-8 h-8 text-orange-500" />
            AI Hotspot Predictions
          </h1>
          <p className="text-gray-500 mt-2">Predictive analytics identifying future waste accumulation zones in Gandhinagar.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[500px]">
        {/* Map Section */}
        <div className="flex-1 rounded-2xl overflow-hidden shadow-sm border border-gray-200 relative bg-gray-50">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={center}
              zoom={zoom}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
              }}
            >
              {hotspotData.map((hotspot) => (
                <OverlayViewF
                  key={hotspot.id}
                  position={{ lat: hotspot.lat, lng: hotspot.lng }}
                  mapPaneName="overlayMouseTarget"
                >
                  <div 
                    className={`p-2 rounded-full shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform ${getMarkerBg(hotspot.risk)} border-2 border-white`}
                    onClick={() => setSelectedHotspot(hotspot)}
                  >
                    <Flame className={`w-6 h-6 ${getMarkerColor(hotspot.risk)}`} />
                  </div>
                </OverlayViewF>
              ))}

              {selectedHotspot && (
                <InfoWindowF
                  position={{ lat: selectedHotspot.lat, lng: selectedHotspot.lng }}
                  onCloseClick={() => setSelectedHotspot(null)}
                >
                  <div className="p-2 min-w-[200px] text-gray-900">
                    <h3 className="font-bold text-lg mb-1">{selectedHotspot.name}</h3>
                    <div className="space-y-2 text-sm mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Risk Level</span>
                        <span className={`font-semibold px-2 py-0.5 rounded-full ${getMarkerBg(selectedHotspot.risk)} ${getMarkerColor(selectedHotspot.risk)}`}>
                          {selectedHotspot.risk}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Probability</span>
                        <span className="font-medium text-gray-900">{selectedHotspot.probability}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Active Reports</span>
                        <span className="font-medium text-gray-900">{selectedHotspot.activeReports}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Trend</span>
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          {selectedHotspot.trend} {getTrendIcon(selectedHotspot.trend)}
                        </span>
                      </div>
                    </div>
                  </div>
                </InfoWindowF>
              )}
            </GoogleMap>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-50 text-gray-500">
              <Loader className="animate-spin h-6 w-6 mr-2" />
              Loading Map...
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="lg:w-96 flex flex-col gap-4 overflow-y-auto pr-2">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              How it works
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Our AI analyzes historical reporting patterns, population density, and municipal collection schedules to predict where waste is most likely to accumulate before it becomes a severe problem.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 px-1">High Risk Zones</h3>
            {hotspotData.filter(h => h.risk === 'High').map(hotspot => (
              <div 
                key={hotspot.id} 
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-red-200 cursor-pointer transition-colors"
                onClick={() => {
                  setCenter({ lat: hotspot.lat, lng: hotspot.lng });
                  setZoom(14);
                  setSelectedHotspot(hotspot);
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    {hotspot.name}
                  </h4>
                  <span className="text-xs font-bold bg-red-50 text-red-600 px-2 py-1 rounded-md">
                    {hotspot.probability}% Risk
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mt-3">
                  <span>{hotspot.activeReports} pending issues</span>
                  <span className="flex items-center gap-1">
                    {hotspot.trend} {getTrendIcon(hotspot.trend)}
                  </span>
                </div>
              </div>
            ))}

            <h3 className="font-semibold text-gray-900 px-1 mt-6">Watchlist</h3>
            {hotspotData.filter(h => h.risk === 'Medium').map(hotspot => (
              <div 
                key={hotspot.id} 
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-amber-200 cursor-pointer transition-colors"
                onClick={() => {
                  setCenter({ lat: hotspot.lat, lng: hotspot.lng });
                  setZoom(14);
                  setSelectedHotspot(hotspot);
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    {hotspot.name}
                  </h4>
                  <span className="text-xs font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded-md">
                    {hotspot.probability}% Risk
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mt-3">
                  <span>{hotspot.activeReports} pending issues</span>
                  <span className="flex items-center gap-1">
                    {hotspot.trend} {getTrendIcon(hotspot.trend)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
