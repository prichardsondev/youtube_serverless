# YouTube playlist: Lambda classroom lab

Use only this `youtube/` directory. The separate `localRunner/` is an advanced-class exercise and is unchanged.

## Continue from DynamoDB

Keep the table from last week, in the same AWS account and Region:

- Table keys: `PK` (String), `SK` (String).
- Index `GSI1`: `Stars` (String) partition key, `SK` (String) sort key.
- Profile: `PK = SK = USER#STUDENT01`.
- Song: `PK = USER#STUDENT01`, `SK = GENRE#ROCK#SONG#Fr7oYjnt3bM`, `Stars = USER#STUDENT01#STARS#5`.

Names and values are case-sensitive. No data migration is needed. Last week's `VIDEO001` etc. are teaching placeholders, not playable IDs; leave those records in place and add a song with a real 11-character video ID. Existing profile tests return 409 rather than overwriting last week's work.

## Console setup (no local runner)

Create three ordinary Lambda event functions: `playlist-student01-user`, `playlist-student01-song`, `playlist-student01-playlist`. Use Node.js 24.x, x86_64, handler `index.handler`, 128 MB memory, and a 10-second timeout. Replace the student suffix with your assigned identifier.

1. Use the instructor-provided execution role, or a role trusting `lambda.amazonaws.com` with `AWSLambdaBasicExecutionRole` plus the appropriate table-scoped policy from `iam/`. Replace REGION, ACCOUNT_ID and TABLE_NAME before attaching a policy. User/song need PutItem on the table; playlist needs Query on its GSI1. Your SSO identity also needs permission to create/configure/invoke the functions and pass the approved role. Ask the instructor if classroom permissions prevent setup.
2. For each function, upload the matching folder's `index.zip` through Code → Upload from → .zip file. The ZIP has `index.mjs` at its root. Do not upload the repository ZIP as a function.
3. Set Configuration → Environment variables → `TABLE` to the exact existing table name, in all three functions. Lambda supplies `AWS_REGION`; do not set that reserved key. Legacy `REGION` overrides remain supported, but omit them for same-Region deployment.
4. Keep the default network configuration (no customer VPC). No public trigger, function URL, or API Gateway is needed for today's tests.
5. Save a private Test event by pasting the entire matching `events/*.json` file. The write events contain a JSON **string** in `body`, matching API Gateway's proxy format.
6. Run user (201 or 409 if already present), song (201, then 409 on repeat), then playlist (200 with `playlistEntity`). Run invalid-song (400) and empty-playlist (404). GSI updates are eventually consistent; retry the playlist briefly after a write.
7. Verify the song in DynamoDB. Open Monitor → View CloudWatch logs. A Lambda invocation marked successful can still contain an application `statusCode` of 400/409/500; inspect the returned payload.

No credentials belong in source or environment variables. The SDK obtains temporary credentials from the execution role. Keep only fictional classroom data.

## Packages and verification

The small classroom ZIPs intentionally use AWS SDK v3 included in the supported Lambda Node.js runtime so the source remains editable in the console. Runtime SDK minor versions can vary. `package.json` and the lockfile pin SDK dependencies for local maintainer tests; for production, bundle those dependencies and manage their updates.

Maintainer commands (not required of learners):

```sh
cd youtube
npm ci
npm test
npm run package
```

Packaging rebuilds all three Lambda ZIPs and the frontend ZIP from current source, excluding test events, secrets and localRunner. Test doubles verify DynamoDB requests and failure handling; they do not replace a test in the assigned AWS account.

## Later: API Gateway and the web page

Use Lambda proxy integration: `POST /user`, `POST /song`, `GET /playlist/{user}/{genre}/{stars}`. REST v1 and HTTP API v2 event methods are supported. Configure API Gateway CORS for the actual frontend origin and set `ALLOWED_ORIGIN` on the functions. Default `*` is for the classroom demo only; CORS does not authenticate users. HTTP APIs can manage CORS at the gateway instead of the function.

Set `stageUrl` in `frontend/index.js` to the deployed HTTPS stage URL. The UI reports API errors and presents a clickable playlist link instead of opening a popup after an asynchronous request. YouTube controls video availability and playback; the existing `watch_videos` behavior is not a guaranteed public API.

Before exposing this as a real multi-user app, add authentication and enforce ownership from verified identity claims, rather than trusting the supplied username. This exercise has no account authentication and creating a profile is not creating a login.

## Review changes

Input validation; 400/404/409 responses; internal errors logged without returning AWS details; clients reused across invocations; AWS_REGION fallback; exact genre boundary; paginated index queries; HTTPS playlist links; placeholder filtering; corrected entity deserialization; regenerated ZIPs; browser form validation, visible feedback, encoded paths and removal of an accidentally copied Cloudflare challenge script. Key layout and the `playlistEntity` response field remain compatible.
