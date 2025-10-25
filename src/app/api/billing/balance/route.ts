import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCombinedBalance } from '@/lib/billing/ai-pricing';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const balance = await getCombinedBalance(user.id);

    return NextResponse.json(balance);
  } catch (error) {
    console.error('❌ Error fetching balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}

