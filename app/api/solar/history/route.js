import { NextResponse } from 'next/server';
import { solarGet } from '../../_helpers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = Number(searchParams.get('hours') || 24);
    const smid = process.env.SOLARMGR_SMID;
    const hist = await solarGet(`/v1/history/energy/${smid}?hours=${hours}`);
    const out = (hist?.points || []).map((p) => ({
      ts: p.ts,
      production_w: p.pv_w,
      consumption_w: p.house_w,
    }));
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: 'solar_history_failed' }, { status: 500 });
  }
}
