export const occupancyPercentage = (occupied: number, total: number) =>
  total === 0 ? 0 : (occupied / total) * 100;
