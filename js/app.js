import { searchCity, getForecast } from './api.js';
import { getWeatherCode } from './weatherCodes.js';
import { renderCurrentWeather, renderForecast, renderFavourites, renderLoading, renderReady, setStatus } from './ui.js';

const form = document.querySelector('#search-form');
const input = document.querySelector('#city-input');
const cityMatches = document.querySelector('#city-matches');
const currentWeather = document.querySelector('#current-weather');
const forecast = document.querySelector('#forecast');
const favouriteList = document.querySelector('#favourite-list');
const favouriteCount = document.querySelector('#favourite-count');
const status = document.querySelector('#status');
const unitC = document.querySelector('#unit-c');
const unitF = document.querySelector('#unit-f');
const locationButton = document.querySelector('#use-location');

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

let favourites = readStorage('weather-favourites', [{
  name: 'BIDDA', country: 'Nigeria', latitude: 9.08044, longitude: 6.0099
}]);
let activeCity = 'BIDDA';
let activeController = null;
let latestWeather = null;
let unit = localStorage.getItem('weather-unit') === 'F' ? 'F' : 'C';

function saveFavourites() {
  localStorage.setItem('weather-favourites', JSON.stringify(favourites));
}

function celsiusToUnit(value) {
  return unit === 'F' ? Math.round((value * 9) / 5 + 32) : Math.round(value);
}

function updateUnitButtons() {
  const isCelsius = unit === 'C';
  unitC.classList.toggle('active', isCelsius);
  unitF.classList.toggle('active', !isCelsius);
  unitC.setAttribute('aria-pressed', String(isCelsius));
  unitF.setAttribute('aria-pressed', String(!isCelsius));
}

function renderLatestWeather() {
  if (!latestWeather) return;
  const { city, data } = latestWeather;
  const currentCode = getWeatherCode(data.current.weather_code);
  const timezone = data.timezone || city.timezone || 'auto';
  let localTime = '';
  try {
    localTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: timezone });
  } catch {
    localTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const favourite = favourites.find(item => item.name.toLowerCase() === city.name.toLowerCase());
  renderCurrentWeather(currentWeather, {
    city: city.name,
    country: [city.region, city.country].filter(Boolean).join(', '),
    temperature: celsiusToUnit(data.current.temperature_2m),
    unit,
    condition: currentCode.label,
    icon: currentCode.emoji,
    wind: Math.round(data.current.wind_speed_10m),
    humidity: data.current.relative_humidity_2m,
    localTime,
    isFavourite: Boolean(favourite),
    onFavouriteToggle: toggleFavourite
  });

  const forecastDays = data.daily.time.map((date, index) => {
    const code = getWeatherCode(data.daily.weather_code[index]);
    const label = index === 0 ? 'Today' : new Intl.DateTimeFormat('en', {
      weekday: 'short', timeZone: timezone
    }).format(new Date(`${date}T12:00:00`));
    return {
      day: label,
      icon: code.emoji,
      high: celsiusToUnit(data.daily.temperature_2m_max[index]),
      low: celsiusToUnit(data.daily.temperature_2m_min[index])
    };
  });
  renderForecast(forecast, forecastDays, unit);
  renderReady(currentWeather);
}

function toggleFavourite() {
  if (!latestWeather) return;
  const { city } = latestWeather;
  const index = favourites.findIndex(item => item.name.toLowerCase() === city.name.toLowerCase());
  if (index >= 0) {
    favourites.splice(index, 1);
  } else {
    favourites.push({
      name: city.name,
      country: city.country || 'Unknown country',
      latitude: city.latitude,
      longitude: city.longitude
    });
  }
  saveFavourites();
  renderLatestWeather();
  renderFavourites(favouriteList, favouriteCount, favourites, activeCity, loadCity);
  setStatus(status, index >= 0 ? `${city.name} removed from favourites.` : `${city.name} added to favourites.`);
}

async function loadCity(city) {
  if (city.name?.toLowerCase() === 'bida') {
    city = { ...city, name: 'BIDDA', region: city.region || 'Niger State', country: city.country || 'Nigeria' };
  }
  activeController?.abort();
  activeController = new AbortController();
  const signal = activeController.signal;
  setStatus(status);
  renderLoading(currentWeather, forecast);
  cityMatches.hidden = true;

  try {
    const data = await getForecast(city.latitude, city.longitude, signal);
    activeCity = city.name;
    latestWeather = { city, data };
    const storedCity = {
      name: city.name,
      country: city.country || 'Unknown country',
      region: city.region || '',
      latitude: city.latitude,
      longitude: city.longitude,
      timezone: city.timezone || data.timezone
    };
    localStorage.setItem('weather-last-viewed', JSON.stringify(storedCity));
    renderLatestWeather();
    renderFavourites(favouriteList, favouriteCount, favourites, activeCity, loadCity);
  } catch (error) {
    if (error?.name === 'AbortError') return;
    renderReady(currentWeather);
    forecast.replaceChildren();
    setStatus(status, error instanceof Error ? error.message : 'Unable to load weather. Please try again.', 'error');
  }
}

async function searchAndLoadCity(cityName) {
  activeController?.abort();
  activeController = new AbortController();
  const signal = activeController.signal;
  setStatus(status);
  renderLoading(currentWeather, forecast);
  cityMatches.hidden = true;

  try {
    const cities = await searchCity(cityName, signal);
    if (cities.length === 0) {
      renderReady(currentWeather);
      forecast.replaceChildren();
      setStatus(status, `We couldn't find “${cityName}”. Try another city name.`, 'error');
      return;
    }

    if (cities.length > 1) {
      cityMatches.replaceChildren();
      cities.forEach((city, index) => {
        const option = document.createElement('option');
        option.value = String(index);
        option.textContent = [city.name, city.region, city.country].filter(Boolean).join(', ');
        cityMatches.append(option);
      });
      cityMatches.hidden = false;
      cityMatches.dataset.matches = JSON.stringify(cities);
      renderReady(currentWeather);
      setStatus(status, 'Choose the location you meant:');
      return;
    }
    await loadCity(cities[0]);
  } catch (error) {
    if (error?.name === 'AbortError') return;
    renderReady(currentWeather);
    forecast.replaceChildren();
    setStatus(status, error instanceof Error ? error.message : 'Unable to load weather. Please try again.', 'error');
  }
}

function useMyLocation() {
  if (!navigator.geolocation) {
    setStatus(status, 'Geolocation is not supported by this browser.', 'error');
    return;
  }
  setStatus(status, 'Getting your location…');
  navigator.geolocation.getCurrentPosition(
    position => {
      const { latitude, longitude } = position.coords;
      loadCity({ name: 'My location', country: 'Current coordinates', region: '', latitude, longitude, timezone: 'auto' });
    },
    error => {
      const messages = {
        1: 'Location permission was denied. Allow location access or search for a city.',
        2: 'Your location is currently unavailable. Try again or search for a city.',
        3: 'Getting your location timed out. Try again or search for a city.'
      };
      setStatus(status, `${messages[error.code] || 'Could not get your location.'} Showing London as a default.`, 'error');
      loadCity({ name: 'BIDDA', country: 'Nigeria', region: 'Niger State', latitude: 9.08044, longitude: 6.0099, timezone: 'Africa/Lagos' });
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
  );
}

cityMatches.addEventListener('change', () => {
  const cities = JSON.parse(cityMatches.dataset.matches || '[]');
  const selected = cities[Number(cityMatches.value)];
  if (selected) loadCity(selected);
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const cityName = input.value.trim();
  if (!cityName) {
    setStatus(status, 'Enter a city name to search.', 'error');
    input.focus();
    return;
  }
  searchAndLoadCity(cityName);
});

locationButton.addEventListener('click', useMyLocation);
unitC.addEventListener('click', () => { unit = 'C'; localStorage.setItem('weather-unit', unit); updateUnitButtons(); renderLatestWeather(); });
unitF.addEventListener('click', () => { unit = 'F'; localStorage.setItem('weather-unit', unit); updateUnitButtons(); renderLatestWeather(); });

updateUnitButtons();
renderFavourites(favouriteList, favouriteCount, favourites, activeCity, loadCity);
const lastViewed = readStorage('weather-last-viewed', null);
if (lastViewed?.latitude != null && lastViewed?.longitude != null && lastViewed.name !== 'My location') {
  loadCity(lastViewed);
} else {
  loadCity({ name: 'BIDDA', country: 'Nigeria', region: 'Niger State', latitude: 9.08044, longitude: 6.0099, timezone: 'Africa/Lagos' });
}
