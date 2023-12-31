import { CharacteristicValue, Service } from 'homebridge';
import { BaseActorPlatformAccessory } from './baseActorAccessory';
import { SwitchConfiguration } from '../../model/configuration/switch-confiugration';

export class SwitchPlatformAccessory extends BaseActorPlatformAccessory<boolean, CharacteristicValue, SwitchConfiguration> {

  protected override initialValue(): boolean {
    return false;
  }

  protected mapActorTypeToPayload(value: boolean): string {
    let result = this.configuration.payload_off || 'off';
    if( value === true ) {
      result = this.configuration.payload_on || 'on';
    }
    this.log.debug(`mapBooleanToPayload ${value} -> ${result}`);
    return result;
  }

  protected createService(): Service {
    return this.service = this.accessory.getService(this.platform.Service.Switch) ||
      this.accessory.addService(this.platform.Service.Switch);
  }

  protected configureSensor() {
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.handleHomekitCurrentStateGet.bind(this))
      .onSet(this.handleHomekitTargetStateSet.bind(this));
  }

  protected convertStatePayloadToStateValue(value: string): boolean {
    let result = false;
    const stateOff = this.configuration.payload_off || this.configuration.state_off || 'off';
    const stateOn = this.configuration.payload_on || this.configuration.state_on || 'on';
    if( value?.toString() === stateOff.toString() ) {
      result = false;
    } else if( value?.toString() === stateOn.toString() ) {
      result = true;
    } else {
      this.platform.log.warn('unknown state value');
      this.platform.log.debug(`state_on: ${stateOn}`);
      this.platform.log.debug(`state_off: ${stateOff}`);
      this.platform.log.debug(`actual state: ${value}`);
    }
    return result;
  }

  protected updateCharacteristic(value: boolean) {
    this.log.debug(`Updating switch value to -> ${value}`);
    this.service.updateCharacteristic(this.platform.Characteristic.On, value);
  }

}