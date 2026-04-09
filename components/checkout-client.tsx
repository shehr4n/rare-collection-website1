"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { checkoutAction } from "@/lib/actions";
import { bangladeshDivisions, bangladeshLocations } from "@/lib/bd-locations";
import { formatCurrency } from "@/lib/utils";

export function CheckoutClient() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [payload, setPayload] = useState("[]");
  const [paymentMethod, setPaymentMethod] = useState("Cash on delivery");
  const [division, setDivision] = useState(bangladeshDivisions[0]);
  const [district, setDistrict] = useState(Object.keys(bangladeshLocations[bangladeshDivisions[0]])[0]);
  const [area, setArea] = useState(
    bangladeshLocations[bangladeshDivisions[0]][
      Object.keys(bangladeshLocations[bangladeshDivisions[0]])[0] as keyof (typeof bangladeshLocations)[typeof bangladeshDivisions[0]]
    ][0]
  );
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const districts = Object.keys(bangladeshLocations[division]) as Array<keyof (typeof bangladeshLocations)[typeof division]>;
  const areas = bangladeshLocations[division][district];

  useEffect(() => {
    setPayload(JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const nextDistrict = Object.keys(bangladeshLocations[division])[0] as keyof (typeof bangladeshLocations)[typeof division];
    setDistrict(nextDistrict);
    setArea(bangladeshLocations[division][nextDistrict][0]);
  }, [division]);

  useEffect(() => {
    setArea(bangladeshLocations[division][district][0]);
  }, [division, district]);

  if (items.length === 0) {
    return <div className="empty-state">Your cart is empty, so checkout is not available yet.</div>;
  }

  return (
    <form
      action={async (formData) => {
        const result = await checkoutAction(formData);
        if (!result.ok) {
          window.alert("Please complete the Bangladesh shipping details correctly before placing the order.");
          return;
        }
        clearCart();
        router.push(`/checkout/success?order=${result.orderNumber}`);
      }}
      className="checkout-layout"
    >
      <div className="stack-form secure-checkout-form">
        <div className="checkout-banner">
          <p className="eyebrow">Secure Checkout</p>
          <h2>Delivery details for Bangladesh orders</h2>
          <p className="muted">
            Please provide a valid Bangladeshi mobile number and select your delivery division, city, and area.
          </p>
        </div>

        <div className="checkout-section-grid">
          <input type="text" name="customerName" placeholder="Full name" required />
          <input type="email" name="customerEmail" placeholder="Email address" required />
        </div>

        <input
          type="tel"
          name="phone"
          placeholder="Bangladeshi mobile number (e.g. 017XXXXXXXX)"
          pattern="^(\+8801|01)[3-9]\d{8}$"
          required
        />

        <div className="checkout-section-grid">
          <label>
            Division
            <select name="division" value={division} onChange={(event) => setDivision(event.target.value)} required>
              {bangladeshDivisions.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>

          <label>
            City / District
            <select
              name="district"
              value={district}
              onChange={(event) => setDistrict(event.target.value as typeof district)}
              required
            >
              {districts.map((entry) => (
                <option key={String(entry)} value={String(entry)}>
                  {String(entry)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Area
          <select name="area" value={area} onChange={(event) => setArea(event.target.value)} required>
            {areas.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>

        <textarea
          name="streetAddress"
          placeholder="House, road, block, village, or detailed street address"
          rows={4}
          required
        />
        <input type="text" name="landmark" placeholder="Nearby landmark or delivery note (optional)" />

        <fieldset className="payment-options">
          <legend>Payment method</legend>
          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="Cash on delivery"
              checked={paymentMethod === "Cash on delivery"}
              onChange={(event) => setPaymentMethod(event.target.value)}
            />
            Cash on delivery
          </label>
          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="bKash payment"
              checked={paymentMethod === "bKash payment"}
              onChange={(event) => setPaymentMethod(event.target.value)}
            />
            bKash payment
          </label>
        </fieldset>
        {paymentMethod === "bKash payment" ? (
          <div className="bkash-panel">
            <p className="bkash-number">Send payment to bKash: 01914554715</p>
            <input
              type="text"
              name="paymentReference"
              placeholder="Enter your bKash transaction ID"
              required
            />
          </div>
        ) : null}
        <input type="hidden" name="items" value={payload} />
        <button className="button button-primary" type="submit">
          Place order
        </button>
      </div>

      <aside className="cart-summary">
        <p className="eyebrow">Order total</p>
        <h2>{formatCurrency(total)}</h2>
        <div className="checkout-trust">
          <div className="trust-row">
            <strong>Delivery zone</strong>
            <span>All over Bangladesh</span>
          </div>
          <div className="trust-row">
            <strong>Verification</strong>
            <span>Mobile number checked before dispatch</span>
          </div>
          <div className="trust-row">
            <strong>Payment options</strong>
            <span>COD and bKash</span>
          </div>
        </div>
        <p className="muted">{items.length} items will be recorded in the owner dashboard.</p>
      </aside>
    </form>
  );
}
