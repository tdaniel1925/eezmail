'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createOrganization } from '@/lib/organizations/actions';
import { toast } from 'sonner';
import { Building2, Loader2, ArrowRight } from 'lucide-react';

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    pricingTier: 'standard',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.name.trim()) {
        toast.error('Please enter an organization name');
        return;
      }

      const result = await createOrganization({
        name: formData.name,
        slug: formData.slug || undefined,
        pricingTier: formData.pricingTier,
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to create organization');
        return;
      }

      toast.success('✅ Organization created successfully!');
      router.push(`/dashboard/organizations/${result.organizationId}`);
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Create Organization
              </h1>
              <p className="text-slate-600">
                Set up a master account for your team
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="border-2 border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Organization Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: formData.slug || generateSlug(e.target.value),
                    });
                  }}
                  placeholder="Acme Corporation"
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Your company or team name
                </p>
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Organization Slug
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-sm">
                    yourapp.com/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: generateSlug(e.target.value) })
                    }
                    placeholder="acme-corp"
                    className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  URL-friendly identifier (auto-generated from name)
                </p>
              </div>

              {/* Pricing Tier */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Pricing Tier
                </label>
                <select
                  value={formData.pricingTier}
                  onChange={(e) =>
                    setFormData({ ...formData, pricingTier: e.target.value })
                  }
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="standard">Standard - $0.0100/SMS</option>
                  <option value="volume">Volume - $0.0085/SMS</option>
                  <option value="enterprise">Enterprise - $0.0075/SMS</option>
                  <option value="partner">Partner - $0.0050/SMS</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Default SMS rate for your organization
                </p>
              </div>

              {/* Info Box */}
              <div className="rounded-lg bg-blue-50 border-2 border-blue-200 p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  What happens next?
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• You'll be set as the organization owner</li>
                  <li>• You can invite team members via email</li>
                  <li>• All team SMS/AI usage bills to your org account</li>
                  <li>• Admins can see all team communications</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading || !formData.name.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Organization
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

