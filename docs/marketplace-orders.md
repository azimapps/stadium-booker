# Marketplace Orders (Client)

Checkout, prepayment via Payme/Click, and viewing your orders through the delivery lifecycle. For product browsing and cart, see [`marketplace.md`](./marketplace.md).

Base URL: `/api/v1/client/marketplace`

**Authentication:** all endpoints require `Authorization: Bearer {user_token}` (JWT with `role: user`).

---

## Table of contents

1. [Checkout](#1-checkout)
2. [List my orders](#2-list-my-orders)
3. [Get my order](#3-get-my-order)
4. [Order lifecycle & payment flow](#4-order-lifecycle--payment-flow)
5. [Push notifications](#5-push-notifications)
6. [What you can't do](#6-what-you-cant-do)

---

## 1. Checkout

Converts the current cart into a `MarketplaceOrder` (status `awaiting_prepayment`) and returns ready-to-open Payme + Click checkout URLs. The user must complete prepayment within **5 minutes** or the order auto-cancels.

**POST** `/checkout`

#### Request

```json
{
  "address_text": "Tashkent, Yunusobod, Amir Temur ko'chasi 12",
  "address_lat": 41.3275,
  "address_lng": 69.2817
}
```

#### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| address_text | string | Yes | Min 3 chars. Free-text address (typically from Yandex Maps reverse geocode) |
| address_lat | float | Yes | Latitude |
| address_lng | float | Yes | Longitude |

Buyer phone + fullname are taken from the logged-in user — no need to send them.

#### Response (201)

```json
{
  "order_id": 42,
  "items_total": 2900000,
  "prepayment_total": 400000,
  "payment_deadline": "2026-05-19T14:35:12Z",
  "payme_url": "https://checkout.paycom.uz/bT0xMjM7YWMub3JkZXJfaWQ9NDI7...",
  "click_url": "https://my.click.uz/services/pay?service_id=...&transaction_param=42&..."
}
```

Open **either** `payme_url` **or** `click_url` (not both) in a browser / in-app webview. The user pays only `prepayment_total` online; the remaining balance (`items_total + delivery_fee − prepayment_total`) is collected in cash on delivery.

#### Errors

| Status | When |
|---|---|
| 400 | Cart is empty |
| 400 | One or more items are out-of-stock or unavailable. The offending lines are **automatically removed from the cart**, and the response body lists them. See below. |
| 401 | Missing/invalid token |
| 404 | User not found |
| 422 | Validation failed (e.g. missing address) |

#### `400 out_of_stock` response shape

```json
{
  "detail": {
    "error": "out_of_stock",
    "removed_items": [
      {"product_title": "Adidas Predator Edge Boots", "size_label": "40", "reason": "out_of_stock"},
      {"product_title": "Old Kit", "size_label": "M",  "reason": "unavailable"}
    ]
  }
}
```

`reason` is `"out_of_stock"` if stock < requested qty, or `"unavailable"` if the product/size was deleted or the product is no longer `active`. After this error, call `GET /cart` again to refresh the cart UI, then retry checkout if items remain.

> **Stock is not decremented at checkout** — only when the Payme/Click webhook confirms the payment. So two users can both reach the Payme page for the last unit; the loser gets a refund flag (rare, see lifecycle below).

---

## 2. List my orders

**GET** `/orders`

#### Query params

| Param | Type | Default | Notes |
|---|---|---|---|
| status | enum | - | Filter to one status. See [status flow](#status-flow). |
| limit | int | 20 | 1–100 |
| offset | int | 0 | ≥ 0 |

Example: `GET /orders?status=prepaid&limit=10`

#### Response (200)

Array of order objects (same shape as `GET /orders/{id}`), sorted by `created_at DESC`.

#### Errors

| Status | When |
|---|---|
| 400 | Invalid `status` value |
| 401 | Missing/invalid token |

---

## 3. Get my order

**GET** `/orders/{order_id}`

#### Response (200)

```json
{
  "id": 42,
  "user_id": 7,
  "buyer_phone": "+998901234567",
  "buyer_fullname": "Ali Karimov",

  "address_text": "Tashkent, Yunusobod, Amir Temur ko'chasi 12",
  "address_lat": 41.3275,
  "address_lng": 69.2817,

  "items_total": 2900000,
  "prepayment_total": 400000,
  "delivery_fee": 30000,
  "paid_amount": 400000,
  "total_price": 2930000,
  "remaining_amount": 2530000,

  "status": "confirmed",
  "payment_deadline": "2026-05-19T14:35:12Z",

  "prepaid_at": "2026-05-19T14:32:01Z",
  "confirmed_at": "2026-05-19T15:10:00Z",
  "delivery_sent_at": null,
  "delivery_completed_at": null,
  "cancelled_at": null,

  "admin_notes": null,
  "needs_refund": false,

  "items": [
    {
      "id": 91,
      "product_id": 2,
      "product_size_id": 5,
      "quantity": 2,
      "unit_price": 1450000,
      "prepayment_per_unit": 200000,
      "product_title": "Adidas Predator Edge Boots",
      "size_label": "40",
      "product_image": "https://.../boots-1.jpg",
      "line_total": 2900000,
      "line_prepayment": 400000
    }
  ],

  "created_at": "2026-05-19T14:30:12Z",
  "updated_at": "2026-05-19T15:10:00Z"
}
```

Notes:
- `total_price` and `remaining_amount` are `null` until the admin sets `delivery_fee` (i.e. while `status ∈ {awaiting_prepayment, prepaid}`).
- `admin_notes` is always `null` on the client side — never exposed.
- `items[]` values are **snapshots** taken at checkout. They will not change if the admin later edits the product.

#### Errors

| Status | When |
|---|---|
| 401 | Missing/invalid token |
| 403 | Order belongs to another user |
| 404 | Order not found or soft-deleted |

---

## 4. Order lifecycle & payment flow

### Status flow

```
awaiting_prepayment ──┬─> prepaid ─> confirmed ─> delivery_sent ─> delivery_completed
                      │
                      └─> cancelled
```

| Status | Meaning (client-facing) |
|---|---|
| `awaiting_prepayment` | Order created. User must finish prepayment via Payme/Click before `payment_deadline`. |
| `prepaid` | Payme/Click webhook confirmed prepayment. Stock decremented. Cart auto-cleared. Waiting on admin to set delivery fee. |
| `confirmed` | Admin set `delivery_fee`. `total_price` + `remaining_amount` now populated. Awaiting shipment. |
| `delivery_sent` | Admin marked as shipped. Out for delivery. |
| `delivery_completed` | Delivered. Rest paid in cash on delivery — `paid_amount == total_price`, `remaining_amount == 0`. |
| `cancelled` | Auto-cancelled (deadline expired) or admin-cancelled. If `paid_amount > 0`, `needs_refund=true` on the backend and an admin will refund offline. |

### Payment flow (Payme / Click)

```
1. POST /checkout                       → order_id, payme_url, click_url, payment_deadline (now + 5 min)
2. User opens payme_url OR click_url    (in-app webview is fine)
3. User completes payment on Payme/Click
4. Provider hits our webhook            → backend atomically decrements stock,
                                          sets order.status = "prepaid",
                                          clears cart, sends "marketplace_order_prepaid" push
5. Client polls GET /orders/{order_id}  → see status flip to "prepaid"
   (or: navigate to order screen on push tap — the push payload includes order_id)
```

The client never calls Payme/Click APIs directly — just open the URLs and watch the order status.

### Polling for status

After redirecting the user to Payme/Click, poll `GET /orders/{order_id}` every 2–3 seconds (or wait for the push). Useful checks:
- `status == "awaiting_prepayment"` and `now > payment_deadline` → payment window expired, will be cancelled by the cron within ~60s.
- `status == "prepaid"` → success, show confirmation screen.
- `status == "cancelled"` and `prepaid_at == null` → user didn't pay in time / cancelled the Payme flow. Cart is **not** restored — they'll need to re-add items.

### End-to-end (browse → delivered)

```
1. GET /products?sort=newest                            → list cards
2. GET /products/{id}                                   → detail view
3. POST /cart {product_id, product_size_id, quantity}
4. GET /cart                                            → review (with live stock)
5. POST /checkout {address_text, address_lat, lng}      → order_id, payme_url, click_url, deadline
6. Open payme_url OR click_url                          → user pays prepayment
7. (poll) GET /orders/{order_id} OR wait for push       → status: "prepaid"
8. Admin sets delivery_fee  →  status: "confirmed"      → show total + remaining
9. Admin marks sent         →  status: "delivery_sent"
10. Admin marks delivered   →  status: "delivery_completed", remaining_amount = 0
```

---

## 5. Push notifications

The backend sends pushes on every status transition. Payload always includes `type` and `order_id`:

| `type` | When |
|---|---|
| `marketplace_order_created` | Right after checkout — deadline ticking |
| `marketplace_order_1min_warning` | 1 min before deadline if still unpaid |
| `marketplace_order_expired` | Deadline hit, auto-cancelled |
| `marketplace_order_prepaid` | Payme/Click webhook confirmed prepayment |
| `marketplace_order_confirmed` | Admin set delivery fee |
| `marketplace_order_delivery_sent` | Admin marked as shipped |
| `marketplace_order_delivery_completed` | Admin marked as delivered |
| `marketplace_order_cancelled_admin` | Admin cancelled |

Tap handler should route to `/orders/{order_id}`.

---

## 6. What you can't do

There is **no** client endpoint to:
- Cancel an order (only the admin or the 5-min cron can cancel — clients just abandon the Payme/Click page).
- Change the address after checkout.
- Re-open a cancelled order (create a new one instead).
- Trigger a refund (handled offline by admin via the `needs_refund` flag).
