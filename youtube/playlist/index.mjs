import { getPlaylist } from "./getPlaylistByStarsGenreData.mjs";
import { Playlist, generatePlaylist } from "./getPlaylistByStarsGenreEntity.mjs";
import { keyText, rating, method, response, handlePreflight, failure } from "./handler_response.mjs";
export const handler = async (event, context) => {
  if (method(event) === "OPTIONS") return handlePreflight();
  if (method(event) && method(event) !== "GET") return response(405, { message: "Use GET" });
  try {
    const { user, genre, stars } = event?.pathParameters || {};
    const query = new Playlist({ username: keyText(user, "user"), genre: keyText(genre, "genre"), stars: rating(stars) });
    const { data } = await getPlaylist(query);
    const playlistEntity = generatePlaylist(data);
    if (!playlistEntity) return response(404, { message: "No playable songs match. Check user, genre and stars; last week's VIDEO001 placeholders are not YouTube IDs. New GSI writes can take a moment to appear." });
    return response(200, { playlistEntity });
  } catch (error) { return failure(error, context); }
};
