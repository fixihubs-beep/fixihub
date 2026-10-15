import { createClient } from '@supabase/supabase-js';
import { after } from 'next/server';
import { dispatchNotifications } from '@/lib/telegram';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function POST(request:Request) {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const token=request.headers.get('authorization');
 if(!token?.startsWith('Bearer ')) return Response.json({error:'Sign in first'},{status:401});
 if(!url || !key) return Response.json({error:'Unavailable'},{status:503});
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await client.auth.getUser(token.slice(7));
 if(error || !user?.identities?.some(i=>i.provider==='google')) return Response.json({error:'Sign in with Google'},{status:401});
 // No message, destination or user ID is accepted from the caller. SQL limits jobs to this user.
 after(async()=>{try{await dispatchNotifications(user.id);}catch{console.warn('Immediate notifications unavailable; queued jobs remain for the backup worker.');}});
 return Response.json({queued:true},{status:202,headers:{'Cache-Control':'no-store'}});
}
