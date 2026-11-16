# API Gateway layer — next week's class

Prerequisite: test all three Lambda functions using the Class 6 lab first. This folder prepares an HTTP API; nothing here has been provisioned in AWS. Use the same account and Region as your existing functions and table. `localRunner/` is not involved.

## Contract

| Route | Lambda | Request | Successful response |
| --- | --- | --- | --- |
| POST /user | user | JSON object: username, name, email | 201; created DynamoDB item |
| POST /song | song | JSON object: username, genre, id, stars | 201; created DynamoDB item |
| GET /playlist/{user}/{genre}/{stars} | playlist | Three path values | 200; `{ "playlistEntity": "https://www.youtube.com/watch_videos?video_ids=..." }` |

Use API Gateway **HTTP API**, Lambda proxy integration, payload format **2.0**, named stage **class**, auto-deploy enabled. IntegrationMethod is POST even for the client GET route: API Gateway uses POST to invoke Lambda. POST clients send ordinary JSON objects; API Gateway places the serialized string into the Lambda event's body. Never send the console test-event wrapper from the browser.

Error contract: 400 invalid input, 409 duplicate item, 404 no playable songs. API Gateway also returns 404 for unknown routes, 429 for throttling, and may return 5xx for integration failures. A client status is an HTTP status here, not just a field inside a Lambda console response.

## Choose one setup path

### Classroom: console

1. In API Gateway, choose Build under HTTP API. Name the API with your student label. Add three Lambda integrations for the existing user, song and playlist functions.
2. Replace automatically generated routes with exactly the three routes above. Attach the matching integration to each. Do not create a catch-all `$default` route.
3. Use payload format 2.0 for each integration. Allow the console to add API Gateway invoke permission to each Lambda function. This resource policy is separate from the execution role that lets Lambda access DynamoDB.
4. Create the `class` stage with auto-deploy enabled. Copy its full invoke URL, including `/class` once. Keep the Lambda timeout at 10 seconds; use a 12-second API integration timeout if configuring it.
5. Configure API-level CORS: exact frontend origin (scheme + host + optional port, no path/trailing slash), methods GET/POST/OPTIONS, header content-type, max age 300. Keep credentials disabled. HTTP API handles preflight automatically and overrides backend CORS headers; do not add an OPTIONS Lambda route.
6. Set stage default throttling to 2 requests/second with burst 5 for this small demo. These are best-effort limits, not a hard spending cap; classroom/account limits may be lower.
7. Enable stage access logs to an instructor-approved CloudWatch log group (7-day retention). Suggested format:

```json
{"requestId":"$context.requestId","routeKey":"$context.routeKey","status":"$context.status","integrationError":"$context.integrationErrorMessage"}
```

Console labels can vary. Verify the route table, integration targets, stage URL and Lambda resource policies before testing.

### Instructor alternative: CloudFormation

Upload `http-api.template.json` to CloudFormation → Create stack → With new resources → Upload a template file. Use a unique stack name. Supply the three **existing unqualified function names** and the exact frontend origin. Review the changes before creating the stack. Do not create a second console API as well.

The template creates the HTTP API, three proxy integrations/routes, a named class stage, a log group and scoped Lambda invocation permissions. It does not create or replace Lambda functions, roles or DynamoDB tables. It attaches individual Lambda permission statements; do not simultaneously manage those same function policies with AWS::Lambda::ResourcePolicy. The deployment identity needs API Gateway/CloudFormation permissions, Lambda AddPermission/RemovePermission and CloudWatch Logs delivery/configuration permissions.

After CREATE_COMPLETE, copy the ApiBaseUrl output into frontend/index.js as stageUrl. Deployment creates a public unauthenticated API; use only the assigned demo table and fictional records. The username is caller-supplied, so this is not a production multi-user access model. Add verified identity and ownership enforcement before real-user use. CORS and throttling do not provide authentication or ownership checks.

## Test from a client

In AWS CloudShell (or a terminal with curl), replace the example base URL with your real stage URL:

```sh
API_BASE='https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/class'
curl -i "$API_BASE/user" -H 'Content-Type: application/json' \
  -d '{"username":"STUDENT01","name":"Student 01","email":"student01@example.com"}'
curl -i "$API_BASE/song" -H 'Content-Type: application/json' \
  -d '{"username":"STUDENT01","genre":"ROCK","id":"Fr7oYjnt3bM","stars":5}'
curl -i "$API_BASE/playlist/STUDENT01/ROCK/5"
```

Expect 201 or 409 on writes and 200 on the playlist after GSI propagation. Set stars to 6 for 400; request /not-a-route for 404. To inspect CORS preflight:

```sh
curl -i -X OPTIONS "$API_BASE/song" \
  -H 'Origin: https://YOUR_FRONTEND_HOST' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
```

Expect a successful preflight with your exact origin in Access-Control-Allow-Origin. curl does not enforce browser CORS; a successful curl call is only the first checkpoint.

Optional instructor smoke checker (Node.js 22+):

```sh
node api/smoke.mjs "$API_BASE" 'https://YOUR_FRONTEND_HOST'
# Explicitly create/reuse two fictional API_SMOKE01 items and check playlist:
node api/smoke.mjs "$API_BASE" 'https://YOUR_FRONTEND_HOST' --write
```

## Connect the browser

Set `stageUrl` in `frontend/index.js` to the full API stage URL, without an extra route. Serve the frontend through your approved web host. For a local frontend-only preview, `cd frontend` then `python3 -m http.server 8000`; open http://localhost:8000 and configure that exact allowed origin. This serves static files; it does not use localRunner or emulate AWS. Do not open index.html as a file:// URL.

Try all three forms and inspect the browser Network panel. POST JSON usually triggers an OPTIONS preflight. The app displays API failures and provides a clickable YouTube playlist link. Keep the same case for names/genres. Last week's VIDEO001 placeholders are filtered; use a real video ID.

## Diagnose and finish

- 404 from gateway: check /class exactly once, route method/path and stage deployment. 404 with the app's no-playable-songs message means the route reached Lambda.
- 500/502: inspect API access logs for integration errors, Lambda invoke permissions, selected function and payload format; then inspect Lambda logs.
- 400/409: application validation/duplicate handling; not a CORS configuration problem.
- Browser blocked but curl works: compare exact origins and preflight headers in Network; HTTP API owns CORS.
- 429: slow down; do not load-test the shared classroom account.

Keep resources for the next exercise only when instructed. For the CloudFormation path, deleting this API stack removes its API/log group/permission statements, leaving the existing functions and table intact. For the console path, delete only your API and its unneeded log group; remove only its API Gateway permission statements if needed. Test data cleanup is separate and should target the exact fictional items.

References: [HTTP API Lambda integration](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html), [CORS](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-cors.html), [throttling](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-throttling.html), [access logs](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-logging.html).
