export interface TirePressure {
  frontLeft: number;
  frontRight: number;
  rearLeft: number;
  rearRight: number;
}

export interface VehicleMetrics {
  vehicleName: string;
  vin: string;
  tirePressure: TirePressure;
  maxSpeed: number;
  nightDrivingMiles: number;
  driverSafetyScore: number;
  idealSafetyScore: number;
  totalSafetyIncidents: number;
  totalDistanceTravelled: number;
  totalHoursTravelled: number;
  averageSafetyScore: number;
}

export interface SafetyMetricsResponse {
  vehicleMetrics: VehicleMetrics[];
  totalSafetyIncidentsCombinedForAll: number;
  totalDistanceTravelledCombinedForAll: number;
  totalHoursTravelledCombinedForAll: number;
  averageSafetyScoreCombinedForAll: number;
}
