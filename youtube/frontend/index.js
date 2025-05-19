const stageUrl = "your-api-gateway-url"; // Replace with your API Gateway URL

function getToken() {
  return new URLSearchParams(window.location.hash.slice(1)).get("id_token");
}

async function addUser() {
  const form = document.getElementById("userdata");
  const formData = new FormData(form);
  const name = formData.get("name");
  const email = formData.get("email");
  const username = formData.get("username");

  try {
    const response = await fetch(`${stageUrl}/user`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, name })
    });
    console.log("User added:", await response.json());
  } catch (err) {
    console.error("Add user failed:", err);
  }
}

async function addSong() {
  const form = document.getElementById("songdata");
  const formData = new FormData(form);
  const user = formData.get("user");
  const songid = formData.get("songid");
  const genre = formData.get("genre");
  const stars = formData.get("stars");

  try {
    const response = await fetch(`${stageUrl}/song`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user,
        genre,
        id: songid,
        stars: stars
      })
    });
    console.log("Song added:", await response.json());
  } catch (err) {
    console.error("Add song failed:", err);
  }
}

async function getPlaylist() {
    const form = document.getElementById("playlistdata");
    const formData = new FormData(form);
    const user = formData.get("user");
    const genre = formData.get("genre");
    const stars = formData.get("stars");
    const url = `${stageUrl}/playlist/${user}/${genre}/${stars}`;
  
    try {
      const response = await fetch(url, {
        method: "GET",
        mode: "cors"
        // leave off Authorization until Cognito is ready
      });
  
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
  
      const data = await response.json();
      console.log("Playlist:", data);
      window.open(data.playlistEntity);
    } catch (err) {
      console.error("Get playlist failed:", err);
    }
  }
  