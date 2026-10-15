import { Cart } from "@/components/screens";
import { CheckoutGate } from "@/components/queue";
export default function CartPage() {
  return (
    <CheckoutGate>
      <Cart />
    </CheckoutGate>
  );
}
