import { appendFileSync } from 'node:fs';
import { initialData } from '../lib/seed';
const sql = initialData.books.filter(b => b.provenance !== 'demo').map(b => `insert into fixihub_live.books(id,document) values('${b.id}','${JSON.stringify(b).replaceAll("'", "''")}'::jsonb) on conflict(id) do nothing;`).join('\n');
appendFileSync('supabase/production/commerce.sql', '\n-- Public catalogue seed only; no mock customers or orders.\nbegin;\n'+sql+'\ncommit;\n');
