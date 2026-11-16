// Learners configure the deployed API in the page; no source edits required.
let stageUrl = "";
try { stageUrl = localStorage.getItem("playlist-api-url") || ""; } catch {}
const endpoint = document.getElementById("api-url");
endpoint.value = stageUrl;
function saveApiAddress() {
  const form = document.getElementById("api-settings");
  if (!form.reportValidity()) return;
  const value = endpoint.value.trim().replace(/\/$/, "");
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !/^[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com(?:\.cn)?$/.test(url.hostname) || url.pathname !== "/class" || url.search || url.hash || url.username || url.password) throw new Error();
    stageUrl = value;
    try { localStorage.setItem("playlist-api-url", value); } catch {}
    status("Address saved. Use the forms below to test your API.", form);
  } catch { status("Paste the HTTPS invoke URL from your API Gateway class stage. It should end in /class.", form); }
}
function clearApiAddress() {
  stageUrl = "";
  endpoint.value = "";
  try { localStorage.removeItem("playlist-api-url"); } catch {}
  document.getElementById("playlist-link").hidden = true;
  status("Address cleared.", document.getElementById("api-settings"));
}
const status = (message, form) => {
  document.getElementById("status").textContent = message;
  if (form) form.querySelector('[role="status"]').textContent = message;
};
async function request(path, body) {
  if (!stageUrl.startsWith("https://")) throw new Error("Paste and save your API address at the top of this page first.");
  const result = await fetch(`${stageUrl.replace(/\/$/, "")}${path}`, {
    method: body ? "POST" : "GET",
    ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {})
  });
  let data;
  try { data = await result.json(); } catch { throw new Error(`The API returned an unreadable response (HTTP ${result.status}). Ask Paul to check the API address and integration.`); }
  if (!result.ok) throw new Error(result.status === 409 ? "Already saved. You can continue to the next step." : data.message || `HTTP ${result.status}`);
  return data;
}
async function addUser() {
  const form = document.getElementById("userdata");
  if (!form.reportValidity()) return;
  try { await request("/user", Object.fromEntries(new FormData(form))); status("User saved.", form); }
  catch (error) { status(error instanceof TypeError ? "Could not reach your API. Check the saved address and ask Paul to check the allowed website address (CORS)." : error.message, form); }
}
async function addSong() {
  const form = document.getElementById("songdata");
  if (!form.reportValidity()) return;
  const f = new FormData(form);
  try { await request("/song", { username: f.get("user"), genre: f.get("genre"), id: f.get("songid"), stars: Number(f.get("stars")) }); status("Song saved.", form); }
  catch (error) { status(error instanceof TypeError ? "Could not reach your API. Check the saved address and ask Paul to check the allowed website address (CORS)." : error.message, form); }
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
    status("Playlist ready. Select the link below to open YouTube.", form);
  } catch (error) { status(error instanceof TypeError ? "Could not reach your API. Check the saved address and ask Paul to check the allowed website address (CORS)." : error.message, form); }
}
