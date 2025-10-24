import { NextResponse } from 'next/server';
import { ecarupPost } from '../../_helpers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { station_id, action, value } = await request.json();
    if (!station_id || !action) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

    if (action === 'start') {
      await ecarupPost(`/v1/stations/${station_id}/start`, {});
    } else if (action === 'stop') {
      await ecarupPost(`/v1/stations/${station_id}/stop`, {});
    } else if (action === 'set_current') {
      await ecarupPost(`/v1/stations/${station_id}/set-current`, { current: Number(value) });
    } else {
      return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'ecarup_command_failed' }, { status: 500 });
  }
}
