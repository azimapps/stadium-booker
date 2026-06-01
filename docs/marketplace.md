# Marketplace (Client)

Fetch-only reference for the client side: browsing products, toggling likes, and managing the cart. Checkout, orders, and payment flows are covered separately.

Base URL: `/api/v1/client/marketplace`

**Authentication:**
- Product list + detail: **optional** `Authorization: Bearer {user_token}`. If sent, `is_liked_by_me` is filled per product; otherwise it's always `false`.
- Likes + all cart endpoints: **required** `Authorization: Bearer {user_token}` (JWT with `role: user`).

---

## Table of contents

1. [List products](#1-list-products)
2. [Get product](#2-get-product)
3. [Toggle like](#3-toggle-like)
4. [Get cart](#4-get-cart)
5. [Add to cart](#5-add-to-cart)
6. [Update cart item](#6-update-cart-item)
7. [Remove cart item](#7-remove-cart-item)

---

## 1. List products

Returns active (visible) products only. Hidden and soft-deleted products are excluded.

**GET** `/products`

#### Query params

| Param | Type | Default | Notes |
|---|---|---|---|
| search | string | - | Case-insensitive `ILIKE` on `title` |
| category | string | - | Exact match (e.g. `"jerseys"`, `"boots"`) |
| sort | enum | `newest` | `newest` \| `likes` \| `price_asc` \| `price_desc` |
| in_stock_only | bool | `false` | When `true`, hides products with `total_stock == 0` |
| limit | int | 20 | 1–100 |
| offset | int | 0 | ≥ 0 |

Example: `GET /products?sort=price_asc&category=boots&in_stock_only=true&limit=20`

#### Response (200)

```json
[
  {
    "id": 2,
    "title": "Adidas Predator Edge Boots",
    "description": "Pro-level firm-ground football boots.",
    "images": ["https://.../boots-1.jpg", "https://.../boots-2.jpg"],
    "price": 1450000,
    "prepayment_amount": 200000,
    "category": "boots",
    "likes_count": 3,
    "status": "active",
    "sizes": [
      {"id": 5, "size_label": "40", "hint_label": "EU 40 / oyoq 25.5 sm", "stock": 3},
      {"id": 6, "size_label": "41", "hint_label": "EU 41 / oyoq 26.0 sm", "stock": 5}
    ],
    "is_liked_by_me": false,
    "total_stock": 8,
    "created_at": "2026-05-15T10:30:00Z",
    "updated_at": "2026-05-15T10:30:00Z"
  }
]
```

Notes:
- `images[0]` is the cover image — use it for cards.
- `total_stock = SUM(sizes[].stock)`.
- Sort `likes` ties broken by `created_at DESC`.

---

## 2. Get product

**GET** `/products/{product_id}`

#### Response (200)

Same shape as a single item in the list response.

#### Errors

| Status | When |
|---|---|
| 404 | Product not found, soft-deleted, or `status == hidden` |

> Note: `sold_out` products **are** returned (so the user can still see them with sizes at 0 stock). Only `hidden` and deleted ones 404.

---

## 3. Toggle like

Idempotent toggle — if not liked yet it likes, if already liked it unlikes. `likes_count` on the product is updated denormally.

**POST** `/products/{product_id}/like`

#### Request

No body.

#### Response (200)

```json
{
  "liked": true,
  "likes_count": 4
}
```

#### Errors

| Status | When |
|---|---|
| 401 | Missing/invalid token |
| 404 | Product not found or soft-deleted |

---

## 4. Get cart

Returns the user's current cart with live stock validation. Lines whose underlying product or size were fully deleted are silently skipped. Lines that exist but exceed available stock (or whose product is no longer `active`) are still returned but with `is_available: false`, and the top-level `has_unavailable: true` is set.

**GET** `/cart`

#### Response (200)

```json
{
  "items": [
    {
      "id": 17,
      "product_id": 2,
      "product_size_id": 5,
      "quantity": 2,
      "product_title": "Adidas Predator Edge Boots",
      "product_image": "https://.../boots-1.jpg",
      "size_label": "40",
      "unit_price": 1450000,
      "prepayment_per_unit": 200000,
      "line_total": 2900000,
      "line_prepayment": 400000,
      "available_stock": 3,
      "is_available": true
    }
  ],
  "items_total": 2900000,
  "prepayment_total": 400000,
  "has_unavailable": false
}
```

Fields per item:
- `unit_price`, `prepayment_per_unit` — pulled **live** from the product (no snapshots in the cart).
- `available_stock` — current stock on the size; use to drive the quantity stepper max.
- `is_available` — `false` if product is no longer active, or `available_stock < quantity`, or stock hit 0.

Empty cart returns `items: []`, `items_total: 0`, `prepayment_total: 0`, `has_unavailable: false` (200, not 404).

---

## 5. Add to cart

Adds a `(product, size, quantity)` line. If the user already has a cart line for the same size, the new quantity is **added** to the existing line (not replaced).

**POST** `/cart`

#### Request

```json
{
  "product_id": 2,
  "product_size_id": 5,
  "quantity": 1
}
```

#### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| product_id | integer | Yes | Must be active & not soft-deleted |
| product_size_id | integer | Yes | Must belong to `product_id` and not be soft-deleted |
| quantity | integer | Yes | ≥ 1 |

#### Response (201)

Same shape as `GET /cart` — the full updated cart is returned.

#### Errors

| Status | When |
|---|---|
| 401 | Missing/invalid token |
| 404 | Product not found, inactive, or hidden |
| 404 | Size not found for this product (or soft-deleted) |
| 422 | Validation failed (e.g. `quantity < 1`) |

> Note: stock is **not** validated at add-time — you can add more than is currently in stock. Stock is validated live in `GET /cart` (`is_available` flag) and again at checkout.

---

## 6. Update cart item

Replaces the line's `quantity`. To increment, send the new total — not a delta.

**PATCH** `/cart/{item_id}`

#### Request

```json
{
  "quantity": 3
}
```

#### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| quantity | integer | Yes | ≥ 1 |

#### Response (200)

Same shape as `GET /cart`.

#### Errors

| Status | When |
|---|---|
| 401 | Missing/invalid token |
| 404 | Cart item not found, not yours, or already deleted |
| 422 | Validation failed (e.g. `quantity < 1`) |

---

## 7. Remove cart item

Hard-removes the line from the cart.

**DELETE** `/cart/{item_id}`

#### Response (200)

Same shape as `GET /cart` (the cart after removal).

#### Errors

| Status | When |
|---|---|
| 401 | Missing/invalid token |
| 404 | Cart item not found, not yours, or already deleted |

---

## Common patterns

### Browsing → cart

```
1. GET /products?sort=newest                  → list cards
2. GET /products/{id}                         → detail view (sizes + hints)
3. POST /cart  {product_id, product_size_id, quantity}
4. GET /cart                                  → cart screen (with live stock)
```

### Quantity stepper

Use `available_stock` from `GET /cart` as the max. If `is_available == false`, show a "not available" badge and disable checkout for that line (the checkout endpoint will also reject and surface what was dropped, but a client-side guard avoids the round-trip).

### Likes

The like toggle is the source of truth for both `liked` and `likes_count`. Apply it optimistically on tap and reconcile with the response. Re-tapping the same product unlikes it.

### About `is_liked_by_me`

- Logged-out: always `false`.
- Logged-in: reflects whether the current user has an active like row for that product.
