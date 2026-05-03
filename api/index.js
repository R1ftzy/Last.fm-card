export default async function handler(req, res) {
  const USER = req.query.user;
  const LASTFM_API_KEY = req.query.apikey;

  if (!USER || !LASTFM_API_KEY) {
    res.status(400).send("Missing ?user= or ?apikey=");
    return;
  }

  const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${USER}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;
  const data = await fetch(url).then(r => r.json());
  const track = data.recenttracks.track[0];

  const title = track.name;
  const artist = track.artist["#text"];
  const album = track.album["#text"];
  const art = track.image.find(i => i.size === "large")?.["#text"] || "";
  const isNowPlaying = !!track["@attr"]?.nowplaying;

  let artBase64 = "";
  if (art) {
    const buf = await fetch(art).then(r => r.arrayBuffer());
    artBase64 = `data:image/jpeg;base64,${Buffer.from(buf).toString("base64")}`;
  }

  const truncate = (str, n) => str.length > n ? str.slice(0, n) + "…" : str;

  const svg = `
<svg width="320" height="80" viewBox="0 0 320 80" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <clipPath id="art">
      <rect x="12" y="10" width="60" height="60" rx="6"/>
    </clipPath>
  </defs>
  <rect width="320" height="80" rx="10" fill="#111"/>
  ${artBase64 ? `<image href="${artBase64}" x="12" y="10" width="60" height="60" clip-path="url(#art)" preserveAspectRatio="xMidYMid slice"/>` : ""}
  <text x="84" y="30" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="600" fill="#ffffff">${truncate(title, 28)}</text>
  <text x="84" y="48" font-family="'Segoe UI', sans-serif" font-size="10" fill="#888888">${truncate(artist, 32)}</text>
  <text x="84" y="62" font-family="'Segoe UI', sans-serif" font-size="10" fill="#666666">${truncate(album, 32)}</text>
  ${isNowPlaying ? `<circle cx="303" cy="14" r="5" fill="#e53935"><animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/></circle>` : ""}
</svg>`.trim();

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
  res.send(svg);
}