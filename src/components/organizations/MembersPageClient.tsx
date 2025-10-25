'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  Loader2,
  Crown,
} from 'lucide-react';
import {
  getOrganizationMembers,
  addMember,
  removeMember,
  updateMemberRole,
} from '@/lib/organizations/actions';
import { toast } from 'sonner';

export default function MembersPageClient() {
  const params = useParams();
  const orgId = params.orgId as string;

  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'member'>('member');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [orgId]);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const result = await getOrganizationMembers(orgId);
      if (result.success && result.members) {
        setMembers(result.members);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsInviting(true);
    try {
      const result = await addMember(orgId, inviteEmail, inviteRole);

      if (!result.success) {
        toast.error(result.error || 'Failed to add member');
        return;
      }

      toast.success(`✅ ${inviteEmail} added as ${inviteRole}!`);
      setShowInvite(false);
      setInviteEmail('');
      setInviteRole('member');
      loadMembers();
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error('Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (memberId: string, email: string) => {
    if (!confirm(`Remove ${email} from organization?`)) {
      return;
    }

    try {
      const result = await removeMember(orgId, memberId);

      if (!result.success) {
        toast.error(result.error || 'Failed to remove member');
        return;
      }

      toast.success(`✅ ${email} removed`);
      loadMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'manager' | 'member') => {
    try {
      const result = await updateMemberRole(memberId, newRole);

      if (!result.success) {
        toast.error(result.error || 'Failed to update role');
        return;
      }

      toast.success(`✅ Role updated to ${newRole}`);
      loadMembers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Team Members</h2>
          <p className="text-slate-600">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowInvite(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Members List */}
      <Card className="border-2 border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            All Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : members.length > 0 ? (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg border-2 border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">
                        {member.fullName || member.email}
                      </div>
                      <div className="text-sm text-slate-600">{member.email}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Joined {new Date(member.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {member.role === 'owner' ? (
                      <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                        <Crown className="h-3 w-3 mr-1" />
                        Owner
                      </Badge>
                    ) : (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(
                            member.id,
                            e.target.value as 'admin' | 'manager' | 'member'
                          )
                        }
                        className="px-3 py-1 border-2 border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="member">Member</option>
                      </select>
                    )}
                    {member.role !== 'owner' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemove(member.id, member.email)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-sm">No members yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-slate-500 mt-1">
                They must already have an account
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as 'admin' | 'manager' | 'member')
                }
                className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="member">Member - Basic access</option>
                <option value="manager">Manager - Can view all</option>
                <option value="admin">Admin - Can manage members</option>
              </select>
            </div>

            <div className="rounded-lg bg-blue-50 border-2 border-blue-200 p-3">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                Role Permissions:
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                {inviteRole === 'admin' && (
                  <>
                    <li>• Can add/remove members</li>
                    <li>• Can view all team communications</li>
                  </>
                )}
                {inviteRole === 'manager' && (
                  <>
                    <li>• Can view all team communications</li>
                    <li>• Cannot manage members</li>
                  </>
                )}
                {inviteRole === 'member' && (
                  <>
                    <li>• Can use SMS and AI features</li>
                    <li>• Usage bills to organization</li>
                  </>
                )}
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowInvite(false)}
                className="flex-1"
                disabled={isInviting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                className="flex-1"
                disabled={isInviting || !inviteEmail.trim()}
              >
                {isInviting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Inviting...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send Invite
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

