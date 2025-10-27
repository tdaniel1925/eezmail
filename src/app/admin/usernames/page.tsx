'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Copy, Check, Users, Shield, TestTube } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';

interface UserCredential {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  role: string;
  roleHierarchy: string | null;
  isSandboxUser: boolean;
  createdAt: Date;
}

interface Stats {
  total: number;
  regular: number;
  sandbox: number;
  admins: number;
}

export default function UsernamesPage() {
  const [users, setUsers] = useState<UserCredential[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserCredential[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, regular: 0, sandbox: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userType, setUserType] = useState<'all' | 'regular' | 'sandbox'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [userType]);

  useEffect(() => {
    // Client-side search
    if (search) {
      const filtered = users.filter(
        (u) =>
          u.username?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u.fullName?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [search, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/usernames?type=${userType}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setFilteredUsers(data.users);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const exportToCSV = () => {
    const headers = ['Username', 'Email', 'Full Name', 'Role', 'Type', 'Created'];
    const rows = filteredUsers.map((u) => [
      u.username,
      u.email,
      u.fullName || '',
      u.role,
      u.isSandboxUser ? 'Sandbox' : 'Regular',
      new Date(u.createdAt).toLocaleDateString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...rows].map((row) => row.join(',')).join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `usernames_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            All User Credentials
          </h1>
          <p className="text-gray-400">
            View and manage all usernames and email addresses in the system
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="text-gray-400 text-sm">Total Users</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-green-400" />
              <span className="text-gray-400 text-sm">Regular Users</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.regular}</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <TestTube className="h-5 w-5 text-purple-400" />
              <span className="text-gray-400 text-sm">Sandbox Users</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.sandbox}</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-5 w-5 text-red-400" />
              <span className="text-gray-400 text-sm">Administrators</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.admins}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by username, email, or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
              />
            </div>

            <Select value={userType} onValueChange={(v: any) => setUserType(v)}>
              <SelectTrigger className="w-full md:w-48 bg-slate-700/50 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="regular">Regular Only</SelectItem>
                <SelectItem value="sandbox">Sandbox Only</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={exportToCSV}
              variant="outline"
              className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-gray-300 font-semibold">Username</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Email</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Full Name</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Role</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Type</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Created</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center p-12 text-gray-400">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-12 text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono">
                            {user.username}
                          </span>
                          <button
                            onClick={() => copyToClipboard(user.username, `username-${user.id}`)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            {copiedId === `username-${user.id}` ? (
                              <Check className="h-4 w-4 text-green-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300">{user.email}</span>
                          <button
                            onClick={() => copyToClipboard(user.email, `email-${user.id}`)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            {copiedId === `email-${user.id}` ? (
                              <Check className="h-4 w-4 text-green-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-gray-300">
                        {user.fullName || '-'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.role === 'super_admin'
                              ? 'bg-red-900/30 text-red-400'
                              : user.role === 'admin'
                              ? 'bg-orange-900/30 text-orange-400'
                              : 'bg-blue-900/30 text-blue-400'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.isSandboxUser
                              ? 'bg-purple-900/30 text-purple-400'
                              : 'bg-green-900/30 text-green-400'
                          }`}
                        >
                          {user.isSandboxUser ? 'Sandbox' : 'Regular'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {formatDistanceToNow(new Date(user.createdAt), {
                          addSuffix: true,
                        })}
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            copyToClipboard(
                              `Username: ${user.username}\nEmail: ${user.email}`,
                              `both-${user.id}`
                            )
                          }
                          className="text-gray-400 hover:text-white"
                        >
                          {copiedId === `both-${user.id}` ? (
                            <Check className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-900/20 border border-blue-800 rounded-xl p-6">
          <h3 className="text-blue-400 font-semibold mb-2">
            Username Authentication System
          </h3>
          <p className="text-gray-300 text-sm">
            All users must log in using their <strong>username</strong>, not their email address.
            Email addresses are used only for notifications and password recovery.
          </p>
        </div>
      </div>
    </div>
  );
}

