"use client";
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#fafafa",
          color: "#161616",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <main style={{ maxWidth: 560, margin: "12vh auto", padding: 28 }}>
          <img
            src="/brand/fixihublogo.jpg"
            alt="FIXIHUB"
            width={64}
            height={64}
            style={{ borderRadius: 12 }}
          />
          <p style={{ fontSize: 11, letterSpacing: 2 }}>
            FIXIHUB / A PAUSE BETWEEN CHAPTERS
          </p>
          <h1>We couldn’t open this chapter.</h1>
          <p>Please try again to reload the website.</p>
          <button
            onClick={reset}
            style={{
              background: "#161616",
              color: "#fff",
              border: 0,
              padding: "14px 22px",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Try again
          </button>
          <a href="/" style={{ color: "#161616", marginLeft: 20 }}>
            Back to FIXIHUB
          </a>
        </main>
      </body>
    </html>
  );
}
