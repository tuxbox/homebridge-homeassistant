/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
//export class LockPlatformAccessory {
//
//  protected readonly log : Logger;
//  protected service: Service;
//  protected readonly configuration: ActorConfiguration;
//
//  protected currentState : string;
//  protected targetState : CharacteristicValue;
//
//  constructor(
//    protected readonly platform: HomebridgeMqttPlatform,
//    protected accessory: PlatformAccessory<AccessoryContext<string, ActorConfiguration>>,
//  ) {
//    this.log = platform.log;
//    this.configuration = accessory.context.configuration;
//    this.currentState = this.initialValue();
//    this.service = this.createService();
//    this.targetState = platform.Characteristic.LockTargetState.UNKNOWN;
//  }
//
//  protected initialValue() : string {
//    return this.accessory.context.__persisted_state || 'unknown';
//  }
//
//  protected createService() : Service {
//    return this.accessory.getService(this.platform.Service.LockMechanism) ||
//            this.accessory.addService(this.platform.Service.LockMechanism);
//  }
//
//  protected configureLock() {
//    this.log.debug(`[CONTEXT] ${JSON.stringify(this.accessory.context)}`);
//    // set accessory information
//    this.platform.log.debug(JSON.stringify(this.configuration));
//    this.accessory.getService(this.platform.Service.AccessoryInformation)!
//      .setCharacteristic(this.platform.Characteristic.Manufacturer, this.configuration.manufacturer || 'Homebridge Homeassistant')
//      .setCharacteristic(this.platform.Characteristic.Model, this.configuration.model || 'Homebridge Homeassistant')
//      // eslint-disable-next-line max-len
//      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.configuration.serial_number || 'dcbac663-04b2-42ae-ae03-3afd23037f93');
//    this.service = this.createService();
//    // set the service name, this is what is displayed as the default name on the Home app
//    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
//    this.service.setCharacteristic(this.platform.Characteristic.Name, this.configuration.name);
//    this.updateCharacteristic(this.currentState);
//
//    this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState)
//      .onGet(this.handleHomekitCurrentStateGet.bind(this));
//    this.service.getCharacteristic(this.platform.Characteristic.LockTargetState)
//      .onGet(this.handleHomekitTargetStateGet.bind(this))
//      .onSet(this.handleHomekitTargetStateSet.bind(this));
//
//    this.log.info(`Receiving Events on ${Events.MqttMessageReceived}:${this.configuration.state_topic}`);
//    EventEmitter.on(`${Events.MqttMessageReceived}:${this.configuration.state_topic}`, ((payload : Payload) => {
//      this.log.debug(`Handling MQTT state update for accessory ${this.accessory.displayName}`);
//      //##const value = this.renderValue(payload);
//      //##this.currentState = this.convertStatePayloadToStateValue(value);
//      const data : ActorStatePayload = JSON.parse(payload.payload);
//      this.log.debug(`[DEBUG] - ${payload.topic} - ${JSON.stringify(data)}`);
//      if (this.currentState === data.value) {
//        this.log.debug(`Skipping update, incoming message has no update - current value: ${this.currentState} - new value: ${data.value}`);
//      } else {
//        this.currentState = data.value;
//        this.accessory.context.__persisted_state = this.currentState;
//        this.log.info(JSON.stringify(this.accessory.context));
//        this.updateCharacteristic(this.currentState);
//      }
//    }).bind(this));
//  }
//
//  protected updateCharacteristic(value: string) {
//    const Characteristic = this.platform.Characteristic;
//    if (value === 'locked') {
//      this.service.updateCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
//    } else if (value === 'unlocked') {
//      this.service.updateCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.UNSECURED);
//    } else {
//      this.service.updateCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.UNKNOWN);
//    }
//  }
//
//  async handleHomekitCurrentStateGet() : Promise<string> {
//    return this.currentState!;
//  }
//
//  async handleHomekitTargetStateGet() : Promise<CharacteristicValue> {
//    return this.targetState;
//  }
//
//  async handleHomekitTargetStateSet(value : CharacteristicValue) {
//    this.log.debug('handleTargetStateSet -> ', value);
//    const Characteristic = this.platform.Characteristic;
//    Characteristic.LockTargetState.SECURED;
//    Characteristic.LockTargetState.UNSECURED;
//
//    const payload : ActorCommandPayload = {
//      'source': 'homebridge',
//      'type': 'lock',
//      'published_at': new Date().toUTCString(),
//      'value': value === Characteristic.LockTargetState.SECURED ? 'lock' : ((Characteristic.LockTargetState.UNSECURED) ?'unlock':'unknown'),
//    };
//    publishMessage({
//      topic: this.configuration.command_topic,
//      payload: JSON.stringify(payload),
//      opts: null,
//    });
//  }
//
//}
//