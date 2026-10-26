
const PREFIX = "tp-cache:";
const MAX_ENTRIES = 60;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return (h >>> 0).toString(36) + str.length.toString(36);
}

export function getCached(key) {
  try {
    const raw = localStorage.getItem(PREFIX + hash(key));
    if (!raw) return null;
    const entry = JSON.parse(raw);
  
    if (entry.key !== key || Date.now() - entry.t > TTL_MS) return null;
    return entry.value;
  } catch {
    return null;
  }
}

export function setCached(key, value) {
  try {
    localStorage.setItem(PREFIX + hash(key), JSON.stringify({ key, t: Date.now(), value }));
    prune();
  } catch {
  }
}

function prune() {
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith(PREFIX)) continue;
    try {
      entries.push({ k, t: JSON.parse(localStorage.getItem(k)).t });
    } catch {
      localStorage.removeItem(k);
    }
  }
  if (entries.length <= MAX_ENTRIES) return;
  entries.sort((a, b) => a.t - b.t);
  entries.slice(0, entries.length - MAX_ENTRIES).forEach(({ k }) => localStorage.removeItem(k));
}

export function clearApiCache() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}