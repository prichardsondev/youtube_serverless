import { createUserData } from "./createUserData.mjs";
import { User } from "./createUserEntitly.mjs";
import { response, handlePreflight } from "./handler_response.mjs";

const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return handlePreflight();
  }

  /* escapted test for lambda service
    "{\"username\":\"SBRIDGEWELL\",\"email\":\"SBRIDGEWELL@gmail.com\",\"name\":\"Sophie Morris Bridgewell\"}"
  */

  try {
    const { username, email, name } = JSON.parse(event.body);

    const user = new User({
      username,
      email,
      name
    });

    const { error } = await createUserData(user);

    return response(error ? 400 : 201, user.toItem());
  } catch (error) {
    return response(
      error?.$metadata?.httpStatusCode || 500,
      { message: error.message }
    );
  }
};

export { handler };
