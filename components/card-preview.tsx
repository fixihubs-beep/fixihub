"use client";
import { useEffect, useRef, useState } from "react";
import { RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import type { Book } from "@/lib/types";
import { BookCover } from "./book-cover";
import { KACAU_COVER } from "@/lib/covers";

/** CSS 3D keeps a whole shelf interactive without one WebGL context per card. */
export function CardPreview({
  book,
  detail = false,
}: {
  book: Book;
  detail?: boolean;
}) {
  const [tone, setTone] = useState(book.color);
  useEffect(() => {
    setTone(book.color);
    if (!book.cover_image || book.cover_image === KACAU_COVER) return;
    let active = true;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 24;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(image, 0, 0, 24, 24);
        const pixels = ctx.getImageData(0, 0, 24, 24).data;
        const buckets = new Map<
          string,
          { n: number; r: number; g: number; b: number }
        >();
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 3] < 128) continue;
          const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
          const key = `${r >> 6},${g >> 6},${b >> 6}`;
          const bucket = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
          bucket.n++;
          bucket.r += r;
          bucket.g += g;
          bucket.b += b;
          buckets.set(key, bucket);
        }
        const dominant = [...buckets.values()].sort((a, b) => b.n - a.n)[0];
        if (active && dominant)
          setTone(
            `rgb(${Math.round(dominant.r / dominant.n)}, ${Math.round(dominant.g / dominant.n)}, ${Math.round(dominant.b / dominant.n)})`,
          );
      } catch {
        /* Keep the book's configured color if sampling is unavailable. */
      }
    };
    image.src = book.cover_image;
    return () => {
      active = false;
    };
  }, [book.cover_image, book.color]);
  const [angle, setAngle] = useState(-24);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; angle: number } | null>(null);
  const stop = () => {
    drag.current = null;
    setDragging(false);
  };
  return (
    <div
      className={`card-preview${detail ? " detail-preview" : ""}`}
      role="group"
      aria-label={`3D preview of ${book.title}`}
    >
      <div
        className="preview-backdrop"
        aria-hidden="true"
        style={{ backgroundColor: tone }}
      >
        {book.cover_image && (
          <div
            className={`preview-backdrop-art${book.cover_image === KACAU_COVER ? " jacket-front-backdrop" : ""}`}
            style={{
              backgroundImage: `url(${JSON.stringify(book.cover_image)})`,
            }}
          />
        )}
      </div>
      <div
        className="rotation-stage"
        tabIndex={0}
        role="slider"
        aria-label={`Rotate ${book.title}`}
        aria-valuemin={-180}
        aria-valuemax={180}
        aria-valuenow={Math.round(((((angle + 180) % 360) + 360) % 360) - 180)}
        aria-valuetext={`${Math.round(((((angle + 180) % 360) + 360) % 360) - 180)} degrees. Use arrow keys to rotate; Home to reset.`}
        onKeyDown={(e) => {
          if (["ArrowLeft", "ArrowRight", "Home"].includes(e.key)) {
            e.preventDefault();
            setAngle((a) =>
              e.key === "Home" ? -24 : a + (e.key === "ArrowLeft" ? -30 : 30),
            );
          }
        }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          drag.current = { x: e.clientX, angle };
          setDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current)
            setAngle(drag.current.angle + (e.clientX - drag.current.x) * 0.8);
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onLostPointerCapture={stop}
      >
        <div
          className={`book-volume${dragging ? " is-dragging" : ""}`}
          style={{ transform: `rotateX(5deg) rotateY(${angle}deg)` }}
        >
          <div className="volume-front">
            <BookCover book={book} />
          </div>
          <div className="volume-back">
            {book.back_cover_image ? (
              <BookCover
                book={{ ...book, cover_image: book.back_cover_image }}
                face="back"
              />
            ) : (
              <div
                className="plain-back"
                style={{ background: tone }}
                aria-label="Back shown in front-cover color"
              />
            )}
          </div>
          <div
            className={`volume-spine ${book.cover_image === KACAU_COVER ? "kacau-spine" : ""}`}
            style={{ backgroundColor: tone }}
          >
            {book.cover_image !== KACAU_COVER && <span>{book.title}</span>}
          </div>
          <div className="volume-pages" />
          <div className="volume-top" />
          <div className="volume-bottom" />
        </div>
      </div>
      <div className="rotation-controls">
        <button
          aria-label={`Rotate ${book.title} left`}
          onClick={() => setAngle((a) => a - 45)}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          aria-label={`Reset ${book.title} rotation`}
          onClick={() => setAngle(-24)}
        >
          <RotateCcw size={13} />
          <span>Drag to rotate</span>
        </button>
        <button
          aria-label={`Rotate ${book.title} right`}
          onClick={() => setAngle((a) => a + 45)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
