import {
  Characteristic as HAPCharacteristic,
  Service as HAPService,
} from 'hap-nodejs';
import { API, Characteristic, CharacteristicValue, DynamicPlatformPlugin, Logger, PlatformAccessory, Service, WithUUID } from 'homebridge';
import { AccessoryConfiguration } from '../../accessory-configuration';
import { BasePlatformAccessory } from '../base-accessory';
import { EventEmitter, Events } from '../../events/event-channel';
import { AccessoryContext } from '../../accessory-context';

export class SwitchAccessory<
  T extends AccessoryConfiguration,
  P extends DynamicPlatformPlugin
> extends BasePlatformAccessory<T, P> {

  constructor(
    protected readonly platform: P,
    protected readonly api: API,
    protected readonly accessory: PlatformAccessory<AccessoryContext<T>>,
    protected readonly logger : Logger,
  ) {
    super(platform, api, accessory, logger);
  }

  protected initialValue(): CharacteristicValue {
    return 0;
  }

  protected createService(): Service {
    return this.accessory.getService(HAPService.Switch) || this.accessory.addService(HAPService.Switch);
  }

  protected stateCharacteristic(): WithUUID<new () => Characteristic> {
    return HAPCharacteristic.On;
  }

  protected override postconfigureAccessory(): void {
    super.postconfigureAccessory();
    this.service.getCharacteristic(this.stateCharacteristic())
      .onSet(this.handleHomekitCurrentStateSet.bind(this));
  }

  async handleHomekitCurrentStateSet(value : CharacteristicValue) : Promise<void> {
    this.log.debug(`handleHomekitTargetStateSet - ${value} - ${typeof value}`);
    this.currentState = value;
    try {
      EventEmitter.emit(`${Events.PublishAccessoryState}:${this.accessory.UUID}`, {
        configuration: this.accessory.context.configuration,
        payload: {
          value,
        },
      });
    } catch (e) {
      this.log.error(JSON.stringify(e));
    }
  }

}