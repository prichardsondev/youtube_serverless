import { createSongData } from "./createSongData.mjs";
import { Song } from "./createSongEntity.mjs";
import { response, handlePreflight } from "./handler_response.mjs";

  /* escapted test for lambda service
    "{\"username\":\"SBRIDGEWELL\",\"genre\":\"COUNTRY\",\"id\":\"Fr7oYjnt3bM\",\"stars\":5}"
  */

const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return handlePreflight();
  }

  try {
    const { username, genre, id, stars } = JSON.parse(event.body);

    const song = new Song({
      username,
      genre,
      id,
      stars: Number(stars)  // Optional: normalize
    });

    const { error } = await createSongData(song);

    return response(error ? 500 : 201, song.toItem());
  } catch (error) {
    return response(
      error?.$metadata?.httpStatusCode || 500,
      { message: error.message }
    );
  }
};

export { handler };
