import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const masterSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18191d" />
      <stop offset="100%" stop-color="#0c0d0f" />
    </linearGradient>

    <!-- Gold bookmark gradient -->
    <linearGradient id="bookmarkGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffdf40" />
      <stop offset="50%" stop-color="#f5ce32" />
      <stop offset="100%" stop-color="#d4a305" />
    </linearGradient>

    <!-- Subtle bookmark shadow -->
    <filter id="ribbonShadow" x="-20%" y="-10%" width="140%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.45" />
    </filter>

    <filter id="markGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Base background tile -->
  <rect width="512" height="512" rx="100" fill="url(#bg)" />
  <rect x="2" y="2" width="508" height="508" rx="98" fill="none" stroke="#2c2e35" stroke-width="3" opacity="0.5" />

  <!-- The FIXIHUB Monogram (FH + Open Bookshelf + Gold Bookmark) -->
  <g filter="url(#markGlow)">
    <!-- Left spine / Left vertical pillar (F stem) -->
    <rect x="114" y="112" width="56" height="288" rx="12" fill="#FFFFFF" />

    <!-- Top F horizontal bar -->
    <rect x="114" y="112" width="180" height="52" rx="12" fill="#FFFFFF" />

    <!-- Right spine / Right vertical pillar (H leg) -->
    <rect x="342" y="112" width="56" height="288" rx="12" fill="#FFFFFF" />

    <!-- Center connecting crossbar (forming H bridge / F middle arm) -->
    <rect x="114" y="230" width="284" height="52" rx="12" fill="#FFFFFF" />

    <!-- Editorial Gold Bookmark Ribbon hanging down the center spine -->
    <path
      d="M 228 108 L 284 108 L 284 362 L 256 334 L 228 362 Z"
      fill="url(#bookmarkGold)"
      filter="url(#ribbonShadow)"
    />
  </g>
</svg>
`.trim();

async function main() {
  const root = process.cwd();
  const brandDir = path.join(root, "public", "brand");
  const iconsDir = path.join(root, "public", "icons");

  if (!fs.existsSync(brandDir)) fs.mkdirSync(brandDir, { recursive: true });
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

  // 1. Write master SVG
  const svgPath = path.join(brandDir, "fixihub-logo.svg");
  fs.writeFileSync(svgPath, masterSvg, "utf8");
  console.log("Saved master SVG to:", svgPath);

  // 2. Generate brand logo PNG (512x512) for Google OAuth Console
  const brandPng512 = path.join(brandDir, "fixihub-logo.png");
  await sharp(Buffer.from(masterSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(brandPng512);
  console.log("Saved 512x512 brand PNG to:", brandPng512);

  // 3. Generate high-res 1024x1024 master PNG
  const brandPng1024 = path.join(brandDir, "fixihub-logo-1024.png");
  await sharp(Buffer.from(masterSvg))
    .resize(1024, 1024)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(brandPng1024);
  console.log("Saved 1024x1024 brand PNG to:", brandPng1024);

  // 4. Update PWA icons in public/icons
  const targets = [
    { name: "fixi-512.png", size: 512 },
    { name: "fixi-192.png", size: 192 },
    { name: "fixi-180.png", size: 180 },
    { name: "fixi-32.png", size: 32 },
    { name: "icon-512.png", size: 512 },
    { name: "icon-192.png", size: 192 },
  ];

  for (const target of targets) {
    const dest = path.join(iconsDir, target.name);
    await sharp(Buffer.from(masterSvg))
      .resize(target.size, target.size)
      .png({ quality: 100 })
      .toFile(dest);
    console.log(`Generated ${target.name} (${target.size}x${target.size})`);
  }

  // 5. Update public/favicon.svg
  const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#121316"/>
  <rect x="14" y="14" width="7" height="36" rx="2" fill="#FFFFFF"/>
  <rect x="14" y="14" width="22" height="7" rx="2" fill="#FFFFFF"/>
  <rect x="43" y="14" width="7" height="36" rx="2" fill="#FFFFFF"/>
  <rect x="14" y="29" width="36" height="7" rx="2" fill="#FFFFFF"/>
  <path d="M 28 13 L 36 13 L 36 46 L 32 42 L 28 46 Z" fill="#F5CE32"/>
</svg>
`.trim();
  fs.writeFileSync(path.join(root, "public", "favicon.svg"), faviconSvg, "utf8");
  console.log("Updated public/favicon.svg");
}

main().catch(console.error);
