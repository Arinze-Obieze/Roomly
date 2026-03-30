const DEFAULT_PAGE_SIZE = 500;
const DEFAULT_BATCH_SIZE = 200;

export async function fetchAllPages(queryFactory, pageSize = DEFAULT_PAGE_SIZE) {
  const rows = [];
  let offset = 0;

  while (true) {
    const { data, error } = await queryFactory(offset, pageSize);
    if (error) throw error;
    if (!data?.length) break;

    rows.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

export async function fetchBatchesByIds(ids, fetchBatch, batchSize = DEFAULT_BATCH_SIZE) {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const rows = [];
  for (let index = 0; index < ids.length; index += batchSize) {
    const batch = ids.slice(index, index + batchSize).filter(Boolean);
    if (!batch.length) continue;

    const { data, error } = await fetchBatch(batch);
    if (error) throw error;
    if (Array.isArray(data) && data.length > 0) {
      rows.push(...data);
    }
  }

  return rows;
}
