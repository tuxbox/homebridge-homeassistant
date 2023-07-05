import { CharacteristicValue, Service } from 'homebridge';
import { BaseActorPlatformAccessory } from './baseActorAccessory';
import { SwitchConfiguration } from '../../model/configuration/switch-confiugration';

export class SwitchPlatformAccessory extends BaseActorPlatformAccessory<string, CharacteristicValue, SwitchConfiguration> {

  protected override initialValue(): string {
    return 'off';
  }

  protected mapActorTypeToPayload(value: CharacteristicValue): string {
    let result = this.configuration.payload_off || 'off';
    if( value === true ) {
      result = this.configuration.payload_on || 'on';
    }
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

  protected updateCharacteristic(value: string) {
    if( value === this.configuration.state_off ) {
      this.service.updateCharacteristic(this.platform.Characteristic.On, false);
    } else if( value === this.configuration.state_on ) {
      this.service.updateCharacteristic(this.platform.Characteristic.On, true);
    } else {
      this.platform.log.warn('unknown state value');
      this.platform.log.debug(`state_on: ${this.configuration.state_on}`);
      this.platform.log.debug(`state_off: ${this.configuration.state_off}`);
      this.platform.log.debug(`actual state: ${value}`);
    }
  }

}