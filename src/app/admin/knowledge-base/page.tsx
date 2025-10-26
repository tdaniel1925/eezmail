/**
 * Knowledge Base Admin Page
 * Manage articles and categories
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { knowledgeBaseArticles, knowledgeBaseCategories } from '@/db/schema';
import { desc, eq, count } from 'drizzle-orm';
import { KBArticlesTable } from '@/components/admin/KBArticlesTable';
import { KBStats } from '@/components/admin/KBStats';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default async function KnowledgeBasePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'super_admin' && userData?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Get articles with category info
  const articles = await db
    .select({
      article: knowledgeBaseArticles,
      category: knowledgeBaseCategories,
    })
    .from(knowledgeBaseArticles)
    .leftJoin(
      knowledgeBaseCategories,
      eq(knowledgeBaseArticles.categoryId, knowledgeBaseCategories.id)
    )
    .orderBy(desc(knowledgeBaseArticles.createdAt))
    .limit(100);

  // Get statistics
  const stats = {
    total: articles.length,
    published: articles.filter((a) => a.article.status === 'published').length,
    draft: articles.filter((a) => a.article.status === 'draft').length,
    views: articles.reduce((sum, a) => sum + (a.article.views || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Knowledge Base
              </h1>
              <p className="text-sm text-gray-500">
                Manage help articles and documentation
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/admin/knowledge-base/categories">
              <Button variant="outline">Manage Categories</Button>
            </Link>
            <Link href="/admin/knowledge-base/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Article
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <KBStats stats={stats} />

        {/* Articles Table */}
        <Suspense fallback={<div>Loading articles...</div>}>
          <KBArticlesTable articles={articles} />
        </Suspense>
      </div>
    </div>
  );
}
