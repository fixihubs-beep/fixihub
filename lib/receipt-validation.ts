export const RECEIPT_LIMIT = 10 * 1024 * 1024;
export const RECEIPT_TYPES = ["image/jpeg", "image/png", "application/pdf"];
export function validateReceiptSignature(bytes: Uint8Array, type: string) {
  const signature = type === "image/png" ? [137,80,78,71,13,10,26,10] : type === "image/jpeg" ? [255,216,255] : type === "application/pdf" ? [37,80,68,70,45] : [];
  if (!signature.length || !signature.every((byte, i) => bytes[i] === byte)) throw Error("The file content does not match its image/PDF type.");
}
