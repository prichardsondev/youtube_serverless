import { handler } from './dist/index.mjs';

const testUser = {
  username: `SBRIDGEWELL_${Date.now()}`,
  email: "SBRIDGEWELL@gmail.com",
  name: "Sophie Morris Bridgewell"
};

const event = {
  httpMethod: "POST",
  body: JSON.stringify(testUser),
  headers: {
    "Content-Type": "application/json"
  }
};

(async () => {
  try {
    const result = await handler(event);
    console.log("✅ Bundled Handler Response:");
    console.dir(result, { depth: null });
  } catch (err) {
    console.error("❌ Error running bundled handler:");
    console.error(err);
  }
})();
