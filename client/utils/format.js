// Small formatting helpers consolidated for reuse across the client
export function formatBackgroundDisplay(name) {
  if (!name) {
    return 'None';
  }
  // remove common suffix _channel (case-insensitive)
  let s = String(name).replace(/_channel$/i, '');
  // insert spaces for camelCase (DarkBeing -> Dark Being)
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
  // replace underscores with spaces and collapse multiple spaces
  s = s.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return s;
}

export function formatTimer(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const SEC = 1;
  const MIN = 60 * SEC;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY; // approximate
  const YEAR = 365 * DAY; // approximate

  let rem = s;
  const years = Math.floor(rem / YEAR);
  rem -= years * YEAR;
  const months = Math.floor(rem / MONTH);
  rem -= months * MONTH;
  const weeks = Math.floor(rem / WEEK);
  rem -= weeks * WEEK;
  const days = Math.floor(rem / DAY);
  rem -= days * DAY;
  const hours = Math.floor(rem / HOUR);
  rem -= hours * HOUR;
  const minutes = Math.floor(rem / MIN);
  rem -= minutes * MIN;
  const secondsLeft = rem;

  const prefix = [];
  if (years) {
    prefix.push(years + 'Y');
  }
  if (months) {
    prefix.push(months + 'M');
  }
  if (weeks) {
    prefix.push(weeks + 'W');
  }
  if (days) {
    prefix.push(days + 'D');
  }

  const pad = n => String(n).padStart(2, '0');
  let timePart;
  if (hours > 0) {
    timePart = `${hours}:${pad(minutes)}:${pad(secondsLeft)}`;
  } else {
    timePart = `${minutes}:${pad(secondsLeft)}`;
  }

  if (prefix.length > 0) {
    return prefix.join(' ') + ' ' + timePart;
  }
  return timePart;
}
