export class Playlist {
  constructor({ username, genre, stars }) { Object.assign(this, { username, genre, stars }); }
  key() { return { PK: `USER#${this.username}#STARS#${this.stars}`, SK: `GENRE#${this.genre}#SONG#` }; }
  toItem() { return this.key(); }
}
export function generatePlaylist(data) {
  const ids = [...new Set(data.map(item => item.SK?.split("#").at(-1)).filter(id => /^[A-Za-z0-9_-]{11}$/.test(id || "")))];
  // Fisher-Yates: shuffle a copy, keeping the DynamoDB result intact.
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  // Keep the browser URL short; playback/availability is controlled by YouTube.
  return ids.length ? `https://www.youtube.com/watch_videos?video_ids=${ids.slice(0, 50).join(",")}` : null;
}
