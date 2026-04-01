export const runtime = 'nodejs';

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { ensureUserProfile } from '@/core/utils/auth/ensureUserProfile';
import { bumpCacheVersion } from '@/core/utils/redis';
import { getProfileUpdateVersionKeys } from '@/core/services/matching/matching-cache-versions';
import { upsertUserMatchingSnapshot } from '@/core/services/matching/features/snapshot.service';
import { validateCSRFRequest } from '@/core/utils/csrf';

function unwrapAvatarPath(value) {
  if (!value || typeof value !== 'string') return null;
  if (!value.startsWith('http')) return value.replace(/^\/+/, '');

  try {
    const url = new URL(value);
    const marker = '/storage/v1/object/public/avatars/';
    const index = url.pathname.indexOf(marker);
    if (index === -1) return null;
    return decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const csrfValidation = await validateCSRFRequest(request);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUserProfile(user);

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    if (!file.type?.startsWith('image/')) {
      return NextResponse.json({ error: 'Please upload an image file' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be 5MB or smaller' }, { status: 400 });
    }

    const extFromName = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : '';
    const extension = extFromName || file.type.split('/')[1] || 'jpg';
    const safeExtension = extension.replace(/[^a-z0-9]/g, '') || 'jpg';
    const objectPath = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;

    const admin = createAdminClient();

    const { data: currentProfile, error: profileError } = await admin
      .from('users')
      .select('profile_picture')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    const { error: uploadError } = await admin.storage
      .from('avatars')
      .upload(objectPath, file, {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = admin.storage.from('avatars').getPublicUrl(objectPath);

    const { data: updatedProfile, error: updateError } = await admin
      .from('users')
      .update({ profile_picture: publicUrl })
      .eq('id', user.id)
      .select('*')
      .single();

    if (updateError) {
      await admin.storage.from('avatars').remove([objectPath]);
      throw updateError;
    }

    const previousAvatarPath = unwrapAvatarPath(currentProfile?.profile_picture);
    if (previousAvatarPath && previousAvatarPath !== objectPath) {
      await admin.storage.from('avatars').remove([previousAvatarPath]);
    }

    await upsertUserMatchingSnapshot(admin, user.id);
    await Promise.all(
      getProfileUpdateVersionKeys(user.id).map((key) => bumpCacheVersion(key))
    );

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      avatarUrl: publicUrl,
    });
  } catch (error) {
    console.error('[profile/avatar POST]', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}
