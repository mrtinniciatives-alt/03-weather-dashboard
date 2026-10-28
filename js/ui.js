function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function renderCurrentWeather(container, data) {
  container.replaceChildren();
  container.style.position = 'relative';

  if (data.onFavouriteToggle) {
    const favouriteButton = element('button', `favourite-toggle${data.isFavourite ? ' active' : ''}`, data.isFavourite ? '★' : '☆');
    favouriteButton.type = 'button';
    favouriteButton.setAttribute('aria-label', data.isFavourite ? 'Remove city from favourites' : 'Add city to favourites');
    favouriteButton.setAttribute('aria-pressed', String(data.isFavourite));
    favouriteButton.addEventListener('click', data.onFavouriteToggle);
    container.append(favouriteButton);
  }

  const main = element('div', 'hero-main');
  const location = element('div', 'location-block');
  const eyebrow = element('p', 'eyebrow');
  eyebrow.append(element('span', 'location-pin', '●'), document.createTextNode(` ${data.city}`));
  location.append(eyebrow, element('p', 'country', data.country));

  const temperatureRow = element('div', 'temperature-row');
  temperatureRow.append(element('span', 'temperature', `${data.temperature}°${data.unit}`));
  const weatherIcon = element('span', 'weather-icon', data.icon);
  weatherIcon.setAttribute('aria-label', data.condition);
  temperatureRow.append(weatherIcon);
  main.append(location, temperatureRow, element('p', 'condition', data.condition));

  const details = element('div', 'hero-details');
  details.append(
    createDetail('≋', 'Wind', `${data.wind} km/h`),
    createDetail('◷', 'Local time', data.localTime),
    createDetail('◌', 'Humidity', `${data.humidity ?? '—'}%`)
  );
  container.append(main, details);
}

function createDetail(icon, label, value) {
  const detail = element('div', 'detail');
  detail.append(element('span', 'detail-icon', icon));
  const text = element('span');
  text.append(element('small', '', label), element('strong', '', value));
  detail.append(text);
  return detail;
}

export function renderForecast(container, days, unit) {
  container.replaceChildren();
  days.forEach(({ day, icon, high, low }) => {
    const card = element('article', 'forecast-card');
    card.append(element('p', '', day));
    card.append(element('span', 'forecast-icon', icon));
    const temps = element('div', 'temps');
    temps.append(element('strong', '', `${high}°${unit}`), element('span', '', `${low}°${unit}`));
    card.append(temps);
    container.append(card);
  });
}

export function renderFavourites(container, countLabel, favourites, activeCity, onSelect) {
  countLabel.textContent = `${favourites.length} ${favourites.length === 1 ? 'city' : 'cities'}`;
  container.replaceChildren();
  favourites.forEach((city) => {
    const item = element('li');
    const active = activeCity?.toLowerCase() === city.name.toLowerCase();
    const button = element('button', `favourite-item${active ? ' active' : ''}`);
    button.type = 'button';
    button.append(element('span', 'favourite-pin', '⌖'), element('span', '', city.name), element('span', 'chevron', '›'));
    button.addEventListener('click', () => onSelect(city));
    item.append(button);
    container.append(item);
  });
}

export function renderLoading(container, forecastContainer) {
  container.replaceChildren();
  container.className = 'glass-card hero skeleton-weather';
  container.setAttribute('aria-busy', 'true');
  forecastContainer.replaceChildren();
  for (let index = 0; index < 7; index += 1) {
    forecastContainer.append(element('div', 'skeleton-card'));
  }
}

export function renderReady(container) {
  container.className = 'glass-card hero';
  container.removeAttribute('aria-busy');
}

export function setStatus(elementNode, message = '', type = 'status') {
  elementNode.textContent = message;
  elementNode.className = `status${message ? ` ${type}` : ''}`;
  elementNode.setAttribute('role', type === 'error' ? 'alert' : 'status');
}
