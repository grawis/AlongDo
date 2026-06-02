import { GOOGLE_MAPS_API_KEY } from './config';

const GOOGLE_MAPS_API_BASE = 'https://maps.googleapis.com/maps/api';
const GOOGLE_PLACES_API_BASE = 'https://places.googleapis.com/v1';

const requireApiKey = () => {
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.trim() === '') {
    throw new Error('尚未設定 Google Maps API 金鑰。');
  }
};

const encodeQuery = (params) => new URLSearchParams(params).toString();

const fetchGoogleMapsLegacy = async (endpoint, params) => {
  requireApiKey();

  const url = `${GOOGLE_MAPS_API_BASE}/${endpoint}/json?${encodeQuery({
    language: 'zh-TW',
    region: 'tw',
    ...params,
    key: GOOGLE_MAPS_API_KEY,
  })}`;

  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Maps API 請求失敗：${response.status} ${text}`);
  }

  return response.json();
};

const fetchPlacesNew = async (endpoint, body, fieldMask) => {
  requireApiKey();

  const response = await fetch(`${GOOGLE_PLACES_API_BASE}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error?.message || data?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
};

const normalizePlace = (place) => ({
  placeId: place.id || place.name?.replace('places/', '') || '',
  name: place.displayName?.text || '',
  address: place.formattedAddress || '',
  coordinates: place.location
    ? {
        latitude: place.location.latitude,
        longitude: place.location.longitude,
      }
    : null,
});

export async function geocodeAddress(address) {
  const data = await fetchGoogleMapsLegacy('geocode', { address });

  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    throw new Error(`地址轉座標失敗：${data.status}${data.error_message ? `，${data.error_message}` : ''}`);
  }

  return data.results[0].geometry.location;
}

export async function searchPlaceCandidates(query) {
  const data = await fetchPlacesNew(
    'places:searchText',
    {
      textQuery: query,
      pageSize: 5,
      languageCode: 'zh-TW',
      regionCode: 'TW',
    },
    'places.id,places.displayName,places.formattedAddress,places.location'
  );

  return (data.places || []).map(normalizePlace);
}

export async function searchNearbyPlaces(coords, options = {}) {
  const { keyword = '', pageSize = 5, radius = 1500 } = options;

  const data = await fetchPlacesNew(
    'places:searchText',
    {
      textQuery: keyword || '附近地點',
      pageSize,
      languageCode: 'zh-TW',
      regionCode: 'TW',
      locationBias: {
        circle: {
          center: {
            latitude: coords.latitude,
            longitude: coords.longitude,
          },
          radius,
        },
      },
    },
    'places.id,places.displayName,places.formattedAddress,places.location'
  );

  return (data.places || []).map(normalizePlace);
}

export async function getDirections(originCoords, destinationCoords, waypointCoords = []) {
  const params = {
    origin: `${originCoords.latitude},${originCoords.longitude}`,
    destination: `${destinationCoords.latitude},${destinationCoords.longitude}`,
    mode: 'walking',
  };

  if (waypointCoords.length) {
    params.waypoints = waypointCoords
      .map((coords) => `${coords.latitude},${coords.longitude}`)
      .join('|');
  }

  const data = await fetchGoogleMapsLegacy('directions', params);

  if (data.status !== 'OK') {
    throw new Error(`路線規劃失敗：${data.status}${data.error_message ? `，${data.error_message}` : ''}`);
  }

  return data.routes[0];
}
