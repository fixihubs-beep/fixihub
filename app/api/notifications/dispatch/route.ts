import { timingSafeEqual } from 'node:crypto';
import { dispatchNotifications } from '@/lib/telegram';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function GET(request:Request) {
 const secret=process.env.CRON_SECRET;
 const actual=Buffer.from(request.headers.get('authorization')||'');
 const expected=Buffer.from(`Bearer ${secret}`);
 if(!secret || actual.length!==expected.length || !timingSafeEqual(actual,expected)) return Response.json({error:'Unauthorized'},{status:401});
 try {return Response.json(await dispatchNotifications(),{headers:{'Cache-Control':'no-store'}});}
 catch {return Response.json({error:'Notification delivery is not configured or unavailable'},{status:503});}
}
