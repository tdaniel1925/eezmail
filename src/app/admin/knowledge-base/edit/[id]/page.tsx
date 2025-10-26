/**
 * Knowledge Base Article Editor
 * Create or edit KB articles with rich text editor
 */

import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { knowledgeBaseArticles, knowledgeBaseCategories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ArticleEditor } from '@/components/admin/ArticleEditor';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ArticleEditorPage({ params }: PageProps) {
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

  const { id } = await params;
  const isNew = id === 'new';

  // Get article if editing
  let article = null;
  if (!isNew) {
    const result = await db.query.knowledgeBaseArticles.findFirst({
      where: eq(knowledgeBaseArticles.id, id),
    });

    if (!result) {
      notFound();
    }

    article = result;
  }

  // Get all categories
  const categories = await db.query.knowledgeBaseCategories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.sortOrder)],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Suspense fallback={<div>Loading editor...</div>}>
        <ArticleEditor
          article={article}
          categories={categories}
          userId={user.id}
        />
      </Suspense>
    </div>
  );
}
