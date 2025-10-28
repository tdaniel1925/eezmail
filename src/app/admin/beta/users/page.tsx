'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Mail, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface BetaUser {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  betaCredits: {
    sms_limit: number;
    sms_used: number;
    ai_limit: number;
    ai_used: number;
  } | null;
  betaInvitedAt: string | null;
  betaExpiresAt: string | null;
  stats: {
    daysUntilExpiration: number | null;
    feedbackCount: number;
    lastActive: string | null;
  };
}

export default function BetaUsersPage() {
  const [users, setUsers] = useState<BetaUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/beta/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      toast.error('Failed to load beta users');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Beta Users</h1>
          <p className="text-muted-foreground">Manage your beta testing community</p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Beta User
            </Button>
          </DialogTrigger>
          <InviteUserDialog
            onSuccess={() => {
              fetchUsers();
              setInviteDialogOpen(false);
            }}
          />
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center">Loading...</div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No beta users yet</h3>
            <p className="text-muted-foreground">Invite your first beta tester to get started</p>
            <Button className="mt-4" onClick={() => setInviteDialogOpen(true)}>
              Invite Beta User
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}

function UserCard({ user }: { user: BetaUser }) {
  const smsPercent = user.betaCredits
    ? Math.round((user.betaCredits.sms_used / user.betaCredits.sms_limit) * 100)
    : 0;
  const aiPercent = user.betaCredits
    ? Math.round((user.betaCredits.ai_used / user.betaCredits.ai_limit) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {user.firstName} {user.lastName}
          </span>
          {user.stats.daysUntilExpiration !== null && user.stats.daysUntilExpiration <= 7 && (
            <Badge variant="destructive">Expiring Soon</Badge>
          )}
        </CardTitle>
        <CardDescription>@{user.username}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center text-sm">
          <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
          {user.email}
        </div>

        {user.betaCredits && (
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-sm">
                <span>SMS Credits</span>
                <span className="text-muted-foreground">
                  {user.betaCredits.sms_used}/{user.betaCredits.sms_limit}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${smsPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span>AI Credits</span>
                <span className="text-muted-foreground">
                  {user.betaCredits.ai_used}/{user.betaCredits.ai_limit}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${aiPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <TrendingUp className="mr-1 h-4 w-4 text-muted-foreground" />
            {user.stats.feedbackCount} feedback
          </div>
          {user.stats.daysUntilExpiration !== null && (
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
              {user.stats.daysUntilExpiration} days left
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InviteUserDialog({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    smsLimit: 50,
    aiLimit: 100,
    durationDays: 90,
  });
  const [credentials, setCredentials] = useState<{
    username: string;
    tempPassword: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/beta/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to invite user');
      }

      const data = await response.json();

      setCredentials({
        username: data.username,
        tempPassword: data.tempPassword,
      });

      toast.success('Beta user invited successfully!', {
        description: 'Welcome email has been sent.',
      });
    } catch (error) {
      toast.error('Failed to invite user', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (credentials) {
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Beta User Invited Successfully!</DialogTitle>
          <DialogDescription>
            The user has been invited and will receive a welcome email.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-sm font-medium">Login Credentials:</p>
            <p className="mt-2 text-sm">
              <strong>Username:</strong> {credentials.username}
            </p>
            <p className="text-sm">
              <strong>Temporary Password:</strong> {credentials.tempPassword}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              These credentials have also been emailed to the user.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSuccess}>Done</Button>
        </DialogFooter>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="max-w-md">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Invite Beta User</DialogTitle>
          <DialogDescription>
            Send an invitation to join the EaseMail Beta Program
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="company">Company (Optional)</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="smsLimit">SMS Credits</Label>
              <Input
                id="smsLimit"
                type="number"
                value={formData.smsLimit}
                onChange={(e) =>
                  setFormData({ ...formData, smsLimit: parseInt(e.target.value) })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="aiLimit">AI Credits</Label>
              <Input
                id="aiLimit"
                type="number"
                value={formData.aiLimit}
                onChange={(e) =>
                  setFormData({ ...formData, aiLimit: parseInt(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="durationDays">Duration (Days)</Label>
            <Input
              id="durationDays"
              type="number"
              value={formData.durationDays}
              onChange={(e) =>
                setFormData({ ...formData, durationDays: parseInt(e.target.value) })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Inviting...' : 'Send Invitation'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

