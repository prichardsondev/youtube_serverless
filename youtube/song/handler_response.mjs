// Kept inside each function so every classroom ZIP is independently deployable.
export class InputError extends Error {}
export const method = (event) => event?.requestContext?.http?.method || event?.httpMethod;
export function bodyOf(event) {
  try {
    const raw = event?.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event?.body;
    const body = JSON.parse(raw);
    if (!body || Array.isArray(body) || typeof body !== "object") throw new Error();
    return body;
  } catch { throw new InputError("body must be a JSON-encoded object string"); }
}
export function text(value, field, max = 100) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new InputError(`${field} must be a non-empty string (maximum ${max} characters)`);
  return value.trim();
}
export function keyText(value, field) {
  const result = text(value, field);
  if (/[#\x00-\x1f\x7f]/.test(result)) throw new InputError(`${field} cannot contain # or control characters`);
  return result;
}
export function rating(value) {
  if (!((typeof value === "number" && Number.isInteger(value)) || (typeof value === "string" && /^[1-5]$/.test(value))) || Number(value) < 1 || Number(value) > 5) throw new InputError("stars must be an integer from 1 to 5");
  return Number(value);
}
export function videoId(value) {
  const id = text(value, "id", 11);
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) throw new InputError("id must be an 11-character YouTube video ID, not a URL");
  return id;
}
export const response = (statusCode, data = {}) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization" },
  body: JSON.stringify(data)
});
export const handlePreflight = () => ({ ...response(204), body: "" });
export function failure(error, context) {
  if (error instanceof InputError) return response(400, { message: error.message });
  if (error.name === "ConditionalCheckFailedException") return response(409, { message: "This item already exists; use a different key or keep the existing item." });
  console.error(JSON.stringify({ requestId: context?.awsRequestId, name: error.name, message: error.message }));
  return response(500, { message: "Unable to complete the database operation. Check the function logs.", requestId: context?.awsRequestId });
}
