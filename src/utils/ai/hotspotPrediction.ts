import { GoogleGenerativeAI } from "@google/generative-ai";
import { getRecentReports, createHotspotPrediction } from '@/utils/db/actions';

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

interface HotspotPrediction {
  location: string;
  latitude: string;
  longitude: string;
  probability: number;
  expectedIncrease: number;
  recommendedVehicles: number;
  predictedDate: string;
  factors: string[];
  reasoning: string;
}

/**
 * Analyze historical report data using Gemini AI to predict future waste hotspots.
 * Returns predictions for the next 24-72 hours.
 */
export async function generateHotspotPredictions(): Promise<HotspotPrediction[]> {
  try {
    const reports = await getRecentReports(100);

    if (reports.length === 0) {
      return getDefaultPredictions();
    }

    // Aggregate report data by location
    const locationData: Record<string, {
      count: number;
      wasteTypes: string[];
      totalReports: number;
      latitudes: string[];
      longitudes: string[];
      dates: string[];
      severities: string[];
    }> = {};

    reports.forEach(report => {
      const loc = report.location;
      if (!locationData[loc]) {
        locationData[loc] = {
          count: 0,
          wasteTypes: [],
          totalReports: 0,
          latitudes: [],
          longitudes: [],
          dates: [],
          severities: [],
        };
      }
      locationData[loc].count++;
      locationData[loc].wasteTypes.push(report.wasteType);
      locationData[loc].totalReports++;
      if (report.latitude) locationData[loc].latitudes.push(report.latitude);
      if (report.longitude) locationData[loc].longitudes.push(report.longitude);
      locationData[loc].dates.push(report.createdAt.toISOString());
      if (report.severity) locationData[loc].severities.push(report.severity);
    });

    const genAI = new GoogleGenerativeAI(geminiApiKey!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const currentDate = new Date().toISOString();
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const prompt = `You are an expert waste management analyst. Based on the following historical waste report data from various locations, predict which areas are likely to become waste hotspots in the next 24-72 hours.

Current Date: ${currentDate}
Day of Week: ${dayOfWeek}

Historical Report Data by Location:
${JSON.stringify(locationData, null, 2)}

Consider these factors:
- Report frequency patterns (locations with repeated reports)
- Day of week patterns (weekends vs weekdays)
- Waste types and severity trends
- Areas with high report counts
- Market/commercial areas tend to generate more waste on weekends
- Residential areas generate more waste mid-week

Generate 3-5 hotspot predictions. Respond ONLY in this JSON format (no markdown):
[
  {
    "location": "Area name and description",
    "latitude": "lat or empty string if unknown",
    "longitude": "lng or empty string if unknown",
    "probability": 85,
    "expectedIncrease": 37,
    "recommendedVehicles": 2,
    "predictedDate": "YYYY-MM-DD",
    "factors": ["weekend", "market_area", "historical_high"],
    "reasoning": "Brief explanation"
  }
]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const predictions = JSON.parse(cleanedText) as HotspotPrediction[];

    // Save predictions to database
    for (const pred of predictions) {
      const predictedDate = new Date(pred.predictedDate);
      if (isNaN(predictedDate.getTime())) continue;

      await createHotspotPrediction(
        pred.location,
        pred.latitude || null,
        pred.longitude || null,
        predictedDate,
        pred.probability,
        pred.expectedIncrease,
        pred.recommendedVehicles,
        { factors: pred.factors, reasoning: pred.reasoning }
      );
    }

    return predictions;
  } catch (error) {
    console.error("Error generating hotspot predictions:", error);
    return getDefaultPredictions();
  }
}

/**
 * Default predictions when no historical data is available (for demo)
 */
function getDefaultPredictions(): HotspotPrediction[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);

  return [
    {
      location: "South Transit & Markets (Sec 20-22)",
      latitude: "23.2384",
      longitude: "72.6425",
      probability: 99,
      expectedIncrease: 45,
      recommendedVehicles: 3,
      predictedDate: tomorrow.toISOString().split('T')[0],
      factors: ["transit_hub", "market_area", "weekend_pattern"],
      reasoning: "High commercial activity and transit area with consistent waste generation patterns"
    },
    {
      location: "Central Govt Offices (Sachivalaya)",
      latitude: "23.2198",
      longitude: "72.6610",
      probability: 74,
      expectedIncrease: 28,
      recommendedVehicles: 2,
      predictedDate: tomorrow.toISOString().split('T')[0],
      factors: ["government_offices", "mid_week_pattern"],
      reasoning: "Dense office area with regular waste accumulation cycles"
    },
    {
      location: "East Infocity & GIDC (Sec 24-26)",
      latitude: "23.1901",
      longitude: "72.6288",
      probability: 50,
      expectedIncrease: 20,
      recommendedVehicles: 1,
      predictedDate: dayAfter.toISOString().split('T')[0],
      factors: ["industrial_output", "weekday_pattern"],
      reasoning: "Industrial and IT area with predictable waste output during working days"
    }
  ];
}
