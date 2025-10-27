import { Shield } from 'lucide-react';
import { PermissionsMatrix } from '@/components/admin/PermissionsMatrix';

export default function PermissionsPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Permissions Management
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage role-based permissions for the entire system
          </p>
        </div>

        {/* Permissions Matrix */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <PermissionsMatrix />
        </div>
      </div>
    </div>
  );
}
