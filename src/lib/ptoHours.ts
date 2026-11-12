/** PTO uses scheduled net hours, up to eight per day, for every employee type.
 * Working-hours overrides are already net: do not subtract another meal break.
 * This caps leave hours only, not worked hours, duty hours, or guaranteed daily pay.
 */
export function capPtoHours(scheduledNetHours: number): number {
  return Number.isFinite(scheduledNetHours) ? Math.min(8, Math.max(0, scheduledNetHours)) : 0;
}
