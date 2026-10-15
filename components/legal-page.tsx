import Link from "next/link";

type Section = { title: string; text: string[] };

const privacy: Section[] = [
  { title: "The current preview", text: ["FIXIHUB currently uses mock accounts for testing. Google sign-in and live payment collection are not enabled. Preview account changes, orders and uploaded receipts are stored in this browser. Do not submit real payment receipts or sensitive personal information during testing."] },
  { title: "Planned Google sign-in", text: ["When enabled, Google will authenticate your account and share your account identifier, email address and available basic profile information, such as your name and profile picture. We will use these details to create your FIXIHUB customer account and connect you to your orders.", "FIXIHUB will not receive your Google password or request access to your Gmail messages, contacts or Google Drive files. Your Google email will prefill your checkout contact email; please check your details before ordering. Signing in will not subscribe you to marketing messages."] },
  { title: "Order information", text: ["For live orders, we plan to collect your contact number, delivery address, order details and payment receipt. These details will be used to process orders, verify payments, arrange delivery and provide support."] },
  { title: "Sessions and browser storage", text: ["The preview uses browser storage for the shopping bag, selected account, theme, checkout queue and order progress. The live service will also need essential session storage or cookies to maintain your login.", "Signing out is different from deleting your account or stored records. Signing out of FIXIHUB will not sign you out of Google. Avoid entering personal details on shared devices."] },
  { title: "Providers and authorised access", text: ["The planned live service will use Google for sign-in and Supabase for authentication and application data. Authorised team members will receive access according to their responsibilities, including support, payment verification and fulfilment. Delivery providers will receive information needed for delivery.", "Provider hosting locations and any processing outside Malaysia will be confirmed in the launch policy. This preview also loads external resources, including Google Fonts and externally hosted artwork; those providers may receive connection information such as your IP address when a resource loads."] },
  { title: "Your choices", text: ["The launch policy will explain how to request access, corrections, account deletion or withdrawal of consent where applicable. Removing Google access will not automatically delete FIXIHUB records. Identity verification may be needed for account requests.", "For this local preview, clearing this site's browser data removes locally saved preview information from that browser, including test orders and receipts. It does not delete information held independently by external resource providers."] },
];

const terms: Section[] = [
  { title: "Using this preview", text: ["FIXIHUB is currently a testing preview. Mock identities do not authenticate real customers, and preview orders do not create real purchases. Do not make real payments using this preview."] },
  { title: "Your future FIXIHUB account", text: ["You can browse public book listings without signing in. For the planned live service, an account will be required to order and view your order history. Your first Google sign-in will create a customer account; return using the same Google account to access its orders.", "Customer sign-in will not grant staff or administrator access. Those permissions will be assigned separately by authorised administrators."] },
  { title: "Account security", text: ["Use an account you are authorised to access and provide accurate contact and delivery information. Protect your Google account and sign out of FIXIHUB on shared devices. Google manages your Google password and account recovery; FIXIHUB cannot reset that password.", "The launch service will provide a support contact for suspected unauthorised activity and account assistance."] },
  { title: "Acceptable use", text: ["Do not impersonate others, access another customer's information, submit false payment evidence or bypass stock limits, queue controls or security measures. Access may be restricted to investigate misuse or protect the service. Restrictions will not automatically remove obligations relating to existing paid orders."] },
  { title: "Preorders and checkout", text: ["Signing in, adding a book to your bag or entering the queue does not confirm an order or guarantee stock. Prices, shipping charges and checkout deadlines will be shown before submission.", "The planned queue allows up to 50 customers to check out at a time, with five minutes to submit an order and payment receipt once admitted. The current preview simulates this within one browser; it does not enforce a shared limit across real visitors.", "For live orders, receipts will require verification before confirmation. If you have paid but a session expires or confirmation is missing, contact support with your payment reference before paying again."] },
  { title: "Publication information", text: ["KACAU: Movie Tie-In is planned at RM30 per copy excluding shipping, limited to 1,000 copies with no reprint. Expected publication is 1 November 2026. Publication is not a delivery date."] },
  { title: "Account closure and availability", text: ["The live service will provide a way to request account closure. Outstanding orders, refunds and applicable recordkeeping obligations may require some records to be retained. Closing FIXIHUB access will not close your Google account.", "Login and checkout may be interrupted by maintenance, network issues or provider outages. These terms do not exclude rights or remedies that cannot lawfully be excluded."] },
];

export function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const isPrivacy = kind === "privacy";
  const sections = isPrivacy ? privacy : terms;
  return (
    <article className="page section legal-page">
      <Link className="legal-back" href="/">← Back to FIXIHUB</Link>
      <header className="legal-heading">
        <span className="eyebrow">YOUR ACCOUNT & YOUR INFORMATION</span>
        <h1>{isPrivacy ? "Privacy Policy" : "Terms of Service"}</h1>
        <p>{isPrivacy ? "How your information is handled, now and when live sign-in opens." : "What to expect when browsing, signing in and ordering with FIXIHUB."}</p>
        <small>Draft · Updated 15 October 2026</small>
      </header>
      <aside className="legal-draft">
        <strong>Preview policy — not yet effective for live orders</strong>
        <p>Google login and live payment collection are not enabled. These pages explain the current preview and the planned account experience.</p>
      </aside>
      <div className="legal-sections">
        {sections.map((section, index) => (
          <details key={section.title} open={index === 0}>
            <summary>{section.title}</summary>
            <div>{section.text.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
          </details>
        ))}
      </div>
      <nav className="legal-related" aria-label="Related information">
        <Link href={isPrivacy ? "/terms" : "/privacy"}>{isPrivacy ? "Terms of Service" : "Privacy Policy"} →</Link>
        <Link href="/account">Account & sign-in →</Link>
      </nav>
    </article>
  );
}
