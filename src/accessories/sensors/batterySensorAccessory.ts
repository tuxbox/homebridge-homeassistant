import { CharacteristicValue, Service } from 'homebridge';
import { DeviceConfiguration } from '../../model/configuration/device-configuration';
import { BaseSensorPlatformAccessory } from './baseSensorAccessory';

export class BatterySensorPlatformAccessory extends BaseSensorPlatformAccessory<number, DeviceConfiguration> {

  protected initialValue(): number {
    return 100.0;
  }

  protected createService(): Service {
    return this.accessory.getService(this.platform.Service.Battery) ||
            this.accessory.addService(this.platform.Service.Battery);
  }

  protected configureSensor() {
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.configuration.name);
    this.service.getCharacteristic(this.platform.Characteristic.BatteryLevel)
      .onGet(this.handleHomekitCurrentStateGet.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.StatusLowBattery)
      .onGet(this.handleHomekitStatusLowBatteryGet.bind(this));
  }

  protected updateCharacteristic(value: number) {
    this.service.updateCharacteristic(this.platform.Characteristic.BatteryLevel, value);
  }

  protected async handleHomekitStatusLowBatteryGet() : Promise<CharacteristicValue> {
    return this.currentState < 15.0 ?
      this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW :
      this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
  }

}