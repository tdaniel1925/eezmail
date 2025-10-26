'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, MoreVertical, Trash, Eye, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface Article {
  article: {
    id: string;
    title: string;
    slug: string;
    status: string;
    visibility: string;
    views: number;
    helpfulCount: number;
    notHelpfulCount: number;
    featured: boolean;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface KBArticlesTableProps {
  articles: Article[];
}

export function KBArticlesTable({
  articles: initialArticles,
}: KBArticlesTableProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Filter articles
  const filteredArticles = articles.filter((item) => {
    const matchesSearch =
      item.article.title.toLowerCase().includes(search.toLowerCase()) ||
      item.article.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || item.article.status === statusFilter;
    const matchesCategory =
      categoryFilter === 'all' ||
      (item.category && item.category.id === categoryFilter);
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(
    new Map(
      articles
        .filter((a) => a.category)
        .map((a) => [a.category!.id, a.category!])
    ).values()
  );

  const handleDelete = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const response = await fetch(`/api/admin/kb/articles/${articleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setArticles((prev) => prev.filter((a) => a.article.id !== articleId));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete article');
    }
  };

  const handleToggleFeatured = async (articleId: string, featured: boolean) => {
    try {
      const response = await fetch(`/api/admin/kb/articles/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !featured }),
      });

      if (!response.ok) throw new Error('Failed to update');

      setArticles((prev) =>
        prev.map((a) =>
          a.article.id === articleId
            ? {
                ...a,
                article: { ...a.article, featured: !featured },
              }
            : a
        )
      );
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update article');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Input
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Helpful</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredArticles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500">
                  No articles found
                </TableCell>
              </TableRow>
            ) : (
              filteredArticles.map((item) => (
                <TableRow key={item.article.id}>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/knowledge-base/edit/${item.article.id}`}
                          className="font-medium hover:underline"
                        >
                          {item.article.title}
                        </Link>
                        {item.article.featured && (
                          <Badge variant="secondary" className="text-xs">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        /{item.article.slug}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.category ? (
                      <Badge variant="outline">{item.category.name}</Badge>
                    ) : (
                      <span className="text-gray-400">Uncategorized</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.article.status === 'published'
                          ? 'default'
                          : item.article.status === 'draft'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {item.article.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm capitalize">
                      {item.article.visibility}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.article.views || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-green-600">
                      {item.article.helpfulCount || 0}
                    </span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-red-600">
                      {item.article.notHelpfulCount || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.article.publishedAt ? (
                      <span className="text-sm text-gray-600">
                        {format(
                          new Date(item.article.publishedAt),
                          'MMM d, yyyy'
                        )}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">
                        Not published
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/knowledge-base/edit/${item.article.id}`}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleToggleFeatured(
                              item.article.id,
                              item.article.featured
                            )
                          }
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {item.article.featured ? 'Unfeature' : 'Feature'}
                        </DropdownMenuItem>
                        {item.article.status === 'published' && (
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/help/${item.article.slug}`}
                              target="_blank"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Public
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(item.article.id)}
                          className="text-red-600"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
