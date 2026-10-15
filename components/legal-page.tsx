import Link from "next/link";
import { Shield, Lock, FileText, CheckCircle2, ArrowRight, Mail, ExternalLink } from "lucide-react";

export function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const isPrivacy = kind === "privacy";

  return (
    <article className="page section legal-page">
      <Link className="legal-back" href="/">
        ← Back to FIXIHUB
      </Link>

      <header className="legal-heading">
        <div className="legal-status-pill">
          <span className="legal-status-dot" />
          <span>Official Policy · Live &amp; Effective</span>
        </div>
        <h1>{isPrivacy ? "Privacy Policy" : "Terms of Service"}</h1>
        <p>
          {isPrivacy
            ? "How FIXIHUB collects, uses, protects, and handles your information and Google account data."
            : "The terms, conditions, and standards governing your use of FIXIHUB preorders and reader services."}
        </p>
        <div className="legal-meta">
          <span>Effective Date: 15 October 2026</span>
          <span className="dot" />
          <span>Platform: FIXIHUB (fixihub.seladevs.my)</span>
          <span className="dot" />
          <span>Operated by: SelaDevs (Malaysia)</span>
        </div>
      </header>

      {/* Prominent cross-reference banner */}
      <div className="legal-notice-banner">
        <div className="legal-notice-icon">
          {isPrivacy ? <Shield size={20} /> : <FileText size={20} />}
        </div>
        <div className="legal-notice-content">
          <strong>{isPrivacy ? "Transparency & Google User Data Protection" : "Privacy Policy Cross-Reference"}</strong>
          <p>
            {isPrivacy
              ? "FIXIHUB adheres strictly to the Google API Services User Data Policy, including the Limited Use requirements. Your Google information is never sold, shared with advertisers, or used for unauthorized purposes."
              : "Looking for our privacy and Google user data handling disclosures? Please read our comprehensive Privacy Policy detailing data collection, storage, and user deletion rights."}
          </p>
          <Link href={isPrivacy ? "/terms" : "/privacy"} className="legal-notice-link">
            {isPrivacy ? "View Terms of Service" : "View Full Privacy Policy"} <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {isPrivacy ? <PrivacyContent /> : <TermsContent />}

      <nav className="legal-related" aria-label="Related links">
        <Link href={isPrivacy ? "/terms" : "/privacy"}>
          {isPrivacy ? "Terms of Service" : "Privacy Policy"} →
        </Link>
        <Link href="/account">Account &amp; Sign-in →</Link>
        <Link href="/about">About &amp; Publisher Info →</Link>
      </nav>
    </article>
  );
}

function PrivacyContent() {
  return (
    <div className="legal-body">
      <section className="legal-section" id="scope">
        <h2>1. Overview &amp; Scope</h2>
        <p>
          FIXIHUB (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), accessible at{" "}
          <a href="https://fixihub.seladevs.my">https://fixihub.seladevs.my</a> and operated by SelaDevs in Malaysia, is
          an independent digital catalog and preorder platform dedicated to contemporary Malaysian independent literature.
        </p>
        <p>
          This Privacy Policy describes how we collect, store, use, and protect your personal data when you visit our website,
          authenticate using Google Sign-In, browse book catalogs, place preorders, or interact with our customer services.
          By accessing FIXIHUB, you acknowledge the data handling practices outlined in this policy.
        </p>
      </section>

      <section className="legal-section" id="collection">
        <h2>2. Information We Collect</h2>
        <p>We only collect information that is strictly necessary to provide and operate FIXIHUB services:</p>

        <h3>A. Google Account Data (Google OAuth 2.0 Sign-In)</h3>
        <p>
          When you sign in to FIXIHUB using Google, Google securely authenticates your identity and provides basic account
          profile data under standard OAuth scopes (<code>openid</code>, <code>email</code>, and <code>profile</code>):
        </p>
        <ul>
          <li><strong>Unique Google User Identifier (sub)</strong>: Used as your secure account key in our authentication system.</li>
          <li><strong>Email Address</strong>: Used to identify your account, communicate order updates, and prefill your checkout contact email.</li>
          <li><strong>Full Name &amp; Given Name</strong>: Used to personalize your account display and address customer communications.</li>
          <li><strong>Profile Avatar URL</strong>: Used solely to display your user avatar within the FIXIHUB account menu.</li>
        </ul>
        <div className="legal-callout">
          <strong>What FIXIHUB Never Accesses:</strong>
          <p>
            FIXIHUB does <em>not</em> receive or store your Google password. We do <em>not</em> request, access, or inspect
            your Gmail messages, Google Drive files, Google Contacts, Google Calendar, search history, or any other private
            Google services. We strictly request the minimum basic identity profile needed to authenticate you.
          </p>
        </div>

        <h3>B. Information You Provide Directly</h3>
        <p>When you participate in preorders or update your customer profile, you provide:</p>
        <ul>
          <li><strong>Delivery Contact Information</strong>: Recipient name, mobile contact number, and shipping address (street address, city, postcode, and state) required for parcel dispatch.</li>
          <li><strong>Order Details</strong>: Items selected, quantity, preorder campaign tier, and delivery zone (Semenanjung Malaysia or Sabah/Sarawak/Labuan).</li>
          <li><strong>Payment Verification Receipts</strong>: Proof-of-transfer image or PDF files and transaction references uploaded to confirm bank transfer payments for physical books.</li>
          <li><strong>Custom Display Name</strong>: Any optional display name you choose to set in your profile.</li>
        </ul>

        <h3>C. Technical &amp; Device Information</h3>
        <p>
          To ensure reliable performance and security, our servers and browser client maintain:
        </p>
        <ul>
          <li><strong>Session Storage</strong>: Essential client-side local storage tokens (such as Supabase authentication JWT tokens) strictly necessary to keep you securely signed in across page loads.</li>
          <li><strong>Interface Preferences</strong>: Local storage values for your preferred visual theme (dark or light mode) and active cart state.</li>
          <li><strong>Security Log Data</strong>: Standard web server connection metadata, including client IP address, browser user-agent string, and timestamp of requests, collected for diagnosing errors and mitigating DDoS or queue manipulation attacks.</li>
        </ul>
      </section>

      <section className="legal-section" id="usage">
        <h2>3. How We Use Your Information</h2>
        <p>Your information is used strictly for legitimate operational purposes:</p>
        <ul>
          <li><strong>Account Authentication &amp; Management</strong>: To verify your identity, manage your customer account, and remember your session without requiring a separate password.</li>
          <li><strong>Fulfilling Orders &amp; Preorders</strong>: To process book reservations, verify stock limits (such as the 1,000-copy limited edition of KACAU), calculate regional postage, and ship parcels to your address.</li>
          <li><strong>Payment Verification</strong>: To enable authorized staff to manually verify uploaded bank transfer receipts against merchant accounts before confirming orders.</li>
          <li><strong>Customer Support &amp; Status Updates</strong>: To provide order confirmations, notify you of publication dispatch timelines, and respond to your customer inquiries.</li>
          <li><strong>System Security &amp; Fair Access</strong>: To operate our waiting room queue (up to 50 concurrent checkout sessions) and prevent duplicate reservations or automated bot abuse.</li>
        </ul>
      </section>

      <section className="legal-section" id="google-limited-use">
        <h2>4. Google API User Data Policy &amp; Limited Use Disclosure</h2>
        <div className="legal-highlight-box">
          <div className="legal-highlight-header">
            <Lock size={18} />
            <span>Google API Services User Data Policy Compliance</span>
          </div>
          <p className="legal-highlight-quote">
            &ldquo;FIXIHUB&rsquo;s use and transfer to any other app of information received from Google APIs will adhere to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.&rdquo;
          </p>
          <ul className="legal-highlight-list">
            <li>
              <CheckCircle2 size={16} />
              <span><strong>Never Sold or Rented</strong>: We never sell, rent, monetize, or trade your Google account information, email, or personal details to any third parties, data brokers, or marketing entities.</span>
            </li>
            <li>
              <CheckCircle2 size={16} />
              <span><strong>No Advertising or Profiling</strong>: We never use or transfer Google user data for serving personalized, targeted, or retargeted advertisements, nor for credit evaluation or consumer profiling.</span>
            </li>
            <li>
              <CheckCircle2 size={16} />
              <span><strong>Strictly Limited Transfer</strong>: We do not transfer Google user data to any external parties except as strictly required to provide or improve FIXIHUB&rsquo;s core customer-facing functionality, comply with applicable laws, or with your explicit consent.</span>
            </li>
            <li>
              <CheckCircle2 size={16} />
              <span><strong>Restricted Human Access</strong>: Human personnel at FIXIHUB do not view your Google profile data unless you have given explicit affirmative consent for technical troubleshooting, it is strictly required to resolve a verified security incident, or required by law.</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="legal-section" id="security">
        <h2>5. Data Storage, Security &amp; Encryption</h2>
        <p>
          We employ robust, industry-standard technical and organizational security measures to protect your personal data:
        </p>
        <ul>
          <li><strong>Encryption in Transit</strong>: All web traffic and API communications are encrypted using Transport Layer Security (TLS 1.3 / HTTPS).</li>
          <li><strong>Encrypted Database Infrastructure</strong>: User records and authentication mappings are stored in PostgreSQL databases managed by Supabase, encrypted at rest using AES-256 encryption.</li>
          <li><strong>Row-Level Security (RLS)</strong>: Strict database-level access rules ensure that customers can only query and modify their own personal profile, cart, and order records.</li>
          <li><strong>Private Receipt Storage</strong>: Uploaded payment verification receipts are stored in private, access-controlled cloud storage buckets. Receipts are never publicly accessible; authorized staff access receipts exclusively via temporary, cryptographically signed URLs that expire automatically after 60 seconds.</li>
        </ul>
      </section>

      <section className="legal-section" id="third-parties">
        <h2>6. Third-Party Service Providers</h2>
        <p>
          We do not sell your personal data. We disclose information only to trusted service providers who assist us in operating FIXIHUB under strict confidentiality obligations:
        </p>
        <div className="legal-table-wrapper">
          <table className="legal-table">
            <thead>
              <tr>
                <th>Service Provider</th>
                <th>Purpose</th>
                <th>Data Shared</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Google LLC</strong></td>
                <td>OAuth 2.0 user authentication</td>
                <td>OAuth callback token verification (Google User ID, email, name, avatar)</td>
              </tr>
              <tr>
                <td><strong>Supabase Inc.</strong></td>
                <td>Backend database, authentication session management, encrypted storage</td>
                <td>Customer profile, encrypted session tokens, preorder records, uploaded receipt files</td>
              </tr>
              <tr>
                <td><strong>Logistics &amp; Courier Services (e.g. PosLaju, J&amp;T)</strong></td>
                <td>Physical delivery of book preorders</td>
                <td>Recipient name, shipping address, and phone number on shipping labels</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="legal-section" id="retention">
        <h2>7. Data Retention Policy</h2>
        <p>We retain personal information only for as long as necessary to fulfill the purposes set out in this Privacy Policy:</p>
        <ul>
          <li><strong>Account Data</strong>: Retained for the lifetime of your active customer account with FIXIHUB.</li>
          <li><strong>Preorder &amp; Commercial Records</strong>: Retained for up to 7 years in compliance with Malaysian tax, commercial accounting, and consumer protection statutory requirements, after which records are securely destroyed or permanently anonymized.</li>
          <li><strong>Queue &amp; Temporary Sessions</strong>: Checkout queue tickets expire automatically after 5 minutes of inactivity and are purged regularly from database memory.</li>
          <li><strong>Browser Storage</strong>: Local storage tokens and cart data persist on your device until you sign out or clear your browser cache.</li>
        </ul>
      </section>

      <section className="legal-section" id="user-rights">
        <h2>8. Your Privacy Rights &amp; How to Delete Your Data</h2>
        <p>You have full control over your personal data under applicable data protection laws:</p>
        <ul>
          <li><strong>Right to Access</strong>: You may view your profile information, saved addresses, and past order history anytime in your <Link href="/profile">FIXIHUB Profile</Link>.</li>
          <li><strong>Right to Rectification</strong>: You can update your display name or shipping address directly in your profile before an order enters dispatch.</li>
          <li><strong>Right to Erasure (Account &amp; Data Deletion)</strong>: You have the right to request the complete deletion of your account and associated personal data.</li>
        </ul>

        <div className="legal-callout">
          <strong>Step-by-Step Instructions to Request Account &amp; Data Deletion:</strong>
          <ol>
            <li>
              Send an email to our privacy team at{" "}
              <a href="mailto:support@seladevs.my?subject=Data%20Deletion%20Request">support@seladevs.my</a> with the subject
              line <code>Data Deletion Request</code>.
            </li>
            <li>
              Please send the request from the Google email address registered with your FIXIHUB account to verify ownership.
            </li>
            <li>
              Our support team will verify your request and permanently purge your customer profile, Google subject ID linkage,
              and private contact records from our live database within <strong>30 calendar days</strong>.
            </li>
            <li>
              You will receive an email confirmation once your account and associated records have been successfully purged.
            </li>
          </ol>
        </div>

        <p>
          <strong>Revoking Google Permissions Directly:</strong> You can disconnect FIXIHUB from your Google account at any time
          by visiting your Google Account Security settings at{" "}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://myaccount.google.com/permissions <ExternalLink size={12} style={{ display: "inline" }} />
          </a>
          . Revoking access prevents FIXIHUB from receiving any future account data from Google.
        </p>
      </section>

      <section className="legal-section" id="cookies">
        <h2>9. Cookies &amp; Local Storage</h2>
        <p>
          FIXIHUB does <strong>not</strong> use third-party tracking cookies, analytics pixels, or advertising beacons.
          We use strictly necessary browser storage mechanisms:
        </p>
        <ul>
          <li><code>sb-*-auth-token</code>: Secure JSON Web Tokens (JWT) issued by Supabase to maintain your active authentication session.</li>
          <li><code>fixihub-theme</code>: Remembers whether you selected the dark or light interface theme.</li>
          <li><code>fixihub-bag</code>: Keeps track of books added to your shopping bag during your browsing session.</li>
        </ul>
        <p>You can clear this storage at any time through your browser settings, which will sign you out and reset your local cart.</p>
      </section>

      <section className="legal-section" id="children">
        <h2>10. Children&rsquo;s Privacy</h2>
        <p>
          FIXIHUB is intended for general audiences and is not directed at children under the age of 13. We do not knowingly
          collect or solicit personal information from children under 13 years of age. If we learn that we have collected
          personal information from a child under 13 without verifiable parental consent, we will promptly delete that information.
        </p>
      </section>

      <section className="legal-section" id="changes">
        <h2>11. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect operational improvements, service enhancements, or
          statutory updates. When changes are made, we will update the &ldquo;Effective Date&rdquo; at the top of this page.
          We encourage you to review this policy periodically.
        </p>
      </section>

      <section className="legal-section" id="contact">
        <h2>12. Contact Information</h2>
        <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
        <div className="legal-contact-card">
          <div className="legal-contact-row">
            <Mail size={16} />
            <span>Privacy &amp; Support Email: <a href="mailto:support@seladevs.my">support@seladevs.my</a></span>
          </div>
          <div className="legal-contact-row">
            <ExternalLink size={16} />
            <span>Platform Website: <a href="https://fixihub.seladevs.my">https://fixihub.seladevs.my</a></span>
          </div>
          <div className="legal-contact-row">
            <Shield size={16} />
            <span>Platform Operator: SelaDevs (Malaysia)</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="legal-body">
      <section className="legal-section" id="acceptance">
        <h2>1. Acceptance of Terms</h2>
        <p>
          Welcome to FIXIHUB (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), operated by SelaDevs in Malaysia at{" "}
          <a href="https://fixihub.seladevs.my">https://fixihub.seladevs.my</a>. By accessing, browsing, signing into, or placing
          preorders on FIXIHUB, you agree to be legally bound by these Terms of Service and all applicable laws and regulations.
          If you do not agree to these terms, please discontinue using the service.
        </p>
      </section>

      <section className="legal-section" id="service-description">
        <h2>2. Service Description &amp; Platform Role</h2>
        <p>
          FIXIHUB is an independent Malaysian literature hub and preorder platform designed to spotlight independent fiction
          and connect readers with authentic editions. We provide public catalog browsing, curated book previews, 3D interactive
          book models, and managed preorder campaigns for featured publications.
        </p>
      </section>

      <section className="legal-section" id="accounts">
        <h2>3. Google Sign-In &amp; User Accounts</h2>
        <p>
          To maintain security without storing customer passwords, FIXIHUB uses <strong>Google Sign-In</strong> as its primary
          authentication method.
        </p>
        <ul>
          <li><strong>Account Creation</strong>: Signing in with your authorized Google account automatically creates a customer profile linked to your Google Subject identifier.</li>
          <li><strong>Accuracy of Information</strong>: You agree to provide accurate, current, and complete delivery and contact information when placing orders.</li>
          <li><strong>Account Responsibility</strong>: You are responsible for maintaining the security of your Google account and for all activities that occur under your session. If you use a shared or public computer, always sign out of FIXIHUB when finished.</li>
        </ul>
      </section>

      <section className="legal-section" id="terms-privacy">
        <h2>4. Data Protection &amp; Privacy Notice</h2>
        <div className="legal-highlight-box">
          <div className="legal-highlight-header">
            <Shield size={18} />
            <span>Comprehensive Privacy Disclosures</span>
          </div>
          <p>
            Your privacy is of paramount importance to us. Our data collection, usage, and security practices are governed
            by our comprehensive <Link href="/privacy"><strong>Privacy Policy</strong></Link>.
          </p>
          <ul className="legal-highlight-list">
            <li>
              <CheckCircle2 size={16} />
              <span>We adhere strictly to the Google API Services User Data Policy, including Limited Use requirements.</span>
            </li>
            <li>
              <CheckCircle2 size={16} />
              <span>Google user data is never sold, shared with advertisers, or used for commercial marketing.</span>
            </li>
            <li>
              <CheckCircle2 size={16} />
              <span>You have the right to request deletion of your account and personal data at any time via <a href="mailto:support@seladevs.my">support@seladevs.my</a>.</span>
            </li>
          </ul>
          <p style={{ marginTop: 12 }}>
            <Link href="/privacy" className="legal-notice-link">
              Read the Complete Privacy Policy &amp; Google Data Disclosures →
            </Link>
          </p>
        </div>
      </section>

      <section className="legal-section" id="preorders">
        <h2>5. Preorders, Pricing &amp; Stock Limits</h2>
        <p>
          FIXIHUB manages dedicated preorder campaigns for select literary works. Key campaign terms include:
        </p>
        <ul>
          <li><strong>Featured Edition</strong>: <em>KACAU: Movie Tie-In</em> by Ariff Adly. RM30 per copy, 328 pages, published in paperback format.</li>
          <li><strong>Strict Production Limits</strong>: This edition is strictly limited to 1,000 numbered physical copies with no reprint. Preorders close automatically once the allocation is exhausted.</li>
          <li><strong>Transparent Shipping Rates</strong>: Shipping is charged at a flat rate of RM5 per order for Semenanjung Malaysia (Peninsular), and RM10 per order for Sabah, Sarawak, and Labuan.</li>
          <li><strong>Estimated Timelines</strong>: Physical dispatch is projected to commence around 1 November 2026. Dates provided are good-faith estimates and subject to printing and courier schedules.</li>
        </ul>
      </section>

      <section className="legal-section" id="checkout-queue">
        <h2>6. Checkout Queue &amp; Payment Verification</h2>
        <p>
          To ensure fairness during high-demand releases, FIXIHUB employs an automated waiting room and checkout queue:
        </p>
        <ul>
          <li><strong>Queue Capacity</strong>: Up to 50 customers are admitted to checkout concurrently.</li>
          <li><strong>Five-Minute Reservation Window</strong>: Once admitted to checkout, you have a 5-minute checkout lease to submit your delivery address and payment verification receipt. If the timer expires before submission, the reserved copies are released back to other waiting readers.</li>
          <li><strong>Payment Method</strong>: Payment is completed via merchant QR / direct bank transfer to our designated merchant account, followed by uploading your payment proof (receipt image or reference number).</li>
          <li><strong>Verification Process</strong>: Submitting an order and receipt places your preorder in &ldquo;Under Review&rdquo; status. Staff manually verify the bank transfer before confirming the preorder. Orders with unverified or fraudulent payment proofs will be cancelled.</li>
        </ul>
      </section>

      <section className="legal-section" id="cancellations">
        <h2>7. Cancellations, Refunds &amp; Deliveries</h2>
        <ul>
          <li><strong>Unpaid / Pending Orders</strong>: You may cancel an unpaid or pending preorder at any time prior to staff review through your orders page.</li>
          <li><strong>Verified Orders</strong>: Once payment has been verified and allocated for fulfillment, cancellation requests must be submitted to support prior to parcel dispatch.</li>
          <li><strong>Damaged or Lost Shipments</strong>: If your parcel arrives damaged or fails to arrive within the courier tracking window, contact <a href="mailto:support@seladevs.my">support@seladevs.my</a> with your order reference number and photographic evidence for a replacement or refund review.</li>
        </ul>
      </section>

      <section className="legal-section" id="ip">
        <h2>8. Intellectual Property &amp; Brand Independence</h2>
        <ul>
          <li><strong>FIXIHUB Identity</strong>: The FIXIHUB brand, stylized &ldquo;FH&rdquo; book-hub logo, software code, interface design, and custom 3D presentation systems are the exclusive intellectual property of SelaDevs.</li>
          <li><strong>Editorial Content &amp; Book Metadata</strong>: Book titles, synopses, author names, and jacket designs belong to their respective copyright holders and publishers. Display of publisher catalog metadata does not imply an exclusive endorsement.</li>
          <li><strong>Independence Disclosure</strong>: FIXIHUB is an independent reader and preorder service operated by SelaDevs. It is not owned, operated, or endorsed by Buku Fixi Sdn Bhd.</li>
        </ul>
      </section>

      <section className="legal-section" id="acceptable-use">
        <h2>9. Acceptable Use Policy</h2>
        <p>When using FIXIHUB, you agree not to:</p>
        <ul>
          <li>Upload forged, altered, or fraudulent payment receipts.</li>
          <li>Deploy automated scripts, bots, scrapers, or exploits to bypass checkout queue controls or hoard limited inventory.</li>
          <li>Impersonate any person or entity or misrepresent your affiliation with any person or organization.</li>
          <li>Interfere with or disrupt the operation of the website, servers, or connected database networks.</li>
          <li>Attempt to gain unauthorized access to administrative features, publisher workspaces, or other customers&rsquo; private records.</li>
        </ul>
      </section>

      <section className="legal-section" id="disclaimer">
        <h2>10. Disclaimer of Warranties &amp; Limitation of Liability</h2>
        <p>
          FIXIHUB is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, whether express
          or implied. While we strive for continuous availability, we do not warrant that the website will operate uninterrupted or error-free.
        </p>
        <p>
          To the maximum extent permitted by Malaysian law, SelaDevs and its operators shall not be liable for any indirect,
          incidental, consequential, or punitive damages arising out of your access to, use of, or inability to use the service.
        </p>
      </section>

      <section className="legal-section" id="governing-law">
        <h2>11. Governing Law &amp; Jurisdiction</h2>
        <p>
          These Terms of Service shall be governed by and construed in accordance with the laws of Malaysia, without regard
          to conflict of law principles. Any dispute arising under or in connection with these terms shall be subject to the
          exclusive jurisdiction of the courts of Malaysia.
        </p>
      </section>

      <section className="legal-section" id="terms-contact">
        <h2>12. Contact &amp; Inquiries</h2>
        <p>For questions or assistance regarding these Terms of Service or preorder operations, please contact:</p>
        <div className="legal-contact-card">
          <div className="legal-contact-row">
            <Mail size={16} />
            <span>Support Email: <a href="mailto:support@seladevs.my">support@seladevs.my</a></span>
          </div>
          <div className="legal-contact-row">
            <ExternalLink size={16} />
            <span>Website: <a href="https://fixihub.seladevs.my">https://fixihub.seladevs.my</a></span>
          </div>
        </div>
      </section>
    </div>
  );
}
