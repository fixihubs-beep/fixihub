"use client";
import { useState } from "react";
import type { Book } from "@/lib/types";
import { KACAU_COVER } from "@/lib/covers";

export function BookCover({
  book,
  small = false,
  face = "front",
  priority = false,
}: {
  book: Book;
  small?: boolean;
  face?: "front" | "back";
  priority?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showCover = Boolean(book.cover_image && failedSrc !== book.cover_image);
  const wrap = book.cover_image === KACAU_COVER;

  return (
    <div
      className={
        "book-cover " +
        (small ? "small " : "") +
        (wrap ? `kacau-cover cover-${face}` : "")
      }
      style={{ "--cover": book.color } as React.CSSProperties}
    >
      {showCover ? (
        <img
          src={book.cover_image!}
          alt={
            face === "back"
              ? `Back cover of ${book.title}`
              : `Kulit buku ${book.title}`
          }
          className="cover-img"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          onError={() => setFailedSrc(book.cover_image || null)}
        />
      ) : (
        <>
          <span className="cover-edition">
            {book.provenance === "demo"
              ? "DEMO / FICTION"
              : "OFFICIAL COVER PENDING"}
          </span>
          <strong>{book.title}</strong>
          <div className="cover-art">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <span className="cover-author">{book.author}</span>
          <span className="cover-mark">
            FH
            <span>
              FIXIHUB
              <br />
              PREVIEW
            </span>
          </span>
        </>
      )}
      <div className="book-spine" />
    </div>
  );
}
