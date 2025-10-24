'use client';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [now, setNow] = useState(null);
  const [history, setHistory] = useState([]);
  const [stations, setStations] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [selectedStation, setSelectedStation] = useState('');
  const [newCurrent, setNewCurrent] = useState('');

  async function fetchAll() {
  const getJson = async (url) => {
    const r = await fetch(url, { cache: 'no-store' });
    const text = await r.text(); // lit toujours le texte
    if (!r.ok) {
      // essaie JSON sinon remonte l'HTML pour debug
      try { 
        const j = JSON.parse(text);
        throw new Error(`${url}: ${j.error || r.statusText}`);
      } catch {
        throw new Error(`${url}: HTTP ${r.status} – ${text.slice(0,120)}...`);
      }
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`${url}: réponse non-JSON`);
    }
  };

  try {
    setLoading(true);
    const [nowRes, histRes, stRes, sessRes] = await Promise.all([
      getJson('/api/solar/now'),
      getJson('/api/solar/history?hours=24'),
      getJson('/api/ecarup/stations'),
      getJson('/api/ecarup/sessions'),
    ]);
    setNow(nowRes);
    setHistory(histRes);
    setStations(stRes);
    setSessions(sessRes);
    if (!selectedStation && stRes?.length) setSelectedStation(String(stRes[0].id));
    setError(null);
  } catch (e) {
    setError(String(e.message || e));
  } finally {
    setLoading(false);
  }
}


  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 30000);
    return () => clearInterval(id);
  }, []);

  const totals = useMemo(() => {
    const prod = Number(now?.production_w ?? 0);
    const cons = Number(now?.consumption_w ?? 0);
    const gridIn = Number(now?.grid_import_w ?? 0);
    const gridOut = Number(now?.grid_export_w ?? 0);
    const batt = Number(now?.battery_w ?? 0);
    const soc = Number(now?.battery_soc ?? 0);
    return { prod, cons, gridIn, gridOut, batt, soc };
  }, [now]);

  async function startCharging() {
    if (!selectedStation) return;
    await fetch('/api/ecarup/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ station_id: selectedStation, action: 'start' }),
    });
    fetchAll();
  }

  async function stopCharging() {
    if (!selectedStation) return;
    await fetch('/api/ecarup/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ station_id: selectedStation, action: 'stop' }),
    });
    fetchAll();
  }

  async function applyCurrent() {
    const val = Number(newCurrent);
    if (!selectedStation || !Number.isFinite(val)) return;
    await fetch('/api/ecarup/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ station_id: selectedStation, action: 'set_current', value: val }),
    });
    setNewCurrent('');
    fetchAll();
  }

  const fmt = (w) => (w >= 1000 ? `${(w / 1000).toFixed(2)} kW` : `${Math.round(w)} W`);

  const historyDisplay = useMemo(() => {
    return history.map((d) => ({
      ts: new Date(d.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      production: Number(d.production_w ?? 0) / 1000,
      consumption: Number(d.consumption_w ?? 0) / 1000,
    }));
  }, [history]);

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Tableau énergie</h1>
            <p className="text-slate-600">Production solaire, consommation, réseau & bornes (eCarUp)</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary btn" onClick={fetchAll}>Actualiser</button>
          </div>
        </header>

        {error && (
          <div className="card text-red-700 bg-red-50">Erreur : {error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="card">
            <div className="label">Production solaire</div>
            <div className="kpi mt-2">{fmt(totals.prod)}</div>
            <div className="text-xs text-slate-500">Mis à jour : {now?.ts ? new Date(now.ts).toLocaleTimeString() : '–'}</div>
          </div>
          <div className="card">
            <div className="label">Consommation</div>
            <div className="kpi mt-2">{fmt(totals.cons)}</div>
            <div className="text-xs text-slate-500">{totals.gridIn > 0 ? `Dont réseau : ${fmt(totals.gridIn)}` : `Injection réseau : ${fmt(totals.gridOut)}`}</div>
          </div>
          <div className="card">
            <div className="label">Batterie</div>
            <div className="kpi mt-2">{fmt(Math.abs(totals.batt))} {totals.batt >= 0 ? '(charge)' : '(décharge)'}</div>
            <div className="text-xs text-slate-500">SoC : {Number.isFinite(totals.soc) ? `${totals.soc}%` : '–'}</div>
          </div>
          <div className="card">
            <div className="label">Réseau</div>
            <div className="kpi mt-2">{totals.gridIn > 0 ? `Import ${fmt(totals.gridIn)}` : `Export ${fmt(totals.gridOut)}`}</div>
            <div className="text-xs text-slate-500">Source : Helion ONE / Solar Manager</div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium mb-3">Dernières 24h – production vs consommation</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyDisplay} margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="currentColor" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="currentColor" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ts" />
                <YAxis unit=" kW" />
                <RTooltip formatter={(v) => `${Number(v).toFixed(2)} kW`} />
                <Area type="monotone" dataKey="production" stroke="currentColor" fillOpacity={1} fill="url(#g1)" name="Production" />
                <Area type="monotone" dataKey="consumption" stroke="currentColor" fillOpacity={1} fill="url(#g2)" name="Consommation" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Bornes eCarUp – gestion de charge</h2>
            <div className="text-sm text-slate-500">Sélectionnez une borne et pilotez la charge.</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <div className="label">Borne</div>
              <select className="select mt-1" value={selectedStation} onChange={(e) => setSelectedStation(e.target.value)}>
                <option value="" disabled>Choisir une borne</option>
                {stations.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {(s.name ?? s.id)} {s.status ? `— ${s.status}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="label">Courant max (A)</div>
              <input className="input mt-1" placeholder="ex. 16" value={newCurrent} onChange={(e) => setNewCurrent(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button className="btn" onClick={applyCurrent}>Appliquer</button>
              <button className="btn btn-secondary" onClick={startCharging}>Démarrer</button>
              <button className="btn btn-outline" onClick={stopCharging}>Arrêter</button>
            </div>
          </div>

          <div className="overflow-x-auto mt-6">
            <table className="table">
              <thead>
                <tr>
                  <th className="th">ID</th>
                  <th className="th">Borne</th>
                  <th className="th">État</th>
                  <th className="th">kWh</th>
                  <th className="th">Début</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((ses) => (
                  <tr key={ses.id} className="border-t">
                    <td className="td">{ses.id}</td>
                    <td className="td">{ses.station_id}</td>
                    <td className="td">{ses.status}</td>
                    <td className="td">{Number(ses.kwh ?? 0).toFixed(2)}</td>
                    <td className="td">{ses.started_at ? new Date(ses.started_at).toLocaleString() : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="text-center text-xs text-slate-500 py-6">© {new Date().getFullYear()} – Votre tableau énergie personnel</footer>
      </div>
    </main>
  );
}
