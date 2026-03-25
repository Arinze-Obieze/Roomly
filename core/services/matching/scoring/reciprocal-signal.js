export function computeReciprocalAcceptanceSignal({
  hasAcceptedPropertyInterest = false,
  hasAcceptedPeopleInterest = false,
  hasPendingPropertyInterest = false,
  hasPendingPeopleInterest = false,
} = {}) {
  let signal = 50;

  if (hasAcceptedPropertyInterest) signal += 20;
  if (hasAcceptedPeopleInterest) signal += 30;
  if (hasPendingPropertyInterest) signal += 10;
  if (hasPendingPeopleInterest) signal += 15;

  return Math.max(0, Math.min(100, signal));
}
