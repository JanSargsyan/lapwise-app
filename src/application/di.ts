import { graph, singleton, provides, ObjectGraph } from 'react-obsidian';
import { BleManager } from 'react-native-ble-plx';

@singleton() @graph()
export class ApplicationGraph extends ObjectGraph {

    @provides()
    bleManager(): BleManager {
        return new BleManager();
    }
}