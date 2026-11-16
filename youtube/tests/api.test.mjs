import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { smoke } from '../api/smoke.mjs';
process.env.TABLE = 'playlist-student01'; process.env.AWS_REGION = 'us-east-1';
const load = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
test('HTTP API v2 fixtures invoke the existing handlers and preserve response contract',async t=>{
 t.mock.method(DynamoDBDocumentClient.prototype,'send',async command=>command.input.IndexName?{Items:[{SK:'GENRE#ROCK#SONG#Fr7oYjnt3bM'}]}:{});
 for(const [name,status] of [['user',201],['song',201],['playlist',200]]) {
  const {handler}=await import(`../${name}/index.mjs`);
  const response=await handler(await load(`../api/events/${name}-http-v2.json`));
  assert.equal(response.statusCode,status); assert.equal(response.headers['Content-Type'],'application/json');
  const body=JSON.parse(response.body); assert.ok(name==='playlist'?body.playlistEntity.startsWith('https://www.youtube.com/'):body.PK==='USER#STUDENT01');
 }
});
test('infrastructure connects only intended routes/functions and does not replace data layer',async()=>{
 const template=await load('../api/http-api.template.json');const r=template.Resources;
 assert.equal(r.PlaylistApi.Properties.ProtocolType,'HTTP');
 assert.deepEqual(Object.values(r).filter(x=>x.Type==='AWS::ApiGatewayV2::Route').map(x=>x.Properties.RouteKey).sort(),['GET /playlist/{user}/{genre}/{stars}','POST /song','POST /user']);
 assert.ok(!Object.values(r).some(x=>['AWS::Lambda::Function','AWS::DynamoDB::Table','AWS::IAM::Role'].includes(x.Type)));
 for(const n of ['User','Song','Playlist']) {
  assert.equal(r[n+'Integration'].Properties.PayloadFormatVersion,'2.0');
  assert.equal(r[n+'Integration'].Properties.IntegrationMethod,'POST');
  const permission=r[n+'Permission'].Properties;
  assert.equal(permission.Principal,'apigateway.amazonaws.com'); assert.ok(permission.SourceArn['Fn::Sub'].includes('${PlaylistApi}/class/'));
  assert.equal(permission.FunctionName.Ref,n+'FunctionName');
 }
 assert.equal(r.ClassStage.Properties.StageName,'class');
 assert.deepEqual(r.PlaylistApi.Properties.CorsConfiguration.AllowOrigins,[{Ref:'FrontendOrigin'}]);
});
const origin='https://classroom.example.com';
const preflight=()=>new Response(null,{status:204,headers:{'access-control-allow-origin':origin,'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type'}});
test('smoke checker is read-only by default',async()=>{
 const seen=[];
 await smoke({baseUrl:'https://example.com/class',origin,report:()=>{},pause:async()=>{},fetcher:async(url,options)=>{seen.push(options.method||'GET');return options.method==='OPTIONS'?preflight():new Response('{}',{status:404});}});
 assert.deepEqual(seen,['OPTIONS','GET']);
});
test('write smoke follows real client JSON contract and retries an eventual GSI miss',async()=>{
 let reads=0;const writes=[];
 await smoke({baseUrl:'https://example.com/class',origin,write:true,report:()=>{},pause:async()=>{},fetcher:async(url,options)=>{
  if(options.method==='OPTIONS')return preflight();
  if(url.endsWith('/not-a-route'))return new Response('{}',{status:404});
  if(options.method==='POST'){
   const body=JSON.parse(options.body);writes.push(body);assert.equal(body.body,undefined);
   return new Response('{}',{status:body.stars===6?400:201,headers:{'access-control-allow-origin':origin}});
  }
  return ++reads===1?new Response('{}',{status:404}):new Response(JSON.stringify({playlistEntity:'https://www.youtube.com/watch_videos?video_ids=Fr7oYjnt3bM'}));
 }});
 assert.equal(writes.length,3);assert.equal(reads,2);
});
test('smoke fails on wrong CORS and on gateway integration failure',async()=>{
 await assert.rejects(smoke({baseUrl:'https://example.com/class',origin,report:()=>{},fetcher:async()=>new Response(null,{status:204})}),/exact allowed origin/);
 await assert.rejects(smoke({baseUrl:'http://example.com',origin}),/HTTPS/);
});
test('write smoke reports a gateway integration failure',async()=>{
 await assert.rejects(smoke({baseUrl:'https://example.com/class',origin,write:true,report:()=>{},pause:async()=>{},fetcher:async(url,options)=>options.method==='OPTIONS'?preflight():new Response('{}',{status:options.method==='POST'?502:404})}),/user returns 201 or existing-item 409/);
});
