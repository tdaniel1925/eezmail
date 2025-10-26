/**
 * Public Article View Page
 * Display a single knowledge base article
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/db';
import { knowledgeBaseArticles, knowledgeBaseCategories } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { ArticleContent } from '@/components/help/ArticleContent';
import { ArticleFeedback } from '@/components/help/ArticleFeedback';
import { RelatedArticles } from '@/components/help/RelatedArticles';
import { ChevronLeft, Calendar, Eye, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;

  // Get article
  const article = await db.query.knowledgeBaseArticles.findFirst({
    where: and(
      eq(knowledgeBaseArticles.slug, slug),
      eq(knowledgeBaseArticles.status, 'published')
    ),
  });

  if (!article) {
    notFound();
  }

  // Get category
  let category = null;
  if (article.categoryId) {
    category = await db.query.knowledgeBaseCategories.findFirst({
      where: eq(knowledgeBaseCategories.id, article.categoryId),
    });
  }

  // Increment view count
  await db
    .update(knowledgeBaseArticles)
    .set({ views: sql`${knowledgeBaseArticles.views} + 1` })
    .where(eq(knowledgeBaseArticles.id, article.id));

  // Get related articles (same category)
  const relatedArticles = article.categoryId
    ? await db.query.knowledgeBaseArticles.findMany({
        where: and(
          eq(knowledgeBaseArticles.categoryId, article.categoryId),
          sql`${knowledgeBaseArticles.id} != ${article.id}`,
          eq(knowledgeBaseArticles.status, 'published')
        ),
        limit: 3,
      })
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/help">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Help Center
            </Button>
          </Link>
        </div>

        {/* Article Header */}
        <article className="rounded-lg border bg-white p-8 shadow-sm">
          <header className="mb-8">
            {category && (
              <div className="mb-4">
                <Badge variant="outline">{category.name}</Badge>
              </div>
            )}

            <h1 className="mb-4 text-4xl font-bold text-gray-900">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="mb-6 text-lg text-gray-600">{article.excerpt}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {article.publishedAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(article.publishedAt), 'MMMM d, yyyy')}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {article.views + 1} views
              </div>
              {article.tags && article.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  {article.tags.slice(0, 3).join(', ')}
                </div>
              )}
            </div>
          </header>

          {/* Article Content */}
          <ArticleContent content={article.content} />

          {/* Feedback */}
          <div className="mt-12 border-t pt-8">
            <ArticleFeedback articleId={article.id} />
          </div>
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Related Articles
            </h2>
            <RelatedArticles articles={relatedArticles} />
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  const article = await db.query.knowledgeBaseArticles.findFirst({
    where: and(
      eq(knowledgeBaseArticles.slug, slug),
      eq(knowledgeBaseArticles.status, 'published')
    ),
  });

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt || '',
    keywords: article.seoKeywords?.join(', ') || '',
  };
}
