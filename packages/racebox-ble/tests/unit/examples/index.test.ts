// Import all example tests to ensure they are included in the test suite
import './StandaloneRecordingScreen.test';
import './RealTimeDataDashboard.test';
import './DataDownloadManager.test';
import './UBXPacketParsing.test';
import './RecordingConfiguration.test';

describe('Example Tests Suite', () => {
  it('should have all example tests loaded', () => {
    // This test ensures all example test files are properly imported
    expect(true).toBe(true);
  });
}); 