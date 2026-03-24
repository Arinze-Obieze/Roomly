import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env or .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PREFIX = '[Buddy Demo]';
const REQUESTED_EMAIL = 'arinzeunleshed@gmail.com';
const FALLBACK_EMAIL = 'arinzeunleashed@gmail.com';

const groupBlueprints = [
  {
    slug: 'arinze',
    memberCount: 21,
    messageCount: 18,
    name: `${DEMO_PREFIX} Lagos Flat Hunt Circle`,
    preferences: {
      city: 'Lagos',
      vibe: 'active',
      goal: 'Shared flat search and inspection planning',
    },
    messages: [
      'Welcome everyone, this group is for serious flat hunt updates around Yaba and Surulere.',
      'I found a decent 2-bedroom around Akoka this morning.',
      'Please share budget ranges so we can split options properly.',
      'I am targeting something between 450k and 650k yearly.',
      'I can inspect on Tuesday if anyone wants me to ask extra questions.',
      'Please check parking, water supply, and power situation.',
      'The landlord at the last place seemed flexible on payment structure.',
      'I prefer somewhere close to a bus route because of work commute.',
      'I can contribute for inspection transport if we shortlist two spots.',
      'Let us keep this group updated with only verified listings.',
      'Someone should also ask about service charge and agency fee.',
      'I have photos from the first compound, sending them later.',
      'Security looked okay, but the street was a bit noisy at night.',
      'No problem, noise level matters for me too.',
      'Can we shortlist the cleanest option before the weekend?',
      'Yes, let us narrow it to three places and inspect fast.',
      'Nice one, I will drop the contact details after confirming availability.',
      'Perfect, this already feels more organized than searching alone.',
    ],
  },
  {
    slug: 'island',
    memberCount: 12,
    messageCount: 10,
    name: `${DEMO_PREFIX} Island Professionals Hub`,
    preferences: {
      city: 'Lagos',
      vibe: 'professional',
      goal: 'Lekki and Ajah apartment search',
    },
    messages: [
      'This space is for Lekki, Chevron, and Ajah leads only.',
      'I saw a serviced apartment that might work for two roommates.',
      'Service charge is the main issue on the island honestly.',
      'True, but if the location saves commute time it may balance out.',
      'Please share only listings with clear video or inspection feedback.',
      'Agreed, no recycled screenshots please.',
      'I can check one around Sangotedo tomorrow afternoon.',
      'Nice, ask about flood history too.',
      'Good call, that area can be tricky in rainy season.',
      'We should pin our top three options after the next inspection.',
    ],
  },
  {
    slug: 'abuja',
    memberCount: 9,
    messageCount: 9,
    name: `${DEMO_PREFIX} Abuja Budget Roommates`,
    preferences: {
      city: 'Abuja',
      vibe: 'budget',
      goal: 'Shared apartment around Gwarinpa and Wuse',
    },
    messages: [
      'Abuja prices are wild, so shared spaces might make more sense.',
      'I am mostly checking Gwarinpa because of easier access.',
      'Wuse is ideal for me if the total cost stays reasonable.',
      'Has anyone found a place with prepaid meter already installed?',
      'Not yet, but I found one with decent security and water.',
      'Please drop rent, caution fee, and agency fee together when sharing.',
      'That helps a lot because hidden costs keep changing the real total.',
      'I can do a physical inspection this weekend.',
      'Great, let us compare notes after that.',
    ],
  },
  {
    slug: 'ph',
    memberCount: 8,
    messageCount: 8,
    name: `${DEMO_PREFIX} Port Harcourt New In Town`,
    preferences: {
      city: 'Port Harcourt',
      vibe: 'friendly',
      goal: 'Helping newcomers settle faster',
    },
    messages: [
      'I just moved recently, so I wanted a smaller support group.',
      'Same here, especially for safe areas and realistic rent expectations.',
      'I have heard good things about Eliozu and parts of Rumuola.',
      'Please share places with stable water and not just generator promises.',
      'That generator promise line is too real.',
      'I can ask around my office for any direct landlord contacts.',
      'Direct landlord deals would save everyone stress.',
      'Let us keep posting as we verify options.',
    ],
  },
];

function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function chunk(array, size) {
  const chunks = [];
  for (let index = 0; index < array.length; index += size) {
    chunks.push(array.slice(index, index + size));
  }
  return chunks;
}

async function listAllAuthUsers() {
  const perPage = 200;
  const users = [];

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const pageUsers = data?.users || [];
    users.push(...pageUsers);

    if (pageUsers.length < perPage) break;
  }

  return users;
}

async function fetchPublicUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, profile_picture');

  if (error) throw error;
  return data || [];
}

async function cleanupExistingDemoGroups() {
  const { data: groups, error } = await supabase
    .from('buddy_groups')
    .select('id, name')
    .ilike('name', `${DEMO_PREFIX}%`);

  if (error) throw error;
  if (!groups?.length) return;

  const groupIds = groups.map((group) => group.id);

  for (const ids of chunk(groupIds, 25)) {
    await supabase.from('buddy_messages').delete().in('group_id', ids);
    await supabase.from('buddy_group_members').delete().in('group_id', ids);
    await supabase.from('buddy_invites').delete().in('group_id', ids);
    await supabase.from('buddy_groups').delete().in('id', ids);
  }
}

function buildProfileMap(publicUsers, authUsers) {
  const authMap = new Map(authUsers.map((user) => [user.id, user]));

  return publicUsers
    .map((user) => {
      const authUser = authMap.get(user.id);
      return {
        id: user.id,
        email: user.email || authUser?.email || null,
        full_name:
          user.full_name ||
          authUser?.user_metadata?.full_name ||
          authUser?.email ||
          'RoomFind User',
        profile_picture:
          user.profile_picture ||
          authUser?.user_metadata?.avatar_url ||
          null,
      };
    })
    .filter((user) => user.email);
}

function pickTargetUser(profiles) {
  return (
    profiles.find((profile) => profile.email === REQUESTED_EMAIL) ||
    profiles.find((profile) => profile.email === FALLBACK_EMAIL) ||
    profiles.find(
      (profile) =>
        profile.email?.includes('arinze') || profile.full_name?.toLowerCase().includes('arinze')
    )
  );
}

function buildGroupAssignments(targetUser, profiles) {
  const usableProfiles = profiles.filter((profile) => profile.id !== targetUser.id);
  const adminPool = usableProfiles.slice(0, groupBlueprints.length - 1);
  const memberPool = usableProfiles.slice(groupBlueprints.length - 1);

  if (adminPool.length < groupBlueprints.length - 1) {
    throw new Error('Not enough users available to assign group admins.');
  }

  const adminAssignments = [targetUser, ...adminPool];
  let offset = 0;

  return groupBlueprints.map((group, index) => {
    const admin = adminAssignments[index];
    const neededMembers = Math.max(group.memberCount - 1, 0);
    const members = memberPool.slice(offset, offset + neededMembers);
    offset += neededMembers;

    if (members.length < neededMembers) {
      throw new Error(`Not enough users available for group "${group.name}".`);
    }

    return {
      ...group,
      admin,
      members: uniqueById([admin, ...members]),
    };
  });
}

function buildMembershipRows(groupId, adminId, members) {
  return members.map((member) => ({
    group_id: groupId,
    user_id: member.id,
    role: member.id === adminId ? 'admin' : 'member',
    status: 'active',
  }));
}

function buildMessageRows(groupId, members, messages, startAt) {
  return messages.map((content, index) => {
    const sender = members[index % members.length];
    return {
      group_id: groupId,
      sender_id: sender.id,
      content,
      attachment_type: 'text',
      attachment_data: null,
      created_at: new Date(startAt.getTime() + index * 3 * 60 * 1000).toISOString(),
    };
  });
}

async function seedGroups(assignments) {
  const seeded = [];

  for (let index = 0; index < assignments.length; index += 1) {
    const assignment = assignments[index];
    const { data: group, error: groupError } = await supabase
      .from('buddy_groups')
      .insert({
        name: assignment.name,
        admin_id: assignment.admin.id,
        preferences: assignment.preferences,
      })
      .select()
      .single();

    if (groupError) throw groupError;

    const membershipRows = buildMembershipRows(group.id, assignment.admin.id, assignment.members);
    const { error: memberError } = await supabase
      .from('buddy_group_members')
      .insert(membershipRows);
    if (memberError) throw memberError;

    const startAt = new Date(Date.now() - (assignments.length - index) * 24 * 60 * 60 * 1000);
    const messageRows = buildMessageRows(
      group.id,
      assignment.members,
      assignment.messages.slice(0, assignment.messageCount),
      startAt
    );

    const { error: messageError } = await supabase
      .from('buddy_messages')
      .insert(messageRows);
    if (messageError) throw messageError;

    seeded.push({
      groupId: group.id,
      groupName: assignment.name,
      adminEmail: assignment.admin.email,
      memberCount: assignment.members.length,
      messageCount: messageRows.length,
    });
  }

  return seeded;
}

async function main() {
  console.log('Inspecting users and preparing buddy demo data...');

  const [authUsers, publicUsers] = await Promise.all([
    listAllAuthUsers(),
    fetchPublicUsers(),
  ]);

  const profiles = buildProfileMap(publicUsers, authUsers);
  const targetUser = pickTargetUser(profiles);

  if (!targetUser) {
    throw new Error(
      `Could not find ${REQUESTED_EMAIL} or a close Arinze account in Supabase users/auth.`
    );
  }

  console.log(
    `Using target account: ${targetUser.email} (${targetUser.full_name})`
  );
  if (targetUser.email !== REQUESTED_EMAIL) {
    console.log(
      `Requested email ${REQUESTED_EMAIL} was not found; fell back to ${targetUser.email}.`
    );
  }

  await cleanupExistingDemoGroups();

  const assignments = buildGroupAssignments(targetUser, profiles);
  const seeded = await seedGroups(assignments);

  console.log('\nBuddy demo seed complete:\n');
  for (const group of seeded) {
    console.log(
      `- ${group.groupName} | admin=${group.adminEmail} | members=${group.memberCount} | messages=${group.messageCount}`
    );
  }
}

main().catch((error) => {
  console.error('\nBuddy demo seed failed:', error);
  process.exit(1);
});
