"use client";
import Link from "next/link";
import { useState } from "react";
import type { Book } from "@/lib/types";
import { BookCover } from "./book-cover";

export function Bookshelf({ books }: { books: Book[] }) {
  const [paused, setPaused] = useState(false);
  return (
    <section className="moving-bookshelf" aria-label="FIXIHUB bookshelf">
      <div className="bookshelf-heading">
        <h2>The FIXIHUB bookshelf.</h2>
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          {paused ? "Play bookshelf" : "Pause bookshelf"}
        </button>
      </div>
      <div className="bookshelf-window">
        <div className="bookshelf-track" data-paused={paused}>
          {[0, 1].map((copy) => (
            <div
              className="bookshelf-group"
              key={copy}
              aria-hidden={copy === 1 ? true : undefined}
            >
              {books.map((book) =>
                copy === 0 ? (
                  <Link
                    className="bookshelf-item"
                    href={`/books/${book.id}`}
                    key={book.id}
                  >
                    <BookCover book={book} />
                    <span>{book.title}</span>
                  </Link>
                ) : (
                  <div className="bookshelf-item" key={book.id}>
                    <BookCover book={book} />
                    <span>{book.title}</span>
                  </div>
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
