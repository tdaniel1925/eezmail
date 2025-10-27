'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Eye, Loader2 } from 'lucide-react';
import { InlineNotification } from '@/components/ui/inline-notification';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  categoryId: string | null;
  tags: string[];
  status: string;
  visibility: string;
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[] | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ArticleEditorProps {
  article: Article | null;
  categories: Category[];
  userId: string;
}

export function ArticleEditor({
  article,
  categories,
  userId,
}: ArticleEditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    title: article?.title || '',
    slug: article?.slug || '',
    content: article?.content || '',
    excerpt: article?.excerpt || '',
    categoryId: article?.categoryId || '',
    tags: article?.tags?.join(', ') || '',
    status: article?.status || 'draft',
    visibility: article?.visibility || 'public',
    featured: article?.featured || false,
    seoTitle: article?.seoTitle || '',
    seoDescription: article?.seoDescription || '',
    seoKeywords: article?.seoKeywords?.join(', ') || '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-generate slug from title
    if (field === 'title' && !article) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSave = async (publish = false) => {
    setIsSaving(true);
    setNotification(null);

    try {
      const payload = {
        ...formData,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        seoKeywords: formData.seoKeywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        authorId: userId,
        status: publish ? 'published' : formData.status,
        publishedAt:
          publish && !article?.status ? new Date().toISOString() : undefined,
      };

      const method = article ? 'PATCH' : 'POST';
      const url = article
        ? `/api/admin/kb/articles/${article.id}`
        : '/api/admin/kb/articles';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save article');
      }

      setNotification({
        type: 'success',
        message: publish
          ? 'Article published successfully! Redirecting...'
          : 'Article saved as draft successfully! Redirecting...',
      });

      setTimeout(() => {
        router.push('/admin/knowledge-base');
      }, 1500);
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.message || 'Failed to save article. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-8">
      {/* Inline Notification */}
      {notification && (
        <div className="mb-6">
          <InlineNotification
            type={notification.type}
            message={notification.message}
            onDismiss={() => setNotification(null)}
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-300 hover:text-white hover:bg-slate-700"
            onClick={() => router.push('/admin/knowledge-base')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {article ? 'Edit Article' : 'New Article'}
            </h1>
            <p className="text-sm text-gray-400">
              {article
                ? `Editing: ${article.title}`
                : 'Create a new knowledge base article'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
            onClick={() => handleSave(false)}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Draft
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => handleSave(true)}
            disabled={isSaving}
          >
            <Eye className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger
            value="content"
            className="text-gray-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
          >
            Content
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="text-gray-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
          >
            Settings
          </TabsTrigger>
          <TabsTrigger
            value="seo"
            className="text-gray-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
          >
            SEO
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Article Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-gray-300">
                  Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="How to use..."
                  className="text-lg font-semibold bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="slug" className="text-gray-300">
                  URL Slug *
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  placeholder="how-to-use"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Article URL: /help/{formData.slug || 'your-slug'}
                </p>
              </div>

              <div>
                <Label htmlFor="excerpt" className="text-gray-300">
                  Excerpt
                </Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => handleChange('excerpt', e.target.value)}
                  placeholder="Brief description of the article (shown in search results)"
                  rows={3}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="content" className="text-gray-300">
                  Content * (Markdown supported)
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  placeholder="Write your article content here... You can use Markdown formatting."
                  rows={20}
                  className="font-mono text-sm bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Supports Markdown: **bold**, *italic*, # headings, - lists,
                  [links](url), ```code```
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Article Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Configure how your article is displayed and accessed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category" className="text-gray-300">
                  Category
                </Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleChange('categoryId', value)}
                >
                  <SelectTrigger
                    id="category"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="">Uncategorized</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tags" className="text-gray-300">
                  Tags (comma-separated)
                </Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  placeholder="getting-started, tutorial, advanced"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status" className="text-gray-300">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value)}
                  >
                    <SelectTrigger
                      id="status"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="visibility" className="text-gray-300">
                    Visibility
                  </Label>
                  <Select
                    value={formData.visibility}
                    onValueChange={(value) => handleChange('visibility', value)}
                  >
                    <SelectTrigger
                      id="visibility"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="internal">Internal Only</SelectItem>
                      <SelectItem value="customers_only">
                        Customers Only
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-700/30 p-4">
                <div>
                  <Label htmlFor="featured" className="text-gray-300">
                    Featured Article
                  </Label>
                  <p className="text-sm text-gray-400">
                    Show this article prominently on the help homepage
                  </p>
                </div>
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) =>
                    handleChange('featured', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">SEO Optimization</CardTitle>
              <CardDescription className="text-gray-400">
                Improve search engine visibility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seoTitle" className="text-gray-300">
                  SEO Title
                </Label>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle}
                  onChange={(e) => handleChange('seoTitle', e.target.value)}
                  placeholder={
                    formData.title || 'Article title for search engines'
                  }
                  maxLength={60}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {formData.seoTitle.length}/60 characters (optimal: 50-60)
                </p>
              </div>

              <div>
                <Label htmlFor="seoDescription" className="text-gray-300">
                  Meta Description
                </Label>
                <Textarea
                  id="seoDescription"
                  value={formData.seoDescription}
                  onChange={(e) =>
                    handleChange('seoDescription', e.target.value)
                  }
                  placeholder={
                    formData.excerpt || 'Description for search results'
                  }
                  rows={3}
                  maxLength={160}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {formData.seoDescription.length}/160 characters (optimal:
                  150-160)
                </p>
              </div>

              <div>
                <Label htmlFor="seoKeywords" className="text-gray-300">
                  Keywords (comma-separated)
                </Label>
                <Input
                  id="seoKeywords"
                  value={formData.seoKeywords}
                  onChange={(e) => handleChange('seoKeywords', e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
