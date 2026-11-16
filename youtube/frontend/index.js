// Configure this when API Gateway is covered. Today's Lambda lab uses console tests.
const stageUrl = "your-api-gateway-url";
const status = (message) => { document.getElementById("status").textContent = message; };
async function request(path, body) {
  if (!stageUrl.startsWith("https://")) throw new Error("Set stageUrl in index.js to your deployed HTTPS API Gateway stage URL first.");
  const result = await fetch(`${stageUrl.replace(/\/$/, "")}${path}`, {
    method: body ? "POST" : "GET",
    ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {})
  });
  const data = await result.json();
  if (!result.ok) throw new Error(data.message || `HTTP ${result.status}`);
  return data;
}
async function addUser() {
  const form = document.getElementById("userdata");
  if (!form.reportValidity()) return;
  try { await request("/user", Object.fromEntries(new FormData(form))); status("User created."); }
  catch (error) { status(error.message); }
}
async function addSong() {
  const form = document.getElementById("songdata");
  if (!form.reportValidity()) return;
  const f = new FormData(form);
  try { await request("/song", { username: f.get("user"), genre: f.get("genre"), id: f.get("songid"), stars: Number(f.get("stars")) }); status("Song created."); }
  catch (error) { status(error.message); }
}
async function getPlaylist() {
  const form = document.getElementById("playlistdata");
  if (!form.reportValidity()) return;
  const link = document.getElementById("playlist-link");
  link.hidden = true;
  const f = new FormData(form);
  try {
    const path = [f.get("user"), f.get("genre"), f.get("stars")].map(value => encodeURIComponent(value.trim())).join("/");
    const data = await request(`/playlist/${path}`);
    const url = new URL(data.playlistEntity);
    if (url.protocol !== "https:" || url.hostname !== "www.youtube.com" || url.pathname !== "/watch_videos") throw new Error("Unexpected playlist URL.");
    link.href = url.href;
    link.hidden = false;
    status("Playlist ready. Select the link to open YouTube.");
  } catch (error) { status(error.message); }
}
