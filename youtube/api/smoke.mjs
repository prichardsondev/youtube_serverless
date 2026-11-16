// Uses the deployed API. Read checks by default; --write explicitly adds two fictional items.
import { pathToFileURL } from 'node:url';
export async function smoke({ baseUrl, origin, write = false, username = 'API_SMOKE01', fetcher = fetch, report = console.log, pause = ms => new Promise(r => setTimeout(r, ms)) }) {
  const base = new URL(baseUrl);
  if (base.protocol !== 'https:' || base.search || base.hash || base.username || base.password) throw new Error('Use the HTTPS API stage URL, including /class, without credentials, query or fragment.');
  const allowed = new URL(origin);
  if (allowed.origin !== origin || !['https:', 'http:'].includes(allowed.protocol)) throw new Error('origin must be the exact browser origin without a path or trailing slash.');
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(username)) throw new Error('Use a simple fictional username.');
  const root = base.href.replace(/\/$/, '');
  async function call(path, options = {}) {
    return fetcher(root + path, { ...options, signal: AbortSignal.timeout(15000) });
  }
  function check(ok, label) { if (!ok) throw new Error(label); report(`PASS ${label}`); }
  const preflight = await call('/song', { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } });
  check(preflight.ok, 'preflight status');
  check(preflight.headers.get('access-control-allow-origin') === origin, 'exact allowed origin');
  check((preflight.headers.get('access-control-allow-methods') || '').split(',').map(s => s.trim().toUpperCase()).includes('POST'), 'preflight permits POST');
  check((preflight.headers.get('access-control-allow-headers') || '').toLowerCase().split(',').map(s => s.trim()).includes('content-type'), 'preflight permits Content-Type');
  await pause(600);
  const unknown = await call('/not-a-route');
  check(unknown.status === 404, 'unknown route returns 404');
  if (!write) { report('No items written. Use --write to test create and playlist operations with fictional data.'); return; }
  const post = async (path, body) => {
    await pause(600);
    return call(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body) });
  };
  const user = await post('/user', { username, name: 'API smoke test', email: 'api-smoke@example.com' });
  check([201,409].includes(user.status), 'user returns 201 or existing-item 409');
  const songBody = { username, genre: 'ROCK', id: 'Fr7oYjnt3bM', stars: 5 };
  const song = await post('/song', songBody);
  check([201,409].includes(song.status), 'song returns 201 or existing-item 409');
  check(song.headers.get('access-control-allow-origin') === origin, 'write response includes CORS');
  const invalid = await post('/song', { ...songBody, stars: 6 });
  check(invalid.status === 400, 'invalid rating returns 400');
  let playlist;
  for (let attempt = 0; attempt < 5; attempt++) {
    await pause(1000);
    playlist = await call(`/playlist/${encodeURIComponent(username)}/ROCK/5`, { headers: { Origin: origin } });
    if (playlist.status !== 404) break; // Allow a short GSI propagation window.
  }
  check(playlist.status === 200, 'playlist returns 200');
  const body = await playlist.json();
  check(typeof body.playlistEntity === 'string' && body.playlistEntity.startsWith('https://www.youtube.com/watch_videos?video_ids='), 'playlist response has an HTTPS YouTube URL');
  report(`Created or reused USER#${username} profile and ROCK song. Keep for class, or remove those exact two test items manually when finished.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [baseUrl, origin, ...flags] = process.argv.slice(2);
  if (!baseUrl || !origin || flags.some(x => x !== '--write')) {
    console.error('Usage: node api/smoke.mjs HTTPS_API_BASE_URL FRONTEND_ORIGIN [--write]'); process.exitCode = 1;
  } else {
    try { await smoke({ baseUrl, origin, write: flags.includes('--write') }); }
    catch (error) { console.error(`FAIL ${error.message}`); process.exitCode = 1; }
  }
}
