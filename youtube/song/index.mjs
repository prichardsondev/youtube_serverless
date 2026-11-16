import { createSongData } from "./createSongData.mjs";
import { Song } from "./createSongEntity.mjs";
import { bodyOf, keyText, text, rating, videoId, InputError, method, response, handlePreflight, failure } from "./handler_response.mjs";
export const handler = async (event, context) => {
  if (method(event) === "OPTIONS") return handlePreflight();
  if (method(event) && method(event) !== "POST") return response(405, { message: "Use POST" });
  try {
    const body = bodyOf(event);
    const item = new Song({ username: keyText(body.username, "username"), genre: keyText(body.genre, "genre"), id: videoId(body.id), stars: rating(body.stars) });
    await createSongData(item);
    return response(201, item.toItem());
  } catch (error) { return failure(error, context); }
};
