import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/core/services/superadmin/guard';
import { logSuperadminEvent } from '@/core/services/superadmin/audit';

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

const buildDayKeys = (days) => {
  const output = [];
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (days - 1));

  for (let i = 0; i < days; i += 1) {
    const key = date.toISOString().slice(0, 10);
    output.push(key);
    date.setDate(date.getDate() + 1);
  }

  return output;
};

const keyFor = (timestamp) => {
  if (!timestamp) return null;
  return new Date(timestamp).toISOString().slice(0, 10);
};

export async function GET(request) {
  const guard = await requireSuperadmin();
  if (guard.errorResponse) return guard.errorResponse;

  const { adminClient, user } = guard;
  const { searchParams } = new URL(request.url);
  const range = clamp(Number(searchParams.get('range') || 30), 7, 180);

  const dayKeys = buildDayKeys(range);
  const from = `${dayKeys[0]}T00:00:00.000Z`;

  const [usersRes, propertiesRes, reportsRes, errorsRes] = await Promise.all([
    adminClient.from('users').select('created_at').gte('created_at', from),
    adminClient.from('properties').select('created_at').gte('created_at', from),
    adminClient
      .from('reports')
      .select('created_at,status')
      .gte('created_at', from),
    adminClient
      .from('activity_logs')
      .select('created_at,level')
      .gte('created_at', from)
      .eq('level', 'error'),
  ]);

  const errorMessages = [];
  [
    ['users', usersRes.error],
    ['properties', propertiesRes.error],
    ['reports', reportsRes.error],
    ['activity_logs', errorsRes.error],
  ].forEach(([name, err]) => {
    if (err) errorMessages.push(`${name}: ${err.message}`);
  });

  const usersMap = Object.fromEntries(dayKeys.map((d) => [d, 0]));
  const propertiesMap = Object.fromEntries(dayKeys.map((d) => [d, 0]));
  const reportsMap = Object.fromEntries(dayKeys.map((d) => [d, { total: 0, pending: 0, resolved: 0, dismissed: 0 }]));
  const errorsMap = Object.fromEntries(dayKeys.map((d) => [d, 0]));

  (usersRes.data || []).forEach((row) => {
    const key = keyFor(row.created_at);
    if (key && usersMap[key] !== undefined) usersMap[key] += 1;
  });

  (propertiesRes.data || []).forEach((row) => {
    const key = keyFor(row.created_at);
    if (key && propertiesMap[key] !== undefined) propertiesMap[key] += 1;
  });

  (reportsRes.data || []).forEach((row) => {
    const key = keyFor(row.created_at);
    if (!key || reportsMap[key] === undefined) return;

    reportsMap[key].total += 1;
    if (row.status === 'pending') reportsMap[key].pending += 1;
    if (row.status === 'resolved') reportsMap[key].resolved += 1;
    if (row.status === 'dismissed') reportsMap[key].dismissed += 1;
  });

  (errorsRes.data || []).forEach((row) => {
    const key = keyFor(row.created_at);
    if (key && errorsMap[key] !== undefined) errorsMap[key] += 1;
  });

  const payload = {
    range,
    from,
    to: `${dayKeys[dayKeys.length - 1]}T23:59:59.999Z`,
    errors: errorMessages,
    series: {
      users: dayKeys.map((date) => ({ date, count: usersMap[date] })),
      properties: dayKeys.map((date) => ({ date, count: propertiesMap[date] })),
      reports: dayKeys.map((date) => ({ date, ...reportsMap[date] })),
      errorLogs: dayKeys.map((date) => ({ date, count: errorsMap[date] })),
    },
  };

  await logSuperadminEvent(adminClient, {
    userId: user.id,
    action: 'get_chart_series',
    status: 'success',
    message: `Loaded chart series for ${range} day window`,
    metadata: { range, source_errors: errorMessages },
  });

  return NextResponse.json(payload);
}
