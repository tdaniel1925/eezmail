'use server';

import { createClient } from '@/lib/supabase/server';

export interface InlineImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload an inline image to Supabase Storage
 * Returns a public URL that can be embedded in email HTML
 */
export async function uploadInlineImage(
  file: File
): Promise<InlineImageUploadResult> {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Only image files are allowed' };
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return {
        success: false,
        error: 'Image must be smaller than 5MB',
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'png';
    const filename = `inline-${timestamp}-${randomString}.${extension}`;
    const filePath = `${user.id}/inline-images/${filename}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`,
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('attachments').getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error('Error uploading inline image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete an inline image from Supabase Storage
 */
export async function deleteInlineImage(
  url: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Extract file path from URL
    // URL format: https://[...].supabase.co/storage/v1/object/public/attachments/[path]
    const urlParts = url.split('/attachments/');
    if (urlParts.length < 2) {
      return { success: false, error: 'Invalid URL format' };
    }

    const filePath = urlParts[1];

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('attachments')
      .remove([filePath]);

    if (deleteError) {
      console.error('Error deleting inline image:', deleteError);
      return {
        success: false,
        error: `Delete failed: ${deleteError.message}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting inline image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

