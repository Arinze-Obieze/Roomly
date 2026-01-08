import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileClient from '@/components/ProfileClient';

export default async function ProfilePage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Redirect if not authenticated (middleware should catch this, but double-check)
  if (authError || !user) {
    redirect('/login');
  }

  // Fetch user profile from database
  let userProfile = null;
  let profileError = null;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      profileError = error.message;
    } else {
      userProfile = data;
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    profileError = 'Failed to load profile';
  }

  // If no profile exists, create basic profile data from auth user
  if (!userProfile) {
    userProfile = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || 'User',
      phone_number: user.user_metadata?.phone || null,
      profile_picture: null,
      bio: null,
      date_of_birth: null,
      is_admin: false,
    };
  }

  return (
    <ProfileClient 
      user={userProfile} 
      authUser={user}
      profileError={profileError} 
    />
  );
}
