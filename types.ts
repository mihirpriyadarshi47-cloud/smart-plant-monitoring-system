
export enum ScreenState {
  SHOW_INFO,
  SHOW_FACE
}

export interface SystemState {
  moisture: number;
  rawMoisture: number;
  temperature: number;
  humidity: number;
  light: number;
  isRaining: boolean;
  pumpActive: boolean;
  autoMode: boolean;
  systemError: boolean;
  rssi: number;
  lastPumpStartTime: number;
  startMoistureLevel: number;
  isDND: boolean;
  displayActive: boolean;
  lastMotionTime: number;
  currentScreen: ScreenState;
  ledActive: boolean;
  buzzerActive: boolean;
}

export interface HardwareConfig {
  wetSoilVal: number;
  drySoilVal: number;
  moistPerLow: number;
  moistPerHigh: number;
  maxPumpRunTime: number;
}
