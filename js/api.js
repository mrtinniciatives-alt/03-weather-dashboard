export async function fetchJson(url, signal) {
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Weather service request failed (${response.status} ${response.statusText}).`);
    }
    return await response.json();
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    if (error instanceof Error && error.message.includes('Weather service request failed')) throw error;
    throw new Error('Could not connect to the weather service. Check your internet connection.');
  }
}

export async function searchCity(name, signal) {
  const query = encodeURIComponent(name.trim());
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5`;
  const data = await fetchJson(url, signal);
  return (data.results || []).map((result) => ({
    name: result.name,
    country: result.country || 'Unknown country',
    region: result.admin1 || '',
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone
  }));
}

export async function getForecast(lat, lon, signal) {
  const latitude = encodeURIComponent(String(lat));
  const longitude = encodeURIComponent(String(lon));
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
  return fetchJson(url, signal);
}
