import test from 'node:test';
import assert from 'node:assert/strict';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
process.env.TABLE = 'playlist-student01';
process.env.AWS_REGION = 'us-east-1';
const { handler: user } = await import('../user/index.mjs');
const { handler: song } = await import('../song/index.mjs');
const { handler: playlist } = await import('../playlist/index.mjs');
const { User, userFromItem } = await import('../user/createUserEntitly.mjs');
const { Song, songFromItem } = await import('../song/createSongEntity.mjs');
const { generatePlaylist } = await import('../playlist/getPlaylistByStarsGenreEntity.mjs');
const post = body => ({ httpMethod: 'POST', body: JSON.stringify(body) });
const songBody = { username: 'STUDENT01', genre: 'ROCK', id: 'Fr7oYjnt3bM', stars: 5 };
const query = { httpMethod: 'GET', pathParameters: { user: 'STUDENT01', genre: 'ROCK', stars: '5' } };
function mockSend(t, fn) { t.mock.method(DynamoDBDocumentClient.prototype, 'send', fn); }
test('write preserves last week key schema and conditional insert', async t => {
 let command; mockSend(t, async c => { command=c.input; return {}; });
 assert.equal((await song(post(songBody))).statusCode, 201);
 assert.deepEqual(command.Item, {PK:'USER#STUDENT01',SK:'GENRE#ROCK#SONG#Fr7oYjnt3bM',Type:'SONG',Stars:'USER#STUDENT01#STARS#5'});
 assert.equal(command.TableName,'playlist-student01'); assert.equal(command.ConditionExpression,'attribute_not_exists(PK)');
});
test('profile write and entity round trips', async t => {
 mockSend(t, async () => ({}));
 const body={username:'STUDENT01',name:'Student 01',email:'student01@example.com'};
 assert.equal((await user(post(body))).statusCode,201);
 assert.deepEqual(userFromItem(new User(body).toItem()),new User(body));
 assert.deepEqual(songFromItem(new Song(songBody).toItem()),new Song(songBody));
});
test('bad bodies, keys, IDs, ratings and missing path params never reach DynamoDB', async t => {
 mockSend(t, async () => { assert.fail('must not send'); });
 for(const body of [null,[],{}, { ...songBody, stars:6 }, {...songBody,stars:true}, {...songBody,stars:'2.5'}, {...songBody,id:'VIDEO001'}, {...songBody,genre:'ROCK#SONG'}, {...songBody,username:''}]) assert.equal((await song(post(body))).statusCode,400);
 assert.equal((await song({body:'{'})).statusCode,400);
 assert.equal((await playlist({})).statusCode,400);
 assert.equal((await user(post({username:'X',name:'X',email:'bad'}))).statusCode,400);
});
test('duplicates return 409, internal failures return 500 without AWS detail', async t => {
 mockSend(t, async () => { throw Object.assign(new Error('private-table-name'),{name:'ConditionalCheckFailedException'}); });
 assert.equal((await song(post(songBody))).statusCode,409);
 t.mock.restoreAll();
 mockSend(t, async () => { throw Object.assign(new Error('private-table-name'),{name:'AccessDeniedException'}); });
 t.mock.method(console,'error',()=>{});
 for(const [handler,event] of [[song,post(songBody)],[playlist,query]]) {
  const result=await handler(event,{awsRequestId:'test-id'});
  assert.equal(result.statusCode,500); assert.ok(!result.body.includes('private-table-name')); assert.ok(result.body.includes('test-id'));
 }
});
test('GSI query follows cursor and uses exact genre boundary', async t => {
 const cursor={Stars:'USER#STUDENT01#STARS#5',SK:'GENRE#ROCK#SONG#VIDEO001',PK:'USER#STUDENT01'}; let calls=0;
 mockSend(t, async ({input}) => {
  assert.equal(input.ExpressionAttributeValues[':sk'],'GENRE#ROCK#SONG#');
  assert.equal(input.ExpressionAttributeValues[':pk'],'USER#STUDENT01#STARS#5'); assert.equal(input.IndexName,'GSI1');
  if(calls++===0) return {Items:[{SK:'GENRE#ROCK#SONG#VIDEO001'}],LastEvaluatedKey:cursor};
  assert.deepEqual(input.ExclusiveStartKey,cursor);return {Items:[{SK:'GENRE#ROCK#SONG#Fr7oYjnt3bM'}]};
 });
 const result=await playlist(query);assert.equal(calls,2);assert.equal(result.statusCode,200);assert.equal(JSON.parse(result.body).playlistEntity,'https://www.youtube.com/watch_videos?video_ids=Fr7oYjnt3bM');
});
test('empty or placeholder-only results are 404', async t => {
 mockSend(t,async()=>({}));assert.equal((await playlist(query)).statusCode,404);
 assert.equal(generatePlaylist([{SK:'GENRE#ROCK#SONG#VIDEO001'}]),null);
});
test('REST/HTTP API preflight, method check, and base64 body', async t => {
 mockSend(t,async()=>({}));
 for(const handler of [user,song,playlist]) {
  assert.equal((await handler({httpMethod:'OPTIONS'})).statusCode,204);
  assert.equal((await handler({requestContext:{http:{method:'OPTIONS'}}})).statusCode,204);
  assert.equal((await handler({httpMethod:'DELETE'})).statusCode,405);
 }
 assert.equal((await song({requestContext:{http:{method:'POST'}},isBase64Encoded:true,body:Buffer.from(JSON.stringify(songBody)).toString('base64')})).statusCode,201);
});
test('playlist filters placeholders, deduplicates IDs and leaves input unchanged',()=>{
 const items=[{SK:'GENRE#ROCK#SONG#Fr7oYjnt3bM'},{SK:'GENRE#ROCK#SONG#Fr7oYjnt3bM'},{SK:'GENRE#ROCK#SONG#VIDEO001'}];
 const before=structuredClone(items);assert.equal(generatePlaylist(items),'https://www.youtube.com/watch_videos?video_ids=Fr7oYjnt3bM');assert.deepEqual(items,before);
});
