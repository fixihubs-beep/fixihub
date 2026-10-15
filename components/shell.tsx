"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  ShoppingBag,
  Sun,
  Moon,
  Menu,
  X,
  LayoutDashboard,
  Download,
} from "lucide-react";
import { useHub } from "./provider";
import { can } from "@/lib/preorder";
import { FeedbackButton } from "./feedback-button";
import { AccountMenu } from "./account-menu";
import { FixiLoading } from "./fixi-feedback";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function Shell({ children }: { children: React.ReactNode }) {
  const h = useHub(),
    path = usePathname(),
    [dark, setDark] = useState(false),
    [menu, setMenu] = useState(false),
    [install, setInstall] = useState<InstallEvent | null>(null),
    [offline, setOffline] = useState(false);
  useEffect(() => {
    setDark(localStorage.getItem("fixihub-theme") === "dark");
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    const handler = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    const online = () => setOffline(!navigator.onLine);
    online();
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => setMenu(false), [path]);
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="topline">
        <span>FIXIHUB / THE INDEPENDENT BOOKSHELF</span>
        <span>
          {h.demo
            ? "PREVIEW · NO REAL PAYMENTS"
            : h.commerceAvailable ? "KACAU PREORDERS OPEN" : "WEBSITE PREORDERS COMING SOON"}{" "}
          <span className="dot" />
        </span>
      </div>
      <header className="header">
        <Link className="brand" href="/" aria-label="FIXIHUB home">
          <img
            className="fixi-mark"
            src="/brand/fixihublogo.jpg"
            alt="FIXIHUB"
            width={58}
            height={58}
          />
          <span className="hub-lockup">
            <span className="hub-word">HUB</span>
            <span className="hub-caption">THE INDEPENDENT BOOKSHELF</span>
          </span>
        </Link>
        <nav className={menu ? "nav open" : "nav"} aria-label="Main navigation">
          {[
            ["/", "Discover"],
            ["/catalog", "All books"],
            ["/preorders", "Preorders"],
            ["/orders", "My orders"],
            ...(can(h.profile, "review") ? [["/admin", "Admin"]] : []),
          ].map(([url, label]) => (
            <Link key={url} href={url} className={path === url ? "active" : ""}>
              {label}
              {label === "Preorders" && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="icon-button theme"
            onClick={() => {
              setDark(!dark);
              localStorage.setItem("fixihub-theme", dark ? "light" : "dark");
            }}
            aria-label={dark ? "Use light theme" : "Use dark theme"}
          >
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <AccountMenu />
          <Link
            href="/cart"
            className="bag"
            aria-label={
              "Shopping bag, " +
              h.cart.reduce((s, i) => s + i.quantity, 0) +
              " items"
            }
          >
            <ShoppingBag size={18} />
            <span>{h.cart.reduce((s, i) => s + i.quantity, 0)}</span>
          </Link>
          <button
            aria-label="Toggle navigation"
            aria-expanded={menu}
            className="icon-button mobile-menu"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {offline && (
        <div className="notice">
          You’re offline. Reconnect to submit orders, receipts or account
          changes.
        </div>
      )}
      {h.error && (
        <div className="notice error" role="alert">
          {h.error}{" "}
          <button onClick={() => void h.refresh()}>Retry connection</button>
        </div>
      )}
      <main id="main">{h.ready ? children : <FixiLoading />}</main>
      <footer>
        <div>
          <Link className="brand" href="/">
            <img
              className="fixi-mark"
              src="/brand/fixihublogo.jpg"
              alt="FIXIHUB"
              width={58}
              height={58}
            />
            <span className="hub-lockup">
              <span className="hub-word">HUB</span>
              <span className="hub-caption">THE INDEPENDENT BOOKSHELF</span>
            </span>
          </Link>
          <p>Good stories deserve a better home.</p>
          <small>
            KACAU: Movie Tie-In · Ariff Adly · 328 pages.
            <br />
            Expected publication 1 November 2026. Artwork belongs to its owners.
          </small>
        </div>
        <div className="footer-links">
          <Link href="/about">
            Preorder information <ArrowUpRight size={14} />
          </Link>
          <Link href="/admin">
            <LayoutDashboard size={15} /> Publisher workspace
          </Link>
          
          {install && (
            <button
              onClick={async () => {
                await install.prompt();
                await install.userChoice;
                setInstall(null);
              }}
            >
              <Download size={15} /> Install FIXIHUB
            </button>
          )}
        </div>
        <div className="footer-note">
          <BookOpen size={22} />
          <span>
            MADE FOR
            <br />
            THE NEXT CHAPTER.
          </span>
        </div>
        <div className="footer-credit">
          <nav className="footer-legal" aria-label="Legal information">
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </nav>
          <span>Made by</span>{" "}
          <a href="https://seladevs.my" target="_blank" rel="noopener noreferrer">
            seladevs.my
          </a>
        </div>
      </footer>
      <FeedbackButton />
      {h.toast && (
        <div className="toast" role="status">
          {h.toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => h.notify("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
