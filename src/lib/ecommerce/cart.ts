/**
 * Shopping Cart Service
 * Manages user shopping carts and cart items
 */

import { db } from '@/db';
import { carts, cartItems, products } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import type { Cart, CartItem, Product } from '@/db/schema';

export interface CartWithItems extends Cart {
  items: Array<CartItem & { product: Product }>;
}

/**
 * Get or create active cart for user
 */
export async function getOrCreateCart(userId: string): Promise<Cart> {
  // Try to find existing active cart
  const [existingCart] = await db
    .select()
    .from(carts)
    .where(and(eq(carts.userId, userId), eq(carts.status, 'active')))
    .limit(1);

  if (existingCart) {
    return existingCart;
  }

  // Create new cart
  const [newCart] = await db
    .insert(carts)
    .values({
      userId,
      status: 'active',
      subtotal: '0',
      discountAmount: '0',
      taxAmount: '0',
      totalAmount: '0',
    })
    .returning();

  return newCart;
}

/**
 * Get cart with all items and product details
 */
export async function getCartWithItems(
  cartId: string
): Promise<CartWithItems | null> {
  const [cart] = await db
    .select()
    .from(carts)
    .where(eq(carts.id, cartId))
    .limit(1);

  if (!cart) {
    return null;
  }

  // Get cart items with product details
  const items = await db
    .select()
    .from(cartItems)
    .leftJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cartId));

  const cartWithItems: CartWithItems = {
    ...cart,
    items: items
      .filter((item) => item.products !== null)
      .map((item) => ({
        ...item.cart_items,
        product: item.products!,
      })),
  };

  return cartWithItems;
}

/**
 * Add product to cart
 */
export async function addToCart(
  userId: string,
  productId: string,
  quantity: number = 1
): Promise<CartWithItems> {
  // Get or create cart
  const cart = await getOrCreateCart(userId);

  // Check if product exists
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) {
    throw new Error('Product not found');
  }

  if (product.status !== 'active') {
    throw new Error('Product is not available');
  }

  // Check if item already in cart
  const [existingItem] = await db
    .select()
    .from(cartItems)
    .where(
      and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId))
    )
    .limit(1);

  if (existingItem) {
    // Update quantity
    await db
      .update(cartItems)
      .set({ quantity: existingItem.quantity + quantity })
      .where(eq(cartItems.id, existingItem.id));
  } else {
    // Add new item
    await db.insert(cartItems).values({
      cartId: cart.id,
      productId,
      quantity,
    });
  }

  // Recalculate cart totals
  await recalculateCartTotals(cart.id);

  // Return updated cart
  return (await getCartWithItems(cart.id))!;
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number
): Promise<CartWithItems> {
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  const [item] = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.id, cartItemId))
    .limit(1);

  if (!item) {
    throw new Error('Cart item not found');
  }

  await db
    .update(cartItems)
    .set({ quantity })
    .where(eq(cartItems.id, cartItemId));

  await recalculateCartTotals(item.cartId);

  return (await getCartWithItems(item.cartId))!;
}

/**
 * Remove item from cart
 */
export async function removeFromCart(
  cartItemId: string
): Promise<CartWithItems> {
  const [item] = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.id, cartItemId))
    .limit(1);

  if (!item) {
    throw new Error('Cart item not found');
  }

  await db.delete(cartItems).where(eq(cartItems.id, cartItemId));

  await recalculateCartTotals(item.cartId);

  return (await getCartWithItems(item.cartId))!;
}

/**
 * Clear all items from cart
 */
export async function clearCart(cartId: string): Promise<void> {
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  await recalculateCartTotals(cartId);
}

/**
 * Recalculate cart totals
 */
async function recalculateCartTotals(cartId: string): Promise<void> {
  const cartWithItems = await getCartWithItems(cartId);

  if (!cartWithItems) {
    return;
  }

  let subtotal = 0;

  for (const item of cartWithItems.items) {
    const price = parseFloat(item.product.price || '0');
    subtotal += price * item.quantity;
  }

  // For now, no discount or tax calculation
  const discountAmount = 0;
  const taxAmount = 0;
  const totalAmount = subtotal - discountAmount + taxAmount;

  await db
    .update(carts)
    .set({
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(carts.id, cartId));
}

/**
 * Apply discount code to cart
 */
export async function applyDiscountCode(
  cartId: string,
  discountCode: string
): Promise<CartWithItems> {
  // TODO: Validate discount code from discount_codes table
  // For now, just store the code
  await db
    .update(carts)
    .set({
      discountCode,
      updatedAt: new Date(),
    })
    .where(eq(carts.id, cartId));

  await recalculateCartTotals(cartId);

  return (await getCartWithItems(cartId))!;
}

/**
 * Convert cart to order (used during checkout)
 */
export async function convertCartToOrder(
  cartId: string,
  userId: string
): Promise<string> {
  const cartWithItems = await getCartWithItems(cartId);

  if (!cartWithItems || cartWithItems.items.length === 0) {
    throw new Error('Cart is empty');
  }

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Create order
  const { orders, orderItems } = await import('@/db/schema');

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      userId,
      status: 'pending',
      subtotal: cartWithItems.subtotal,
      discountAmount: cartWithItems.discountAmount,
      taxAmount: cartWithItems.taxAmount,
      totalAmount: cartWithItems.totalAmount,
    })
    .returning();

  // Create order items
  for (const item of cartWithItems.items) {
    const unitPrice = parseFloat(item.product.price || '0');
    const totalAmount = unitPrice * item.quantity;

    await db.insert(orderItems).values({
      orderId: order.id,
      productId: item.productId,
      productName: item.product.name,
      productType: item.product.productType,
      quantity: item.quantity,
      unitPrice: unitPrice.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    });
  }

  // Mark cart as converted
  await db
    .update(carts)
    .set({ status: 'converted', updatedAt: new Date() })
    .where(eq(carts.id, cartId));

  return order.id;
}
