import { NextResponse } from 'next/server';
import { solarGet } from '../../_helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const smid = process.env.SOLARMGR_SMID;
    const info = await solarGet(`/v1/info/gateway/${smid}`);
    const pf = info?.powerflow ?? {};
    return NextResponse.json({
      ts: new Date().toISOString(),
      production_w: pf.pv_w ?? 0,
      consumption_w: pf.house_w ?? 0,
      grid_import_w: Math.max(0, pf.grid_w ?? 0),
      grid_export_w: Math.max(0, -(pf.grid_w ?? 0)),
      battery_w: pf.batt_w ?? 0,
      battery_soc: pf.batt_soc ?? null,
    });
  } catch (e) {
    return NextResponse.json({ error: 'solar_now_failed' }, { status: 500 });
  }
}
