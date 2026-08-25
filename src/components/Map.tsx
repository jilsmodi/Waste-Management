// @ts-nocheck
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Leaf } from 'lucide-react'

// Custom leaf icon
const leafIcon = new L.Icon({
  iconUrl: '/leaflet/leaf-green.png',
  shadowUrl: '/leaflet/leaf-shadow.png',
  iconSize: [38, 95],
  shadowSize: [50, 64],
  iconAnchor: [22, 94],
  shadowAnchor: [4, 62],
  popupAnchor: [-3, -76]
})

type HotspotPrediction = {
  id?: number;
  location: string;
  latitude?: string;
  longitude?: string;
  probability: number;
}

export default function Map({ predictions }: { predictions: HotspotPrediction[] }) {
  return (
    <div className="h-full w-full min-h-[400px] rounded-lg overflow-hidden border border-gray-200">
      <MapContainer center={[23.2156, 72.6369]} zoom={13} style={{ height: '100%', width: '100%', minHeight: '400px' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {predictions && predictions.map((point, index) => {
          if (!point.latitude || !point.longitude) return null;
          return (
            <Marker key={index} position={[parseFloat(point.latitude), parseFloat(point.longitude)]} icon={leafIcon}>
              <Popup>
                <div className="p-1">
                  <div className="font-bold mb-1">{point.location}</div>
                  <div className="text-red-600 font-semibold">{point.probability}% Risk</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  )
}