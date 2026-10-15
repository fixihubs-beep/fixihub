import { test } from "node:test";
import assert from "node:assert/strict";
import type { User } from "@supabase/supabase-js";
import { googleProfile } from "../lib/auth";

test("Google profile never trusts user metadata for role or account email", () => {
  const user = { id: "real-user", email: "verified@example.test", identities: [{ provider: "google" }], user_metadata: {
    full_name: "Google Reader", avatar_url: "https://example.test/avatar.png", role: "superadmin", email: "other@example.test",
  } } as unknown as User;
  assert.deepEqual(googleProfile(user), { id: "real-user", email: "verified@example.test", display_name: "Google Reader", avatar_url: "https://example.test/avatar.png", role: "customer", active: true });
  user.user_metadata.fixihub_display_name = "Chosen name";
  assert.equal(googleProfile(user)?.display_name, "Chosen name");
});

test("Non-Google identities are rejected and unsafe avatars are not rendered", () => {
  const user = { id: "user", identities: [{ provider: "email" }], user_metadata: { avatar_url: "javascript:alert(1)" } } as unknown as User;
  assert.equal(googleProfile(user), null);
  user.identities = [{ provider: "google" }] as User["identities"];
  assert.equal(googleProfile(user)?.avatar_url, undefined);
  assert.equal(googleProfile(user)?.role, "customer");
});
