-- =====================================================
-- KNOWLEDGE BASE SYSTEM
-- Migration 016
-- =====================================================

-- KB categories table
CREATE TABLE IF NOT EXISTS kb_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES kb_categories(id) ON DELETE SET NULL,
    icon VARCHAR(50), -- Icon name for UI
    sort_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- KB articles table
CREATE TABLE IF NOT EXISTS kb_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category_id UUID REFERENCES kb_categories(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'internal', 'customers_only')),
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT[],
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Article feedback
CREATE TABLE IF NOT EXISTS kb_article_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES kb_articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    helpful BOOLEAN NOT NULL, -- true = helpful, false = not helpful
    feedback_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- One feedback per user per article
    CONSTRAINT unique_user_article_feedback UNIQUE (article_id, user_id)
);

-- Related articles (for suggestions)
CREATE TABLE IF NOT EXISTS kb_related_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES kb_articles(id) ON DELETE CASCADE,
    related_article_id UUID NOT NULL REFERENCES kb_articles(id) ON DELETE CASCADE,
    relevance_score DECIMAL(3, 2) DEFAULT 0.5,
    
    CONSTRAINT no_self_relation CHECK (article_id != related_article_id),
    CONSTRAINT unique_article_relation UNIQUE (article_id, related_article_id)
);

-- Indexes
CREATE INDEX idx_kb_categories_parent ON kb_categories(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_kb_categories_visible ON kb_categories(is_visible) WHERE is_visible = true;
CREATE INDEX idx_kb_categories_sort ON kb_categories(sort_order);

CREATE INDEX idx_kb_articles_category ON kb_articles(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX idx_kb_articles_author ON kb_articles(author_id) WHERE author_id IS NOT NULL;
CREATE INDEX idx_kb_articles_status ON kb_articles(status);
CREATE INDEX idx_kb_articles_published ON kb_articles(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_kb_articles_featured ON kb_articles(featured) WHERE featured = true;
CREATE INDEX idx_kb_articles_tags ON kb_articles USING GIN(tags);
CREATE INDEX idx_kb_articles_views ON kb_articles(views DESC);
CREATE INDEX idx_kb_articles_helpful ON kb_articles(helpful_count DESC);

-- Full-text search index
CREATE INDEX idx_kb_articles_search ON kb_articles 
    USING GIN(to_tsvector('english', title || ' ' || content));

CREATE INDEX idx_kb_feedback_article ON kb_article_feedback(article_id);
CREATE INDEX idx_kb_feedback_user ON kb_article_feedback(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX idx_kb_related_article ON kb_related_articles(article_id);
CREATE INDEX idx_kb_related_related ON kb_related_articles(related_article_id);

-- Comments
COMMENT ON TABLE kb_categories IS 'Knowledge base article categories with hierarchy support';
COMMENT ON TABLE kb_articles IS 'Knowledge base articles with full-text search';
COMMENT ON TABLE kb_article_feedback IS 'User feedback on KB articles';
COMMENT ON TABLE kb_related_articles IS 'Related article suggestions';

-- Function to update article helpful counts
CREATE OR REPLACE FUNCTION update_article_helpful_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.helpful THEN
            UPDATE kb_articles SET helpful_count = helpful_count + 1 WHERE id = NEW.article_id;
        ELSE
            UPDATE kb_articles SET not_helpful_count = not_helpful_count + 1 WHERE id = NEW.article_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.helpful != NEW.helpful THEN
            IF NEW.helpful THEN
                UPDATE kb_articles 
                SET helpful_count = helpful_count + 1, not_helpful_count = not_helpful_count - 1 
                WHERE id = NEW.article_id;
            ELSE
                UPDATE kb_articles 
                SET helpful_count = helpful_count - 1, not_helpful_count = not_helpful_count + 1 
                WHERE id = NEW.article_id;
            END IF;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.helpful THEN
            UPDATE kb_articles SET helpful_count = helpful_count - 1 WHERE id = OLD.article_id;
        ELSE
            UPDATE kb_articles SET not_helpful_count = not_helpful_count - 1 WHERE id = OLD.article_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_article_helpful_counts
    AFTER INSERT OR UPDATE OR DELETE ON kb_article_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_article_helpful_counts();

