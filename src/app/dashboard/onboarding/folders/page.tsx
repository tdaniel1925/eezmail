import { FolderConfirmation } from '@/components/onboarding/FolderConfirmation';

interface FolderSelectionPageProps {
  searchParams: {
    accountId?: string;
    required?: string;
    optional?: string;
  };
}

export default function FolderSelectionPage({
  searchParams,
}: FolderSelectionPageProps) {
  const accountId = searchParams.accountId;
  const isRequired = searchParams.required === 'true';
  const isOptional = searchParams.optional === 'true';

  if (!accountId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Missing Account ID</h1>
          <p className="text-gray-600">
            Unable to load folder selection without an account ID.
          </p>
        </div>
      </div>
    );
  }

  return (
    <FolderConfirmation
      accountId={accountId}
      isRequired={isRequired}
      isOptional={isOptional}
    />
  );
}
