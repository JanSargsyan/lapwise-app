import { DataRate } from "@/src/domain/model/racebox/DataRate";
import { RecordingFlags } from "@/src/domain/model/racebox/RecordingFlags";

export interface RecordingConfig {
    enable: boolean;
    dataRate: DataRate;
    flags: RecordingFlags;
    stationarySpeedThreshold: number;
    stationaryDetectionInterval: number;
    noFixDetectionInterval: number;
    autoShutdownInterval: number;
}