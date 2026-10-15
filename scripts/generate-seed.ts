// The website-only preview has a new domain model. Migration 001 and seed.sql
// remain historical fixtures for tests/database.ts, not production launch data.
throw new Error(
  "Production seed generation is deferred until the new KACAU Supabase migrations and RLS are implemented. Do not overwrite the legacy seed with preview records.",
);
export {};
