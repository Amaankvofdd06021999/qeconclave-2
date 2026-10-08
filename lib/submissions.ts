import postgres from 'postgres';
// Form submissions (registration, speaker, partner) are stored in Postgres via DATABASE_URL — any
// provider works (Neon from the Vercel Marketplace, Supabase, Vercel Postgres, self-hosted). The
// table is created on first use, so a fresh database needs no manual migration step.
export type Submission={id:string,kind:string,name:string,email:string,company:string,jobTitle:string,phone:string,message:string,talkTitle:string,profile:string};
let sql:ReturnType<typeof postgres>|null=null;let ready:Promise<unknown>|null=null;
function client(){
 const url=process.env.DATABASE_URL||process.env.POSTGRES_URL;
 if(!url)throw new Error('Submission storage is not configured (set DATABASE_URL)');
 // One connection per serverless instance; prepare:false keeps it compatible with poolers (PgBouncer, Neon, Supabase).
 sql??=postgres(url,{max:1,prepare:false,idle_timeout:20,ssl:/localhost|127\.0\.0\.1/.test(url)?false:'require'});
 ready??=sql`CREATE TABLE IF NOT EXISTS submissions (
  id text PRIMARY KEY, kind text NOT NULL, name text NOT NULL, email text NOT NULL, company text NOT NULL,
  job_title text NOT NULL DEFAULT '', phone text NOT NULL DEFAULT '', message text NOT NULL DEFAULT '',
  talk_title text NOT NULL DEFAULT '', profile text NOT NULL DEFAULT '', consent boolean NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`
  .then(()=>sql!`CREATE INDEX IF NOT EXISTS idx_submissions_kind_created ON submissions (kind, created_at)`)
  .catch(e=>{ready=null;throw e});
 return {sql,ready};
}
// Idempotent on id: a retried submit with the same request id is stored once.
export async function saveSubmission(s:Submission){const {sql,ready}=client();await ready;
 await sql`INSERT INTO submissions (id,kind,name,email,company,job_title,phone,message,talk_title,profile,consent)
  VALUES (${s.id},${s.kind},${s.name},${s.email.toLowerCase()},${s.company},${s.jobTitle},${s.phone},${s.message},${s.talkTitle},${s.profile},true)
  ON CONFLICT (id) DO NOTHING`}
