import { notifySuperadmins } from '../superadmin/superadmin-notifications.js';

function buildApprovalMessage({ propertyTitle, city, state, creatorName }) {
  const safeTitle = propertyTitle?.trim() || 'Untitled property';
  const safeCreator = creatorName?.trim() || 'A landlord';
  const location = [city, state].filter(Boolean).join(', ');

  return `${safeCreator} submitted "${safeTitle}"${location ? ` in ${location}` : ''} for approval.`;
}

export async function notifySuperadminsOfPendingProperty({
  property,
  creatorUserId = null,
  creatorName = null,
}) {
  if (!property?.id) return { notified: 0, skipped: true };

  const title = 'New Property Pending Approval';
  const message = buildApprovalMessage({
    propertyTitle: property.title,
    city: property.city,
    state: property.state,
    creatorName,
  });

  return notifySuperadmins({
    actorUserId: creatorUserId,
    type: 'system',
    title,
    message,
    link: '/superadmin/properties?approvalStatus=pending',
    data: { propertyId: property.id, approvalStatus: 'pending' },
    channels: ['in-app', 'email'],
  });
}

export { buildApprovalMessage };
