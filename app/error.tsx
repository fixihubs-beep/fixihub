"use client";
import { FixiError } from "@/components/fixi-feedback";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <FixiError retry={reset} />;
}
