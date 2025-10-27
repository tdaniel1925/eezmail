import { Shield } from 'lucide-react';
import { PermissionsMatrix } from '@/components/admin/PermissionsMatrix';

export default function PermissionsPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Permissions & Roles
            </h1>
          </div>
          
          {/* Page Description */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-900 dark:text-blue-200 mb-3">
              <strong>🔐 What is this page for?</strong>
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
              This page allows system administrators to manage granular permissions for each hierarchical role in the system.
              Control which features and actions each role can access to maintain security and proper access control.
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li><strong>9 Hierarchical Roles:</strong> User → Team User → Team Admin → Team Super Admin → Enterprise User → Enterprise Admin → Enterprise Super Admin → System Admin → System Super Admin</li>
              <li><strong>Granular Permissions:</strong> Control access to specific features (email management, user management, billing, etc.)</li>
              <li><strong>Real-time Updates:</strong> Changes take effect immediately when you click the checkboxes</li>
              <li><strong>Category Organization:</strong> Permissions are grouped by category for easy management</li>
              <li><strong>Database Synced:</strong> All changes are persisted to the database and enforced across the application</li>
            </ul>
            <p className="text-sm text-blue-800 dark:text-blue-300 mt-3">
              💡 <strong>How to use:</strong> Click the checkboxes to grant (✓) or revoke (✗) permissions for each role. Green checkbox = permission granted, gray = permission revoked.
            </p>
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <PermissionsMatrix />
        </div>
      </div>
    </div>
  );
}
