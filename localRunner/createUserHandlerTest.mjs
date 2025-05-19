import { handler } from "./createUserHandler.mjs";

// 👤 Change these values as needed for testing
const testUser = {
  username: `SBRIDGEWELL_${Date.now()}`,
  email: "SBRIDGEWELL@gmail.com",
  name: "Sophie Morris Bridgewell"
};

// 🧪 Simulated API Gateway event
const event = {
  httpMethod: "POST",
  body: JSON.stringify(testUser),
  headers: {
    "Content-Type": "application/json"
  }
};

// 👇 Escaped version for AWS Lambda test UI
const lambdaTestPayload = JSON.stringify({
  httpMethod: "POST",
  body: JSON.stringify(testUser)
}, null, 2); // Pretty format

(async () => {
  try {
    const response = await handler(event);
    console.log("✅ Lambda Response:");
    console.dir(response, { depth: null });

    console.log("\n📋 Copy/Paste this into Lambda test payload:");
    console.log(lambdaTestPayload);

  } catch (error) {
    console.error("❌ Error during handler execution:");
    console.error(error);
  }
})();



