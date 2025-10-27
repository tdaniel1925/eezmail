'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserPlus,
  Loader2,
  CheckCircle,
  XCircle,
  Building2,
  Users as UsersIcon,
  TestTube,
  Shield,
} from 'lucide-react';

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddUserModal({
  open,
  onOpenChange,
  onSuccess,
}: AddUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<
    'regular' | 'sandbox' | 'admin' | 'organization'
  >('regular');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'user',
    tier: 'individual',
    organizationName: '',
    autoGeneratePassword: true,
    customPassword: '',
    sendInvite: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Determine actual values based on user type
      let finalRole = formData.role;
      let finalTier = formData.tier;
      let isSandbox = false;

      switch (userType) {
        case 'sandbox':
          isSandbox = true;
          finalRole = 'user';
          break;
        case 'admin':
          finalRole = formData.role; // Use selected admin role
          finalTier = 'enterprise';
          break;
        case 'organization':
          finalTier = 'team';
          break;
        case 'regular':
        default:
          // Use form values as-is
          break;
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          role: finalRole,
          tier: finalTier,
          isSandbox,
          organizationName:
            userType === 'organization' ? formData.organizationName : undefined,
          password: formData.autoGeneratePassword
            ? undefined
            : formData.customPassword,
          sendInvite: formData.sendInvite,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setMessage({
        type: 'success',
        text: `${getUserTypeLabel()} created successfully! ${formData.sendInvite ? 'Invitation email sent.' : ''}`,
      });

      // Reset form after a delay
      setTimeout(() => {
        resetForm();
        onSuccess();
        onOpenChange(false);
      }, 2000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create user',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      role: 'user',
      tier: 'individual',
      organizationName: '',
      autoGeneratePassword: true,
      customPassword: '',
      sendInvite: true,
    });
    setMessage(null);
    setUserType('regular');
  };

  const getUserTypeLabel = () => {
    switch (userType) {
      case 'sandbox':
        return 'Sandbox user';
      case 'admin':
        return 'Admin user';
      case 'organization':
        return 'Organization user';
      default:
        return 'User';
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-400" />
            Add New User
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a new user account with the appropriate permissions and
            settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Inline message */}
          {message && (
            <div
              className={`rounded-lg p-4 flex items-start gap-3 ${
                message.type === 'success'
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'bg-red-500/20 border border-red-500/30'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <p
                className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-200' : 'text-red-200'
                }`}
              >
                {message.text}
              </p>
            </div>
          )}

          {/* User Type Selection */}
          <div className="space-y-3">
            <Label className="text-gray-300">User Type *</Label>
            <Tabs
              value={userType}
              onValueChange={(v) => setUserType(v as any)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4 bg-slate-700/50">
                <TabsTrigger
                  value="regular"
                  className="data-[state=active]:bg-blue-600"
                >
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Regular
                </TabsTrigger>
                <TabsTrigger
                  value="organization"
                  className="data-[state=active]:bg-purple-600"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Organization
                </TabsTrigger>
                <TabsTrigger
                  value="sandbox"
                  className="data-[state=active]:bg-yellow-600"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Sandbox
                </TabsTrigger>
                <TabsTrigger
                  value="admin"
                  className="data-[state=active]:bg-red-600"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={loading}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">
                Full Name *
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={loading}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
              />
            </div>

            {/* Organization Name (only for organization type) */}
            {userType === 'organization' && (
              <div className="space-y-2">
                <Label htmlFor="organizationName" className="text-gray-300">
                  Organization/Company Name *
                </Label>
                <Input
                  id="organizationName"
                  placeholder="Acme Corporation"
                  value={formData.organizationName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      organizationName: e.target.value,
                    })
                  }
                  required={userType === 'organization'}
                  disabled={loading}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
                />
              </div>
            )}
          </div>

          {/* Role & Tier Selection */}
          <div className="grid grid-cols-2 gap-4">
            {/* Role (for regular and admin users) */}
            {(userType === 'regular' || userType === 'admin') && (
              <div className="space-y-2">
                <Label htmlFor="role" className="text-gray-300">
                  Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                  disabled={loading}
                >
                  <SelectTrigger
                    id="role"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {userType === 'admin' ? (
                      <>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </>
                    ) : (
                      <SelectItem value="user">User</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Tier (for regular and organization users) */}
            {(userType === 'regular' || userType === 'organization') && (
              <div className="space-y-2">
                <Label htmlFor="tier" className="text-gray-300">
                  Subscription Tier
                </Label>
                <Select
                  value={formData.tier}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tier: value })
                  }
                  disabled={loading || userType === 'organization'}
                >
                  <SelectTrigger
                    id="tier"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                {userType === 'organization' && (
                  <p className="text-xs text-gray-400">
                    Organization users are automatically assigned Team tier
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Password Options */}
          <div className="space-y-3">
            <Label className="text-gray-300">Password</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoGeneratePassword"
                  checked={formData.autoGeneratePassword}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      autoGeneratePassword: checked as boolean,
                      customPassword: '',
                    })
                  }
                  disabled={loading}
                />
                <Label
                  htmlFor="autoGeneratePassword"
                  className="text-sm font-normal cursor-pointer text-gray-300"
                >
                  Auto-generate secure temporary password
                </Label>
              </div>

              {!formData.autoGeneratePassword && (
                <div className="space-y-2">
                  <Label htmlFor="customPassword" className="text-gray-300">
                    Custom Password
                  </Label>
                  <Input
                    id="customPassword"
                    type="password"
                    placeholder="Enter custom password"
                    value={formData.customPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customPassword: e.target.value,
                      })
                    }
                    required={!formData.autoGeneratePassword}
                    disabled={loading}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
                  />
                  <p className="text-xs text-gray-400">Minimum 8 characters</p>
                </div>
              )}
            </div>
          </div>

          {/* Send Invitation */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendInvite"
              checked={formData.sendInvite}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, sendInvite: checked as boolean })
              }
              disabled={loading}
            />
            <Label
              htmlFor="sendInvite"
              className="text-sm font-normal cursor-pointer text-gray-300"
            >
              Send invitation email with login credentials
            </Label>
          </div>

          {/* User Type Info */}
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4">
            <p className="text-sm text-blue-300">
              <strong>Creating:</strong> {getUserTypeLabel()}
              {userType === 'sandbox' && ' (for testing purposes, no billing)'}
              {userType === 'admin' && ' (full system access)'}
              {userType === 'organization' && ' (team collaboration features)'}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
