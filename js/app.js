import { searchCity, getForecast } from './api.js';
import { getWeatherCode } from './weatherCodes.js';
import { renderCurrentWeather, renderForecast, renderFavourites, setStatus } from './ui.js';

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

const favourites = ['London', 'New York', 'Tokyo', 'Paris', 'Niger', 'Lagos', 'Kwara', 'Rivers'];
let activeCity = 'London';
let activeController = null;
let latestWeather = null;
let unit = localStorage.getItem('weather-unit') === 'F' ? 'F' : 'C';

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
  const timezone = data.timezone || city.timezone;
  let localTime = '';
  try {
    localTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: timezone });
  } catch {
    localTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  renderCurrentWeather(currentWeather, {
    city: city.name,
    country: [city.region, city.country].filter(Boolean).join(', '),
    temperature: celsiusToUnit(data.current.temperature_2m),
    unit,
    condition: currentCode.label,
    icon: currentCode.emoji,
    wind: Math.round(data.current.wind_speed_10m),
    humidity: data.current.relative_humidity_2m,
    localTime
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
}

async function loadCity(city) {
  activeController?.abort();
  activeController = new AbortController();
  const signal = activeController.signal;
  setStatus(status, 'Loading…');
  currentWeather.setAttribute('aria-busy', 'true');
  cityMatches.hidden = true;

  try {
    const data = await getForecast(city.latitude, city.longitude, signal);
    activeCity = city.name;
    latestWeather = { city, data };
    renderLatestWeather();
    renderFavourites(favouriteList, favouriteCount, favourites, activeCity, searchAndLoadCity);
    setStatus(status);
    input.value = '';
  } catch (error) {
    if (error?.name === 'AbortError') return;
    setStatus(status, error instanceof Error ? error.message : 'Unable to load weather. Please try again.', 'error');
  } finally {
    if (!activeController.signal.aborted) currentWeather.removeAttribute('aria-busy');
  }
}

async function searchAndLoadCity(cityName) {
  activeController?.abort();
  activeController = new AbortController();
  const signal = activeController.signal;
  setStatus(status, 'Loading…');
  cityMatches.hidden = true;
  currentWeather.setAttribute('aria-busy', 'true');

  try {
    const cities = await searchCity(cityName, signal);
    if (cities.length === 0) {
      setStatus(status, `We couldn't find “${cityName}”. Try another city name.`, 'error');
      return;
    }

    if (cities.length > 1 && !latestWeather && cityName.toLowerCase() === activeCity.toLowerCase()) {
      await loadCity(cities[0]);
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
      setStatus(status, 'Choose the location you meant:');
      return;
    }

    await loadCity(cities[0]);
  } catch (error) {
    if (error?.name === 'AbortError') return;
    setStatus(status, error instanceof Error ? error.message : 'Unable to load weather. Please try again.', 'error');
  } finally {
    if (!cityMatches.hidden || !activeController.signal.aborted) currentWeather.removeAttribute('aria-busy');
  }
}

cityMatches.addEventListener('change', () => {
  const cities = JSON.parse(cityMatches.dataset.matches || '[]');
  const selected = cities[Number(cityMatches.value)];
  if (selected) loadCity(selected);
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const cityName = input.value.trim();
  if (!cityName) {
    setStatus(status, 'Enter a city name to search.', 'error');
    input.focus();
    return;
  }
  searchAndLoadCity(cityName);
});

unitC.addEventListener('click', () => {
  unit = 'C';
  localStorage.setItem('weather-unit', unit);
  updateUnitButtons();
  renderLatestWeather();
});
unitF.addEventListener('click', () => {
  unit = 'F';
  localStorage.setItem('weather-unit', unit);
  updateUnitButtons();
  renderLatestWeather();
});

updateUnitButtons();
searchAndLoadCity(activeCity);
