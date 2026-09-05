// Presentation order for published banners. One draw per page load.

const SESSION_SEED = (Math.random() * 0x100000000) >>> 0;

function hash(text) {
  let value = 0x811c9dc5;

  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 0x01000193);
  }

  return value >>> 0;
}

function randomFrom(seed) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;

    let t = state;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

export function orderBannersForSession(banners) {
  if (!Array.isArray(banners) || banners.length < 2) {
    return Array.isArray(banners) ? banners : [];
  }

  const ids = banners.map((banner) => String(banner?.id ?? "")).join("|");

  const next = randomFrom((SESSION_SEED ^ hash(ids)) >>> 0);

  const ordered = [...banners];

  for (let i = ordered.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));

    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
  }

  return ordered;
}

export default orderBannersForSession;
