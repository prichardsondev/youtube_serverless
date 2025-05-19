import { createUserData } from "./createUserData.mjs";
import { User } from "./createUserEntitly.mjs";
import { response, handlePreflight } from "./handler_response.mjs";

const isValid = (value) => typeof value === 'string' && value.trim().length > 0;

const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return handlePreflight();
  }

  try {
    const body = JSON.parse(event.body);
    const { username, email, name } = body;

    if (!isValid(username) || !isValid(email) || !isValid(name)) {
      return response(400, { message: "Invalid input: username, email, and name are required." });
    }

    const user = new User({ username, email, name });
    await createUserData(user);

    return response(201, user.toItem());
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return response(409, { message: "User already exists" });
    }

    console.error("Unhandled error:", error);
    return response(
      error?.$metadata?.httpStatusCode || 500,
      { message: error.message }
    );
  }
};

export { handler };

