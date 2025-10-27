'use server';

import { db } from '@/lib/db';
import {
  notificationTemplates,
  templateImages,
  type NotificationTemplate,
  type NewNotificationTemplate,
  type TemplateImage,
  type NewTemplateImage,
} from '@/db/schema';
import { eq, and, desc, like, inArray, sql } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// TEMPLATE CRUD OPERATIONS
// ============================================================================

export async function getTemplates(filters?: {
  type?: string;
  audience?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { limit = 50, offset = 0, search } = filters || {};

  const conditions = [];

  if (filters?.type) {
    conditions.push(eq(notificationTemplates.type, filters.type as any));
  }
  if (filters?.audience) {
    conditions.push(
      eq(notificationTemplates.audience, filters.audience as any)
    );
  }
  if (filters?.status) {
    conditions.push(eq(notificationTemplates.status, filters.status as any));
  }
  if (search) {
    conditions.push(
      sql`(${notificationTemplates.name} ILIKE ${'%' + search + '%'} OR ${notificationTemplates.description} ILIKE ${'%' + search + '%'})`
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let query = db.select().from(notificationTemplates);

  if (whereClause) {
    query = query.where(whereClause) as any;
  }

  const templates = await query
    .orderBy(desc(notificationTemplates.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count
  let countQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(notificationTemplates);

  if (whereClause) {
    countQuery = countQuery.where(whereClause) as any;
  }

  const [{ count }] = await countQuery;

  return {
    templates,
    total: count,
  };
}

export async function getTemplateById(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const [template] = await db
    .select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.id, id))
    .limit(1);

  return template;
}

export async function getTemplateBySlug(slug: string) {
  const [template] = await db
    .select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.slug, slug))
    .limit(1);

  return template;
}

export async function createTemplate(
  data: Omit<NewNotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Check if admin
  const isAdmin =
    user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';

  if (!isAdmin) {
    throw new Error('Only admins can create templates');
  }

  const [template] = await db
    .insert(notificationTemplates)
    .values({
      ...data,
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning();

  console.log(
    `✅ [Template Service] Created template: ${template.name} (${template.id})`
  );

  return template;
}

export async function updateTemplate(
  id: string,
  data: Partial<
    Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  >
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Check if admin
  const isAdmin =
    user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';

  if (!isAdmin) {
    throw new Error('Only admins can update templates');
  }

  const [template] = await db
    .update(notificationTemplates)
    .set({
      ...data,
      updatedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(notificationTemplates.id, id))
    .returning();

  console.log(
    `✅ [Template Service] Updated template: ${template?.name} (${id})`
  );

  return template;
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Check if admin
  const isAdmin =
    user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';

  if (!isAdmin) {
    throw new Error('Only admins can delete templates');
  }

  await db
    .delete(notificationTemplates)
    .where(eq(notificationTemplates.id, id));

  console.log(`✅ [Template Service] Deleted template: ${id}`);

  return { success: true };
}

export async function duplicateTemplate(id: string, newName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const original = await getTemplateById(id);

  if (!original) {
    throw new Error('Template not found');
  }

  // Create new slug from name
  const slug = newName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

  const [duplicate] = await db
    .insert(notificationTemplates)
    .values({
      ...original,
      id: undefined as any,
      name: newName,
      slug,
      status: 'draft',
      createdBy: user.id,
      updatedBy: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  console.log(
    `✅ [Template Service] Duplicated template: ${original.name} → ${newName}`
  );

  return duplicate;
}

// ============================================================================
// IMAGE MANAGEMENT
// ============================================================================

export async function uploadTemplateImage(
  file: {
    filename: string;
    originalFilename: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    url: string;
    storageKey?: string;
  },
  metadata?: {
    altText?: string;
    description?: string;
    tags?: string[];
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const [image] = await db
    .insert(templateImages)
    .values({
      ...file,
      altText: metadata?.altText,
      description: metadata?.description,
      tags: metadata?.tags,
      uploadedBy: user.id,
    })
    .returning();

  console.log(
    `✅ [Template Service] Uploaded image: ${image.filename} (${image.id})`
  );

  return image;
}

export async function getTemplateImages(filters?: {
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { limit = 50, offset = 0, search, tags } = filters || {};

  const conditions = [];

  if (search) {
    conditions.push(
      sql`(${templateImages.filename} ILIKE ${'%' + search + '%'} OR ${templateImages.description} ILIKE ${'%' + search + '%'})`
    );
  }

  if (tags && tags.length > 0) {
    conditions.push(
      sql`${templateImages.tags} @> ${JSON.stringify(tags)}::jsonb`
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let query = db.select().from(templateImages);

  if (whereClause) {
    query = query.where(whereClause) as any;
  }

  const images = await query
    .orderBy(desc(templateImages.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count
  let countQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(templateImages);

  if (whereClause) {
    countQuery = countQuery.where(whereClause) as any;
  }

  const [{ count }] = await countQuery;

  return {
    images,
    total: count,
  };
}

export async function deleteTemplateImage(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Check if admin
  const isAdmin =
    user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';

  if (!isAdmin) {
    throw new Error('Only admins can delete images');
  }

  await db.delete(templateImages).where(eq(templateImages.id, id));

  console.log(`✅ [Template Service] Deleted image: ${id}`);

  return { success: true };
}

// ============================================================================
// TEMPLATE PREVIEW & TESTING
// ============================================================================

export async function previewTemplate(
  id: string,
  variables: Record<string, string>
) {
  const template = await getTemplateById(id);

  if (!template) {
    throw new Error('Template not found');
  }

  // Substitute variables in template
  let htmlContent = template.htmlContent;
  let textContent = template.textContent || '';
  let subject = template.subject;

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    htmlContent = htmlContent.replace(placeholder, value);
    textContent = textContent.replace(placeholder, value);
    subject = subject.replace(placeholder, value);
  });

  return {
    subject,
    htmlContent,
    textContent,
  };
}

export async function sendTestEmail(
  templateId: string,
  testEmail: string,
  variables: Record<string, string>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Import notification service
  const { sendNotification } = await import('./notification-service');

  const template = await getTemplateById(templateId);

  if (!template) {
    throw new Error('Template not found');
  }

  // Create temporary user record or use existing
  const [testUser] = await db
    .select()
    .from(require('@/db/schema').users)
    .where(eq(require('@/db/schema').users.email, testEmail))
    .limit(1);

  if (!testUser) {
    throw new Error('Test email must belong to an existing user');
  }

  // Send notification
  const result = await sendNotification({
    templateSlug: template.slug,
    recipientId: testUser.id,
    variables,
  });

  return result;
}

// ============================================================================
// TEMPLATE ANALYTICS
// ============================================================================

export async function getTemplateAnalytics(id: string) {
  const template = await getTemplateById(id);

  if (!template) {
    throw new Error('Template not found');
  }

  const [stats] = await db
    .select({
      totalSent: sql<number>`COUNT(*)`,
      totalDelivered: sql<number>`COUNT(*) FILTER (WHERE status = 'delivered')`,
      totalFailed: sql<number>`COUNT(*) FILTER (WHERE status = 'failed')`,
      totalOpened: sql<number>`COUNT(*) FILTER (WHERE opened_at IS NOT NULL)`,
      totalClicked: sql<number>`COUNT(*) FILTER (WHERE clicked_at IS NOT NULL)`,
      avgDeliveryTime: sql<number>`AVG(EXTRACT(EPOCH FROM (delivered_at - sent_at)))`,
      openRate: sql<number>`
        CASE 
          WHEN COUNT(*) > 0 THEN 
            (COUNT(*) FILTER (WHERE opened_at IS NOT NULL)::float / COUNT(*)::float * 100)
          ELSE 0 
        END
      `,
      clickRate: sql<number>`
        CASE 
          WHEN COUNT(*) > 0 THEN 
            (COUNT(*) FILTER (WHERE clicked_at IS NOT NULL)::float / COUNT(*)::float * 100)
          ELSE 0 
        END
      `,
    })
    .from(require('@/db/schema').notificationQueue)
    .where(eq(require('@/db/schema').notificationQueue.templateId, id));

  return {
    template,
    stats,
  };
}
