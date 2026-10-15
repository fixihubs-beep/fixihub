# FIXIHUB profile

## Implemented in preview
- Header account button with name and avatar; initials when no photo is available or loading fails.
- Dropdown links to `/profile` and asks for confirmation before logout.
- Personal details: editable FIXIHUB display name, read-only account email.
- One saved delivery address per account: recipient, calling code, phone, street, optional unit, postcode, city, country and state.
- Saved details prefill checkout; editing a profile never rewrites existing orders.
- Remove saved address, order history shortcut and privacy link.
- Guest access offers sign-in instead of profile fields. Preview data persists locally; account switching uses separate profile records.
- Logout clears the bag, preserves saved records and does not extend a checkout timer.

## Google integration, deferred until requested
- Use verified Supabase authentication identity, not a client-submitted email, to own profile records.
- On first login, populate the display name, account email and avatar URL from the authenticated Google identity. Preserve a customer's later display-name edits.
- Never let customer metadata assign roles or staff permissions.
- Add owner-only profile/address update policies, with separately scoped operational access. Validate address fields on the server as well as in the form.
- Keep account email bound to authentication; delivery contact changes must not reassign order ownership.
- End the authenticated Supabase session on logout. Do not cancel paid orders or extend queue leases.
- Google OAuth is not enabled by this change; no real Google profile is fetched in preview.

## Validation
Browser flow covers saved-address persistence, checkout prefilling, isolation across preview identities, guest handling, logout cancellation/confirmation and a 320px viewport.
