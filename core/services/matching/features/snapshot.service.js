import { buildPropertyMatchingFeatures } from './build-property-features.js';
import { buildUserMatchingFeatures } from './build-user-features.js';

export async function upsertUserMatchingSnapshot(adminSb, userId, options = {}) {
  if (!userId) return null;

  const now = options.now instanceof Date ? options.now : new Date();
  const [{ data: user }, { data: lifestyle }, { data: preferences }] = await Promise.all([
    adminSb.from('users').select('id, date_of_birth, privacy_setting, profile_visibility').eq('id', userId).maybeSingle(),
    adminSb.from('user_lifestyles').select('*').eq('user_id', userId).maybeSingle(),
    adminSb.from('match_preferences').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  const featureRow = buildUserMatchingFeatures({
    user: user || { id: userId },
    lifestyle: lifestyle || null,
    preferences: preferences || null,
    now,
  });

  const { error } = await adminSb
    .from('matching_user_features')
    .upsert(featureRow, { onConflict: 'user_id' });

  if (error) throw error;
  return featureRow;
}

export async function upsertPropertyMatchingSnapshot(adminSb, propertyId, options = {}) {
  if (!propertyId) return null;

  const now = options.now instanceof Date ? options.now : new Date();
  const [{ data: property }, { data: mediaRows }] = await Promise.all([
    adminSb
      .from('properties')
      .select('id, listed_by_user_id, approval_status, is_active, privacy_setting, is_public, city, state, price_per_month, property_type, offering_type, available_from, created_at')
      .eq('id', propertyId)
      .maybeSingle(),
    adminSb
      .from('property_media')
      .select('id')
      .eq('property_id', propertyId),
  ]);

  if (!property) return null;

  const { data: hostLifestyle } = await adminSb
    .from('user_lifestyles')
    .select('user_id, schedule_type, interests')
    .eq('user_id', property.listed_by_user_id)
    .maybeSingle();

  const featureRow = buildPropertyMatchingFeatures({
    property,
    hostLifestyle: hostLifestyle || null,
    mediaCount: Array.isArray(mediaRows) ? mediaRows.length : 0,
    now,
  });

  const { error } = await adminSb
    .from('matching_property_features')
    .upsert(featureRow, { onConflict: 'property_id' });

  if (error) throw error;
  return featureRow;
}
