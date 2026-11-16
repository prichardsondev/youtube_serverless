import { createUserData } from "./createUserData.mjs";
import { User } from "./createUserEntitly.mjs";
import { bodyOf, keyText, text, rating, videoId, InputError, method, response, handlePreflight, failure } from "./handler_response.mjs";
export const handler = async (event, context) => {
  if (method(event) === "OPTIONS") return handlePreflight();
  if (method(event) && method(event) !== "POST") return response(405, { message: "Use POST" });
  try {
    const body = bodyOf(event);
    const username = keyText(body.username, "username");
    const name = text(body.name, "name");
    const email = text(body.email, "email", 254);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InputError("email must be a valid address");
    const item = new User({ username, name, email });
    await createUserData(item);
    return response(201, item.toItem());
  } catch (error) { return failure(error, context); }
};
