export function calculateTeamPoints(
  participationPercentage: number,
  maxPoints: number
) {
  if (participationPercentage >= 80) {
    return maxPoints;
  }

  if (participationPercentage >= 60) {
    return Math.round(maxPoints * 0.75);
  }

  if (participationPercentage >= 40) {
    return Math.round(maxPoints * 0.5);
  }

  if (participationPercentage >= 20) {
    return Math.round(maxPoints * 0.25);
  }

  return 0;
}