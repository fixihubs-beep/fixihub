import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("server queue enforces admission, private rows, stable leases and expiry promotion", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to anon,authenticated;
      grant execute on function auth.uid() to anon,authenticated;`);
    await db.exec(
      readFileSync("supabase/production/queue-foundation.sql", "utf8"),
    );
    const ids = Array.from(
      { length: 52 },
      (_, i) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    );
    for (const id of ids)
      await db.query("insert into auth.users(id) values($1)", [id]);
    async function as(id: string) {
      await db.exec("reset role; set role authenticated;");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id,
      ]);
    }
    await as(ids[0]);
    await assert.rejects(
      db.query("select public.fixihub_queue_join()"),
      /not open/,
    );
    await db.exec("reset role; update fixihub_queue.control set enabled=true;");
    for (let i = 0; i < 52; i++) {
      await as(ids[i]);
      const result = await db.query<{
        value: { state: string; ahead: number };
      }>("select public.fixihub_queue_join() as value");
      assert.equal(result.rows[0].value.state, i < 50 ? "active" : "waiting");
      if (i >= 50) assert.equal(result.rows[0].value.ahead, i - 50);
    }
    await assert.rejects(
      db.query("select * from fixihub_queue.tickets"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select fixihub_queue.complete(auth.uid(),gen_random_uuid())"),
      /permission denied/,
    );
    await as(ids[0]);
    const original = (
      await db.query<{ value: { expires_at: string; lease_id: string } }>(
        "select public.fixihub_queue_status() as value",
      )
    ).rows[0].value;
    const repeat = (
      await db.query<{ value: { expires_at: string; lease_id: string } }>(
        "select public.fixihub_queue_join() as value",
      )
    ).rows[0].value;
    assert.equal(original.expires_at, repeat.expires_at);
    assert.equal(original.lease_id, repeat.lease_id);
    await db.exec("reset role;");
    await db.query(
      "update fixihub_queue.tickets set expires_at=clock_timestamp()-interval '1 second' where user_id=$1",
      [ids[0]],
    );
    await as(ids[50]);
    const promoted = await db.query<{ value: { state: string } }>(
      "select public.fixihub_queue_status() as value",
    );
    assert.equal(promoted.rows[0].value.state, "active");
    await as(ids[51]);
    const position = await db.query<{
      value: { ahead: number; state: string };
    }>("select public.fixihub_queue_status() as value");
    assert.equal(position.rows[0].value.state, "waiting");
    assert.equal(position.rows[0].value.ahead, 0);
    await db.exec("reset role; set role anon;");
    await assert.rejects(
      db.query("select public.fixihub_queue_status()"),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
