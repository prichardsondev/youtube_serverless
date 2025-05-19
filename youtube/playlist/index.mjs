import { getPlaylist } from "./getPlaylistByStarsGenreData.mjs";
import { Playlist, generatePlaylist } from "./getPlaylistByStarsGenreEntity.mjs";
import { response, handlePreflight } from "./handler_response.mjs";

/* path prameters for lambda service test
    "user": "SBRIDGEWELL",
    "genre": "COUNTRY",
    "stars": 5
*/

const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return handlePreflight(); // CORS preflight support
  }

  const { genre, stars, user } = event.pathParameters;
  const playlistEntity = new Playlist({ username: user, genre, stars });

  try {
    const { error, data } = await getPlaylist(playlistEntity);

    if (data.length === 0) {
      throw new Error("playlist is empty");
    }

    const playlist = { playlistEntity: generatePlaylist(data) };
    return response(error ? 500 : 200, playlist); // no need to stringify
  } catch (error) {
    return response(
      error?.$metadata?.httpStatusCode || 500,
      { message: error.message }
    );
  }
};

export { handler };
