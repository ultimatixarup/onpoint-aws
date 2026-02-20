import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    MapContainer,
    Marker,
    Polyline,
    Popup,
    TileLayer,
    useMap,
} from "react-leaflet";
import { useSearchParams } from "react-router-dom";
import {
    fetchDrivers,
    fetchFleets,
    fetchVehicleAssignments,
    fetchVehicles,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import {
    fetchTripEvents,
    fetchTripSummaryTrips,
} from "../../api/tripSummaryApi";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { formatDateTime as formatAppDateTime, formatDate } from "../../utils/date";

const ROUTING_BASE_URL =
  import.meta.env.VITE_ROUTING_BASE_URL ?? "https://router.project-osrm.org";
const GEOCODE_BASE_URL =
  import.meta.env.VITE_GEOCODE_BASE_URL ??
  "https://nominatim.openstreetmap.org/reverse";

type AssignmentRecord = {
  assignmentId?: string;
  vin?: string;
  driverId?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
};

const startMarkerIcon = L.divIcon({
  className: "trip-map-marker trip-map-marker--start",
  html: '<span class="trip-map-marker__dot" aria-hidden="true"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10],
});

const endMarkerIcon = L.divIcon({
  className: "trip-map-marker trip-map-marker--end",
  html: '<span class="trip-map-marker__dot" aria-hidden="true"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10],
});

export function TripHistoryPage() {
  const [searchParams] = useSearchParams();
  const paramsApplied = useRef(false);
  const tripDetailsRef = useRef<HTMLDivElement | null>(null);
  const fromDatePickerRef = useRef<HTMLInputElement | null>(null);
  const toDatePickerRef = useRef<HTMLInputElement | null>(null);
  const queryTripId = searchParams.get("tripId") ?? "";
  const queryVin = searchParams.get("vin") ?? "";
  const [dateRange, setDateRange] = useState("last90");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [search, setSearch] = useState("");
  const [selectedVin, setSelectedVin] = useState("all");
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedTripVin, setSelectedTripVin] = useState<string | null>(null);

  const openDatePicker = (field: "from" | "to") => {
    const node = field === "from" ? fromDatePickerRef.current : toDatePickerRef.current;
    if (!node) return;
    if ("showPicker" in node) {
      (node as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
      return;
    }
    node.click();
  };

  const focusTripDetails = () => {
    requestAnimationFrame(() => {
      const node = tripDetailsRef.current;
      if (!node) return;
      node.scrollIntoView({ behavior: "smooth", block: "start" });
      node.focus({ preventScroll: true });
    });
  };

  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const tenantId = tenant?.id ?? "";
  const fleetId = fleet?.id;

  const { data: fleetOptions = [], isLoading: isLoadingFleets } = useQuery({
    queryKey: tenantId ? queryKeys.fleets(tenantId) : ["fleets", "none"],
    queryFn: () => fetchFleets(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: tenantId
      ? queryKeys.vehicles(tenantId, fleetId)
      : ["vehicles", "none"],
    queryFn: () => fetchVehicles(tenantId, fleetId),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: tenantId ? queryKeys.drivers(tenantId) : ["drivers", "none"],
    queryFn: () => fetchDrivers(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });

  const canFetchTrips = Boolean(
    tenantId &&
    (fleetId ||
      selectedVin !== "all" ||
      (fleetOptions.length > 0 && !isLoadingFleets)),
  );

  const { from, to } = useMemo(() => {
    const now = new Date();
    if (dateRange === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return { from: start.toISOString(), to: now.toISOString() };
    }
    if (dateRange === "last7") {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return { from: start.toISOString(), to: now.toISOString() };
    }
    if (dateRange === "last30") {
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return { from: start.toISOString(), to: now.toISOString() };
    }
    if (dateRange === "last90") {
      const start = new Date();
      start.setDate(start.getDate() - 90);
      return { from: start.toISOString(), to: now.toISOString() };
    }
    if (dateRange === "custom") {
      const start = parseUsDate(customFrom, "start");
      const end = parseUsDate(customTo, "end");
      if (start && end && start.getTime() > end.getTime()) {
        return { from: undefined, to: undefined };
      }
      return {
        from: start ? start.toISOString() : undefined,
        to: end ? end.toISOString() : undefined,
      };
    }
    return { from: undefined, to: undefined };
  }, [customFrom, customTo, dateRange]);

  const {
    data: tripResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "trip-summary",
      tenantId,
      fleetId ?? "all",
      selectedVin,
      from ?? "",
      to ?? "",
    ],
    queryFn: async () => {
      if (selectedVin !== "all") {
        return fetchTripSummaryTrips({
          tenantId,
          vin: selectedVin,
          from,
          to,
          limit: 50,
          include: "summary",
        });
      }

      if (fleetId) {
        return fetchTripSummaryTrips({
          tenantId,
          fleetId,
          from,
          to,
          limit: 50,
          include: "summary",
        });
      }

      if (!fleetOptions.length) {
        return { items: [], nextToken: null };
      }

      const responses = await Promise.all(
        fleetOptions.map((fleetOption) =>
          fetchTripSummaryTrips({
            tenantId,
            fleetId: fleetOption.fleetId,
            from,
            to,
            limit: 50,
            include: "summary",
          }),
        ),
      );

      const merged = responses.flatMap((response) => response.items ?? []);
      merged.sort((a, b) => {
        const aEnd = a.endTime ? new Date(a.endTime).getTime() : 0;
        const bEnd = b.endTime ? new Date(b.endTime).getTime() : 0;
        return bEnd - aEnd;
      });

      return { items: merged, nextToken: null };
    },
    enabled: canFetchTrips && (dateRange !== "custom" || Boolean(from && to)),
  });

  const stats = useMemo(() => {
    const items = tripResponse?.items ?? [];
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
    const totalEngineMinutes = durations.reduce(
      (sum, value) => sum + value,
      0,
    );

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
  }, [dateRange, tripResponse]);

  const driverNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const driver of drivers) {
      if (!driver.driverId) continue;
      map.set(
        driver.driverId,
        driver.name ?? driver.displayName ?? driver.driverId,
      );
    }
    return map;
  }, [drivers]);

  const tripVins = useMemo(() => {
    const vins = (tripResponse?.items ?? [])
      .map((item) => item.vin)
      .filter((value): value is string => Boolean(value));
    return Array.from(new Set(vins));
  }, [tripResponse]);

  const { data: assignmentsByVinResponse = [] } = useQuery({
    queryKey: ["trip-history-vin-assignments", tenantId, ...tripVins],
    queryFn: async () => {
      const responses = await Promise.all(
        tripVins.map((vin) =>
          fetchVehicleAssignments(vin, tenantId).catch(() => ({ items: [] })),
        ),
      );
      return responses.map((response, index) => ({
        vin: tripVins[index],
        items: normalizeAssignmentRecords(response, tripVins[index]),
      }));
    },
    enabled: Boolean(tenantId && tripVins.length > 0),
    staleTime: 5 * 60 * 1000,
  });

  const assignmentsByVin = useMemo(() => {
    const map = new Map<string, AssignmentRecord[]>();
    for (const group of assignmentsByVinResponse) {
      const sorted = [...group.items].sort(
        (a, b) =>
          (parseIsoToMs(b.effectiveFrom) ?? 0) -
          (parseIsoToMs(a.effectiveFrom) ?? 0),
      );
      map.set(group.vin, sorted);
    }
    return map;
  }, [assignmentsByVinResponse]);

  const trips = useMemo(() => {
    const items = tripResponse?.items ?? [];
    const normalized = items.map((item) => {
      const record = item as Record<string, unknown>;
      const summary = parseSummary(
        record.summary ?? record.summaryJson ?? record.tripSummary,
      );
      const startTimeRaw =
        readStringFromRecord(record, [
          "startTime",
          "start_time",
          "tripStartTime",
        ]) ??
        readStringFromRecord(summary ?? {}, [
          "startTime",
          "start_time",
          "tripStartTime",
        ]) ??
        item.startTime;
      const endTimeRaw =
        readStringFromRecord(record, ["endTime", "end_time", "tripEndTime"]) ??
        readStringFromRecord(summary ?? {}, [
          "endTime",
          "end_time",
          "tripEndTime",
        ]) ??
        item.endTime;
      const start = formatDate(startTimeRaw, "--");
      const end = formatDate(endTimeRaw, "--");
      const startTimestamp = formatDateTime(startTimeRaw);
      const endTimestamp = formatDateTime(endTimeRaw);
      const miles =
        typeof item.milesDriven === "number"
          ? item.milesDriven.toFixed(1)
          : "--";
      const duration =
        startTimeRaw && endTimeRaw
          ? formatDuration(startTimeRaw, endTimeRaw)
          : "--";
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
        assignmentsByVin.get(item.vin ?? "") ?? [],
        startTimeRaw,
        endTimeRaw,
      );
      const resolvedDriverId = resolvedAssignment?.driverId;
      const resolvedDriverName =
        (resolvedDriverId ? driverNameById.get(resolvedDriverId) : undefined) ??
        resolvedDriverId;
      return {
        id: item.tripId,
        driverName:
          driverName !== "--" ? driverName : (resolvedDriverName ?? "--"),
        vin: item.vin,
        start,
        end,
        startTimestamp,
        endTimestamp,
        endOdometer:
          typeof endOdometer === "number"
            ? `${endOdometer.toFixed(2)} mi`
            : "--",
        miles,
        duration,
        alerts: item.overspeedEventCountTotal ?? 0,
      };
    });

    if (!search.trim()) return normalized;
    const term = search.trim().toLowerCase();
    return normalized.filter(
      (trip) =>
        trip.id.toLowerCase().includes(term) ||
        trip.driverName.toLowerCase().includes(term),
    );
  }, [assignmentsByVin, driverNameById, search, tripResponse]);

  const selectedTrip = useMemo(() => {
    if (!selectedTripId || !selectedTripVin) return null;
    return (
      tripResponse?.items ?? []
    ).find(
      (item) => item.tripId === selectedTripId && item.vin === selectedTripVin,
    );
  }, [selectedTripId, selectedTripVin, tripResponse]);

  const vehicleOptions = useMemo(
    () => vehicles.map((vehicle) => vehicle.vin).filter(Boolean),
    [vehicles],
  );

  const selectedVehicle = useMemo(
    () =>
      selectedTripVin
        ? vehicles.find((vehicle) => vehicle.vin === selectedTripVin)
        : undefined,
    [selectedTripVin, vehicles],
  );

  const isSelectedVehicleEv = useMemo(
    () => isVehicleEv(selectedVehicle),
    [selectedVehicle],
  );

  useEffect(() => {
    if (paramsApplied.current) return;
    if (queryTripId) setSearch(queryTripId);
    if (queryVin) setSelectedVin(queryVin);
    if (queryTripId || queryVin) paramsApplied.current = true;
  }, [queryTripId, queryVin]);

  useEffect(() => {
    if (!queryTripId) return;
    const match = trips.find((trip) => trip.id === queryTripId);
    if (!match) return;
    if (selectedTripId !== match.id || selectedTripVin !== match.vin) {
      setSelectedTripId(match.id);
      setSelectedTripVin(match.vin);
    }
  }, [queryTripId, selectedTripId, selectedTripVin, trips]);

  useEffect(() => {
    if (!selectedTripId || !selectedTripVin) return;
    const stillExists = trips.some(
      (trip) => trip.id === selectedTripId && trip.vin === selectedTripVin,
    );
    if (!stillExists) {
      setSelectedTripId(null);
      setSelectedTripVin(null);
    }
  }, [selectedTripId, selectedTripVin, trips]);

  const {
    data: tripEventsResponse,
    isLoading: isLoadingTripEvents,
    error: tripEventsError,
  } = useQuery({
    queryKey: [
      "trip-events",
      tenantId,
      selectedTripVin ?? "",
      selectedTripId ?? "",
    ],
    queryFn: () =>
      fetchTripEvents({
        tenantId,
        vin: selectedTripVin ?? "",
        tripId: selectedTripId ?? "",
        limit: 500,
      }),
    enabled: Boolean(tenantId && selectedTripId && selectedTripVin),
  });

  const tripPath = useMemo(() => {
    const items = tripEventsResponse?.items ?? [];
    return items
      .map((item) => extractEventPosition(item))
      .filter((pos): pos is [number, number] => Boolean(pos));
  }, [tripEventsResponse]);

  const [startAddress, setStartAddress] = useState<string | null>(null);
  const [endAddress, setEndAddress] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const geocodeCache = useRef(new Map<string, string>());

  const [snappedPath, setSnappedPath] = useState<Array<[number, number]>>([]);
  const [isRouting, setIsRouting] = useState(false);
  const [routingError, setRoutingError] = useState<string | null>(null);

  useEffect(() => {
    if (tripPath.length < 2) {
      setSnappedPath([]);
      setRoutingError(null);
      setIsRouting(false);
      return;
    }

    const controller = new AbortController();
    const fetchRoute = async () => {
      setIsRouting(true);
      setRoutingError(null);
      try {
        const sampled = reduceRoutePoints(tripPath, 100);
        const coords = sampled
          .map(([lat, lon]) => `${lon},${lat}`)
          .join(";");
        const url = `${ROUTING_BASE_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Routing failed (${response.status})`);
        }
        const data = (await response.json()) as {
          routes?: Array<{
            geometry?: { coordinates?: Array<[number, number]> };
          }>;
        };
        const coordinates = data.routes?.[0]?.geometry?.coordinates ?? [];
        const snapped = coordinates
          .map(([lon, lat]) => [lat, lon] as [number, number])
          .filter((pos) => pos.every((value) => Number.isFinite(value)));
        setSnappedPath(snapped.length > 1 ? snapped : []);
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        setSnappedPath([]);
        setRoutingError(
          err instanceof Error ? err.message : "Unable to load route.",
        );
      } finally {
        setIsRouting(false);
      }
    };

    void fetchRoute();
    return () => controller.abort();
  }, [tripPath]);

  useEffect(() => {
    if (tripPath.length < 2) {
      setStartAddress(null);
      setEndAddress(null);
      setIsGeocoding(false);
      return;
    }

    const [startLat, startLon] = tripPath[0];
    const [endLat, endLon] = tripPath[tripPath.length - 1];

    const fetchAddress = async (lat: number, lon: number) => {
      const cacheKey = `${lat.toFixed(6)},${lon.toFixed(6)}`;
      const cached = geocodeCache.current.get(cacheKey);
      if (cached) return cached;
      const url = `${GEOCODE_BASE_URL}?format=jsonv2&lat=${lat}&lon=${lon}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = (await response.json()) as { display_name?: string };
      const value = data.display_name?.trim();
      if (value) geocodeCache.current.set(cacheKey, value);
      return value ?? null;
    };

    let isActive = true;
    setIsGeocoding(true);
    Promise.all([
      fetchAddress(startLat, startLon),
      fetchAddress(endLat, endLon),
    ])
      .then(([startValue, endValue]) => {
        if (!isActive) return;
        setStartAddress(startValue);
        setEndAddress(endValue);
      })
      .catch(() => {
        if (!isActive) return;
        setStartAddress(null);
        setEndAddress(null);
      })
      .finally(() => {
        if (!isActive) return;
        setIsGeocoding(false);
      });

    return () => {
      isActive = false;
    };
  }, [tripPath]);

  const displayPath = useMemo(
    () => (snappedPath.length > 1 ? snappedPath : tripPath),
    [snappedPath, tripPath],
  );

  const tripBounds = useMemo(() => {
    if (displayPath.length === 0) return null;
    return L.latLngBounds(displayPath);
  }, [displayPath]);

  const selectedTripRecord = useMemo(
    () => (selectedTrip ? (selectedTrip as Record<string, unknown>) : null),
    [selectedTrip],
  );
  const summaryRecord = useMemo(
    () =>
      parseSummary(
        selectedTripRecord?.summary ??
          selectedTripRecord?.summaryJson ??
          selectedTripRecord?.tripSummary,
      ),
    [selectedTripRecord],
  );

  const eventStats = useMemo(() => {
    const items = tripEventsResponse?.items ?? [];
    let odometerEnd: number | undefined;
    let fuelGallons: number | undefined;
    let fuelPercent: number | undefined;
    let batteryPercent: number | undefined;
    let evRangeMiles: number | undefined;
    let maxSpeed: number | undefined;
    let harshBraking = 0;
    let harshAcceleration = 0;
    let harshCornering = 0;

    for (const item of items) {
      const odometer = readNumberFromRecord(item as Record<string, unknown>, [
        "odometer_miles",
        "odometerMiles",
        "odometer",
      ]);
      if (odometer !== undefined) odometerEnd = odometer;

      const fuelAbs = readNumberFromRecord(item as Record<string, unknown>, [
        "fuelIndicatorAbsoluteGallons",
        "fuelLevelGallons",
        "fuelGallons",
      ]);
      if (fuelAbs !== undefined) fuelGallons = fuelAbs;

      const fuelPct = readNumberFromRecord(item as Record<string, unknown>, [
        "fuelPercent",
        "fuel_percent",
      ]);
      if (fuelPct !== undefined) fuelPercent = fuelPct;

      const batteryPct = readNumberFromRecord(item as Record<string, unknown>, [
        "batteryLevelPercent",
        "batteryPercent",
        "evBatteryPercent",
      ]);
      if (batteryPct !== undefined) batteryPercent = batteryPct;

      const rangeMiles = readNumberFromRecord(item as Record<string, unknown>, [
        "rangeMiles",
        "evRangeMiles",
      ]);
      if (rangeMiles !== undefined) evRangeMiles = rangeMiles;

      const speed = readNumberFromRecord(item as Record<string, unknown>, [
        "speed_mph",
        "speedMph",
        "speed",
      ]);
      if (speed !== undefined) {
        maxSpeed = maxSpeed === undefined ? speed : Math.max(maxSpeed, speed);
      }

      const eventType = String((item as Record<string, unknown>).eventType ?? "");
      if (eventType === "harsh_braking") harshBraking += 1;
      if (eventType === "harsh_acceleration") harshAcceleration += 1;
      if (eventType === "harsh_cornering") harshCornering += 1;
    }

    return {
      odometerEnd,
      fuelGallons,
      fuelPercent,
      batteryPercent,
      evRangeMiles,
      maxSpeed,
      harshBraking,
      harshAcceleration,
      harshCornering,
    };
  }, [tripEventsResponse]);

  const distanceMiles = selectedTrip?.milesDriven;
  const durationMinutes = minutesBetween(
    selectedTrip?.startTime,
    selectedTrip?.endTime,
  );
  const durationHours =
    typeof durationMinutes === "number" ? durationMinutes / 60 : undefined;
  const avgSpeedFromSummary = readNumberFromTrip(selectedTripRecord, summaryRecord, [
    "averageSpeedMph",
    "speed.averageMph",
  ]);
  const avgSpeed =
    avgSpeedFromSummary ??
    (typeof distanceMiles === "number" && durationHours && durationHours > 0
      ? distanceMiles / durationHours
      : undefined);
  const fuelConsumed =
    selectedTrip?.fuelConsumed ??
    readNumberFromTrip(selectedTripRecord, summaryRecord, [
      "fuel.fuelConsumed",
      "fuelConsumedGallons",
    ]);
  const mpg =
    readNumberFromTrip(selectedTripRecord, summaryRecord, [
      "mpg.actualMpg",
      "fuelEfficiencyMpg",
    ]) ??
    (typeof distanceMiles === "number" &&
    typeof fuelConsumed === "number" &&
    fuelConsumed > 0
      ? distanceMiles / fuelConsumed
      : undefined);

  const odometerEnd =
    readNumberFromTrip(selectedTripRecord, summaryRecord, [
      "odometerEnd",
      "odometer.endMiles",
      "odometer_end_miles",
    ]) ?? eventStats.odometerEnd;

  const fuelLevelGallons =
    readNumberFromTrip(selectedTripRecord, summaryRecord, [
      "fuel.fuelIndicatorAbsoluteGallons",
      "fuelIndicatorAbsoluteGallons",
      "fuelIndicatorGallons",
      "fuel.endGallons",
    ]) ?? eventStats.fuelGallons;

  const fuelLevelPercent =
    readNumberFromTrip(selectedTripRecord, summaryRecord, [
      "fuel.fuelIndicatorPercent",
      "fuelIndicatorPercent",
      "fuelPercent",
    ]) ?? eventStats.fuelPercent;

  const evBatteryStart = readNumberFromTrip(selectedTripRecord, summaryRecord, [
    "evData.batteryLevelStartPercent",
    "batteryLevelStartPercent",
  ]);
  const evBatteryEnd =
    readNumberFromTrip(selectedTripRecord, summaryRecord, [
      "evData.batteryLevelEndPercent",
      "batteryLevelEndPercent",
    ]) ?? eventStats.batteryPercent;
  const evBatteryConsumed =
    evBatteryStart !== undefined && evBatteryEnd !== undefined
      ? Math.max(0, evBatteryStart - evBatteryEnd)
      : undefined;
  const evRangeEnd =
    readNumberFromTrip(selectedTripRecord, summaryRecord, [
      "evData.rangeEndMiles",
      "rangeEndMiles",
    ]) ?? eventStats.evRangeMiles;

  const idlingSeconds =
    readNumberFromTrip(selectedTripRecord, summaryRecord, [
      "idlingTimeSeconds",
      "idling_seconds",
    ]) ??
    parseHmsToSeconds(
      readStringFromTrip(selectedTripRecord, summaryRecord, [
        "idlingTime",
      ]),
    );

  const nightMiles = readNumberFromTrip(selectedTripRecord, summaryRecord, [
    "distance.nightMiles",
    "nightMiles",
  ]);

  const overspeedMilesTotal =
    readNumberFromTrip(selectedTripRecord, summaryRecord, [
      "overspeedMilesTotal",
      "overspeed.milesTotal",
    ]) ??
    sumOptional(
      readNumberFromTrip(selectedTripRecord, summaryRecord, [
        "overspeedMilesStandard",
        "overspeed.milesStandard",
      ]),
      readNumberFromTrip(selectedTripRecord, summaryRecord, [
        "overspeedMilesSevere",
        "overspeed.milesSevere",
      ]),
    );

  const harshAcceleration =
    readNumberFromTrip(selectedTripRecord, summaryRecord, [
      "events.harshAccelerationCount",
      "harshAccelerationCount",
    ]) ?? eventStats.harshAcceleration;
  const harshBraking =
    readNumberFromTrip(selectedTripRecord, summaryRecord, [
      "events.harshBrakingCount",
      "harshBrakingCount",
    ]) ?? eventStats.harshBraking;
  const harshCornering =
    readNumberFromTrip(selectedTripRecord, summaryRecord, [
      "events.harshCorneringCount",
      "harshCorneringCount",
    ]) ?? eventStats.harshCornering;

  const tripStartLabel = formatDateTime(selectedTrip?.startTime);
  const tripEndLabel = formatDateTime(selectedTrip?.endTime);
  const startLocationLabel =
    startAddress ??
    (tripPath[0]
      ? formatLatLon(tripPath[0][0], tripPath[0][1])
      : "Location unavailable");
  const endLocationLabel =
    endAddress ??
    (tripPath.length > 0
      ? formatLatLon(
          tripPath[tripPath.length - 1][0],
          tripPath[tripPath.length - 1][1],
        )
      : "Location unavailable");
  const startLocationDisplay =
    isGeocoding && !startAddress
      ? "Resolving address..."
      : startLocationLabel;
  const endLocationDisplay =
    isGeocoding && !endAddress ? "Resolving address..." : endLocationLabel;

  const summaryItems = useMemo(
    () => [
      {
        label: "Harsh Acceleration",
        value: formatOptionalNumber(harshAcceleration ?? 0, 0),
        icon: "⚡",
      },
      {
        label: "Harsh Braking",
        value: formatOptionalNumber(harshBraking ?? 0, 0),
        icon: "🛑",
      },
      {
        label: "Harsh Cornering",
        value: formatOptionalNumber(harshCornering ?? 0, 0),
        icon: "↪️",
      },
      {
        label: "Over Speeding (miles)",
        value: formatOptionalNumber(overspeedMilesTotal, 2),
        icon: "🚗",
      },
      {
        label: "Night Driving (miles)",
        value: formatOptionalNumber(nightMiles, 2),
        icon: "🌙",
      },
    ],
    [
      harshAcceleration,
      harshBraking,
      harshCornering,
      nightMiles,
      overspeedMilesTotal,
    ],
  );

  const metricItems = useMemo(() => {
    const items = [
      {
        label: "Average Speed",
        value: formatOptionalNumber(avgSpeed, 2, " mph"),
        icon: "🏎️",
      },
      {
        label: "Odometer",
        value:
          typeof odometerEnd === "number"
            ? `${odometerEnd.toFixed(2)} miles`
            : "NA",
        icon: "🧭",
      },
      {
        label: "Mileage",
        value: mpg !== undefined ? `${mpg.toFixed(2)} mpg` : "NA",
        icon: "⛽",
      },
      {
        label: "Fuel Consumed",
        value: formatOptionalNumber(fuelConsumed, 2, " gal"),
        icon: "🛢️",
      },
      {
        label: "Fuel Level",
        value:
          typeof fuelLevelGallons === "number"
            ? `${fuelLevelGallons.toFixed(2)} gal`
            : typeof fuelLevelPercent === "number"
              ? `${fuelLevelPercent.toFixed(1)}%`
              : "NA",
        icon: "⛽",
      },
    ];

    if (isSelectedVehicleEv) {
      items.push(
        {
          label: "EV Battery Consumed",
          value:
            typeof evBatteryConsumed === "number"
              ? `${evBatteryConsumed.toFixed(1)}%`
              : "NA",
          icon: "🔋",
        },
        {
          label: "EV Battery Level",
          value:
            typeof evBatteryEnd === "number"
              ? `${evBatteryEnd.toFixed(1)}%`
              : "NA",
          icon: "🔋",
        },
        {
          label: "EV Battery Remaining",
          value:
            typeof evBatteryEnd === "number"
              ? `${evBatteryEnd.toFixed(1)}%`
              : "NA",
          icon: "🔋",
        },
        {
          label: "EV Range",
          value:
            typeof evRangeEnd === "number"
              ? `${evRangeEnd.toFixed(2)} miles`
              : "NA",
          icon: "🧮",
        },
      );
    }

    items.push(
      {
        label: "Trip Distance",
        value:
          typeof distanceMiles === "number"
            ? `${distanceMiles.toFixed(2)} miles`
            : "NA",
        icon: "📍",
      },
      {
        label: "Trip Duration",
        value: formatDurationDetailed(
          selectedTrip?.startTime,
          selectedTrip?.endTime,
        ),
        icon: "⏱️",
      },
      {
        label: "Idling Duration",
        value:
          typeof idlingSeconds === "number"
            ? formatSecondsAsDuration(idlingSeconds)
            : "NA",
        icon: "🕒",
      },
    );

    return items;
  }, [
    avgSpeed,
    distanceMiles,
    evBatteryConsumed,
    evBatteryEnd,
    evRangeEnd,
    fuelConsumed,
    fuelLevelGallons,
    fuelLevelPercent,
    idlingSeconds,
    isSelectedVehicleEv,
    mpg,
    odometerEnd,
    selectedTrip,
  ]);

  return (
    <div className="page trip-history-page">
      <section className="trip-hero">
        <div className="trip-hero__glow" />
        <div className="trip-hero__content">
          <div>
            <p className="trip-hero__eyebrow">Trip intelligence</p>
            <h1>Trip History</h1>
            <p className="trip-hero__subtitle">
              Audit fleet movement, safety signals, and route performance.
            </p>
          </div>
          <div className="trip-hero__actions">
            <Button variant="secondary">Export</Button>
            <Button onClick={() => refetch()}>Refresh</Button>
          </div>
        </div>
        <div className="trip-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="trip-stat">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <span className="text-muted">Compared to previous period</span>
            </div>
          ))}
        </div>
      </section>

      <Card title="Filters">
        <div className="form-grid">
          <label className="form__field">
            <span className="text-muted">Date range</span>
            <select
              className="select"
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value)}
            >
              <option value="today">Today</option>
              <option value="last7">Last 7 days</option>
              <option value="last30">Last 30 days</option>
              <option value="last90">Last 90 days</option>
              <option value="custom">Custom range</option>
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">From</span>
            <div className="inline" style={{ alignItems: "center", gap: "0.5rem" }}>
              <input
                className="input"
                type="text"
                inputMode="numeric"
                placeholder="MM/DD/YYYY"
                value={customFrom}
                onChange={(event) =>
                  setCustomFrom(normalizeUsDateInput(event.target.value))
                }
                onBlur={() => setCustomFrom(normalizeUsDateFinal(customFrom))}
                disabled={dateRange !== "custom"}
              />
              <button
                type="button"
                className="icon-button"
                aria-label="Open From date picker"
                onClick={() => openDatePicker("from")}
                disabled={dateRange !== "custom"}
              >
                📅
              </button>
              <input
                ref={fromDatePickerRef}
                type="date"
                value={toIsoDate(customFrom)}
                max={toIsoDate(customTo) || undefined}
                onChange={(event) => setCustomFrom(fromIsoDateToUs(event.target.value))}
                disabled={dateRange !== "custom"}
                tabIndex={-1}
                aria-hidden="true"
                style={{ position: "absolute", opacity: 0, width: 1, height: 1, pointerEvents: "none" }}
              />
            </div>
          </label>
          <label className="form__field">
            <span className="text-muted">To</span>
            <div className="inline" style={{ alignItems: "center", gap: "0.5rem" }}>
              <input
                className="input"
                type="text"
                inputMode="numeric"
                placeholder="MM/DD/YYYY"
                value={customTo}
                onChange={(event) =>
                  setCustomTo(normalizeUsDateInput(event.target.value))
                }
                onBlur={() => setCustomTo(normalizeUsDateFinal(customTo))}
                disabled={dateRange !== "custom"}
              />
              <button
                type="button"
                className="icon-button"
                aria-label="Open To date picker"
                onClick={() => openDatePicker("to")}
                disabled={dateRange !== "custom"}
              >
                📅
              </button>
              <input
                ref={toDatePickerRef}
                type="date"
                value={toIsoDate(customTo)}
                min={toIsoDate(customFrom) || undefined}
                onChange={(event) => setCustomTo(fromIsoDateToUs(event.target.value))}
                disabled={dateRange !== "custom"}
                tabIndex={-1}
                aria-hidden="true"
                style={{ position: "absolute", opacity: 0, width: 1, height: 1, pointerEvents: "none" }}
              />
            </div>
          </label>
          <label className="form__field">
            <span className="text-muted">Vehicle (VIN)</span>
            <select
              className="select"
              value={selectedVin}
              onChange={(event) => setSelectedVin(event.target.value)}
            >
              <option value="all">All vehicles</option>
              {vehicleOptions.map((vin) => (
                <option key={vin} value={vin}>
                  {vin}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">Status</span>
            <select className="select" defaultValue="all">
              <option value="all">All statuses</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In progress</option>
              <option value="canceled">Canceled</option>
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">Search</span>
            <input
              className="input"
              placeholder="Search by trip ID or driver"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
      </Card>

      <Card title="Trips">
        <div className="tabs">
          <button className="tab tab--active">Trips</button>
          <button className="tab">Alerts</button>
        </div>

        <div className="table-toolbar">
          <p className="text-muted">
            {!canFetchTrips
              ? "Select a fleet or VIN to load trips"
              : isLoading
                ? "Loading trips..."
                : error
                  ? "Unable to load trips"
                  : `Showing ${trips.length} trips`}
          </p>
          <div className="inline">
            <button className="icon-button" aria-label="Grid view">
              ▦
            </button>
            <button className="icon-button" aria-label="List view">
              ≡
            </button>
          </div>
        </div>

        {!canFetchTrips ? (
          <div className="empty-state">
            <div className="empty-state__icon">📍</div>
            <h3>Select a fleet or VIN</h3>
            <p className="text-muted">
              Choose a fleet from the top bar or select a specific VIN to view
              trips.
            </p>
          </div>
        ) : isLoading ? (
          <div className="empty-state">
            <div className="empty-state__icon">⏳</div>
            <h3>Loading trips</h3>
            <p className="text-muted">
              Fetching trip summaries for the selected filters.
            </p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state__icon">⚠️</div>
            <h3>Unable to load trips</h3>
            <p className="text-muted">
              Verify your tenant and fleet selection, then try again.
            </p>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        ) : trips.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🧭</div>
            <h3>No trips found</h3>
            <p className="text-muted">
              Trips will appear here as vehicles report telemetry. Adjust
              filters or try another date range.
            </p>
            <Button
              onClick={() => {
                setDateRange("last30");
                setCustomFrom("");
                setCustomTo("");
                setSearch("");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Driver Name</th>
                  <th>VIN</th>
                  <th>Start Timestamp</th>
                  <th>End Timestamp</th>
                  <th>End Odometer</th>
                  <th>Miles</th>
                  <th>Duration</th>
                  <th>Alerts</th>
                  <th>Trip ID</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => (
                  <tr
                    key={trip.id}
                    className={
                      trip.id === selectedTripId && trip.vin === selectedTripVin
                        ? "is-selected"
                        : undefined
                    }
                    onClick={() => {
                      setSelectedTripId(trip.id);
                      setSelectedTripVin(trip.vin);
                      focusTripDetails();
                    }}
                  >
                    <td>{trip.driverName}</td>
                    <td className="mono">{trip.vin}</td>
                    <td>{trip.startTimestamp}</td>
                    <td>{trip.endTimestamp}</td>
                    <td>{trip.endOdometer}</td>
                    <td>{trip.miles}</td>
                    <td>{trip.duration}</td>
                    <td>{trip.alerts}</td>
                    <td className="mono">{trip.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div ref={tripDetailsRef} tabIndex={-1}>
        {!selectedTripId || !selectedTripVin ? (
          <Card>
            <div className="empty-state">
              <div className="empty-state__icon">🗺️</div>
              <h3>Select a trip</h3>
              <p className="text-muted">
                Click a trip to view its route on the map.
              </p>
            </div>
          </Card>
        ) : isLoadingTripEvents ? (
          <Card>
            <div className="empty-state">
              <div className="empty-state__icon">⏳</div>
              <h3>Loading trip route</h3>
              <p className="text-muted">
                Fetching telemetry events for this trip.
              </p>
            </div>
          </Card>
        ) : tripEventsError ? (
          <Card>
            <div className="empty-state">
              <div className="empty-state__icon">⚠️</div>
              <h3>Unable to load route</h3>
              <p className="text-muted">Verify your API access and try again.</p>
            </div>
          </Card>
        ) : tripPath.length === 0 ? (
          <Card>
            <div className="empty-state">
              <div className="empty-state__icon">📍</div>
              <h3>No GPS points available</h3>
              <p className="text-muted">
                This trip has no location data to display.
              </p>
            </div>
          </Card>
        ) : (
          <div className="trip-map-layout">
            <Card>
              <div className="trip-details">
              <div className="trip-locations">
                <div className="trip-location">
                  <div className="trip-location__icon trip-location__icon--start" />
                  <div>
                    <p className="trip-location__label">Start</p>
                    <p className="trip-location__value">
                      {startLocationDisplay}
                    </p>
                  </div>
                  <div className="trip-location__time">{tripStartLabel}</div>
                </div>
                <div className="trip-location">
                  <div className="trip-location__icon trip-location__icon--end" />
                  <div>
                    <p className="trip-location__label">End</p>
                    <p className="trip-location__value">
                      {endLocationDisplay}
                    </p>
                  </div>
                  <div className="trip-location__time">{tripEndLabel}</div>
                </div>
              </div>

              <div className="trip-metrics">
                {metricItems.map((metric) => (
                  <div key={metric.label} className="trip-metric">
                    <span className="trip-metric__icon">{metric.icon}</span>
                    <div>
                      <p className="trip-metric__label">{metric.label}</p>
                      <p className="trip-metric__value">{metric.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </Card>

            <Card>
              <div className="trip-map-card">
              <div className="trip-summary">
                {summaryItems.map((summary) => (
                  <div key={summary.label} className="trip-summary__item">
                    <span className="trip-summary__icon">{summary.icon}</span>
                    <div>
                      <p className="trip-summary__label">{summary.label}</p>
                      <p className="trip-summary__value">{summary.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="map-container">
                {isRouting ? (
                  <p className="text-muted">Snapping route to roads...</p>
                ) : null}
                {routingError ? (
                  <p className="text-muted">
                    Unable to load road route. Showing raw GPS track instead.
                  </p>
                ) : null}
                <MapContainer
                  center={displayPath[0]}
                  zoom={12}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {tripBounds ? <FitBounds bounds={tripBounds} /> : null}
                  <Polyline positions={displayPath} color="#1d4ed8" weight={4} />
                  {displayPath.length > 0 ? (
                    <Marker position={displayPath[0]} icon={startMarkerIcon}>
                      <Popup>
                        Start
                        <br />
                        {selectedTripVin}
                      </Popup>
                    </Marker>
                  ) : null}
                  {displayPath.length > 1 ? (
                    <Marker
                      position={displayPath[displayPath.length - 1]}
                      icon={endMarkerIcon}
                    >
                      <Popup>
                        End
                        <br />
                        {selectedTripVin}
                      </Popup>
                    </Marker>
                  ) : null}
                </MapContainer>
              </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function FitBounds({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds, { padding: [24, 24] });
  }, [bounds, map]);

  return null;
}

function extractEventPosition(event: Record<string, unknown>) {
  const directLat = asNumber(event.lat ?? event.latitude);
  const directLon = asNumber(event.lon ?? event.longitude);
  if (directLat !== null && directLon !== null)
    return [directLat, directLon] as [number, number];

  const location = event.location as Record<string, unknown> | undefined;
  if (location) {
    const locLat = asNumber(location.lat ?? location.latitude);
    const locLon = asNumber(location.lon ?? location.longitude);
    if (locLat !== null && locLon !== null)
      return [locLat, locLon] as [number, number];
  }

  const geo = event.geo as Record<string, unknown> | undefined;
  if (geo) {
    const geoLat = asNumber(geo.lat ?? geo.latitude);
    const geoLon = asNumber(geo.lon ?? geo.longitude);
    if (geoLat !== null && geoLon !== null)
      return [geoLat, geoLon] as [number, number];
  }

  return null;
}

function parseSummary(value: unknown): Record<string, unknown> | null {
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

function parseIsoToMs(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? undefined : time;
}

function normalizeAssignmentRecords(response: unknown, vin: string) {
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

function resolveAssignmentForTrip(
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

function readNumberFromRecord(
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

function readStringFromRecord(
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

function readNumberFromTrip(
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

function readStringFromTrip(
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

function parseHmsToSeconds(value?: string) {
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

function formatSecondsAsDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "NA";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function sumOptional(a?: number, b?: number) {
  if (a === undefined && b === undefined) return undefined;
  return (a ?? 0) + (b ?? 0);
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function reduceRoutePoints(
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

function formatDuration(startTime: string, endTime: string) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const ms = end.getTime() - start.getTime();
  if (Number.isNaN(ms) || ms <= 0) return "--";
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatDurationDetailed(
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

function minutesBetween(startTime?: string, endTime?: string) {
  if (!startTime || !endTime) return undefined;
  const start = new Date(startTime);
  const end = new Date(endTime);
  const ms = end.getTime() - start.getTime();
  if (Number.isNaN(ms) || ms <= 0) return undefined;
  return Math.round(ms / 60000);
}

function formatMinutes(totalMinutes: number) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return "--";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatDateTime(value?: string) {
  return formatAppDateTime(value, "--");
}

function formatLatLon(lat: number, lon: number) {
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

function formatOptionalNumber(
  value: number | null | undefined,
  decimals: number,
  suffix = "",
) {
  if (value === null || value === undefined || Number.isNaN(value)) return "NA";
  return `${value.toFixed(decimals)}${suffix}`;
}

function rangeLabel(value: string) {
  if (value === "today") return "today";
  if (value === "last7") return "last 7d";
  if (value === "last30") return "last 30d";
  if (value === "last90") return "last 90d";
  if (value === "custom") return "custom";
  return value;
}

function isVehicleEv(
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

function normalizeUsDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function normalizeUsDateFinal(value: string) {
  const trimmed = value.trim();
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!match) return trimmed;
  const month = match[1].padStart(2, "0");
  const day = match[2].padStart(2, "0");
  return `${month}/${day}/${match[3]}`;
}

function toIsoDate(value: string) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return "";
  const month = match[1].padStart(2, "0");
  const day = match[2].padStart(2, "0");
  const year = match[3];
  return `${year}-${month}-${day}`;
}

function fromIsoDateToUs(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return "";
  return `${match[2]}/${match[3]}/${match[1]}`;
}

function parseUsDate(value: string, mode: "start" | "end") {
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
