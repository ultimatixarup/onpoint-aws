// src/app/utils/datetime-utils.ts

export function convertUtcToCst(utcTimeStr: string): Date | null {
  if (utcTimeStr) {
    let utcDate = new Date(utcTimeStr);
    let options: Intl.DateTimeFormatOptions = { timeZone: "America/Chicago" };
    let cstDateStr = utcDate.toLocaleString("en-US", options);
    return new Date(cstDateStr);
  }
  return null;
}

export function convertIstToUtc(istTimeStr: string): Date | null {
  if (istTimeStr) {
    let istDate = new Date(istTimeStr);
    let utcDate = new Date(istDate.getTime() - 5.5 * 60 * 60 * 1000); // Subtract 5 hours 30 minutes
    return utcDate;
  }
  return null;
}
