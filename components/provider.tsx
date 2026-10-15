"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { verifiedGoogleProfile, finishGoogleCallback, hasGoogleCallback } from "@/lib/auth";
import { liveCall, paymentSettings, submitLiveReceipt, type LiveSnapshot, type PaymentSetup } from "@/lib/live";
import { initialData } from "@/lib/seed";
import { withBookCover } from "@/lib/covers";
import { quote, receiptValid } from "@/lib/rules";
import { validateReceiptSignature } from "@/lib/receipt-validation";
import { KACAU_ID } from "@/lib/preorder";
import type { Book, Campaign, CartItem, Data, Order, Profile, SavedDelivery } from "@/lib/types";
const CART = "fixihub-live-cart:";
const emptyData = (): Data => ({ books: initialData.books, campaigns: initialData.campaigns.map(c => ({...c, active:false})), orders:[], payments:[], profiles:[], events:[], entitlements:[], access:[] });
type Hub = {
  data: Data;
  profile: Profile | null;
  demo: boolean;
  commerceAvailable: boolean;
  paymentReady: boolean;
  backendReady: boolean;
  receiptServerReady: boolean;
  payment: PaymentSetup | null;
  ready: boolean;
  error: string;
  toast: string;
  cart: CartItem[];
  notify: (message: string) => void;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  add: (book: Book, campaign?: Campaign) => void;
  placeOrder: (
    address: string,
    key: string,
    phone?: string,
    email?: string,
    destination?: { country: string; region: string },
  ) => Promise<string>;
  upload: (
    order: string,
    kind: "book" | "shipping",
    file: File,
    reference?: string,
  ) => Promise<void>;
  receipt: (path: string) => Promise<string>;
  review: (id: string, approve: boolean, note: string) => Promise<void>;
  transition: (
    id: string,
    action: "cancel" | "prepare" | "request_refund" | "refund",
    note: string,
  ) => Promise<void>;
  saveBook: (book: Book) => Promise<void>;
  saveCampaign: (campaign: Campaign) => Promise<void>;
  changeRole: (
    id: string,
    role: Profile["role"],
    active: boolean,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  saveDelivery: (delivery: SavedDelivery | undefined) => Promise<void>;
  refresh: () => Promise<void>;
};
const Context = createContext<Hub | null>(null);
export function useHub() {
  const hub = useContext(Context);
  if (!hub) throw Error("Missing provider");
  return hub;
}
export function Provider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data>(emptyData);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false), [error, setError] = useState(""), [toast, notify] = useState("");
  const [backendReady, setBackendReady] = useState(false), [serverReady, setServerReady] = useState(false);
  const [payment, setPayment] = useState<PaymentSetup | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const owner = useRef<string | null>(null), generation = useRef(0), alive = useRef(false), cartLoaded = useRef(false), initializing = useRef(true);
  async function refresh(callback = false) {
    const version = ++generation.current;
    try {
      if (callback) await finishGoogleCallback();
      const user = await verifiedGoogleProfile();
      if (!alive.current || version !== generation.current) return;
      if (owner.current !== (user?.id || null) || !cartLoaded.current) {
        owner.current = user?.id || null; cartLoaded.current = true;
        let saved: CartItem[] = [];
        try { const value = JSON.parse(sessionStorage.getItem(CART + (owner.current || "guest")) || "[]"); if (Array.isArray(value)) saved = value; } catch {}
        setCart(saved); setData(emptyData());
      }
      setProfile(current => current?.id === user?.id && current && user ? { ...user, role: current.role, active: current.active } : user); setError("");
      try {
        const [snapshot, server] = await Promise.all([
          liveCall<LiveSnapshot>(user ? "snapshot" : "catalog"),
          fetch("/api/commerce-status", { cache:"no-store" }).then(r => r.json()),
        ]);
        const merchant = await paymentSettings().catch(() => snapshot.payment);
        if (!alive.current || version !== generation.current) return;
        setData({ books:(snapshot.books || initialData.books).map(withBookCover), campaigns:snapshot.campaigns || [], orders:snapshot.orders || [], payments:snapshot.payments || [], profiles:snapshot.profiles || [], events:snapshot.events || [], entitlements:[], access:[] });
        setProfile(snapshot.profile || user); setPayment(merchant); setBackendReady(true); setServerReady(server.ready === true);
      } catch {
        if (!alive.current || version !== generation.current) return;
        setProfile(user); setData(emptyData()); setBackendReady(false); setServerReady(false); setPayment(null);
      }
    } catch(e) {
      if (alive.current && version === generation.current) {
        owner.current = null; setProfile(null); setData(emptyData()); setCart([]); setBackendReady(false); setPayment(null); setError((e as Error).message);
      }
    } finally { if (alive.current && version === generation.current) setReady(true); }
  }
  useEffect(() => {
    alive.current = true;
    // Legacy mock identities are never read or accepted as credentials.
    try { sessionStorage.removeItem("fixihub-preview-identity"); } catch {}
    initializing.current = true;
    void refresh(hasGoogleCallback()).finally(() => { if (alive.current) initializing.current = false; });
    const subscription = supabase?.auth.onAuthStateChange(event => {
      if (event === "INITIAL_SESSION" || initializing.current) return;
      if (event === "SIGNED_OUT") {
        ++generation.current; owner.current = null; setProfile(null); setData(emptyData()); setCart([]); setPayment(null); setBackendReady(false); setError("");
      }
      setTimeout(() => { if (alive.current) void refresh(); }, 0);
    });
    return () => { alive.current = false; ++generation.current; subscription?.data.subscription.unsubscribe(); };
  }, []);
  useEffect(() => { if (ready) { try { sessionStorage.setItem(CART + (profile?.id || "guest"),JSON.stringify(cart)); } catch {} } },[cart,ready,profile?.id]);
  useEffect(() => { if (!ready) return; const timer=setInterval(() => void refresh(),15000); return () => clearInterval(timer); },[ready,profile?.id]);
  useEffect(() => { if (!toast) return; const timer=setTimeout(() => notify(""),6000); return () => clearTimeout(timer); },[toast]);
  const paymentReady = backendReady && serverReady && !!payment?.payee && !!payment?.qr_url;
  const campaign = data.campaigns.find(c => c.book_id === KACAU_ID);
  const commerceAvailable = paymentReady && !!payment?.enabled && !!campaign?.active && Date.now() >= Date.parse(campaign.opens_at) && Date.now() < Date.parse(campaign.closes_at);
  async function logout() {
    if (!supabase) throw Error("Sign-in is not configured.");
    const id=owner.current;
    const result=await supabase.auth.signOut({scope:"local"});
    if(result.error) throw Error("Could not sign out. Please try again.");
    sessionStorage.removeItem(CART+(id || "guest"));
    ++generation.current; owner.current=null; setProfile(null); setData(emptyData()); setCart([]); setPayment(null); setBackendReady(false); setError("");
  }
  function add(book: Book,campaign?: Campaign) {
    try {
      if(!commerceAvailable) throw Error("Preorders are not open yet.");
      const next=cart.some(i=>i.book_id===book.id)?cart.map(i=>i.book_id===book.id?{...i,quantity:i.quantity+1}:i):[...cart,{book_id:book.id,quantity:1,campaign_id:campaign?.id}];
      quote(next,data.books,data.campaigns); setCart(next); notify("KACAU added to your bag.");
    } catch(e) {notify((e as Error).message);}
  }
  async function change(action:string,input:object,message:string) { await liveCall(action,input); await refresh(); notify(message); }
  async function placeOrder(address:string,key:string,phone="",email="",destination?:{country:string;region:string}) {
    if(!profile) throw Error("Sign in with Google first.");
    if(!commerceAvailable) throw Error("Checkout is not open.");
    if(cart.length!==1 || cart[0].book_id!==KACAU_ID) throw Error("Only KACAU is available for preorder.");
    const order=await liveCall<Order>("order.create",{request_id:key,quantity:cart[0].quantity,address,phone,email,...destination});
    setCart([]); sessionStorage.removeItem(CART+profile.id); await refresh(); notify("Order reserved. Upload your receipt before the timer ends."); return order.id;
  }
  async function upload(id:string,kind:"book"|"shipping",file:File,reference="") {
    receiptValid(file); validateReceiptSignature(new Uint8Array(await file.slice(0,8).arrayBuffer()),file.type);
    if(kind!=="book") throw Error("Submit one receipt for the full order total.");
    if(reference.trim().length<3 || reference.length>120) throw Error("Enter a transfer reference (3–120 characters).");
    await submitLiveReceipt(id,file,reference); await refresh(); notify("Receipt submitted for review.");
  }
  async function receipt(path:string) {
    if(!supabase) throw Error("Sign in first.");
    const result=await supabase.storage.from("fixihub-receipts").createSignedUrl(path,120);
    if(result.error) throw Error("Receipt access denied or expired. Reopen the receipt.");
    return result.data.signedUrl;
  }
  async function updateName(name:string) {
    if(!supabase || !profile) throw Error("Sign in first.");
    if(!name.trim() || name.length>100) throw Error("Enter a name of 1–100 characters.");
    const result=await supabase.auth.updateUser({data:{fixihub_display_name:name.trim()}});
    if(result.error) throw Error("Your name could not be saved. Please try again.");
    await refresh(); notify("Profile saved.");
  }
  return <Context.Provider value={{data,profile,demo:false,commerceAvailable,paymentReady,backendReady,receiptServerReady:serverReady,payment,ready,error,toast,cart,notify,setCart,add,placeOrder,upload,receipt,logout,updateName,refresh,
    review:(id,approve,note)=>change("payment.review",{id,approve,note,bank_checked:approve},approve?"Payment approved.":"Receipt rejected with correction instructions."),
    transition:(id,action,note)=>change("order.transition",{id,action,note},"Order updated."),
    saveBook:book=>change("catalog.update",book,"Catalog saved."),
    saveCampaign:campaign=>change("campaign.update",campaign,"Campaign saved."),
    changeRole:(id,role,active)=>change("access.update",{id,role,active},"Account access updated."),
    saveDelivery:delivery=>change("profile.delivery",{delivery:delivery || null},delivery?"Delivery details saved.":"Saved address removed."),
  }}>{children}</Context.Provider>;
}
