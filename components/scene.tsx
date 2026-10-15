"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import {
  CanvasTexture,
  Group,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from "three";
import { useMemo, useRef, useEffect, useState } from "react";
import type { Book } from "@/lib/types";
import { KACAU_COVER } from "@/lib/covers";
// Use the dominant front-cover tone for unscanned backs and spines.
function frontTone(texture: Texture, fallback: string) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 32;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(texture.image, 0, 0, 32, 32);
    const pixels = ctx.getImageData(0, 0, 32, 32).data;
    const buckets = new Map<
      string,
      { count: number; r: number; g: number; b: number }
    >();
    for (let i = 0; i < pixels.length; i += 4) {
      const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
      const key = `${r >> 6},${g >> 6},${b >> 6}`;
      const bucket = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0 };
      bucket.count++;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      buckets.set(key, bucket);
    }
    const tone = [...buckets.values()].sort((a, b) => b.count - a.count)[0];
    return `rgb(${Math.round(tone.r / tone.count)}, ${Math.round(tone.g / tone.count)}, ${Math.round(tone.b / tone.count)})`;
  } catch {
    return fallback;
  }
}
function useCover(url?: string | null, face: "front" | "back" = "front") {
  const [texture, setTexture] = useState<Texture | null>(null);
  useEffect(() => {
    setTexture(null);
    if (!url) return;
    let active = true;
    let loaded: Texture | null = null;
    new TextureLoader().load(
      url,
      (tex) => {
        if (!active) {
          tex.dispose();
          return;
        }
        tex.colorSpace = SRGBColorSpace;
        if (url === KACAU_COVER) {
          tex.repeat.x = 709 / 1536;
          tex.offset.x = face === "front" ? 827 / 1536 : 0;
        }
        loaded = tex;
        setTexture(tex);
      },
      undefined,
      () => {
        if (active) setTexture(null);
      },
    );
    return () => {
      active = false;
      loaded?.dispose();
    };
  }, [url, face]);
  return texture;
}
function Volume({
  book,
  x = 0,
  angle = 0,
  scale = 1,
}: {
  book: Book;
  x?: number;
  angle?: number;
  scale?: number;
}) {
  const coverTexture = useCover(book.cover_image);
  const backTexture = useCover(book.back_cover_image, "back");
  const bindingColor = useMemo(
    () => (coverTexture ? frontTone(coverTexture, book.color) : book.color),
    [coverTexture, book.color],
  );

  const fallbackTexture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 768;
    c.height = 1024;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = book.color;
    ctx.fillRect(0, 0, 768, 1024);
    ctx.fillStyle = "#172018";
    ctx.font = "bold 22px Arial";
    ctx.fillText("FICTION / MALAYSIA", 55, 72);
    ctx.font = "900 86px Arial";
    const words = book.title.split(" ");
    words.forEach((w, i) => ctx.fillText(w, 50, 190 + i * 90, 670));
    ctx.save();
    ctx.translate(390, 620);
    ctx.rotate(-0.3);
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = i % 2 ? "#eff0d9" : "#233029";
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.ellipse(0, 0, 85 + i * 28, 40 + i * 24, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = "#172018";
    ctx.font = "bold 25px Arial";
    ctx.fillText(book.author.toUpperCase(), 55, 935, 650);
    ctx.font = "bold 20px Arial";
    ctx.fillText("FH / ORIGINAL DEMO COVER", 55, 985);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, [book.title, book.author, book.color]);
  useEffect(() => () => fallbackTexture.dispose(), [fallbackTexture]);
  return (
    <group position={[x, 0, 0]} rotation={[0, angle, -0.09]} scale={scale}>
      <mesh castShadow>
        <boxGeometry args={[2, 3.1, 0.25]} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <meshStandardMaterial
            key={i}
            attach={"material-" + i}
            color={
              i === 4 || (i === 5 && backTexture)
                ? "white"
                : i === 0 || i === 2 || i === 3
                  ? "#eeeade"
                  : bindingColor
            }
            map={
              i === 4
                ? coverTexture || fallbackTexture
                : i === 5
                  ? backTexture
                  : null
            }
            roughness={0.7}
          />
        ))}
      </mesh>
      <mesh position={[-1.015, 0, 0]}>
        <boxGeometry args={[0.07, 3.13, 0.28]} />
        <meshStandardMaterial color={bindingColor} roughness={0.7} />
      </mesh>
    </group>
  );
}
function Books({ book, hero }: { book: Book; hero: boolean }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (hero && ref.current)
      ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.35) * 0.025;
  });
  return (
    <group ref={ref}>
      <Volume
        book={book}
        x={hero ? 1.15 : 0}
        angle={-0.2}
        scale={hero ? 0.9 : 1}
      />
      {hero && (
        <Volume
          book={{
            ...book,
            title: "RENJANA",
            slug: "renjana",
            author: "Qiydenneskala",
            color: "#db8871",
            cover_image: "/covers/renjana.jpg",
            back_cover_image: null,
          }}
          x={-1.15}
          angle={0.2}
          scale={0.8}
        />
      )}
    </group>
  );
}
export default function Scene({
  book,
  hero = false,
}: {
  book: Book;
  hero?: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0.4, hero ? 9.2 : 7.7], fov: 35 }}
      dpr={[1, 1.5]}
      shadows
      frameloop={hero ? "always" : "demand"}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={2} />
      <directionalLight position={[3, 6, 5]} intensity={3} castShadow />
      <Books book={book} hero={hero} />
      <ContactShadows
        position={[0, -1.9, 0]}
        opacity={0.3}
        scale={10}
        blur={2.5}
        far={5}
      />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={(2 * Math.PI) / 3}
      />
    </Canvas>
  );
}
