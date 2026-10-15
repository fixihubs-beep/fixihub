import Link from "next/link";

export function FixiLoading({
  label = "Opening your next chapter…",
}: {
  label?: string;
}) {
  return (
    <div className="fixi-loading" role="status" aria-live="polite">
      <img src="/brand/buku-fixi-logo.jpg" alt="FIXI" width={64} height={64} />
      <div className="fixi-loading-track" aria-hidden="true">
        <span />
      </div>
      <p>{label}</p>
    </div>
  );
}

export function FixiError({
  missing = false,
  retry,
}: {
  missing?: boolean;
  retry?: () => void;
}) {
  return (
    <section className="fixi-error-page" aria-labelledby="fixi-error-title">
      <div className="fixi-error-brand">
        <img
          src="/brand/buku-fixi-logo.jpg"
          alt="FIXI"
          width={64}
          height={64}
        />
        <span>HUB</span>
      </div>
      <span className="fixi-error-code">
        {missing ? "404 / PAGE NOT FOUND" : "A PAUSE BETWEEN CHAPTERS"}
      </span>
      <h1 id="fixi-error-title">
        {missing
          ? "This page is missing."
          : "Something interrupted this chapter."}
      </h1>
      <p>
        {missing
          ? "The link may have changed. There are more stories waiting on the bookshelf."
          : "We couldn’t load this page. Try again, or return to the bookshelf."}
      </p>
      <div className="fixi-error-actions">
        {retry && (
          <button className="button primary" onClick={retry}>
            Try again
          </button>
        )}
        <Link
          className={`button ${retry ? "secondary" : "primary"}`}
          href="/catalog"
        >
          Browse books
        </Link>
        <Link className="text-link" href="/">
          Back to FIXIHUB ↗
        </Link>
      </div>
    </section>
  );
}
