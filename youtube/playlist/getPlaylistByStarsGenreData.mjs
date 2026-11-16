import { table, region } from "./config.mjs";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
export const getPlaylist = async (playlist) => {
  if (!table) throw new Error("Set the TABLE environment variable to your existing table name");
  const data = [];
  let cursor;
  do {
    const page = await client.send(new QueryCommand({
      TableName: table, IndexName: "GSI1",
      KeyConditionExpression: "#stars = :pk AND begins_with(#sk, :sk)",
      ExpressionAttributeNames: { "#stars": "Stars", "#sk": "SK" },
      ExpressionAttributeValues: { ":pk": playlist.key().PK, ":sk": playlist.key().SK },
      ProjectionExpression: "SK", ExclusiveStartKey: cursor, Limit: 100
    }));
    data.push(...(page.Items || []));
    cursor = page.LastEvaluatedKey;
  } while (cursor && Object.keys(cursor).length);
  return { data };
};
