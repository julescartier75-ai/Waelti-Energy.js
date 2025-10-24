import { NextResponse } from 'next/server';
import { ecarupGet } from '../../_helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await ecarupGet('/v1/stations');
    return NextResponse.json(list?.items || list || []);
  } catch (e) {
    return NextResponse.json({ error: 'ecarup_stations_failed' }, { status: 500 });
  }
}
