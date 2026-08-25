'use client'
import { useState, useCallback, useEffect } from 'react'
import { MapPin, Upload, CheckCircle, Loader, AlertTriangle, Camera, Trash2, Map as MapIcon, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createUser, getUserByEmail, createReport, getReportsForArea } from '@/utils/db/actions';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

// Define the shape of our Verification Result
type VerificationResult = {
  wasteType: string;
  quantity: string;
  severity: string;
  priority: string; // low, medium, high, critical
  healthRisk: string;
  confidence: number;
  wasteCategories: Record<string, number>;
  recyclableMaterials: string[];
  recyclableValue: string;
  recommendation: string;
}

function MapboxLocationInput({ 
  onLocationSelect 
}: { 
  onLocationSelect: (location: string, lat: number, lng: number) => void;
}) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCqnEpKQc4Ze4wSw0EvKyfDL-khebm07yQ'
  });

  const [center, setCenter] = useState({ lat: 23.2156, lng: 72.6369 });
  const [zoom, setZoom] = useState(13);
  const [marker, setMarker] = useState<{lat: number, lng: number} | null>(null);
  const [address, setAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCenter({ lat, lng });
          setZoom(15);
          setMarker({ lat, lng });
          fetchAddress(lat, lng);
        },
        (error) => {
          console.error("Error getting location", error);
        }
      );
    }
  }, []);

  const fetchAddress = async (lat: number, lng: number) => {
    if (!googleMapsApiKey) return;
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsApiKey}`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const placeName = data.results[0].formatted_address;
        setAddress(placeName);
        onLocationSelect(placeName, lat, lng);
        return;
      }
    } catch (err) {
      console.error("Error fetching address", err);
    }
    const fallbackAddress = `Selected Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    setAddress(fallbackAddress);
    onLocationSelect(fallbackAddress, lat, lng);
  };

  const handleCurrentLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCenter({ lat, lng });
          setZoom(16);
          setMarker({ lat, lng });
          fetchAddress(lat, lng);
          setIsLocating(false);
        },
        (error) => {
          toast.error("Could not get current location");
          setIsLocating(false);
        }
      );
    } else {
      toast.error("Geolocation not supported");
      setIsLocating(false);
    }
  };

  const containerStyle = {
    width: '100%',
    height: '300px'
  };

  return (
    <div className="space-y-4">
      <div className="relative h-[300px] rounded-xl overflow-hidden shadow-sm border border-gray-200">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={zoom}
            onClick={(e) => {
              if (e.latLng) {
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                setMarker({ lat, lng });
                fetchAddress(lat, lng);
              }
            }}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {marker && (
              <MarkerF position={marker} />
            )}
          </GoogleMap>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-50 text-gray-500">
            <Loader className="animate-spin h-6 w-6 mr-2" />
            Loading Map...
          </div>
        )}
        <div className="absolute top-4 right-4">
          <Button 
            type="button" 
            variant="secondary" 
            size="sm" 
            onClick={handleCurrentLocation}
            disabled={isLocating}
            className="bg-white/90 backdrop-blur shadow-sm hover:bg-white"
          >
            {isLocating ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
            Current Location
          </Button>
        </div>
      </div>
      
      {address && (
        <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm">{address}</p>
        </div>
      )}
    </div>
  );
}

export default function ReportWastePage() {
  const router = useRouter();
  const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle')
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [duplicateInfo, setDuplicateInfo] = useState<{ isDuplicate: boolean; similarReportsCount: number } | null>(null)

  const [newReport, setNewReport] = useState({
    location: '',
    latitude: '',
    longitude: '',
    type: '',
    amount: '',
    description: '',
    landmark: '',
    severity: 'medium', // fallback
    priority: 'medium', // fallback
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewReport({ ...newReport, [name]: value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleVerify = async () => {
    if (!file) return;

    setVerificationStatus('verifying');
    
    if (!geminiApiKey) {
      setTimeout(() => {
        const mockResult: VerificationResult = {
          wasteType: "Mixed Plastic & Paper Waste",
          quantity: "4.8 kg",
          severity: "high",
          priority: "high",
          healthRisk: "medium",
          confidence: 0.92,
          wasteCategories: { "plastic": 50, "paper": 30, "organic": 10, "metal": 10 },
          recyclableMaterials: ["Plastic bottles", "Cardboard box", "Soda cans"],
          recyclableValue: "₹140",
          recommendation: "Separate plastic bottles and paper products for recycling."
        };
        setVerificationResult(mockResult);
        setVerificationStatus('success');
        setNewReport(prev => ({
          ...prev,
          type: mockResult.wasteType,
          amount: mockResult.quantity,
          severity: mockResult.severity,
          priority: mockResult.priority
        }));
        toast.success("AI Verification Successful (Demo Mode)");
      }, 1500);
      return;
    }

    try {
      const base64Data = await readFileAsBase64(file);
      const base64Content = base64Data.split(',')[1];
      
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `You are an expert in waste management, recycling, and environmental health assessment. Analyze this waste image comprehensively and provide:

1. Primary waste type (e.g., plastic, paper, glass, metal, organic, e-waste, mixed, construction debris)
2. Estimated quantity (in kg or liters)
3. Severity level: "low" (small litter), "medium" (moderate pile), "high" (large dumping), "critical" (hazardous/blocking area)
4. Priority level: "low", "medium", "high", "critical"
5. Health risk: "low" (no immediate risk), "medium" (potential contamination), "high" (disease/toxic risk)
6. Waste composition breakdown as percentages (must sum to 100)
7. Recyclable materials detected (list specific items)
8. Estimated recyclable value in Indian Rupees (INR)
9. Recommendation for disposal/recycling routing
10. Confidence level (0-1)

Respond ONLY in this exact JSON format (no markdown, no explanation):
{
  "wasteType": "primary type",
  "quantity": "estimated quantity with unit",
  "severity": "low|medium|high|critical",
  "priority": "low|medium|high|critical",
  "healthRisk": "low|medium|high",
  "confidence": 0.92,
  "wasteCategories": {"plastic": 40, "organic": 30, "paper": 20, "metal": 10},
  "recyclableMaterials": ["plastic bottles", "cardboard"],
  "recyclableValue": "₹150-200",
  "recommendation": "Route to Recycling Facility B. Separate organic waste for composting."
}`;

      const imagePart = {
        inlineData: {
          data: base64Content,
          mimeType: file.type
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      let responseText = response.text() || "";

      // Strip markdown code blocks if the model ignored our instruction
      if (responseText.includes("```json")) {
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      } else if (responseText.includes("```")) {
        responseText = responseText.replace(/```/g, '').trim();
      }

      const parsedResult: VerificationResult = JSON.parse(responseText);
      setVerificationResult(parsedResult);
      setVerificationStatus('success');
      setNewReport(prev => ({
        ...prev,
        type: parsedResult.wasteType,
        amount: parsedResult.quantity,
        severity: parsedResult.severity,
        priority: parsedResult.priority
      }));
      toast.success("AI Verification Complete!");
    } catch (error) {
      console.error('Error verifying waste:', error);
      setVerificationStatus('failure');
      toast.error('AI Verification failed. Please fill details manually.');
    }
  }

  const checkDuplicates = async (lat: string, lng: string) => {
    try {
      const reports = await getReportsForArea(lat, lng, 0.12); // ~120m radius
      // Filter for recent reports (last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentDuplicates = reports.filter((r: any) => new Date(r.createdAt) >= twentyFourHoursAgo);
      
      if (recentDuplicates.length > 0) {
        setDuplicateInfo({
          isDuplicate: true,
          similarReportsCount: recentDuplicates.length
        });
      } else {
        setDuplicateInfo(null);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const handleLocationSelect = (location: string, lat: number, lng: number) => {
    setNewReport(prev => ({
      ...prev,
      location,
      latitude: lat.toString(),
      longitude: lng.toString()
    }));
    checkDuplicates(lat.toString(), lng.toString());
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationStatus !== 'success' && verificationStatus !== 'failure') {
      toast.error('Please verify the waste image first.');
      return;
    }
    
    if (!newReport.location || !newReport.latitude || !newReport.longitude) {
      toast.error('Please select a location on the map.');
      return;
    }

    setIsSubmitting(true);
    try {
      const email = localStorage.getItem('userEmail') || 'jils@example.com';
      const name = email.split('@')[0];
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
      const user = await getUserByEmail(email) || await createUser(email, formattedName);
      
      if (!user) {
        toast.error('Failed to authenticate user. Please try logging in again.');
        setIsSubmitting(false);
        return;
      }
      
      const report = await createReport(
        user.id,
        newReport.location,
        newReport.type,
        newReport.amount,
        undefined, // Omit preview base64 to save DB bandwidth
        verificationResult || undefined,
        newReport.latitude,
        newReport.longitude,
        newReport.severity,
        newReport.priority,
        verificationResult?.healthRisk,
        verificationResult?.confidence,
        verificationResult?.wasteCategories,
        verificationResult?.recyclableMaterials,
        verificationResult?.recyclableValue,
        verificationResult?.recommendation,
        undefined, // incidentId
        newReport.description,
        newReport.landmark
      );

      if (report) {
        setIsSuccessModalOpen(true);
      } else {
        toast.error('Failed to submit report. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">🚨 Report Waste</h1>
        <p className="text-gray-500 mt-2">Help keep Gandhinagar clean by reporting waste hotspots.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        
        {/* Step 1: Upload Photo */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            1. Capture Photo
          </h2>
          
          {!preview ? (
            <div className="mt-2 flex justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-12 hover:bg-gray-50 transition-colors">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
                <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-white font-semibold text-emerald-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-600 focus-within:ring-offset-2 hover:text-emerald-500"
                  >
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden shadow-sm border border-gray-200 max-w-sm">
              <img src={preview} alt="Waste preview" className="w-full h-auto object-cover" />
              <button 
                onClick={() => { setPreview(null); setFile(null); setVerificationStatus('idle'); }} 
                className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-sm hover:bg-red-50 text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {file && verificationStatus === 'idle' && (
            <Button type="button" onClick={handleVerify} className="mt-4 w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle className="w-4 h-4 mr-2" /> Verify Waste with AI
            </Button>
          )}

          {verificationStatus === 'verifying' && (
            <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center gap-3">
              <Loader className="animate-spin text-blue-600 w-5 h-5" />
              <p className="text-blue-800 font-medium">AI is analyzing the waste...</p>
            </div>
          )}

          {verificationStatus === 'success' && verificationResult && (
            <div className="mt-4 p-5 rounded-xl bg-emerald-50 border border-emerald-100 grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Detected Waste Type</p>
                <p className="text-lg font-semibold text-gray-900">{verificationResult.wasteType}</p>
                <p className="text-sm text-gray-600 mt-1">Est. Quantity: {verificationResult.quantity}</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 uppercase font-semibold">Priority:</span>
                  <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase ${
                    verificationResult.priority === 'high' || verificationResult.priority === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {verificationResult.priority}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 uppercase font-semibold">Confidence:</span>
                  <span className="text-sm font-medium text-gray-900">{(verificationResult.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Step 2: Location */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-emerald-600" />
            2. Pin Location
          </h2>
          <MapboxLocationInput onLocationSelect={handleLocationSelect} />
          
          {duplicateInfo?.isDuplicate && (
            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-amber-800 font-semibold">Similar Report Detected</h4>
                <p className="text-sm text-amber-700 mt-1">
                  We found {duplicateInfo.similarReportsCount} similar waste report(s) nearby in the last 24 hours.
                  Submitting this will escalate the priority of the existing report.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Step 3: Details */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-emerald-600" />
            3. Details
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label htmlFor="type" className="block text-sm font-medium leading-6 text-gray-900">Waste Type</label>
              <input
                type="text"
                name="type"
                id="type"
                value={newReport.type}
                onChange={handleInputChange}
                required
                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                placeholder="e.g. Plastic bags and bottles"
              />
            </div>
            
            <div className="space-y-1">
              <label htmlFor="amount" className="block text-sm font-medium leading-6 text-gray-900">Estimated Quantity</label>
              <input
                type="text"
                name="amount"
                id="amount"
                value={newReport.amount}
                onChange={handleInputChange}
                required
                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                placeholder="e.g. 3 large garbage bags"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label htmlFor="landmark" className="block text-sm font-medium leading-6 text-gray-900">Nearby Landmark</label>
              <input
                type="text"
                name="landmark"
                id="landmark"
                value={newReport.landmark}
                onChange={handleInputChange}
                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                placeholder="e.g. Near the main entrance of City Park"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">Additional Description</label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={newReport.description}
                onChange={handleInputChange}
                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                placeholder="Any specific details that would help the collection team?"
              />
            </div>
          </div>
        </section>

        <div className="pt-6 border-t border-gray-100 flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting || verificationStatus !== 'success'}
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-8 py-3 rounded-xl h-auto text-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </div>
      </form>

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted!</h3>
            <p className="text-gray-600 mb-6">
              Thank you for helping keep Gandhinagar clean. Your report has been successfully forwarded to the collection team.
            </p>
            
            <div className="bg-amber-50 rounded-2xl p-4 mb-8 border border-amber-100 flex flex-col items-center justify-center">
              <Gift className="w-8 h-8 text-amber-500 mb-2" />
              <p className="text-amber-800 font-bold text-lg">10 Points Redeemed!</p>
              <p className="text-amber-700 text-sm mt-1">You've earned rewards for your contribution.</p>
            </div>

            <Button 
              onClick={() => router.push('/')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl h-auto text-lg transition-all shadow-md hover:shadow-lg"
            >
              Go to Home
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}