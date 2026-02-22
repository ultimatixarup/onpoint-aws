import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
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
  buildTripDetailPresentation,
  fetchTripEventPositions,
  buildTripHistoryRows,
  buildTripHistoryStats,
  fetchTripMapData,
  fetchTripHistoryTrips,
  fetchTripSummaryTripDetail,
  type TripHistoryAssignmentRecord,
} from "../../api/tripSummaryApi";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import {
  formatLatLon,
  fromIsoDateToUs,
  isVehicleEv,
  normalizeAssignmentRecords,
  normalizeUsDateFinal,
  normalizeUsDateInput,
  parseIsoToMs,
  parseUsDate,
  toIsoDate,
} from "./tripHistoryUtils";

const GEOCODE_BASE_URL =
  import.meta.env.VITE_GEOCODE_BASE_URL ??
  "https://nominatim.openstreetmap.org/reverse";

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
    const node =
      field === "from" ? fromDatePickerRef.current : toDatePickerRef.current;
    if (!node) return;
    node.focus({ preventScroll: true });
    const showPicker = (node as HTMLInputElement & { showPicker?: () => void })
      .showPicker;
    if (typeof showPicker === "function") {
      try {
        showPicker.call(node);
        return;
      } catch {
        node.click();
        return;
      }
    }
    node.click();
  };

  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const tenantId = tenant?.id ?? "";
  const tenantHeaderId = useMemo(() => {
    const id = tenant?.id?.trim() ?? "";
    const name = tenant?.name?.trim() ?? "";
    const looksLikeTenantId = /^[a-z0-9-]+$/i.test(name) && name.includes("-");
    if (looksLikeTenantId && name !== id) {
      return name;
    }
    return id;
  }, [tenant?.id, tenant?.name]);
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
    queryFn: () =>
      fetchTripHistoryTrips({
        tenantId,
        tenantHeaderId,
        selectedVin,
        fleetId,
        fleetIds: fleetOptions.map((item) => item.fleetId).filter(Boolean),
        from,
        to,
        limit: 50,
      }),
    enabled: canFetchTrips && (dateRange !== "custom" || Boolean(from && to)),
  });

  const stats = useMemo(
    () => buildTripHistoryStats(dateRange, tripResponse?.items ?? []),
    [dateRange, tripResponse],
  );

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
    const map = new Map<string, TripHistoryAssignmentRecord[]>();
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

  const trips = useMemo(
    () =>
      buildTripHistoryRows({
        items: tripResponse?.items ?? [],
        assignmentsByVin,
        driverNameById,
        search,
      }),
    [assignmentsByVin, driverNameById, search, tripResponse],
  );

  const selectedTrip = useMemo(() => {
    if (!selectedTripId || !selectedTripVin) return null;
    return (tripResponse?.items ?? []).find(
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
    data: selectedTripDetail,
    isLoading: isLoadingTripDetail,
    error: tripDetailError,
  } = useQuery({
    queryKey: [
      "trip-detail",
      tenantHeaderId,
      selectedTripVin ?? "",
      selectedTripId ?? "",
    ],
    queryFn: () =>
      fetchTripSummaryTripDetail({
        tenantId,
        tenantHeaderId,
        vin: selectedTripVin ?? "",
        tripId: selectedTripId ?? "",
        include: "summary",
      }),
    enabled: Boolean(tenantId && selectedTripId && selectedTripVin),
  });

  const {
    data: tripMapData,
    isLoading: isLoadingTripMap,
    error: tripMapError,
  } = useQuery({
    queryKey: [
      "trip-map-data",
      tenantHeaderId,
      selectedTripVin ?? "",
      selectedTripId ?? "",
    ],
    queryFn: async () => {
      const response = await fetchTripMapData({
        tenantId,
        tenantHeaderId,
        vin: selectedTripVin ?? "",
        tripId: selectedTripId ?? "",
      });
      return response.map;
    },
    enabled: Boolean(tenantId && selectedTripId && selectedTripVin),
  });

  const {
    data: tripEventPositions,
    isLoading: isLoadingTripEventsPath,
    error: tripEventsPathError,
  } = useQuery({
    queryKey: [
      "trip-events-path",
      tenantHeaderId,
      selectedTripVin ?? "",
      selectedTripId ?? "",
    ],
    queryFn: () =>
      fetchTripEventPositions({
        tenantId,
        tenantHeaderId,
        vin: selectedTripVin ?? "",
        tripId: selectedTripId ?? "",
        limit: 1000,
      }),
    enabled: Boolean(tenantId && selectedTripId && selectedTripVin),
  });

  // Extract path data from map response
  const tripPath = tripMapData?.sampledPath ?? [];
  const snappedPath = tripMapData?.snappedPath ?? [];

  const [startAddress, setStartAddress] = useState<string | null>(null);
  const [endAddress, setEndAddress] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const geocodeCache = useRef(new Map<string, string>());
  const lastGeocodingTime = useRef<number>(0);

  // Nominatim requires minimum 1 second between requests
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    if (tripPath.length < 2) {
      setStartAddress(null);
      setEndAddress(null);
      setIsGeocoding(false);
      return;
    }

    const [startLat, startLon] = tripPath[0];
    const [endLat, endLon] = tripPath[tripPath.length - 1];

    const fetchAddressWithRateLimit = async (
      lat: number,
      lon: number,
      retryCount = 0,
    ): Promise<string | null> => {
      const cacheKey = `${lat.toFixed(6)},${lon.toFixed(6)}`;
      const cached = geocodeCache.current.get(cacheKey);
      if (cached) return cached;

      // Enforce 1-second minimum between requests to Nominatim
      const timeSinceLastRequest = Date.now() - lastGeocodingTime.current;
      if (timeSinceLastRequest < 1100) {
        await delay(1100 - timeSinceLastRequest);
      }

      lastGeocodingTime.current = Date.now();
      const url = `${GEOCODE_BASE_URL}?format=jsonv2&lat=${lat}&lon=${lon}`;

      try {
        const response = await fetch(url);

        // Handle rate limiting (425 Too Early or 429 Too Many Requests)
        if (response.status === 425 || response.status === 429) {
          if (retryCount < 3) {
            // Exponential backoff: 2s, 4s, 8s
            const backoffMs = Math.pow(2, retryCount + 1) * 1000;
            await delay(backoffMs);
            return fetchAddressWithRateLimit(lat, lon, retryCount + 1);
          }
          return null; // Give up after 3 retries
        }

        if (!response.ok) return null;

        const data = (await response.json()) as { display_name?: string };
        const value = data.display_name?.trim();
        if (value) geocodeCache.current.set(cacheKey, value);
        return value ?? null;
      } catch {
        return null;
      }
    };

    let isActive = true;
    setIsGeocoding(true);

    // Sequential requests with rate limiting, not parallel
    (async () => {
      const startValue = await fetchAddressWithRateLimit(startLat, startLon);
      if (!isActive) return;

      const endValue = await fetchAddressWithRateLimit(endLat, endLon);
      if (!isActive) return;

      setStartAddress(startValue);
      setEndAddress(endValue);
      setIsGeocoding(false);
    })().catch(() => {
      if (!isActive) return;
      setStartAddress(null);
      setEndAddress(null);
      setIsGeocoding(false);
    });

    return () => {
      isActive = false;
    };
  }, [tripPath]);

  const displayPath = useMemo(() => {
    const primary = snappedPath.length > 1 ? snappedPath : tripPath;
    if (primary.length > 1) {
      const first = primary[0];
      const last = primary[primary.length - 1];
      const isDegenerate = first[0] === last[0] && first[1] === last[1];
      if (!isDegenerate) return primary;
    }

    if (Array.isArray(tripEventPositions) && tripEventPositions.length > 1) {
      return tripEventPositions;
    }

    return primary;
  }, [snappedPath, tripPath, tripEventPositions]);

  const tripBounds = useMemo(() => {
    if (displayPath.length === 0) return null;
    return L.latLngBounds(displayPath);
  }, [displayPath]);

  const tripDetailPresentation = useMemo(
    () =>
      buildTripDetailPresentation({
        selectedTrip,
        selectedTripDetail,
        isSelectedVehicleEv,
      }),
    [isSelectedVehicleEv, selectedTrip, selectedTripDetail],
  );

  const { metricItems, summaryItems, tripStartLabel, tripEndLabel } =
    tripDetailPresentation;

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
    isGeocoding && !startAddress ? "Resolving address..." : startLocationLabel;
  const endLocationDisplay =
    isGeocoding && !endAddress ? "Resolving address..." : endLocationLabel;

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
            <div className="trip-date-field">
              <input
                className="input"
                type="text"
                inputMode="numeric"
                placeholder="mm/dd/yyyy"
                maxLength={10}
                pattern="\d{2}/\d{2}/\d{4}"
                value={customFrom}
                onChange={(event) => {
                  const normalized = normalizeUsDateInput(event.target.value);
                  setCustomFrom(
                    normalized.length === 10
                      ? normalizeUsDateFinal(normalized)
                      : normalized,
                  );
                }}
                onBlur={() => setCustomFrom(normalizeUsDateFinal(customFrom))}
                disabled={dateRange !== "custom"}
              />
              <button
                type="button"
                className="icon-button trip-date-field__button"
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
                onChange={(event) =>
                  setCustomFrom(
                    normalizeUsDateFinal(fromIsoDateToUs(event.target.value)),
                  )
                }
                disabled={dateRange !== "custom"}
                tabIndex={-1}
                aria-hidden="true"
                className="trip-date-field__native"
              />
            </div>
          </label>
          <label className="form__field">
            <span className="text-muted">To</span>
            <div className="trip-date-field">
              <input
                className="input"
                type="text"
                inputMode="numeric"
                placeholder="mm/dd/yyyy"
                maxLength={10}
                pattern="\d{2}/\d{2}/\d{4}"
                value={customTo}
                onChange={(event) => {
                  const normalized = normalizeUsDateInput(event.target.value);
                  setCustomTo(
                    normalized.length === 10
                      ? normalizeUsDateFinal(normalized)
                      : normalized,
                  );
                }}
                onBlur={() => setCustomTo(normalizeUsDateFinal(customTo))}
                disabled={dateRange !== "custom"}
              />
              <button
                type="button"
                className="icon-button trip-date-field__button"
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
                onChange={(event) =>
                  setCustomTo(
                    normalizeUsDateFinal(fromIsoDateToUs(event.target.value)),
                  )
                }
                disabled={dateRange !== "custom"}
                tabIndex={-1}
                aria-hidden="true"
                className="trip-date-field__native"
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
                {trips.map((trip) => {
                  const isSelectedRow =
                    trip.id === selectedTripId && trip.vin === selectedTripVin;

                  return (
                    <Fragment key={`${trip.vin}-${trip.id}`}>
                      <tr
                        className={isSelectedRow ? "is-selected" : undefined}
                        onClick={() => {
                          if (isSelectedRow) {
                            setSelectedTripId(null);
                            setSelectedTripVin(null);
                            return;
                          }
                          setSelectedTripId(trip.id);
                          setSelectedTripVin(trip.vin);
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

                      {isSelectedRow ? (
                        <tr className="trip-inline-row">
                          <td className="trip-inline-cell" colSpan={9}>
                            {isLoadingTripDetail ? (
                              <div className="trip-inline-panel empty-state">
                                <div className="empty-state__icon">⏳</div>
                                <h3>Loading trip details</h3>
                                <p className="text-muted">
                                  Fetching trip summary for this trip.
                                </p>
                              </div>
                            ) : (
                              <div className="trip-inline-panel">
                                {tripDetailError ? (
                                  <div className="banner banner--warning">
                                    Detailed summary is unavailable right now.
                                    Showing trip information from the table and
                                    map data where available.
                                  </div>
                                ) : null}
                                <div className="trip-map-layout trip-map-layout--inline">
                                  <div className="trip-details">
                                    <div className="trip-locations">
                                      <div className="trip-location">
                                        <div className="trip-location__icon trip-location__icon--start" />
                                        <div>
                                          <p className="trip-location__label">
                                            Start
                                          </p>
                                          <p className="trip-location__value">
                                            {startLocationDisplay}
                                          </p>
                                        </div>
                                        <div className="trip-location__time">
                                          {tripStartLabel}
                                        </div>
                                      </div>
                                      <div className="trip-location">
                                        <div className="trip-location__icon trip-location__icon--end" />
                                        <div>
                                          <p className="trip-location__label">
                                            End
                                          </p>
                                          <p className="trip-location__value">
                                            {endLocationDisplay}
                                          </p>
                                        </div>
                                        <div className="trip-location__time">
                                          {tripEndLabel}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="trip-metrics">
                                      {metricItems.map((metric) => (
                                        <div
                                          key={metric.label}
                                          className="trip-metric"
                                        >
                                          <span className="trip-metric__icon">
                                            {metric.icon}
                                          </span>
                                          <div>
                                            <p className="trip-metric__label">
                                              {metric.label}
                                            </p>
                                            <p className="trip-metric__value">
                                              {metric.value}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="trip-map-card">
                                    <div className="trip-summary">
                                      {summaryItems.map((summary) => (
                                        <div
                                          key={summary.label}
                                          className="trip-summary__item"
                                        >
                                          <span className="trip-summary__icon">
                                            {summary.icon}
                                          </span>
                                          <div>
                                            <p className="trip-summary__label">
                                              {summary.label}
                                            </p>
                                            <p className="trip-summary__value">
                                              {summary.value}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="map-container map-container--inline">
                                      {isLoadingTripMap ||
                                      isLoadingTripEventsPath ? (
                                        <div className="empty-state">
                                          <div className="empty-state__icon">
                                            ⏳
                                          </div>
                                          <h3>Loading route</h3>
                                          <p className="text-muted">
                                            Fetching map and event path data.
                                          </p>
                                        </div>
                                      ) : tripMapError ||
                                        tripEventsPathError ? (
                                        <div className="empty-state">
                                          <div className="empty-state__icon">
                                            ⚠️
                                          </div>
                                          <h3>Unable to load route</h3>
                                          <p className="text-muted">
                                            Trip metrics are available, but map
                                            data could not be loaded.
                                          </p>
                                        </div>
                                      ) : displayPath.length === 0 ? (
                                        <div className="empty-state">
                                          <div className="empty-state__icon">
                                            📍
                                          </div>
                                          <h3>No GPS points available</h3>
                                          <p className="text-muted">
                                            This trip has no location data to
                                            display.
                                          </p>
                                        </div>
                                      ) : (
                                        <MapContainer
                                          center={displayPath[0]}
                                          zoom={12}
                                          style={{
                                            height: "100%",
                                            width: "100%",
                                          }}
                                        >
                                          <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                          />
                                          {tripBounds ? (
                                            <FitBounds bounds={tripBounds} />
                                          ) : null}
                                          <Polyline
                                            positions={displayPath}
                                            color="#1d4ed8"
                                            weight={4}
                                          />
                                          {displayPath.length > 0 ? (
                                            <Marker
                                              position={displayPath[0]}
                                              icon={startMarkerIcon}
                                            >
                                              <Popup>
                                                Start
                                                <br />
                                                {selectedTripVin}
                                              </Popup>
                                            </Marker>
                                          ) : null}
                                          {displayPath.length > 1 ? (
                                            <Marker
                                              position={
                                                displayPath[
                                                  displayPath.length - 1
                                                ]
                                              }
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
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
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
