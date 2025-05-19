import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const region = process.env.AWS_REGION || 'us-east-1';
const table = process.env.USER_TABLE || 'prichardson_youtube';

let docClient;

const initClient = async () => {
  if (docClient) return docClient;

  const clientParams = { region };

  if (!process.env.AWS_EXECUTION_ENV) {
    try {
      const { fromSSO } = await import('@aws-sdk/credential-provider-sso');
      const profile = process.env.AWS_PROFILE || 'training';
      clientParams.credentials = fromSSO({ profile });
    } catch (err) {
      console.warn("[⚠️] SSO credentials could not be loaded. Run `aws sso login --profile myprofile`.");
      throw err;
    }
  }

  const client = new DynamoDBClient(clientParams);
  docClient = DynamoDBDocumentClient.from(client);
  return docClient;
};

const createUserData = async (user) => {
  try {
    const client = await initClient();

    const command = new PutCommand({
      Item: user.toItem(),
      TableName: table,
      ConditionExpression: "attribute_not_exists(PK)",
    });

    const response = await client.send(command);
    return response;
  } catch (error) {
    throw error;
  }
};

export { createUserData };
