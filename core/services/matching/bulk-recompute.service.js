import { recomputeForProperty, recomputeForSeeker } from './recompute-compatibility.service.js';

export const MATCHING_RECOMPUTE_SCOPES = {
  all_seekers: 'all_seekers',
  approved_properties: 'approved_properties',
  active_properties: 'active_properties',
};

const PAGE_SIZE = 500;

async function fetchAllRows(queryFactory, pageSize = PAGE_SIZE) {
  const rows = [];
  let from = 0;

  while (true) {
    const { data, error } = await queryFactory().range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;

    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

async function fetchTargetIds(adminSb, scope) {
  if (scope === MATCHING_RECOMPUTE_SCOPES.all_seekers) {
    const [lifestyles, preferences] = await Promise.all([
      fetchAllRows(() => adminSb.from('user_lifestyles').select('user_id').not('user_id', 'is', null).order('user_id')),
      fetchAllRows(() => adminSb.from('match_preferences').select('user_id').not('user_id', 'is', null).order('user_id')),
    ]);

    return [...new Set([
      ...(lifestyles || []).map((row) => row.user_id),
      ...(preferences || []).map((row) => row.user_id),
    ].filter(Boolean))];
  }

  if (scope === MATCHING_RECOMPUTE_SCOPES.active_properties) {
    const properties = await fetchAllRows(() =>
      adminSb
        .from('properties')
        .select('id')
        .eq('is_active', true)
        .order('id')
    );
    return (properties || []).map((row) => row.id).filter(Boolean);
  }

  const properties = await fetchAllRows(() =>
    adminSb
      .from('properties')
      .select('id')
      .eq('is_active', true)
      .eq('approval_status', 'approved')
      .order('id')
  );
  return (properties || []).map((row) => row.id).filter(Boolean);
}

export async function runBulkMatchingRecompute(adminSb, options = {}) {
  const scope = options.scope || MATCHING_RECOMPUTE_SCOPES.approved_properties;
  const concurrency = Math.max(1, Math.min(Number(options.concurrency) || 10, 50));
  const limit = Number(options.limit) > 0 ? Number(options.limit) : null;
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;

  const targetIds = await fetchTargetIds(adminSb, scope);
  const ids = limit ? targetIds.slice(0, limit) : targetIds;

  const results = {
    scope,
    requested: ids.length,
    succeeded: 0,
    failed: 0,
    updatedScores: 0,
    failures: [],
  };

  onProgress?.({
    stage: 'targets_loaded',
    scope,
    total: ids.length,
    concurrency,
  });

  for (let index = 0; index < ids.length; index += concurrency) {
    const batch = ids.slice(index, index + concurrency);
    const settled = await Promise.allSettled(
      batch.map(async (id) => {
        if (scope === MATCHING_RECOMPUTE_SCOPES.all_seekers) {
          return recomputeForSeeker(adminSb, id);
        }
        return recomputeForProperty(adminSb, id);
      })
    );

    settled.forEach((outcome, batchIndex) => {
      const targetId = batch[batchIndex];
      if (outcome.status === 'fulfilled') {
        results.succeeded += 1;
        results.updatedScores += Number(outcome.value?.updated || 0);
        return;
      }

      results.failed += 1;
      results.failures.push({
        id: targetId,
        message: outcome.reason?.message || String(outcome.reason || 'Unknown error'),
      });
    });

    onProgress?.({
      stage: 'batch_complete',
      processed: Math.min(index + batch.length, ids.length),
      total: ids.length,
      succeeded: results.succeeded,
      failed: results.failed,
      updatedScores: results.updatedScores,
    });
  }

  return results;
}
