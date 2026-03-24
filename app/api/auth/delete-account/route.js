import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { NextResponse } from 'next/server';
import { validateCSRFRequest } from '@/core/utils/csrf';

function unwrapPath(value) {
  if (!value || typeof value !== 'string') return null;

  if (!value.startsWith('http')) {
    return value.replace(/^\/+/, '');
  }

  try {
    const url = new URL(value);
    const marker = '/object/public/';
    const bucketIndex = url.pathname.indexOf(marker);

    if (bucketIndex === -1) return null;

    const remainder = url.pathname.slice(bucketIndex + marker.length);
    const slashIndex = remainder.indexOf('/');
    if (slashIndex === -1) return null;

    return decodeURIComponent(remainder.slice(slashIndex + 1));
  } catch {
    return null;
  }
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

async function mustSucceed(promise, label) {
  const result = await promise;
  if (result?.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
  return result;
}

export async function DELETE(request) {
  try {
    const csrfValidation = await validateCSRFRequest(request);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const userEmail = user.email?.toLowerCase() || null;
    const admin = createAdminClient();

    const [
      { data: profileRow },
      { data: propertyRows },
      { data: conversationRows },
      { data: adminGroupRows },
      { data: userPostRows },
      { data: supportTicketRows },
      { data: messageAttachmentRows },
      { data: buddyAttachmentRows },
      { data: supportAttachmentRows },
    ] = await Promise.all([
      mustSucceed(
        admin.from('users').select('profile_picture').eq('id', userId).maybeSingle(),
        'Failed to load user profile'
      ),
      mustSucceed(
        admin.from('properties').select('id').eq('listed_by_user_id', userId),
        'Failed to load user properties'
      ),
      mustSucceed(
        admin.from('conversations').select('id').or(`tenant_id.eq.${userId},host_id.eq.${userId}`),
        'Failed to load user conversations'
      ),
      mustSucceed(
        admin.from('buddy_groups').select('id').eq('admin_id', userId),
        'Failed to load buddy groups'
      ),
      mustSucceed(
        admin.from('community_posts').select('id').eq('user_id', userId),
        'Failed to load community posts'
      ),
      mustSucceed(
        admin.from('support_tickets').select('id').eq('user_id', userId),
        'Failed to load support tickets'
      ),
      mustSucceed(
        admin
          .from('messages')
          .select('attachment_data')
          .eq('sender_id', userId)
          .not('attachment_data->>path', 'is', null),
        'Failed to load message attachments'
      ),
      mustSucceed(
        admin
          .from('buddy_messages')
          .select('attachment_data')
          .eq('sender_id', userId)
          .not('attachment_data->>path', 'is', null),
        'Failed to load buddy attachments'
      ),
      mustSucceed(
        admin
          .from('support_messages')
          .select('attachment_data')
          .eq('sender_id', userId)
          .not('attachment_data->>path', 'is', null),
        'Failed to load support attachments'
      ),
    ]);

    const avatarPath =
      unwrapPath(profileRow?.profile_picture) ||
      unwrapPath(user.user_metadata?.avatar_url) ||
      unwrapPath(user.user_metadata?.picture);

    const propertyIds = (propertyRows || []).map((row) => row.id);
    const conversationIds = (conversationRows || []).map((row) => row.id);
    const adminGroupIds = (adminGroupRows || []).map((row) => row.id);
    const postIds = (userPostRows || []).map((row) => row.id);
    const supportTicketIds = (supportTicketRows || []).map((row) => row.id);

    let propertyMedia = [];
    if (propertyIds.length > 0) {
      const { data } = await mustSucceed(
        admin.from('property_media').select('url').in('property_id', propertyIds),
        'Failed to load property media'
      );
      propertyMedia = data || [];
    }

    const propertyMediaPaths = uniqueStrings(propertyMedia.map((row) => unwrapPath(row.url)));
    const messageAttachmentPaths = uniqueStrings(
      (messageAttachmentRows || []).map((row) => row.attachment_data?.path)
    );
    const buddyAttachmentPaths = uniqueStrings(
      (buddyAttachmentRows || []).map((row) => row.attachment_data?.path)
    );
    const supportAttachmentPaths = uniqueStrings(
      (supportAttachmentRows || []).map((row) => row.attachment_data?.path)
    );

    if (postIds.length > 0) {
      await mustSucceed(
        admin.from('community_comments').delete().in('post_id', postIds),
        'Failed to delete comments on user posts'
      );
      await mustSucceed(
        admin.from('community_votes').delete().in('post_id', postIds),
        'Failed to delete votes on user posts'
      );
    }

    await mustSucceed(
      admin.from('community_comments').delete().eq('user_id', userId),
      'Failed to delete user comments'
    );
    await mustSucceed(
      admin.from('community_votes').delete().eq('user_id', userId),
      'Failed to delete user votes'
    );
    await mustSucceed(
      admin.from('community_posts').delete().eq('user_id', userId),
      'Failed to delete user posts'
    );

    if (supportTicketIds.length > 0) {
      await mustSucceed(
        admin.from('support_messages').delete().in('ticket_id', supportTicketIds),
        'Failed to delete support ticket messages'
      );
      await mustSucceed(
        admin.from('support_tickets').delete().in('id', supportTicketIds),
        'Failed to delete support tickets'
      );
    }

    await mustSucceed(
      admin.from('support_messages').delete().eq('sender_id', userId),
      'Failed to delete support replies'
    );

    await mustSucceed(
      admin.from('buddy_messages').delete().eq('sender_id', userId),
      'Failed to delete buddy messages'
    );
    await mustSucceed(
      admin.from('buddy_group_members').delete().eq('user_id', userId),
      'Failed to delete buddy memberships'
    );

    if (adminGroupIds.length > 0) {
      await mustSucceed(
        admin.from('buddy_invites').delete().in('group_id', adminGroupIds),
        'Failed to delete buddy invites for owned groups'
      );
      await mustSucceed(
        admin.from('buddy_messages').delete().in('group_id', adminGroupIds),
        'Failed to delete buddy group messages'
      );
      await mustSucceed(
        admin.from('buddy_group_members').delete().in('group_id', adminGroupIds),
        'Failed to delete buddy group members'
      );
      await mustSucceed(
        admin.from('buddy_groups').delete().in('id', adminGroupIds),
        'Failed to delete owned buddy groups'
      );
    }

    if (userEmail) {
      await mustSucceed(
        admin.from('buddy_invites').delete().eq('email', userEmail),
        'Failed to delete buddy invites for user email'
      );
    }

    if (conversationIds.length > 0) {
      await mustSucceed(
        admin.from('messages').delete().in('conversation_id', conversationIds),
        'Failed to delete messages'
      );
      await mustSucceed(
        admin.from('conversations').delete().in('id', conversationIds),
        'Failed to delete conversations'
      );
    }

    await mustSucceed(
      admin.from('property_interests').delete().eq('seeker_id', userId),
      'Failed to delete user property interests'
    );
    await mustSucceed(
      admin.from('compatibility_scores').delete().eq('seeker_id', userId),
      'Failed to delete user compatibility scores'
    );
    await mustSucceed(
      admin.from('saved_properties').delete().eq('user_id', userId),
      'Failed to delete saved properties'
    );

    if (propertyIds.length > 0) {
      await mustSucceed(
        admin.from('property_interests').delete().in('property_id', propertyIds),
        'Failed to delete interests on user properties'
      );
      await mustSucceed(
        admin.from('compatibility_scores').delete().in('property_id', propertyIds),
        'Failed to delete compatibility scores on user properties'
      );
      await mustSucceed(
        admin.from('saved_properties').delete().in('property_id', propertyIds),
        'Failed to delete saved references to user properties'
      );
      await mustSucceed(
        admin.from('property_media').delete().in('property_id', propertyIds),
        'Failed to delete property media rows'
      );
      await mustSucceed(
        admin.from('properties').delete().in('id', propertyIds),
        'Failed to delete properties'
      );
    }

    if (propertyMediaPaths.length > 0) {
      await mustSucceed(
        admin.storage.from('property-media').remove(propertyMediaPaths),
        'Failed to delete property media files'
      );
    }
    if (messageAttachmentPaths.length > 0) {
      await mustSucceed(
        admin.storage.from('message_attachments').remove(messageAttachmentPaths),
        'Failed to delete message attachments'
      );
    }
    if (buddyAttachmentPaths.length > 0) {
      await mustSucceed(
        admin.storage.from('buddy_attachments').remove(buddyAttachmentPaths),
        'Failed to delete buddy attachments'
      );
    }
    if (supportAttachmentPaths.length > 0) {
      await mustSucceed(
        admin.storage.from('support_attachments').remove(supportAttachmentPaths),
        'Failed to delete support attachments'
      );
    }

    if (avatarPath) {
      await mustSucceed(
        admin.storage.from('avatars').remove([avatarPath]),
        'Failed to delete avatar file'
      );
    }

    await mustSucceed(
      admin.from('notifications').delete().eq('user_id', userId),
      'Failed to delete notifications'
    );
    await mustSucceed(
      admin.from('user_lifestyles').delete().eq('user_id', userId),
      'Failed to delete lifestyle data'
    );
    await mustSucceed(
      admin.from('match_preferences').delete().eq('user_id', userId),
      'Failed to delete match preferences'
    );
    await mustSucceed(
      admin.from('users').delete().eq('id', userId),
      'Failed to delete user profile'
    );

    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      throw new Error(`Failed to delete auth user: ${deleteAuthError.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[auth/delete-account DELETE]', error);
    return NextResponse.json({ error: error.message || 'Failed to delete account' }, { status: 500 });
  }
}
