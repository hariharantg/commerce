import { NextRequest } from 'next/server';

const PLACE_ID = 'ChIJw7QwQw2rADsR8Qn6e7iQn1A';
const API_KEY = process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyBsTIuaRZOT0cwmRbrSwZ2VMRew0A6adyc';

export async function GET(req: NextRequest) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total&key=${API_KEY}`;
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');
    if (!response.ok || !contentType?.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Failed to fetch from Google Places API', details: await response.text() }), { status: 500 });
    }
    const data = await response.json();
    // Log the full response for debugging
    console.log('Google Places API response:', JSON.stringify(data, null, 2));
    return new Response(JSON.stringify({ reviews: data.result?.reviews || [], raw: data }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
