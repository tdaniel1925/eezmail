'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Eye,
  Send,
  Save,
  Copy,
  Trash2,
  Code,
  Sparkles,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InlineNotification } from '@/components/ui/inline-notification';

interface TemplateEditorProps {
  templateId?: string;
  initialData?: any;
}

export function TemplateEditor({
  templateId,
  initialData,
}: TemplateEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');

  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    slug: initialData?.slug || '',
    type: initialData?.type || 'transactional',
    audience: initialData?.audience || 'all',
    status: initialData?.status || 'draft',
    subject: initialData?.subject || '',
    htmlContent: initialData?.htmlContent || '',
    textContent: initialData?.textContent || '',
    preheader: initialData?.preheader || '',
    fromName: initialData?.fromName || 'EaseMail',
    fromEmail: initialData?.fromEmail || 'noreply@easemail.ai',
    replyToEmail: initialData?.replyToEmail || '',
    category: initialData?.category || '',
    tags: initialData?.tags || [],
    variables: initialData?.variables || [],
  });

  const [newTag, setNewTag] = useState('');
  const [newVariable, setNewVariable] = useState('');
  const [previewData, setPreviewData] = useState<Record<string, string>>({});

  // Generate slug from name
  useEffect(() => {
    if (!templateId && formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.name, templateId]);

  // Extract variables from HTML content
  useEffect(() => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const matches = [...formData.htmlContent.matchAll(variableRegex)];
    const extractedVars = [...new Set(matches.map((m) => m[1]))];

    if (JSON.stringify(extractedVars) !== JSON.stringify(formData.variables)) {
      setFormData((prev) => ({ ...prev, variables: extractedVars }));
    }
  }, [formData.htmlContent]);

  const handleSave = async (asDraft = false) => {
    // Validate required fields
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Template name is required';
    if (!formData.slug) newErrors.slug = 'Slug is required';
    if (!formData.subject) newErrors.subject = 'Subject line is required';
    if (!formData.htmlContent)
      newErrors.htmlContent = 'HTML content is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setNotification({
        type: 'error',
        message: 'Please fill in all required fields',
      });
      return;
    }

    setErrors({});
    setSaving(true);
    setNotification(null);
    try {
      const url = templateId
        ? `/api/admin/templates/${templateId}`
        : '/api/admin/templates';

      const method = templateId ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        status: asDraft ? 'draft' : formData.status,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save template');
      }

      setNotification({
        type: 'success',
        message: templateId
          ? 'Template updated successfully'
          : 'Template created successfully',
      });

      if (!templateId && data.template) {
        // Wait a bit to show the success message, then redirect
        setTimeout(() => {
          router.push(`/admin/notification-templates/${data.template.id}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setNotification({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Failed to save template',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!templateId) {
      setNotification({
        type: 'error',
        message: 'Please save the template before sending a test email',
      });
      return;
    }

    if (!formData.fromEmail) {
      setNotification({
        type: 'error',
        message: 'Please enter a test email address',
      });
      return;
    }

    setLoading(true);
    setNotification(null);
    try {
      const response = await fetch(`/api/admin/templates/${templateId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: formData.fromEmail,
          variables: previewData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email');
      }

      setNotification({
        type: 'success',
        message: `Test email sent successfully to ${formData.fromEmail}!`,
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      setNotification({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Failed to send test email',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!templateId) return;

    setLoading(true);
    setNotification(null);
    try {
      const response = await fetch(
        `/api/admin/templates/${templateId}/duplicate`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to duplicate template');
      }

      setNotification({
        type: 'success',
        message: 'Template duplicated successfully. Redirecting...',
      });

      setTimeout(() => {
        router.push(`/admin/notification-templates/${data.newTemplate.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error duplicating template:', error);
      setNotification({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to duplicate template',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!templateId) return;
    if (
      !confirm(
        'Are you sure you want to delete this template? This action cannot be undone.'
      )
    )
      return;

    setLoading(true);
    setNotification(null);
    try {
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete template');
      }

      setNotification({
        type: 'success',
        message: 'Template deleted successfully. Redirecting...',
      });

      setTimeout(() => {
        router.push('/admin/notification-templates');
      }, 1500);
    } catch (error) {
      console.error('Error deleting template:', error);
      setNotification({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Failed to delete template',
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag] }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const addVariable = () => {
    if (newVariable && !formData.variables.includes(newVariable)) {
      setFormData((prev) => ({
        ...prev,
        variables: [...prev.variables, newVariable],
      }));
      setNewVariable('');
    }
  };

  const removeVariable = (variable: string) => {
    setFormData((prev) => ({
      ...prev,
      variables: prev.variables.filter((v) => v !== variable),
    }));
  };

  const renderPreview = () => {
    let html = formData.htmlContent;

    // Replace variables with preview data or placeholder
    formData.variables.forEach((variable) => {
      const value = previewData[variable] || `{{${variable}}}`;
      html = html.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
    });

    return html;
  };

  return (
    <div className="space-y-6">
      {/* Inline Notification */}
      {notification && (
        <InlineNotification
          type={notification.type}
          message={notification.message}
          onDismiss={() => setNotification(null)}
        />
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {templateId ? 'Edit Template' : 'Create New Template'}
          </h2>
          <p className="text-muted-foreground">
            {templateId
              ? `Editing: ${formData.name}`
              : 'Create a new email template'}
          </p>
        </div>
        <div className="flex gap-2">
          {templateId && (
            <>
              <Button
                variant="outline"
                onClick={handleDuplicate}
                disabled={loading}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                onClick={handleSendTest}
                disabled={loading}
              >
                <Send className="mr-2 h-4 w-4" />
                Send Test
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            Save as Draft
          </Button>
          <Button onClick={() => handleSave(false)} disabled={saving}>
            <Mail className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : templateId ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="edit">
            <Code className="mr-2 h-4 w-4" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="variables">
            <Sparkles className="mr-2 h-4 w-4" />
            Variables
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Template name, type, and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Template Name *{' '}
                    {errors.name && (
                      <span className="text-destructive text-xs ml-2">
                        {errors.name}
                      </span>
                    )}
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }));
                      setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    placeholder="Welcome Email"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">
                    Slug *{' '}
                    {errors.slug && (
                      <span className="text-destructive text-xs ml-2">
                        {errors.slug}
                      </span>
                    )}
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        slug: e.target.value,
                      }));
                      setErrors((prev) => ({ ...prev, slug: '' }));
                    }}
                    placeholder="welcome-email"
                    disabled={!!templateId}
                    className={errors.slug ? 'border-destructive' : ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe when this template is used..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transactional">
                        Transactional
                      </SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="sandbox">Sandbox</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">Audience *</Label>
                  <Select
                    value={formData.audience}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, audience: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="sandbox">Sandbox</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
              <CardDescription>
                Subject line, preheader, and email body
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">
                  Subject Line *{' '}
                  {errors.subject && (
                    <span className="text-destructive text-xs ml-2">
                      {errors.subject}
                    </span>
                  )}
                </Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }));
                    setErrors((prev) => ({ ...prev, subject: '' }));
                  }}
                  placeholder="Welcome to EaseMail!"
                  className={errors.subject ? 'border-destructive' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preheader">Preheader Text</Label>
                <Input
                  id="preheader"
                  value={formData.preheader}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      preheader: e.target.value,
                    }))
                  }
                  placeholder="Preview text that appears after subject line"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="htmlContent">
                  HTML Content *{' '}
                  {errors.htmlContent && (
                    <span className="text-destructive text-xs ml-2">
                      {errors.htmlContent}
                    </span>
                  )}
                </Label>
                <Textarea
                  id="htmlContent"
                  value={formData.htmlContent}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      htmlContent: e.target.value,
                    }));
                    setErrors((prev) => ({ ...prev, htmlContent: '' }));
                  }}
                  placeholder="<html>...</html>"
                  rows={15}
                  className={`font-mono text-sm ${errors.htmlContent ? 'border-destructive' : ''}`}
                />
                <p className="text-xs text-muted-foreground">
                  Use variables like {'{'}
                  {'{'}userName{'}}'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textContent">Plain Text Content</Label>
                <Textarea
                  id="textContent"
                  value={formData.textContent}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      textContent: e.target.value,
                    }))
                  }
                  placeholder="Plain text version for email clients that don't support HTML"
                  rows={8}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sender Information</CardTitle>
              <CardDescription>
                Configure who the email appears to be from
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={formData.fromName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fromName: e.target.value,
                      }))
                    }
                    placeholder="EaseMail"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={formData.fromEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fromEmail: e.target.value,
                      }))
                    }
                    placeholder="noreply@easemail.ai"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="replyToEmail">Reply-To Email</Label>
                <Input
                  id="replyToEmail"
                  type="email"
                  value={formData.replyToEmail}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      replyToEmail: e.target.value,
                    }))
                  }
                  placeholder="support@easemail.ai"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  placeholder="onboarding"
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
              <CardDescription>
                Preview how the email will look to recipients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Variables will be replaced with test data or shown as
                  placeholders
                </AlertDescription>
              </Alert>
              <div className="border rounded-lg p-4 bg-white">
                <div className="mb-4 pb-4 border-b">
                  <p className="text-sm text-muted-foreground">Subject:</p>
                  <p className="font-medium">{formData.subject}</p>
                </div>
                <div
                  dangerouslySetInnerHTML={{ __html: renderPreview() }}
                  className="prose max-w-none"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Variables</CardTitle>
              <CardDescription>
                Variables detected in your template and test values
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Variables are automatically detected from your HTML content.
                  Use {'{'}
                  {'{'}variableName{'}}'}
                  syntax.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Add Custom Variable</Label>
                <div className="flex gap-2">
                  <Input
                    value={newVariable}
                    onChange={(e) => setNewVariable(e.target.value)}
                    placeholder="variableName"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addVariable();
                      }
                    }}
                  />
                  <Button type="button" onClick={addVariable} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Detected Variables ({formData.variables.length})</Label>
                {formData.variables.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No variables detected. Add {'{'}
                    {'{'}variableName{'}}'}
                    to your HTML.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {formData.variables.map((variable) => (
                      <div key={variable} className="flex gap-2 items-center">
                        <Badge variant="outline" className="font-mono">
                          {'{'}
                          {'{'}
                          {variable}
                          {'}}'}
                        </Badge>
                        <Input
                          value={previewData[variable] || ''}
                          onChange={(e) =>
                            setPreviewData((prev) => ({
                              ...prev,
                              [variable]: e.target.value,
                            }))
                          }
                          placeholder={`Test value for ${variable}`}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVariable(variable)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
