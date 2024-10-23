import { API, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { Characteristic as HAPCharacteristic } from 'hap-nodejs';
import { MQTTPlatform } from './lib-mqtt/mqtt-platform';
import { AccessoryManagerPlatform } from './lib/platform';
import { EventEmitter } from './lib/events/event-channel';
import { Events } from './lib/events/event-channel';
import { MqttEvents, MqttMessage } from './lib-mqtt/mqtt-events';
import { AccessoryRegistration } from './lib/accessory-registration';

let ITotalEnergy;
let ICurrentPower;

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class HomebridgeMqttPlatform extends AccessoryManagerPlatform {

  public readonly Service: typeof Service = this.api.hap.Service;
  public Characteristic: typeof Characteristic & typeof ITotalEnergy & typeof ICurrentPower;
  private readonly mqtt : MQTTPlatform;
  private readonly accessoryRegistration : AccessoryRegistration<HomebridgeMqttPlatform>;
  private subscriptions = {};
  private stateDeDuplication = {};

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    super(log, config, api);
    this.mqtt = new MQTTPlatform(config, log);
    this.accessoryRegistration = new AccessoryRegistration(this, this.api, log);
    this.accessoryRegistration.setup();
  }

  protected override async onDidFinishLaunching(): Promise<void> {
    await super.onDidFinishLaunching();
    this.log.debug('Executed didFinishLaunching callback');
    this.log.info(`Configuration: ${JSON.stringify(this.config)}`);
    try {
      await this.mqtt.configure();
      EventEmitter.emit(MqttEvents.ConfigureMQTT, {
        ...this.config,
        configuration_topic: `${this.config.homebridgeConfigTopic}/#`,
      });
    } catch (e : unknown) {
      this.log.error(JSON.stringify(e));
    }
  }

  override setup() {
    super.setup();
    EventEmitter.on(Events.AccessoryConfigured, (async (payload) => {
      this.log.debug('Accessory configured');
      this.log.debug(JSON.stringify(payload));
    }).bind(this));
    EventEmitter.on(Events.ConfigureAccessory, async (payload) => {
      this.log.debug('Configure Accessory for platform');
      this.log.debug(`Payload: ${JSON.stringify(payload.payload)}`);
      this.log.debug(`Accessory Type: ${payload.accessory_type}`);
      this.log.debug(`Accessory: ${payload.accessory}`);
      const { accessory } = payload;
      if( payload.accessory_type === 'sensor' ) {
        const configuration = payload.payload;
        const topic = configuration['state_topic'];
        // TODO strongly type the payload
        EventEmitter.on(`${MqttEvents.MessageReceived}:${topic}`, (async (payload) => {
          this.log.debug(`Received message on topic ${topic}`);
          EventEmitter.emit(`${Events.UpdateAccessoryState}:${accessory.UUID}`, JSON.parse(payload.payload));
        }).bind(this));
        this.subscriptions[topic] = accessory.UUID;
        EventEmitter.emit(MqttEvents.SubscribeTopic, {
          topic,
        });
        EventEmitter.emit(Events.AccessoryConfigured, {
          'accessory_type': 'sensor',
          'accessory_id': accessory.UUID,
        });
      } else if (payload.accessory_type === 'lock' ) {
        const configuration = payload.payload;
        const state_topic = configuration['state_topic'];
        EventEmitter.on(`${MqttEvents.MessageReceived}:${state_topic}`, (async (payload) => {
          this.log.debug(`Handle lock state message on topic '${state_topic}'`);
          const content = JSON.parse(payload.payload);
          if( this.stateDeDuplication[state_topic] === undefined) {
            this.stateDeDuplication[state_topic] = {};
          }
          if( this.stateDeDuplication[state_topic] === content.value) {
            this.log.debug(`DeDuplicating state on topic '${state_topic}'`);
          } else {
            this.stateDeDuplication[state_topic] = content.value;
            if (configuration['sync_state_to_target_state'] === true) {
              EventEmitter.emit(`${Events.UpdateAccessoryTargetState}:${accessory.UUID}`, content);
            }
            EventEmitter.emit(`${Events.UpdateAccessoryState}:${accessory.UUID}`, content);
          }
        }).bind(this));
        EventEmitter.on(`${Events.PublishAccessoryTargetState}:${accessory.UUID}`, async (payload) => {
          this.log.debug(`consuming 'PublishAccessoryTargetState' - ${JSON.stringify(payload)}`);
          const configuration = payload.configuration;
          const content = payload.payload;
          content.readable_value = content.value === HAPCharacteristic.LockTargetState.UNSECURED ? 'unsecured' : 'secured';
          EventEmitter.emit(MqttEvents.PublishMessage, {
            topic: configuration['target_state_topic'],
            payload: JSON.stringify(content),
            opts: {},
          } as MqttMessage);
          const auto_lock_delay = configuration['auto_lock_delay'] || 3000;
          if(payload.payload.value === HAPCharacteristic.LockTargetState.UNSECURED ) {
            this.log.debug(`Unlocking lock - scheduling auto lock - ${auto_lock_delay}`);
            setTimeout(() => {
              this.log.debug('fireing auto lock event');
              const message = {
                ...payload,
              };
              message.payload.value = HAPCharacteristic.LockTargetState.SECURED;
              message.payload.readable_value = 'secured';
              EventEmitter.emit(Events.PublishAccessoryTargetState, message);
            }, auto_lock_delay);
          }
        });
        this.subscriptions[state_topic] = accessory.UUID;
        EventEmitter.emit(MqttEvents.SubscribeTopic, {
          'topic': state_topic,
        });
        EventEmitter.emit(Events.AccessoryConfigured, {
          'accessory_type': 'lock',
          'accessory_id': accessory.UUID,
        });
      } else if( payload.accessory_type === 'switch') {
        const configuration = payload.payload;
        const state_topic = configuration['state_topic'];
        const command_topic = configuration['command_topic'];
        EventEmitter.on(`${MqttEvents.MessageReceived}:${state_topic}`, (async (payload) => {
          this.log.debug('switch state');
          this.log.debug(JSON.stringify(payload));
          EventEmitter.emit(`${Events.UpdateAccessoryState}:${accessory.UUID}`, JSON.parse(payload.payload));
        }).bind(this));
        EventEmitter.on(`${Events.PublishAccessoryState}:${accessory.UUID}`, (async (payload) => {
          this.log.debug(`publish switch command to ${command_topic}`);
          EventEmitter.emit(`${MqttEvents.PublishMessage}`, {
            topic: command_topic,
            payload: JSON.stringify(payload.payload),
            opts: {},
            qos: 0,
            retain: false,
          } as MqttMessage);
        }).bind(this));
        this.subscriptions[state_topic] = accessory.UUID;
        EventEmitter.emit(MqttEvents.SubscribeTopic, {
          'topic': state_topic,
        });
        EventEmitter.emit(Events.AccessoryConfigured, {
          'accessory_type': 'lock',
          'accessory_id': accessory.UUID,
        });
      } else {
        this.log.debug(`unsupported accessory_type: ${payload.accessory_type}`);
      }
    });

    //ITotalEnergy = TotalEnergyCharacteristic;
    //ICurrentPower = PowerCharacteristic;
    //let x = Object.defineProperty(this.api.hap.Characteristic, 'TotalEnergy', {value: TotalEnergyCharacteristic});
    //x = Object.defineProperty(this.api.hap.Characteristic, 'Voltage', {value: VoltageCharacteristic});
    //x = Object.defineProperty(this.api.hap.Characteristic, 'Current', {value: CurrentCharacteristic});
    //this.Characteristic = Object.defineProperty(x, 'CurrentPower', {value: PowerCharacteristic});
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.log.debug(JSON.stringify(accessory.context));
    this.accessoryManager.configureAccessory(accessory);
  }

}
