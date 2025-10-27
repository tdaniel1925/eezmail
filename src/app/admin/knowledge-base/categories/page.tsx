'use client';

/**
 * Knowledge Base Categories Management
 * Manage article categories and organization
 */

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FolderOpen, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { InlineNotification } from '@/components/ui/inline-notification';

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    sortOrder: 0,
  });

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  async function loadCategories() {
    try {
      const response = await fetch('/api/admin/kb/categories');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        if (response.status === 403) {
          router.push('/dashboard');
          return;
        }
        throw new Error('Failed to load categories');
      }
      const data = await response.json();
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateCategory = async () => {
    setIsSaving(true);
    setNotification(null);

    try {
      const response = await fetch('/api/admin/kb/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      setNotification({
        type: 'success',
        message: 'Category created successfully!',
      });

      setIsDialogOpen(false);
      setFormData({
        name: '',
        slug: '',
        description: '',
        icon: '',
        sortOrder: 0,
      });
      loadCategories();
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.message || 'Failed to create category',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await fetch(`/api/admin/kb/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      setNotification({
        type: 'success',
        message: 'Category deleted successfully!',
      });

      loadCategories();
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.message || 'Failed to delete category',
      });
    }
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="container mx-auto">
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

        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 text-gray-300 hover:text-white hover:bg-slate-700"
            onClick={() => router.push('/admin/knowledge-base')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Articles
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Manage Categories
              </h1>
              <p className="text-gray-400">
                Organize your knowledge base articles into categories
              </p>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </Button>
          </div>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FolderOpen className="h-5 w-5" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-gray-400 text-center py-8">
                Loading categories...
              </div>
            ) : (
              <div className="border border-slate-700 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-700/50 border-slate-700">
                      <TableHead className="text-gray-300">Name</TableHead>
                      <TableHead className="text-gray-300">Slug</TableHead>
                      <TableHead className="text-gray-300">Icon</TableHead>
                      <TableHead className="text-gray-300">Articles</TableHead>
                      <TableHead className="text-gray-300">
                        Sort Order
                      </TableHead>
                      <TableHead className="text-right text-gray-300">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-gray-400 py-8"
                        >
                          No categories found. Create your first category!
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((category) => (
                        <TableRow
                          key={category.id}
                          className="border-slate-700 hover:bg-slate-700/30"
                        >
                          <TableCell className="font-medium text-white">
                            {category.name}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-gray-300">
                            /{category.slug}
                          </TableCell>
                          <TableCell>
                            {category.icon && (
                              <span className="text-2xl">{category.icon}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {/* TODO: Add article count */}-
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {category.sortOrder}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-300 hover:text-white hover:bg-slate-700"
                              onClick={() => handleDelete(category.id)}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Category Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a new category to organize your knowledge base articles
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name" className="text-gray-300">
                  Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Getting Started"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
                />
              </div>
              <div>
                <Label htmlFor="slug" className="text-gray-300">
                  Slug *
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="getting-started"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-300">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of this category"
                  rows={3}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon" className="text-gray-300">
                    Icon (emoji)
                  </Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    placeholder="📚"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <Label htmlFor="sortOrder" className="text-gray-300">
                    Sort Order
                  </Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sortOrder: parseInt(e.target.value) || 0,
                      })
                    }
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCategory}
                disabled={isSaving || !formData.name || !formData.slug}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Category'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
