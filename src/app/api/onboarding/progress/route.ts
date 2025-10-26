import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOnboardingProgress } from '@/lib/onboarding/actions';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const progress = await getOnboardingProgress(user.id);
    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error fetching onboarding progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}


