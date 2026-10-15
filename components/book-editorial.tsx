"use client";
import { useState } from "react";
import {
  bookEditorial,
  CONTENT_RETRIEVED,
  FILM_POSTER,
} from "@/lib/book-editorial";
import type { Book } from "@/lib/types";

export function BookSynopsis({ book }: { book: Book }) {
  const info = bookEditorial(book);
  if (!info) return <p>{book.description}</p>;
  return (
    <div className="book-synopsis">
      <h2>Synopsis</h2>
      <p lang="ms">{info.synopsis}</p>
      {info.editionNote && <p className="editorial-note">{info.editionNote}</p>}
      <a
        className="editorial-source"
        href={info.source.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        Summary adapted from {info.source.label} ↗
      </a>
    </div>
  );
}

export function BookInsights({ book }: { book: Book }) {
  const info = bookEditorial(book);
  if (!info) return null;
  return (
    <div className="book-insights">
      {info.profile && (
        <details>
          <summary>About {book.author}</summary>
          <p lang="ms">{info.profile.text}</p>
          <a
            className="editorial-source"
            href={info.profile.source.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {info.profile.source.label} ↗
          </a>
        </details>
      )}
      {info.rating && (
        <details>
          <summary>
            Reader rating <span>★ {info.rating.value.toFixed(2)} / 5</span>
          </summary>
          <p>{info.rating.edition}</p>
          <a
            className="editorial-source"
            href={info.rating.source.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {info.rating.source.label} · {info.rating.count}{" "}
            {info.rating.countLabel} ↗
          </a>
          <p className="editorial-note">
            Indexed snapshot retrieved {CONTENT_RETRIEVED}. Scores may have
            changed; this is not a FIXIHUB rating.
          </p>
        </details>
      )}
    </div>
  );
}

export function FilmPoster() {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="film-poster">
      <a href={FILM_POSTER.source} target="_blank" rel="noopener noreferrer">
        {failed ? (
          <span className="poster-fallback">View KACAU movie poster ↗</span>
        ) : (
          <img
            src={FILM_POSTER.image}
            alt="KACAU movie poster — in cinemas 12 November 2026"
            width="250"
            height="375"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
        )}
      </a>
      <figcaption>
        Movie poster ·{" "}
        <a href={FILM_POSTER.source} target="_blank" rel="noopener noreferrer">
          Cinema Online ↗
        </a>
      </figcaption>
    </figure>
  );
}
