import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (should be much smaller for 10-minute voice)
const MAX_DURATION = 600; // 10 minutes in seconds

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const audioBlob = formData.get('audio') as Blob;
    const duration = parseInt(formData.get('duration') as string) || 0;
    const quality = (formData.get('quality') as string) || 'medium';

    if (!audioBlob) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (audioBlob.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
        },
        { status: 400 }
      );
    }

    // Validate duration
    if (duration > MAX_DURATION) {
      return NextResponse.json(
        {
          error: `Duration exceeds ${MAX_DURATION} seconds limit`,
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg',
      'audio/ogg;codecs=opus',
    ];

    if (!allowedTypes.includes(audioBlob.type)) {
      return NextResponse.json(
        { error: 'Invalid audio format. Only WebM/Opus is supported.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const filename = `${user.id}/${timestamp}-${randomId}.webm`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voice-messages')
      .upload(filename, audioBlob, {
        contentType: audioBlob.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload voice message' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('voice-messages')
      .getPublicUrl(filename);

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: 'Failed to generate public URL' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      id: uploadData.path,
      url: urlData.publicUrl,
      filename,
      size: audioBlob.size,
      duration,
      quality,
      format: audioBlob.type,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Voice message upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload voice message' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
