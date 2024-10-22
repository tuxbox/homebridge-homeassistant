import { Service as HAPService, Characteristic as HAPCharacteristic, CharacteristicValue } from 'hap-nodejs';
import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, Service, WithUUID } from 'homebridge';
import { AccessoryConfiguration } from '../../accessory-configuration';
import { AccessoryContext } from '../../accessory-context';
import { BasePlatformAccessory } from '../base-accessory';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class HumiditySensorPlatformAccessory<T extends AccessoryConfiguration, P extends DynamicPlatformPlugin>
  extends BasePlatformAccessory<T, P> {

  constructor(
    protected readonly platform: P,
    protected readonly api: API,
    protected readonly accessory: PlatformAccessory<AccessoryContext<T>>,
    protected readonly logger : Logger,
  ) {
    super(platform, api, accessory, logger);
  }

  override createService() : Service {
    return this.accessory.getService(HAPService.HumiditySensor) ||
            this.accessory.addService(HAPService.HumiditySensor);
  }

  protected initialValue(): CharacteristicValue {
    this.accessory.context.__persisted_state = this.accessory.context.__persisted_state || {};
    return this.accessory.context.__persisted_state[this.stateCharacteristic().UUID] || 0.0;
  }

  protected stateValueType(): string {
    return 'number';
  }

  protected stateCharacteristic(): WithUUID<new () => HAPCharacteristic> {
    return HAPCharacteristic.CurrentRelativeHumidity;
  }

}
