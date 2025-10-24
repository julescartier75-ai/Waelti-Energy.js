import { NextResponse } from 'next/server';
import { ecarupGet } from '../../_helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await ecarupGet('/v1/sessions?limit=50');
    return NextResponse.json(list?.items || list || []);
  } catch (e) {
    return NextResponse.json({ error: 'ecarup_sessions_failed' }, { status: 500 });
  }
}
