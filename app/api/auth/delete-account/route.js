import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { NextResponse } from 'next/server';
import { validateCSRFRequest } from '@/core/utils/csrf';

/**
 * DELETE /api/auth/delete-account
 *
 * Full cascade deletion in FK-safe order:
 *   1. Buddy messages → buddy_group_members → buddy_groups (where admin)
 *   2. Buddy invites
 *   3. Community posts (user authored)
 *   4. Messages & conversations
 *   5. Property interests (as seeker)
 *   6. Property media files + Storage objects → properties
 *   7. Notifications
 *   8. User lifestyle & match preferences
 *   9. users row
 *  10. auth.users (via admin client — hard delete)
 *
 * Uses service-role admin client for the final auth.users deletion.
 */
export async function DELETE(request) {
  try {
    const csrfValidation = await validateCSRFRequest(request);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

    // Regular client to verify session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Admin client — needed for storage.list() on other users' buckets and deleteUser()
    const admin = createAdminClient();

    // ── 1. Delete buddy messages sent by the user ─────────────────────────────
    await admin.from('buddy_messages').delete().eq('sender_id', userId);

    // ── 2. Remove user from all buddy groups they're a member of ────────────── 
    await admin.from('buddy_group_members').delete().eq('user_id', userId);

    // ── 3. Delete buddy groups the user created (members already removed above)
    await admin.from('buddy_groups').delete().eq('created_by', userId);

    // ── 4. Delete buddy invites created by or sent to the user ────────────────
    await admin
      .from('buddy_invites')
      .delete()
      .or(`created_by.eq.${userId},invited_user_id.eq.${userId}`);

    // ── 5. Delete community posts ─────────────────────────────────────────────
    await admin.from('community_posts').delete().eq('user_id', userId);

    // ── 6. Delete messages & conversations ───────────────────────────────────
    // Find all conversation IDs the user participates in
    const { data: convRows } = await admin
      .from('conversations')
      .select('id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    const convIds = (convRows || []).map(c => c.id);
    if (convIds.length > 0) {
      await admin.from('messages').delete().in('conversation_id', convIds);
      await admin.from('conversations').delete().in('id', convIds);
    }

    // ── 7. Property interests (as seeker expressing interest in others' rooms) ─
    await admin.from('property_interests').delete().eq('user_id', userId);

    // ── 8. Property interests ON the user's properties → then their properties ─
    const { data: propertyRows } = await admin
      .from('properties')
      .select('id')
      .eq('owner_id', userId);

    const propertyIds = (propertyRows || []).map(p => p.id);

    if (propertyIds.length > 0) {
      // Remove seekers' interests in user's properties
      await admin.from('property_interests').delete().in('property_id', propertyIds);

      // Fetch property media to delete storage files
      const { data: mediaRows } = await admin
        .from('property_media')
        .select('url')
        .in('property_id', propertyIds);

      if (mediaRows && mediaRows.length > 0) {
        // Extract storage paths (everything after "/property-media/")
        const storagePaths = mediaRows
          .map(m => {
            try {
              const url = new URL(m.url);
              const pathParts = url.pathname.split('/property-media/');
              return pathParts.length > 1 ? decodeURIComponent(pathParts[1]) : null;
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        if (storagePaths.length > 0) {
          await admin.storage.from('property-media').remove(storagePaths);
        }
      }

      await admin.from('property_media').delete().in('property_id', propertyIds);
      await admin.from('properties').delete().in('id', propertyIds);
    }

    // ── 9. Notifications ──────────────────────────────────────────────────────
    await admin
      .from('notifications')
      .delete()
      .or(`user_id.eq.${userId},actor_id.eq.${userId}`);

    // ── 10. Lifestyle & match preferences ────────────────────────────────────
    await admin.from('user_lifestyles').delete().eq('user_id', userId);
    await admin.from('match_preferences').delete().eq('user_id', userId);

    // ── 11. Avatar from storage ───────────────────────────────────────────────
    const avatarPath = `avatars/${userId}`;
    const { data: avatarFiles } = await admin.storage.from('avatars').list(avatarPath);
    if (avatarFiles && avatarFiles.length > 0) {
      const filePaths = avatarFiles.map(f => `${avatarPath}/${f.name}`);
      await admin.storage.from('avatars').remove(filePaths);
    }

    // ── 12. users row ─────────────────────────────────────────────────────────
    await admin.from('users').delete().eq('id', userId);

    // ── 13. Hard-delete from auth.users via admin API ─────────────────────────
    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      // Log but don't fail — the user row is gone, the auth record is effectively orphaned
      console.error('[delete-account] admin.auth.admin.deleteUser failed:', deleteAuthError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[auth/delete-account DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
