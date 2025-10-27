import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { TemplateEditor } from '@/components/admin/TemplateEditor';
import { db } from '@/lib/db';
import { notificationTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface EditTemplatePageProps {
  params: {
    id: string;
  };
}

async function getTemplate(id: string) {
  const template = await db.query.notificationTemplates.findFirst({
    where: eq(notificationTemplates.id, id),
  });

  return template;
}

export default async function EditTemplatePage({
  params,
}: EditTemplatePageProps) {
  const { id } = await params;
  const template = await getTemplate(id);

  if (!template) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<TemplateEditorSkeleton />}>
        <TemplateEditor templateId={id} initialData={template} />
      </Suspense>
    </div>
  );
}

function TemplateEditorSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
