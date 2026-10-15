"use client";
import { useState } from "react";
import type { SavedDelivery } from "@/lib/types";

const countries = [
  ["MY", "Malaysia", "+60"],
  ["SG", "Singapore", "+65"],
  ["BN", "Brunei", "+673"],
  ["ID", "Indonesia", "+62"],
  ["TH", "Thailand", "+66"],
  ["AU", "Australia", "+61"],
  ["GB", "United Kingdom", "+44"],
];
const states = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Kuala Lumpur",
  "Labuan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Penang",
  "Perak",
  "Perlis",
  "Putrajaya",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
];

export function deliveryFromForm(form: HTMLFormElement) {
  const data = new FormData(form);
  const get = (name: string) => String(data.get(name) || "").trim();
  const country = countries.find(([code]) => code === get("country"));
  const digits = get("phone")
    .replace(/[\s()-]/g, "")
    .replace(/^0+/, "");
  if (!/^\d{6,12}$/.test(digits))
    throw Error("Enter a valid contact number without the country code.");
  const phone = get("dialCode") + digits;
  if (phone.length > 16) throw Error("The contact number is too long.");
  const fields = ["recipient", "address1", "city", "postcode"];
  if (
    !country ||
    fields.some((name) => !get(name)) ||
    (get("country") !== "SG" && !get("region"))
  )
    throw Error("Complete the delivery address.");
  if (get("country") === "MY" && !/^\d{5}$/.test(get("postcode")))
    throw Error("Enter a five-digit Malaysian postcode.");
  return {
    phone,
    address: [
      get("recipient"),
      get("address1"),
      get("address2"),
      `${get("postcode")} ${get("city")}`,
      get("region"),
      `${country[1]} (${country[0]})`,
    ]
      .filter(Boolean)
      .join(", "),
  };
}

export function DeliveryFields({ initial }: { initial?: Partial<SavedDelivery> }) {
  const [country, setCountry] = useState(initial?.country || "MY");
  return (
    <>
      <div className="contact-fields">
        <label>
          Calling code
          <select
            name="dialCode"
            autoComplete="tel-country-code"
            defaultValue={initial?.dialCode || "+60"}
          >
            {countries.map(([code, name, dial]) => (
              <option key={code} value={dial} label={`${code} ${dial}`}>
                {name} ({dial})
              </option>
            ))}
          </select>
        </label>
        <label>
          Contact number
          <input
            name="phone"
            defaultValue={initial?.phone || ""}
            type="tel"
            required
            maxLength={20}
            autoComplete="tel-national"
            placeholder="12 345 6789"
          />
        </label>
      </div>
      <fieldset className="delivery-fields">
        <legend>Delivery address</legend>
        <label>
          Recipient name
          <input
            name="recipient"
            defaultValue={initial?.recipient || ""}
            required
            maxLength={100}
            autoComplete="shipping name"
          />
        </label>
        <label>
          Address line 1
          <input
            name="address1"
            defaultValue={initial?.address1 || ""}
            required
            maxLength={200}
            autoComplete="shipping address-line1"
            placeholder="House number and street"
          />
        </label>
        <label>
          Address line 2 (optional)
          <input
            name="address2"
            defaultValue={initial?.address2 || ""}
            maxLength={200}
            autoComplete="shipping address-line2"
            placeholder="Apartment, unit or building"
          />
        </label>
        <div className="address-locality">
          <label>
            Postcode
            <input
              name="postcode"
            defaultValue={initial?.postcode || ""}
              required
              maxLength={12}
              pattern={country === "MY" ? "[0-9]{5}" : undefined}
              inputMode={country === "MY" ? "numeric" : "text"}
              autoComplete="shipping postal-code"
            />
          </label>
          <label>
            City
            <input
              name="city"
            defaultValue={initial?.city || ""}
              required
              maxLength={100}
              autoComplete="shipping address-level2"
            />
          </label>
        </div>
        <label>
          Country / region
          <select
            name="country"
            autoComplete="shipping country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {countries.map(([code, name]) => (
              <option key={code} value={code}>
                {name} ({code})
              </option>
            ))}
          </select>
        </label>
        <label>
          State / province
          {country === "MY" ? (
            <select
              key="my"
              name="region"
              required
              defaultValue={initial?.country === "MY" ? initial.region || "" : ""}
              autoComplete="shipping address-level1"
            >
              <option value="" disabled>
                Select state
              </option>
              {states.map((state) => (
                <option key={state}>{state}</option>
              ))}
            </select>
          ) : (
            <input
              key={country}
              name="region"
              defaultValue={initial?.country === country ? initial.region || "" : ""}
              required={country !== "SG"}
              maxLength={100}
              autoComplete="shipping address-level1"
              placeholder={country === "SG" ? "Optional" : undefined}
            />
          )}
        </label>
      </fieldset>
    </>
  );
}
