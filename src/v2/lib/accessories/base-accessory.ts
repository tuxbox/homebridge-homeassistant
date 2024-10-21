import { CharacteristicValue, Characteristic as HAPCharacteristic, Service as HAPService } from 'hap-nodejs';
import { Service, PlatformAccessory, Logger, DynamicPlatformPlugin, API, WithUUID } from 'homebridge';
import { AccessoryConfiguration } from '../accessory-configuration';
import { AccessoryContext } from '../accessory-context';
import { EventEmitter, Events } from '../events/event-channel';
import { AccessoryState } from '../accessory-state';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export abstract class BasePlatformAccessory<
  Configuration extends AccessoryConfiguration,
  Platform extends DynamicPlatformPlugin> {

  protected readonly configuration: Configuration;
  protected service: Service;
  protected currentState : CharacteristicValue;

  constructor(
    protected readonly platform: Platform,
    protected readonly api: API,
    protected accessory: PlatformAccessory<AccessoryContext<Configuration>>,
    protected readonly log: Logger,
  ) {
    this.configuration = accessory.context.configuration;
    this.service = this.createService();
    this.currentState = this.initialValue();
  }

  protected abstract initialValue() : CharacteristicValue;

  protected abstract createService() : Service;

  protected abstract stateValueType() : string;

  protected abstract stateCharacteristic() : WithUUID<new () => HAPCharacteristic>;

  public configureAccessory() {
    this.log.debug('configureAccessory');
    this.preconfigureAccessory();
    this.log.debug(JSON.stringify(this.configuration));
    const model = (this.configuration.model === undefined || this.configuration.model.length < 2) ? undefined : this.configuration.model;
    this.accessory.getService(HAPService.AccessoryInformation)!
      .setCharacteristic(HAPCharacteristic.Manufacturer, this.configuration.manufacturer || 'Homebridge')
      .setCharacteristic(HAPCharacteristic.Model, model || 'Homebridge Accessory')
      // eslint-disable-next-line max-len
      .setCharacteristic(HAPCharacteristic.SerialNumber, this.configuration.serial_number || 'dcbac663-04b2-42ae-ae03-3afd23037f93');
    this.service.getCharacteristic(this.stateCharacteristic())
      .onGet(this.handleHomekitCurrentStateGet.bind(this));
    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(HAPCharacteristic.Name, this.configuration.name);
    EventEmitter.on(`${Events.UpdateAccessoryState}:${this.accessory.UUID}`, (async (payload : AccessoryState) => {
      this.log.debug('UpdateAccessoryState Event handled');
      const stuff = payload.value;
      this.updateCharacteristic(this.stateCharacteristic(), stuff);
    }).bind(this));
    this.postconfigureAccessory();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected preconfigureAccessory() {
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected postconfigureAccessory() {
    this.log.debug(`postconfigureAccessory - ${this.currentState}`);
    this.updateCharacteristic(this.stateCharacteristic(), this.currentState);
  }

  public reconfigureAccessory(configuration: Configuration) {
    const currentConfiguration = this.accessory.context.configuration;
    if (currentConfiguration.last_changed === configuration.last_changed) {
      this.log.info('No update required - configuration unchanged');
      this.preReconfigureAccessory(false);
      this.doReconfigureAccessory(false, configuration);
      this.postReconfigureAccessory(false);
    } else {
      this.preReconfigureAccessory(false);
      this.doReconfigureAccessory(false, configuration);
      this.postReconfigureAccessory(false);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  protected preReconfigureAccessory(_updated: boolean) {
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected doReconfigureAccessory(updated: boolean, configuration: Configuration) {
    if(updated) {
      this.accessory.context.configuration = configuration;
      this.service.setCharacteristic(HAPCharacteristic.Name, this.configuration.name);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  protected postReconfigureAccessory(_updated: boolean) {
  }

  protected updateCharacteristic(characteristic: WithUUID<new () => HAPCharacteristic>, value: CharacteristicValue) {
    if (value === undefined || !(typeof value === this.stateValueType())) {
      this.log.warn(`Illegal value for Temperature Sensor received (${value}) - ${this.configuration.name}`);
    } else {
      this.log.info(`Updating Characteristic value for ${this.configuration.name} to ${value} (${typeof value})`);
      this.service.updateCharacteristic(characteristic.UUID, value);
      this.accessory.context.__persisted_state[this.stateCharacteristic().UUID] = value;
      this.currentState = value;
      this.api.updatePlatformAccessories([this.accessory]);
    }
  }

  async handleHomekitCurrentStateGet() : Promise<CharacteristicValue> {
    return this.currentState!;
  }

}
