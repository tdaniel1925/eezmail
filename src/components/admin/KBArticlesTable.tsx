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
          className="max-w-sm bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-slate-700/50 border-slate-600 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] bg-slate-700/50 border-slate-600 text-white">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
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
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-700/50 border-slate-700">
              <TableHead className="text-gray-300">Title</TableHead>
              <TableHead className="text-gray-300">Category</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Visibility</TableHead>
              <TableHead className="text-right text-gray-300">Views</TableHead>
              <TableHead className="text-right text-gray-300">
                Helpful
              </TableHead>
              <TableHead className="text-gray-300">Published</TableHead>
              <TableHead className="text-right text-gray-300">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredArticles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-400">
                  No articles found
                </TableCell>
              </TableRow>
            ) : (
              filteredArticles.map((item) => (
                <TableRow
                  key={item.article.id}
                  className="border-slate-700 hover:bg-slate-700/30"
                >
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/knowledge-base/edit/${item.article.id}`}
                          className="font-medium text-white hover:underline"
                        >
                          {item.article.title}
                        </Link>
                        {item.article.featured && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          >
                            Featured
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        /{item.article.slug}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.category ? (
                      <Badge
                        variant="outline"
                        className="bg-blue-500/10 text-blue-400 border-blue-500/20"
                      >
                        {item.category.name}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">Uncategorized</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.article.status === 'published'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : item.article.status === 'draft'
                            ? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                            : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }
                    >
                      {item.article.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm capitalize text-gray-300">
                      {item.article.visibility}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-gray-300">
                    {item.article.views || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-green-400">
                      {item.article.helpfulCount || 0}
                    </span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-red-400">
                      {item.article.notHelpfulCount || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.article.publishedAt ? (
                      <span className="text-sm text-gray-400">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-300 hover:text-white hover:bg-slate-700"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-slate-800 border-slate-700"
                      >
                        <DropdownMenuItem className="text-gray-300 hover:bg-slate-700 hover:text-white">
                          <Link
                            href={`/admin/knowledge-base/edit/${item.article.id}`}
                            className="flex items-center w-full"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            <span>Edit</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleToggleFeatured(
                              item.article.id,
                              item.article.featured
                            )
                          }
                          className="text-gray-300 hover:bg-slate-700 hover:text-white"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {item.article.featured ? 'Unfeature' : 'Feature'}
                        </DropdownMenuItem>
                        {item.article.status === 'published' && (
                          <DropdownMenuItem className="text-gray-300 hover:bg-slate-700 hover:text-white">
                            <Link
                              href={`/help/${item.article.slug}`}
                              target="_blank"
                              className="flex items-center w-full"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              <span>View Public</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(item.article.id)}
                          className="text-red-400 hover:bg-slate-700"
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
