import test from 'node:test';
import assert from 'node:assert/strict';
import { notificationText, dispatchNotifications, type NotificationJob } from '../lib/telegram';
import { GET } from '../app/api/notifications/dispatch/route';
test('Telegram worker routes all four topics, sends the private receipt and acknowledges jobs',async()=>{
 const oldFetch=global.fetch,oldEnv={...process.env};
 Object.assign(process.env,{NEXT_PUBLIC_SUPABASE_URL:'https://project.example.test',SUPABASE_SERVICE_ROLE_KEY:'test-service-key',TELEGRAM_BOT_TOKEN:'test-token',TELEGRAM_CHAT_ID:'-100123',TELEGRAM_TOPIC_LOGIN:'2',TELEGRAM_TOPIC_FEEDBACK:'4',TELEGRAM_TOPIC_ORDER:'6',TELEGRAM_TOPIC_PAYMENT:'8'});
 const jobs:NotificationJob[]=(['LOGIN','ORDER','PAYMENT','FEEDBACK'] as const).map((kind,i)=>({id:String(i),kind,lease:'lease',attempts:1,payload:{id:String(i),order_id:'order-123',receipt_path:'private/file.pdf',name:'Reader',email:'reader@example.test',message:'Help with my order',customer_name:'Reader',address:'Full address',quantity:2,phone:'+60123456789',book_total:60,shipping_total:5}}));
 const sent:Array<{url:string;body:any}>=[],acks:string[]=[];
 global.fetch=async(input,init)=>{
  const url=String(input);
  if(url.includes('/rpc/')){const body=JSON.parse(String(init?.body));if(body.p_action==='claim')return Response.json(jobs.shift()||null);acks.push(body.p_action);return Response.json({ok:true});}
  if(url.includes('/storage/'))return new Response('%PDF-test',{headers:{'Content-Type':'application/pdf'}});
  sent.push({url,body:init?.body instanceof FormData?init.body:JSON.parse(String(init?.body))});return Response.json({ok:true,result:{message_id:100}});
 };
 try {
  assert.deepEqual(await dispatchNotifications(),{sent:4,failed:0});
  assert.deepEqual(acks,['sent','sent','sent','sent']);
  assert.equal(sent[0].body.message_thread_id,2);assert.equal(sent[1].body.message_thread_id,6);assert.equal(sent[3].body.message_thread_id,4);
  assert.match(sent[1].body.text,/Address: Full address/);assert.match(sent[1].body.text,/Quantity: 2/);
  assert.match(sent[2].url,/sendDocument$/);assert.equal(sent[2].body.get('message_thread_id'),'8');assert.ok(sent[2].body.get('document') instanceof Blob);assert.match(sent[2].body.get('caption'),/order-123/);
 }finally{global.fetch=oldFetch;process.env=oldEnv;}
});
test('worker rejects callers without the scheduler secret',async()=>{
 const response=await GET(new Request('https://example.test/api/notifications/dispatch'));
 assert.equal(response.status,401);
});
test('notification messages use plain text rather than interpreting user markup',()=>{
 const text=notificationText({id:'1',kind:'FEEDBACK',lease:'x',attempts:1,payload:{name:'<b>Reader</b>',message:'<script>alert(1)</script>',category:'Feedback'}});
 assert.ok(text.includes('<b>Reader</b>'));
});
test('Telegram rate limits leave a durable retry instead of marking delivery successful',async()=>{
 const oldFetch=global.fetch,oldEnv={...process.env};
 Object.assign(process.env,{NEXT_PUBLIC_SUPABASE_URL:'https://project.example.test',SUPABASE_SERVICE_ROLE_KEY:'test',TELEGRAM_BOT_TOKEN:'test',TELEGRAM_CHAT_ID:'-100123',TELEGRAM_TOPIC_LOGIN:'2',TELEGRAM_TOPIC_FEEDBACK:'4',TELEGRAM_TOPIC_ORDER:'6',TELEGRAM_TOPIC_PAYMENT:'8'});
 let retry:any;
 global.fetch=async(input,init)=>{
  if(String(input).includes('/rpc/')){const b=JSON.parse(String(init?.body));if(b.p_action==='claim')return Response.json({id:'job',kind:'LOGIN',lease:'lease',attempts:1,payload:{display_name:'Reader'}});retry=b;return Response.json({ok:true});}
  return Response.json({ok:false,parameters:{retry_after:120}},{status:429});
 };
 try{assert.deepEqual(await dispatchNotifications(),{sent:0,failed:1});assert.equal(retry.p_action,'retry');assert.equal(retry.p_delay,120);assert.equal(retry.p_lease,'lease');}
 finally{global.fetch=oldFetch;process.env=oldEnv;}
});
test('immediate delivery claims only the verified user scope and keeps failures for the backup',async()=>{
 const oldFetch=global.fetch,oldEnv={...process.env};
 Object.assign(process.env,{NEXT_PUBLIC_SUPABASE_URL:'https://project.example.test',SUPABASE_SERVICE_ROLE_KEY:'test',TELEGRAM_BOT_TOKEN:'test',TELEGRAM_CHAT_ID:'-100123',TELEGRAM_TOPIC_LOGIN:'2',TELEGRAM_TOPIC_FEEDBACK:'4',TELEGRAM_TOPIC_ORDER:'6',TELEGRAM_TOPIC_PAYMENT:'8'});
 let retry:any;
 global.fetch=async(input,init)=>{
  const url=String(input);
  if(url.endsWith('/fixihub_notification_claim_for_user')){assert.deepEqual(JSON.parse(String(init?.body)),{p_user:'verified-user'});return Response.json({id:'job',kind:'LOGIN',lease:'lease',attempts:1,payload:{display_name:'Reader'}});}
  if(url.includes('/rpc/')){retry=JSON.parse(String(init?.body));return Response.json({ok:true});}
  return Response.json({ok:false},{status:503});
 };
 try{assert.deepEqual(await dispatchNotifications('verified-user'),{sent:0,failed:1});assert.equal(retry.p_action,'retry');assert.equal(retry.p_id,'job');}
 finally{global.fetch=oldFetch;process.env=oldEnv;}
});
