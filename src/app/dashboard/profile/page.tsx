/**
 * User Profile Page
 * View and edit personal information
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Building, Calendar, Shield } from 'lucide-react';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user details
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  const initials = userData?.fullName
    ? userData.fullName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : user.email?.[0].toUpperCase();

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Profile Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your personal information and account settings
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <div className="h-24 w-24 rounded-lg bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                {initials}
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    defaultValue={userData?.fullName || ''}
                    className="max-w-md"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center gap-2 max-w-md">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      defaultValue={user.email}
                      disabled
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    defaultValue={userData?.phone || ''}
                    placeholder="+1 (555) 000-0000"
                    className="max-w-md"
                  />
                </div>

                <Button>Save Changes</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600 dark:text-gray-400">
                  Account Type
                </Label>
                <p className="font-medium capitalize">
                  {userData?.accountType || 'Individual'}
                </p>
              </div>

              <div>
                <Label className="text-gray-600 dark:text-gray-400">Role</Label>
                <p className="font-medium capitalize">
                  {userData?.role || 'User'}
                </p>
              </div>

              <div>
                <Label className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </Label>
                <p className="font-medium">
                  {userData?.createdAt
                    ? new Date(userData.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>

              <div>
                <Label className="text-gray-600 dark:text-gray-400">
                  Last Updated
                </Label>
                <p className="font-medium">
                  {userData?.updatedAt
                    ? new Date(userData.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>

            {userData?.organizationId && (
              <div className="pt-4 border-t">
                <Label className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Organization
                </Label>
                <p className="font-medium">{userData.organizationId}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Password</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="password"
                  value="••••••••"
                  disabled
                  className="max-w-md bg-gray-50 dark:bg-gray-800"
                />
                <Button variant="ghost">Change Password</Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button variant="danger" className="text-red-600">
                Request Account Deletion
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
