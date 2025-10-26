/**
 * Shopping Cart API
 * GET /api/cart - Get user's cart
 * POST /api/cart/add - Add item to cart
 * PATCH /api/cart/items/[id] - Update item quantity
 * DELETE /api/cart/items/[id] - Remove item from cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getOrCreateCart,
  getCartWithItems,
  addToCart,
} from '@/lib/ecommerce/cart';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cart = await getOrCreateCart(user.id);
    const cartWithItems = await getCartWithItems(cart.id);

    return NextResponse.json({ cart: cartWithItems });
  } catch (error) {
    console.error('[Cart API] Error:', error);
    return NextResponse.json({ error: 'Failed to get cart' }, { status: 500 });
  }
}
