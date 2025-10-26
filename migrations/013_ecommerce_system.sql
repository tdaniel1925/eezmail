-- =====================================================
-- E-COMMERCE PLATFORM
-- Migration 013
-- =====================================================

-- Products table (master catalog)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('subscription', 'one_time', 'usage_based')),
    price DECIMAL(10, 2),
    billing_interval TEXT CHECK (billing_interval IN ('month', 'year', 'day', 'week')),
    trial_period_days INTEGER DEFAULT 0,
    usage_unit TEXT, -- 'token', 'sms', 'gb', 'email'
    usage_rate DECIMAL(10, 6), -- Cost per unit for usage-based pricing
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    stripe_product_id TEXT UNIQUE,
    stripe_price_id TEXT,
    category TEXT,
    features JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_processor TEXT CHECK (payment_processor IN ('stripe', 'square')),
    stripe_payment_intent_id TEXT,
    square_payment_id TEXT,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL, -- Snapshot of product name at time of purchase
    product_type VARCHAR(20) NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    subscription_id TEXT, -- Stripe/Square subscription ID if applicable
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Shopping cart
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT, -- For guest carts
    subtotal DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) DEFAULT 0,
    discount_code VARCHAR(50),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'converted')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure one active cart per user
    CONSTRAINT unique_active_user_cart UNIQUE NULLS NOT DISTINCT (user_id, status) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Cart items
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Prevent duplicate products in same cart
    CONSTRAINT unique_cart_product UNIQUE (cart_id, product_id)
);

-- Customer subscriptions (extended from existing)
CREATE TABLE IF NOT EXISTS customer_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    stripe_subscription_id TEXT UNIQUE,
    square_subscription_id TEXT UNIQUE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'paused')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES customer_subscriptions(id) ON DELETE SET NULL,
    amount_due DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    stripe_invoice_id TEXT UNIQUE,
    pdf_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add missing columns if tables already exist (for idempotency)
DO $$ 
BEGIN
    -- Add due_date to invoices if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'due_date'
    ) THEN
        ALTER TABLE invoices ADD COLUMN due_date TIMESTAMPTZ;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- Indexes for performance (use DO block to handle existing indexes)
DO $$ 
BEGIN
    -- Products indexes
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_products_stripe_product ON products(stripe_product_id) WHERE stripe_product_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category) WHERE category IS NOT NULL;

    -- Orders indexes
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id) WHERE user_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_orders_org ON orders(organization_id) WHERE organization_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

    -- Order items indexes
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id) WHERE product_id IS NOT NULL;

    -- Carts indexes
    CREATE INDEX IF NOT EXISTS idx_carts_user ON carts(user_id) WHERE user_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_carts_session ON carts(session_id) WHERE session_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status);

    -- Cart items indexes
    CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
    CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);

    -- Subscriptions indexes
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON customer_subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON customer_subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON customer_subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

    -- Invoices indexes
    CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date) WHERE due_date IS NOT NULL;
EXCEPTION
    WHEN duplicate_table THEN NULL;
END $$;

-- Comments
COMMENT ON TABLE products IS 'Master product catalog for e-commerce platform';
COMMENT ON TABLE orders IS 'Customer orders with payment tracking';
COMMENT ON TABLE order_items IS 'Line items for orders';
COMMENT ON TABLE carts IS 'Shopping carts for active sessions';
COMMENT ON TABLE customer_subscriptions IS 'Active customer subscriptions';
COMMENT ON TABLE invoices IS 'Customer invoices for billing';

-- Generate order number function
CREATE OR REPLACE FUNCTION generate_order_number() RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    year_prefix TEXT;
BEGIN
    year_prefix := TO_CHAR(NOW(), 'YY');
    SELECT 'ORD-' || year_prefix || '-' || LPAD((COALESCE(MAX(SUBSTRING(order_number FROM '\d+$')::INTEGER), 0) + 1)::TEXT, 6, '0')
    INTO new_number
    FROM orders
    WHERE order_number LIKE 'ORD-' || year_prefix || '-%';
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate invoice number function
CREATE OR REPLACE FUNCTION generate_invoice_number() RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    year_prefix TEXT;
BEGIN
    year_prefix := TO_CHAR(NOW(), 'YY');
    SELECT 'INV-' || year_prefix || '-' || LPAD((COALESCE(MAX(SUBSTRING(invoice_number FROM '\d+$')::INTEGER), 0) + 1)::TEXT, 6, '0')
    INTO new_number
    FROM invoices
    WHERE invoice_number LIKE 'INV-' || year_prefix || '-%';
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

