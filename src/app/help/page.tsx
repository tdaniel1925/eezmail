/**
 * Public Knowledge Base Portal
 * Browse and search help articles
 */

import { Suspense } from 'react';
import { db } from '@/db';
import { knowledgeBaseArticles, knowledgeBaseCategories } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { HelpSearch } from '@/components/help/HelpSearch';
import { FeaturedArticles } from '@/components/help/FeaturedArticles';
import { CategoryList } from '@/components/help/CategoryList';
import { PopularArticles } from '@/components/help/PopularArticles';
import { BookOpen } from 'lucide-react';

// Force dynamic rendering - don't try to fetch DB at build time
export const dynamic = 'force-dynamic';

export default async function HelpPage() {
  // Get featured articles
  const featuredArticles = await db.query.knowledgeBaseArticles.findMany({
    where: and(
      eq(knowledgeBaseArticles.status, 'published'),
      eq(knowledgeBaseArticles.featured, true)
    ),
    orderBy: [desc(knowledgeBaseArticles.publishedAt)],
    limit: 3,
  });

  // Get categories
  const categories = await db.query.knowledgeBaseCategories.findMany({
    where: eq(knowledgeBaseCategories.isVisible, true),
    orderBy: (categories, { asc }) => [asc(categories.sortOrder)],
  });

  // Get popular articles (by views)
  const popularArticles = await db.query.knowledgeBaseArticles.findMany({
    where: eq(knowledgeBaseArticles.status, 'published'),
    orderBy: [desc(knowledgeBaseArticles.views)],
    limit: 5,
  });

  // Get article count
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(knowledgeBaseArticles)
    .where(eq(knowledgeBaseArticles.status, 'published'));

  const totalArticles = result[0]?.count || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              How can we help you?
            </h1>
            <p className="mb-8 text-lg text-gray-600">
              Search our knowledge base for answers
            </p>

            {/* Search */}
            <Suspense fallback={<div>Loading search...</div>}>
              <HelpSearch />
            </Suspense>

            <p className="mt-4 text-sm text-gray-500">
              {totalArticles} articles available
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Featured Articles
            </h2>
            <FeaturedArticles articles={featuredArticles} />
          </section>
        )}

        {/* Categories */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Browse by Category
          </h2>
          <CategoryList categories={categories} />
        </section>

        {/* Popular Articles */}
        {popularArticles.length > 0 && (
          <section>
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Popular Articles
            </h2>
            <PopularArticles articles={popularArticles} />
          </section>
        )}
      </div>
    </div>
  );
}
