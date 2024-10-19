import { Service as HAPService, Characteristic as HAPCharacteristic } from 'hap-nodejs';
import { DynamicPlatformPlugin, Logger, PlatformAccessory, Service } from 'homebridge';
import { BasePlatformAccessory } from '../../base-accessory';
import { AccessoryConfiguration } from '../../accessory-configuration';
import { AccessoryContext } from '../../accessory-context';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class HumiditySensorPlatformAccessory<T extends AccessoryConfiguration, P extends DynamicPlatformPlugin>
  extends BasePlatformAccessory<number, T, P> {

  constructor(
    protected readonly platform: P,
    protected readonly accessory: PlatformAccessory<AccessoryContext<number, T>>,
    private readonly logger : Logger,
  ) {
    super(platform, accessory, logger);
  }

  override createService() : Service {
    return this.accessory.getService(HAPService.HumiditySensor) ||
            this.accessory.addService(HAPService.HumiditySensor);
  }

  override configureAccessory() {
    super.configureAccessory();
    this.service.getCharacteristic(HAPCharacteristic.CurrentRelativeHumidity)
      .onGet(this.handleHomekitCurrentStateGet.bind(this));
  }

  override updateCharacteristic(value: number) {
    this.log.info(`Updating Characteristic value for ${this.configuration.name} to ${value} (${typeof value})`);
    if (value === undefined || !(typeof value === 'number')) {
      this.log.warn(`Illegal value for Temperature Sensor received (${value}) - ${this.configuration.name}`);
    } else {
      this.service.updateCharacteristic(HAPCharacteristic.CurrentRelativeHumidity, value);
    }
  }

  protected override initialValue(): number {
    return this.accessory.context.__persisted_state || 0.0;
  }

}
