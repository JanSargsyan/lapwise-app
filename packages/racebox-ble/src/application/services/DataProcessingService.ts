import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, filter, bufferTime, scan, share, distinctUntilChanged } from 'rxjs/operators';
import { DataController } from '../controllers/DataController';
import { LiveDataMessage } from '../../domain/entities/LiveDataMessage';
import { Position, MotionData } from '../../domain/value-objects';
import { RaceBoxError } from '../../domain/types/RaceBoxError';

export interface DataStatistics {
  totalDataPoints: number;
  averageSpeed: number;
  maxSpeed: number;
  totalDistance: number;
  recordingDuration: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface DataProcessingConfig {
  statisticsWindowMs: number;
  qualityThreshold: number;
  enableRealTimeProcessing: boolean;
  enableDataAggregation: boolean;
}

export class DataProcessingService {
  // Data streams
  private readonly statisticsSubject = new BehaviorSubject<DataStatistics>({
    totalDataPoints: 0,
    averageSpeed: 0,
    maxSpeed: 0,
    totalDistance: 0,
    recordingDuration: 0,
    dataQuality: 'poor'
  });

  public readonly statistics$: Observable<DataStatistics>;
  public readonly realTimeStatistics$: Observable<DataStatistics>;

  // Configuration
  private config: DataProcessingConfig = {
    statisticsWindowMs: 5000,
    qualityThreshold: 0.8,
    enableRealTimeProcessing: true,
    enableDataAggregation: true
  };

  // State
  private dataBuffer: LiveDataMessage[] = [];
  private lastPosition?: Position;
  private recordingStartTime?: Date;

  constructor(private readonly dataController: DataController) {
    // Initialize streams
    this.statistics$ = this.statisticsSubject.asObservable().pipe(share());
    this.realTimeStatistics$ = this.setupRealTimeStatistics();

    // Set up data processing
    this.setupDataProcessing();
  }

  // Data processing setup
  private setupDataProcessing(): void {
    // Subscribe to live data for processing
    this.dataController.liveData$.subscribe({
      next: (data) => {
        this.processDataPoint(data);
      },
      error: (error) => {
        console.error('Data processing error:', error);
      }
    });
  }

  private setupRealTimeStatistics(): Observable<DataStatistics> {
    return this.dataController.liveData$.pipe(
      bufferTime(this.config.statisticsWindowMs),
      filter(buffer => buffer.length > 0),
      map(buffer => this.calculateStatistics(buffer)),
      share()
    );
  }

  // Data point processing
  private processDataPoint(data: LiveDataMessage): void {
    // Add to buffer
    this.dataBuffer.push(data);

    // Update recording start time if not set
    if (!this.recordingStartTime) {
      this.recordingStartTime = data.timestamp;
    }

    // Calculate distance if we have a previous position
    if (this.lastPosition) {
      const distance = this.calculateDistance(this.lastPosition, data.position);
      // Update total distance in statistics
    }

    // Update last position
    this.lastPosition = data.position;

    // Update statistics
    this.updateStatistics();
  }

  // Statistics calculation
  private calculateStatistics(data: LiveDataMessage[]): DataStatistics {
    if (data.length === 0) {
      return this.statisticsSubject.value;
    }

    const speeds = data.map(d => d.motion.speed.value);
    const averageSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
    const maxSpeed = Math.max(...speeds);

    const totalDistance = this.calculateTotalDistance(data);
    const recordingDuration = this.calculateRecordingDuration(data);
    const dataQuality = this.assessDataQuality(data);

    return {
      totalDataPoints: this.dataBuffer.length,
      averageSpeed,
      maxSpeed,
      totalDistance,
      recordingDuration,
      dataQuality
    };
  }

  private updateStatistics(): void {
    const statistics = this.calculateStatistics(this.dataBuffer);
    this.statisticsSubject.next(statistics);
  }

  // Distance calculation
  private calculateDistance(pos1: Position, pos2: Position): number {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = this.toRadians(pos1.latitude);
    const lat2Rad = this.toRadians(pos2.latitude);
    const deltaLat = this.toRadians(pos2.latitude - pos1.latitude);
    const deltaLon = this.toRadians(pos2.longitude - pos1.longitude);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private calculateTotalDistance(data: LiveDataMessage[]): number {
    let totalDistance = 0;
    
    for (let i = 1; i < data.length; i++) {
      const distance = this.calculateDistance(data[i - 1].position, data[i].position);
      totalDistance += distance;
    }

    return totalDistance;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Recording duration calculation
  private calculateRecordingDuration(data: LiveDataMessage[]): number {
    if (data.length === 0) return 0;

    const startTime = data[0].timestamp;
    const endTime = data[data.length - 1].timestamp;
    
    return (endTime.getTime() - startTime.getTime()) / 1000; // Duration in seconds
  }

  // Data quality assessment
  private assessDataQuality(data: LiveDataMessage[]): 'excellent' | 'good' | 'fair' | 'poor' {
    if (data.length === 0) return 'poor';

    const qualityScores = data.map(point => {
      let score = 1.0;

      // Check position accuracy
      if (point.position.accuracy > 10) score -= 0.3;
      else if (point.position.accuracy > 5) score -= 0.1;

      // Check GNSS fix status
      if (point.gnssStatus.fixStatus === 0) score -= 0.5;
      else if (point.gnssStatus.fixStatus === 2) score -= 0.2;

      // Check number of satellites
      if (point.gnssStatus.numSatellites < 6) score -= 0.2;
      else if (point.gnssStatus.numSatellites < 10) score -= 0.1;

      // Check PDOP
      if (point.gnssStatus.pdop > 5) score -= 0.2;
      else if (point.gnssStatus.pdop > 3) score -= 0.1;

      return Math.max(0, score);
    });

    const averageQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;

    if (averageQuality >= 0.9) return 'excellent';
    if (averageQuality >= 0.7) return 'good';
    if (averageQuality >= 0.5) return 'fair';
    return 'poor';
  }

  // Data filtering
  filterByQuality(minQuality: 'excellent' | 'good' | 'fair' | 'poor'): Observable<LiveDataMessage> {
    const qualityLevels = { 'excellent': 0.9, 'good': 0.7, 'fair': 0.5, 'poor': 0.3 };
    const minScore = qualityLevels[minQuality];

    return this.dataController.liveData$.pipe(
      filter(data => {
        const quality = this.assessDataQuality([data]);
        const qualityLevels = { 'excellent': 0.9, 'good': 0.7, 'fair': 0.5, 'poor': 0.3 };
        return qualityLevels[quality] >= minScore;
      })
    );
  }

  filterBySpeedRange(minSpeed: number, maxSpeed: number): Observable<LiveDataMessage> {
    return this.dataController.liveData$.pipe(
      filter(data => 
        data.motion.speed.value >= minSpeed && 
        data.motion.speed.value <= maxSpeed
      )
    );
  }

  // Data export
  exportStatistics(): DataStatistics {
    return this.statisticsSubject.value;
  }

  exportDataBuffer(): LiveDataMessage[] {
    return [...this.dataBuffer];
  }

  // Configuration
  updateConfig(config: Partial<DataProcessingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): DataProcessingConfig {
    return { ...this.config };
  }

  // Utility methods
  clearDataBuffer(): void {
    this.dataBuffer = [];
    this.lastPosition = undefined;
    this.recordingStartTime = undefined;
    this.updateStatistics();
  }

  getDataBufferSize(): number {
    return this.dataBuffer.length;
  }

  getCurrentStatistics(): DataStatistics {
    return this.statisticsSubject.value;
  }
} 