import { table, region } from "./config.mjs";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// Reuse the client across warm invocations; the execution role supplies credentials.
const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
export const createUserData = async (item) => {
  if (!table) throw new Error("Set the TABLE environment variable to your existing table name");
  return client.send(new PutCommand({ TableName: table, Item: item.toItem(), ConditionExpression: "attribute_not_exists(PK)" }));
};
