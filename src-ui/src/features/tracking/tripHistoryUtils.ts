import type { TripSummaryItem } from "../../api/tripSummaryApi";
import { formatDateTime as formatAppDateTime, formatDate } from "../../utils/date";

export type AssignmentRecord = {
  assignmentId?: string;
  vin?: string;
  driverId?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
};

export function parseSummary(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "object") return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      return typeof parsed === "object" && parsed ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function parseIsoToMs(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? undefined : time;
}

export function normalizeAssignmentRecords(response: unknown, vin: string) {
  const items = Array.isArray(response)
    ? response
    : typeof response === "object" &&
        response !== null &&
        Array.isArray((response as { items?: unknown[] }).items)
      ? (response as { items: unknown[] }).items
      : [];

  return items.map((item) => {
    const record = item as Record<string, unknown>;
    return {
      assignmentId: record.assignmentId ? String(record.assignmentId) : undefined,
      vin: record.vin ? String(record.vin) : vin,
      driverId: record.driverId ? String(record.driverId) : undefined,
      effectiveFrom: record.effectiveFrom
        ? String(record.effectiveFrom)
        : undefined,
      effectiveTo: record.effectiveTo ? String(record.effectiveTo) : undefined,
    } satisfies AssignmentRecord;
  });
}

export function resolveAssignmentForTrip(
  assignments: AssignmentRecord[],
  startTime?: string,
  endTime?: string,
) {
  if (!assignments.length) return undefined;
  const tripTime = parseIsoToMs(startTime) ?? parseIsoToMs(endTime);

  if (tripTime === undefined) {
    return assignments[0];
  }

  const matching = assignments.filter((assignment) => {
    const from = parseIsoToMs(assignment.effectiveFrom);
    const to = parseIsoToMs(assignment.effectiveTo);
    if (from !== undefined && tripTime < from) return false;
    if (to !== undefined && tripTime > to) return false;
    return true;
  });

  if (matching.length > 0) {
    return matching.sort(
      (a, b) =>
        (parseIsoToMs(b.effectiveFrom) ?? 0) -
        (parseIsoToMs(a.effectiveFrom) ?? 0),
    )[0];
  }

  return assignments[0];
}

function getPath(record: Record<string, unknown>, path: string) {
  const parts = path.split(".");
  let current: unknown = record;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function readNumberFromRecord(
  record: Record<string, unknown>,
  paths: string[],
) {
  for (const path of paths) {
    const value = getPath(record, path);
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

export function readStringFromRecord(
  record: Record<string, unknown>,
  paths: string[],
) {
  for (const path of paths) {
    const value = getPath(record, path);
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return undefined;
}

export function readNumberFromTrip(
  record: Record<string, unknown> | null,
  summary: Record<string, unknown> | null,
  paths: string[],
) {
  if (record) {
    const value = readNumberFromRecord(record, paths);
    if (value !== undefined) return value;
  }
  if (summary) {
    const value = readNumberFromRecord(summary, paths);
    if (value !== undefined) return value;
  }
  return undefined;
}

function litersToGallons(value: number) {
  return value / 3.785411784;
}

export function readFuelGallonsFromTrip(
  record: Record<string, unknown> | null,
  summary: Record<string, unknown> | null,
  paths: { gallons: string[]; liters: string[] },
) {
  const gallons = readNumberFromTrip(record, summary, paths.gallons);
  if (gallons !== undefined) return gallons;
  const liters = readNumberFromTrip(record, summary, paths.liters);
  if (liters !== undefined) return litersToGallons(liters);
  return undefined;
}

export function readStringFromTrip(
  record: Record<string, unknown> | null,
  summary: Record<string, unknown> | null,
  paths: string[],
) {
  if (record) {
    for (const path of paths) {
      const value = getPath(record, path);
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  if (summary) {
    for (const path of paths) {
      const value = getPath(summary, path);
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return undefined;
}

export function parseHmsToSeconds(value?: string) {
  if (!value) return undefined;
  const parts = value.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return undefined;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return undefined;
}

export function formatSecondsAsDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "NA";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function sumOptional(a?: number, b?: number) {
  if (a === undefined && b === undefined) return undefined;
  return (a ?? 0) + (b ?? 0);
}

export function reduceRoutePoints(
  points: Array<[number, number]>,
  maxPoints: number,
) {
  if (points.length <= maxPoints) return points;
  if (maxPoints < 2) return points.slice(0, 1);
  const trimmed = dedupeConsecutive(points);
  if (trimmed.length <= maxPoints) return trimmed;
  const start = trimmed[0];
  const end = trimmed[trimmed.length - 1];
  const middle = trimmed.slice(1, -1);
  const step = Math.ceil(middle.length / (maxPoints - 2));
  const sampled: Array<[number, number]> = [];
  for (let i = 0; i < middle.length; i += step) {
    sampled.push(middle[i]);
  }
  return [start, ...sampled, end];
}

function dedupeConsecutive(points: Array<[number, number]>) {
  const result: Array<[number, number]> = [];
  let prev: [number, number] | null = null;
  for (const point of points) {
    if (!prev || prev[0] !== point[0] || prev[1] !== point[1]) {
      result.push(point);
      prev = point;
    }
  }
  return result;
}

export function formatDuration(startTime: string, endTime: string) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const ms = end.getTime() - start.getTime();
  if (Number.isNaN(ms) || ms <= 0) return "--";
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function formatDurationDetailed(
  startTime?: string,
  endTime?: string,
) {
  if (!startTime || !endTime) return "NA";
  const start = new Date(startTime);
  const end = new Date(endTime);
  const ms = end.getTime() - start.getTime();
  if (Number.isNaN(ms) || ms <= 0) return "NA";
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function minutesBetween(startTime?: string, endTime?: string) {
  if (!startTime || !endTime) return undefined;
  const start = new Date(startTime);
  const end = new Date(endTime);
  const ms = end.getTime() - start.getTime();
  if (Number.isNaN(ms) || ms <= 0) return undefined;
  return Math.round(ms / 60000);
}

export function formatMinutes(totalMinutes: number) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return "--";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function formatDateTime(value?: string) {
  return formatAppDateTime(value, "--");
}

export function formatLatLon(lat: number, lon: number) {
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

export function formatOptionalNumber(
  value: number | null | undefined,
  decimals: number,
  suffix = "",
) {
  if (value === null || value === undefined || Number.isNaN(value)) return "NA";
  return `${value.toFixed(decimals)}${suffix}`;
}

export function rangeLabel(value: string) {
  if (value === "today") return "today";
  if (value === "last7") return "last 7d";
  if (value === "last30") return "last 30d";
  if (value === "last90") return "last 90d";
  if (value === "custom") return "custom";
  return value;
}

export function isVehicleEv(
  vehicle?: {
    fuelType?: string;
    engineType?: string;
    vehicleType?: string;
  } | null,
) {
  if (!vehicle) return false;
  const values = [vehicle.fuelType, vehicle.engineType, vehicle.vehicleType]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim().toLowerCase());

  return values.some(
    (value) =>
      value === "ev" ||
      value === "bev" ||
      value === "electric" ||
      value.includes("electric"),
  );
}

export function normalizeUsDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function normalizeUsDateFinal(value: string) {
  const trimmed = value.trim();
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!match) return trimmed;
  const month = match[1].padStart(2, "0");
  const day = match[2].padStart(2, "0");
  return `${month}/${day}/${match[3]}`;
}

export function toIsoDate(value: string) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return "";
  const month = match[1].padStart(2, "0");
  const day = match[2].padStart(2, "0");
  const year = match[3];
  return `${year}-${month}-${day}`;
}

export function fromIsoDateToUs(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return "";
  return `${match[2]}/${match[3]}/${match[1]}`;
}

export function parseUsDate(value: string, mode: "start" | "end") {
  if (!value) return undefined;
  const trimmed = value.trim();

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return undefined;
    if (mode === "end") {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return date;
  }

  const match = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(trimmed);
  if (!match) return undefined;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (!month || !day || !year || month > 12 || day > 31) return undefined;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return undefined;
  if (mode === "end") {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
}

export type TripHistoryStat = {
  label: string;
  value: string;
};

export type TripTableRow = {
  id: string;
  driverName: string;
  vin: string;
  start: string;
  end: string;
  startTimestamp: string;
  endTimestamp: string;
  endOdometer: string;
  miles: string;
  duration: string;
  alerts: number;
};

export function buildTripOverviewStats(
  dateRange: string,
  items: TripSummaryItem[],
): TripHistoryStat[] {
  const totalTrips = items.length;
  const totalMiles = items.reduce(
    (sum, item) =>
      sum + (typeof item.milesDriven === "number" ? item.milesDriven : 0),
    0,
  );
  const totalAlerts = items.reduce(
    (sum, item) =>
      sum +
      (typeof item.overspeedEventCountTotal === "number"
        ? item.overspeedEventCountTotal
        : 0),
    0,
  );
  const durations = items
    .map((item) => minutesBetween(item.startTime, item.endTime))
    .filter((value): value is number => typeof value === "number");
  const totalEngineMinutes = durations.reduce((sum, value) => sum + value, 0);

  return [
    {
      label: `Trips (${rangeLabel(dateRange)})`,
      value: totalTrips.toLocaleString(),
    },
    {
      label: "Miles driven",
      value:
        totalMiles > 0
          ? totalMiles.toLocaleString(undefined, { maximumFractionDigits: 1 })
          : "0",
    },
    {
      label: "Total engine hours",
      value: totalEngineMinutes > 0 ? formatMinutes(totalEngineMinutes) : "0m",
    },
    { label: "Alerts", value: totalAlerts.toLocaleString() },
  ];
}

export function buildTripTableRows(params: {
  items: TripSummaryItem[];
  assignmentsByVin: Map<string, AssignmentRecord[]>;
  driverNameById: Map<string, string>;
  search: string;
}): TripTableRow[] {
  const normalized = params.items.map((item) => {
    const record = item as Record<string, unknown>;
    const summary = parseSummary(
      record.summary ?? record.summaryJson ?? record.tripSummary,
    );
    const startTimeRaw =
      readStringFromRecord(record, ["startTime", "start_time", "tripStartTime"]) ??
      readStringFromRecord(summary ?? {}, [
        "startTime",
        "start_time",
        "tripStartTime",
      ]) ??
      item.startTime;
    const endTimeRaw =
      readStringFromRecord(record, ["endTime", "end_time", "tripEndTime"]) ??
      readStringFromRecord(summary ?? {}, ["endTime", "end_time", "tripEndTime"]) ??
      item.endTime;
    const start = formatDate(startTimeRaw, "--");
    const end = formatDate(endTimeRaw, "--");
    const startTimestamp = formatDateTime(startTimeRaw);
    const endTimestamp = formatDateTime(endTimeRaw);
    const miles =
      typeof item.milesDriven === "number" ? item.milesDriven.toFixed(1) : "--";
    const duration =
      startTimeRaw && endTimeRaw ? formatDuration(startTimeRaw, endTimeRaw) : "--";
    const endOdometer =
      readNumberFromRecord(record, [
        "odometerEnd",
        "odometer_end",
        "odometerEndMiles",
        "odometer_end_miles",
        "odometer.endMiles",
        "telemetry.odometerEnd",
        "telemetry.odometerEndMiles",
      ]) ??
      readNumberFromRecord(summary ?? {}, [
        "odometerEnd",
        "odometer_end",
        "odometerEndMiles",
        "odometer_end_miles",
        "odometer.endMiles",
      ]);
    const driverName =
      readStringFromRecord(record, [
        "driverName",
        "driver.name",
        "driverDisplayName",
        "driver.displayName",
        "operatorName",
        "operator.name",
        "assignedDriverName",
        "driverId",
      ]) ??
      readStringFromRecord(summary ?? {}, [
        "driverName",
        "driver.name",
        "driverDisplayName",
        "driver.displayName",
        "operatorName",
        "operator.name",
        "assignedDriverName",
        "driverId",
      ]) ??
      "--";
    const resolvedAssignment = resolveAssignmentForTrip(
      params.assignmentsByVin.get(item.vin ?? "") ?? [],
      startTimeRaw,
      endTimeRaw,
    );
    const resolvedDriverId = resolvedAssignment?.driverId;
    const resolvedDriverName =
      (resolvedDriverId
        ? params.driverNameById.get(resolvedDriverId)
        : undefined) ?? resolvedDriverId;
    return {
      id: item.tripId,
      driverName: driverName !== "--" ? driverName : (resolvedDriverName ?? "--"),
      vin: item.vin,
      start,
      end,
      startTimestamp,
      endTimestamp,
      endOdometer:
        typeof endOdometer === "number" ? `${endOdometer.toFixed(2)} mi` : "--",
      miles,
      duration,
      alerts: item.overspeedEventCountTotal ?? 0,
    };
  });

  if (!params.search.trim()) return normalized;
  const term = params.search.trim().toLowerCase();
  return normalized.filter(
    (trip) =>
      trip.id.toLowerCase().includes(term) ||
      trip.driverName.toLowerCase().includes(term),
  );
}

export function buildSummaryItems(params: {
  harshAcceleration?: number;
  harshBraking?: number;
  harshCornering?: number;
  overspeedMilesTotal?: number;
  nightMiles?: number;
}) {
  return [
    {
      label: "Harsh Acceleration",
      value: formatOptionalNumber(params.harshAcceleration ?? 0, 0),
      icon: "⚡",
    },
    {
      label: "Harsh Braking",
      value: formatOptionalNumber(params.harshBraking ?? 0, 0),
      icon: "🛑",
    },
    {
      label: "Harsh Cornering",
      value: formatOptionalNumber(params.harshCornering ?? 0, 0),
      icon: "↪️",
    },
    {
      label: "Over Speeding (miles)",
      value: formatOptionalNumber(params.overspeedMilesTotal, 2),
      icon: "🚗",
    },
    {
      label: "Night Driving (miles)",
      value: formatOptionalNumber(params.nightMiles, 2),
      icon: "🌙",
    },
  ];
}

export function buildMetricItems(params: {
  avgSpeed?: number;
  odometerEnd?: number;
  mpg?: number;
  fuelConsumed?: number;
  fuelLevelGallons?: number;
  fuelLevelPercent?: number;
  isSelectedVehicleEv: boolean;
  evBatteryConsumed?: number;
  evBatteryEnd?: number;
  evRangeEnd?: number;
  distanceMiles?: number;
  tripStartTime?: string;
  tripEndTime?: string;
  idlingSeconds?: number;
}) {
  const items = [
    {
      label: "Average Speed",
      value: formatOptionalNumber(params.avgSpeed, 2, " mph"),
      icon: "🏎️",
    },
    {
      label: "Odometer",
      value:
        typeof params.odometerEnd === "number"
          ? `${params.odometerEnd.toFixed(2)} miles`
          : "NA",
      icon: "🧭",
    },
    {
      label: "Mileage",
      value: params.mpg !== undefined ? `${params.mpg.toFixed(2)} mpg` : "NA",
      icon: "⛽",
    },
    {
      label: "Fuel Consumed",
      value: formatOptionalNumber(params.fuelConsumed, 2, " gal"),
      icon: "🛢️",
    },
    {
      label: "Fuel Level",
      value:
        typeof params.fuelLevelGallons === "number"
          ? `${params.fuelLevelGallons.toFixed(2)} gal`
          : typeof params.fuelLevelPercent === "number"
            ? `${params.fuelLevelPercent.toFixed(1)}%`
            : "NA",
      icon: "⛽",
    },
  ];

  if (params.isSelectedVehicleEv) {
    items.push(
      {
        label: "EV Battery Consumed",
        value:
          typeof params.evBatteryConsumed === "number"
            ? `${params.evBatteryConsumed.toFixed(1)}%`
            : "NA",
        icon: "🔋",
      },
      {
        label: "EV Battery Level",
        value:
          typeof params.evBatteryEnd === "number"
            ? `${params.evBatteryEnd.toFixed(1)}%`
            : "NA",
        icon: "🔋",
      },
      {
        label: "EV Battery Remaining",
        value:
          typeof params.evBatteryEnd === "number"
            ? `${params.evBatteryEnd.toFixed(1)}%`
            : "NA",
        icon: "🔋",
      },
      {
        label: "EV Range",
        value:
          typeof params.evRangeEnd === "number"
            ? `${params.evRangeEnd.toFixed(2)} miles`
            : "NA",
        icon: "🧮",
      },
    );
  }

  items.push(
    {
      label: "Trip Distance",
      value:
        typeof params.distanceMiles === "number"
          ? `${params.distanceMiles.toFixed(2)} miles`
          : "NA",
      icon: "📍",
    },
    {
      label: "Trip Duration",
      value: formatDurationDetailed(params.tripStartTime, params.tripEndTime),
      icon: "⏱️",
    },
    {
      label: "Idling Duration",
      value:
        typeof params.idlingSeconds === "number"
          ? formatSecondsAsDuration(params.idlingSeconds)
          : "NA",
      icon: "🕒",
    },
  );

  return items;
}
