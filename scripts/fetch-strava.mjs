#!/usr/bin/env node
/*
 * fetch-strava.mjs — sync cycling stats from Strava into content/strava.json
 *
 * Mirrors scripts/fetch-reading.mjs. Runs in CI (see
 * .github/workflows/sync-strava.yml). Until the secrets below are set it
 * does nothing and leaves the seed strava.json in place.
 *
 * One-time setup (https://www.strava.com/settings/api):
 *   1. Create an API application -> note Client ID + Client Secret.
 *   2. Do the OAuth dance once with scope `read` (or `activity:read_all` for
 *      recent-ride data) to get a refresh_token.
 *      With only `read` scope, totals are synced but recent_ride falls back
 *      to the existing value in strava.json.
 *   3. Add three repo secrets:
 *        STRAVA_CLIENT_ID
 *        STRAVA_CLIENT_SECRET
 *        STRAVA_REFRESH_TOKEN
 *
 * The script preserves the `bike` block from the existing file so the bike
 * spec (which Strava doesn't expose cleanly) stays editable by hand.
 */
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const CLIENT_ID     = process.env.STRAVA_CLIENT_ID;
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN;
const OUT_PATH      = fileURLToPath(new URL('../content/strava.json', import.meta.url));

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.log('Strava secrets not set — leaving content/strava.json untouched.');
  process.exit(0);
}

const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

async function accessToken() {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: REFRESH_TOKEN,
    }),
  });
  if (!res.ok) throw new Error(`token ${res.status}: ${await res.text()}`);
  return (await res.json()).access_token;
}

const api = (token) => async (path, { optional = false } = {}) => {
  const res = await fetch(`https://www.strava.com/api/v3${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (optional && res.status === 401) return null;
    throw new Error(`${path} -> ${res.status}: ${await res.text()}`);
  }
  return res.json();
};

try {
  const token = await accessToken();
  const get = api(token);

  const me = await get('/athlete');
  const [stats, activities] = await Promise.all([
    get(`/athletes/${me.id}/stats`),
    get('/athlete/activities?per_page=15', { optional: true }),
  ]);

  const rideTotals = stats.all_ride_totals || {};
  const lastRide = (activities || []).find((a) => a.type === 'Ride');

  // preserve hand-kept bike block
  let prev = {};
  try { prev = JSON.parse(await fs.readFile(OUT_PATH, 'utf8')); } catch { /* first run */ }

  const recentTotals = stats.recent_ride_totals || {};

  const output = {
    athlete: `${me.firstname ?? ''} ${me.lastname ?? ''}`.trim() || prev.athlete,
    bike: prev.bike,
    totals: {
      all_time_distance_km:        round((rideTotals.distance || 0) / 1000),
      all_time_rides:              rideTotals.count || 0,
      all_time_elevation_m:        Math.round(rideTotals.elevation_gain || 0),
      all_time_moving_time_h:      round((rideTotals.moving_time || 0) / 3600),
      biggest_ride_km:             round((stats.biggest_ride_distance || 0) / 1000),
      biggest_climb_elevation_m:   Math.round(stats.biggest_climb_elevation_gain || 0),
    },
    recent_ride_totals: {
      count:          recentTotals.count || 0,
      distance_km:    round((recentTotals.distance || 0) / 1000),
      moving_time_h:  round((recentTotals.moving_time || 0) / 3600),
      elevation_m:    Math.round(recentTotals.elevation_gain || 0),
    },
    recent_ride: lastRide ? {
      name: lastRide.name,
      distance_km: round(lastRide.distance / 1000),
      moving_time: `${Math.floor(lastRide.moving_time / 3600)}h ${Math.round((lastRide.moving_time % 3600) / 60)}m`.replace(/^0h /, ''),
      elevation_m: Math.round(lastRide.total_elevation_gain || 0),
      avg_speed_kmh: round((lastRide.average_speed || 0) * 3.6),
      date: (lastRide.start_date_local || '').slice(0, 10),
      url: `https://www.strava.com/activities/${lastRide.id}`,
    } : prev.recent_ride,
    last_synced: new Date().toISOString(),
  };

  await fs.writeFile(OUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(
    `Wrote strava.json — ${output.totals.all_time_distance_km} km across ` +
    `${output.totals.all_time_rides} rides; latest: ${output.recent_ride?.name ?? 'n/a'}`
  );
} catch (err) {
  console.error('Strava sync failed:', err.message);
  process.exit(1);
}
