# FIXIHUB Brand Identity & Compliance Architecture

Updated on 16 October 2026 to resolve Google Cloud OAuth Verification findings regarding brand uniqueness, intellectual property, and user privacy compliance.

## 1. Brand Identity Transition & Impersonation Prevention

### Previous Asset & Finding
- **Previous Asset**: `public/brand/buku-fixi-logo.jpg` (retrieved from MABOPA's Buku Fixi publisher directory).
- **Google Cloud OAuth Finding**: *"Your logo does not uniquely identify your brand and identity. Configure your app with a logo that reflects your identity and does not impersonate any other brand."*
- **Root Cause**: Buku Fixi Sdn Bhd is a distinct registered publisher. Submitting or displaying Buku Fixi's trademarked publisher logo as FIXIHUB's application logo violated Google's OAuth Application Branding Verification policies prohibiting third-party brand impersonation.

### Permanent FIXIHUB Brand Logo
FIXIHUB uses the permanent brand logo asset:
- **Canonical App Logo**: `public/brand/fixihublogo.jpg` (400 x 400 JPG).
- **Google OAuth Consent Screen PNG**: `public/brand/fixihublogo.png` (512 x 512 PNG, rendered from the canonical logo).
- **Web App PWA Suite**:
  - `public/icons/fixi-512.png` (512 x 512)
  - `public/icons/fixi-192.png` (192 x 192)
  - `public/icons/fixi-180.png` (180 x 180, Apple Touch Icon)
  - `public/icons/fixi-32.png` (32 x 32, Standard Favicon)

---

## 2. Google OAuth Verification & Privacy Policy Compliance

### Google Review Finding
- **Finding**: *"Your privacy policy page at 'https://fixihub.seladevs.my/terms' does not have sufficient content. We were unable to confirm your app's compliance. Please update your privacy policy to clearly and sufficiently detail your app's data collection and usage, then retry."*
- **Root Causes**:
  1. The Google Cloud OAuth Consent Screen configuration had `https://fixihub.seladevs.my/terms` entered in the "Privacy policy link" field (or pointing to terms instead of privacy).
  2. The previous legal template included draft/preview disclaimers (*"Preview policy — not yet effective for live orders"*), collapsed `<details>` accordions, and deferred commitments, which are disallowed by Google's OAuth Verification requirements.
  3. Missing explicit Google API Services User Data Policy Limited Use declaration and step-by-step account/data deletion mechanisms.

### Implemented Solutions
1. **Comprehensive, Live Privacy Policy (`/privacy`)**:
   - Hosted publicly at `https://fixihub.seladevs.my/privacy` without requiring authentication.
   - Removed all "Draft" and "Preview" labels; established official live effective date.
   - Fully detailed data collection: Google OAuth basic profile data (`openid`, `email`, `profile`), delivery contact information, and order receipts.
   - Fully detailed data usage: Identity authentication, order fulfillment, receipt verification, and customer service.
   - **Mandatory Limited Use Clause**: Explicit inclusion of Google's required text:
     > *"FIXIHUB's use and transfer to any other app of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements."*
   - Explicit declarations that Google user data is **never sold**, **never used for advertising or retargeting**, and **never inspected by humans** except under strict security or support circumstances.
   - Clear step-by-step data deletion process via email to `support@seladevs.my` (completed within 30 days) and direct Google Account permission revocation at `https://myaccount.google.com/permissions`.
2. **Dual-Protected Terms of Service (`/terms`)**:
   - Comprehensive Terms of Service governing platform usage, preorder campaigns, 5-minute queue reservations, and refund rules.
   - Includes a prominent header banner and Section 4 cross-referencing the Privacy Policy and Google User Data Limited Use.
   - If Google's review crawler or team accesses `/terms`, it clearly identifies the data protection terms and provides immediate access to the full Privacy Policy.
