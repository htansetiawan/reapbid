export interface AutopilotState {
  enabled: boolean;
  lastUpdateTime?: number | null;
  error?: string;
}