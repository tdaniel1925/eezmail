'use client';

/**
 * Knowledge Base Admin Page
 * Manage articles and categories
 */

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KBArticlesTable } from '@/components/admin/KBArticlesTable';
import { KBStats } from '@/components/admin/KBStats';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen } from 'lucide-react';

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    views: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArticles() {
      try {
        const response = await fetch('/api/admin/kb/articles');
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          if (response.status === 403) {
            router.push('/dashboard');
            return;
          }
          throw new Error('Failed to load articles');
        }
        const data = await response.json();
        setArticles(data.articles || []);
        setStats(data.stats || { total: 0, published: 0, draft: 0, views: 0 });
      } catch (error) {
        console.error('Error loading articles:', error);
      } finally {
        setLoading(false);
      }
    }
    loadArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-3 border border-blue-500/20">
              <BookOpen className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Knowledge Base</h1>
              <p className="text-sm text-gray-400">
                Manage help articles and documentation
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
              onClick={() => router.push('/admin/knowledge-base/categories')}
            >
              Manage Categories
            </Button>
            <Button
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => router.push('/admin/knowledge-base/new')}
            >
              <Plus className="h-4 w-4" />
              New Article
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {loading ? (
          <div className="text-gray-400">Loading statistics...</div>
        ) : (
          <KBStats stats={stats} />
        )}

        {/* Articles Table */}
        {loading ? (
          <div className="text-gray-400">Loading articles...</div>
        ) : (
          <Suspense
            fallback={<div className="text-gray-400">Loading articles...</div>}
          >
            <KBArticlesTable articles={articles} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
