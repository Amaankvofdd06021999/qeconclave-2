import {z} from 'zod';
import {saveSubmission} from '@/lib/submissions';
// Node runtime: the Postgres driver needs TCP sockets.
export const runtime='nodejs';
export const dynamic='force-dynamic';
const schema=z.object({id:z.string().uuid(),kind:z.enum(['registration','speaker','partner']),name:z.string().trim().min(2).max(160),email:z.string().trim().email().max(254),company:z.string().trim().min(2).max(200),jobTitle:z.string().trim().max(200).default(''),phone:z.string().trim().max(50).default(''),message:z.string().trim().max(5000).default(''),talkTitle:z.string().trim().max(250).default(''),profile:z.string().trim().max(500).default(''),consent:z.literal(true),website:z.string().max(0).optional()});
export async function POST(req:Request){
 if(req.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'Please submit through the event website.'},{status:403});
 if(!req.headers.get('content-type')?.includes('application/json'))return Response.json({error:'Unsupported request format.'},{status:415});
 try{const raw=await req.text();if(raw.length>16000)return Response.json({error:'Please shorten your message.'},{status:413});const parsed=schema.safeParse(JSON.parse(raw));if(!parsed.success)return Response.json({error:'Please check the required fields and consent.'},{status:400});const s=parsed.data;
 if(s.kind==='speaker'&&(s.talkTitle.length<5||s.message.length<40))return Response.json({error:'Please include a session title and an abstract of at least 40 characters.'},{status:400});
 if(s.profile){try{const u=new URL(s.profile);if(!['https:','http:'].includes(u.protocol))throw new Error();}catch{return Response.json({error:'Please enter a valid profile URL.'},{status:400})}}
 await saveSubmission(s);return Response.json({ok:true,id:s.id,status:'received'},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(e){if(e instanceof SyntaxError)return Response.json({error:'Please check the form and try again.'},{status:400});console.error('Submission save failed',e instanceof Error?e.message:'Unknown error');return Response.json({error:'We couldn’t save your details. Please try again, or contact info@qeconclave.com. Your input is still here.'},{status:503});}
}
