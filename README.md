# Mr T Season Weather Dashboard

A responsive weather dashboard built with plain HTML, CSS, and JavaScript ES modules.

## Features

- Live city search using Open-Meteo geocoding
- Current conditions and a 7-day forecast
- WMO weather-code labels and emoji
- Multiple-location selection for common city names
- Celsius/Fahrenheit toggle saved in `localStorage`
- Favourite cities saved as structured objects in `localStorage`
- Current-card favourite toggle
- Browser geolocation with permission, unavailable, and timeout messages
- Last-viewed city restoration
- Search cancellation with `AbortController`
- Skeleton loading cards and accessible status messages
- Responsive glassmorphism layout

## APIs Used

- Open-Meteo Geocoding API: `https://geocoding-api.open-meteo.com/v1/search`
- Open-Meteo Forecast API: `https://api.open-meteo.com/v1/forecast`

No API key is required.

## Screenshots

- **Desktop dashboard:** `screenshots/desktop.png`
- **Mobile dashboard:** `screenshots/mobile.png`

Screenshots can be added to a future `screenshots/` directory.

## Running the App

Serve the project with any local static server, for example:

```powershell
npx http-server . -p 4173 -a 127.0.0.1 -c-1
```

Then open `http://127.0.0.1:4173/`.

## What I Learned

This project demonstrates ES modules, browser API integration, `async`/`await`, `try/catch` error handling, request cancellation, `localStorage`, geolocation, DOM creation, responsive CSS, and accessible loading and status states. It also demonstrates why `textContent` and `document.createElement()` are safer for rendering values supplied by external APIs than injecting raw HTML with `innerHTML`.
