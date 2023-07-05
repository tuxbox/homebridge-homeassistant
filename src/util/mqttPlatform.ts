import { AsyncMqttClient } from 'async-mqtt';
import { Logger, PlatformConfig } from 'homebridge';
import MQTT from 'async-mqtt';
import { EventEmitter, Events } from './eventChannel';
import { MqttPublishEvent } from '../model/mqtt/mqttPublishEvent';
import { MqttSubscribeEvent } from '../model/mqtt/mqttSubscribeEvent';

export class MQTTPlatform {

  private readonly topicRegEx = new RegExp('^([^/]+)/([^/]+)/(?:([^/]+)/)?config$');
  private client : AsyncMqttClient | null = null;


  constructor(private readonly configuration : PlatformConfig, private readonly log : Logger) {
  }

  async connect() {
    this.log.info(`Connecting to ${this.configuration.host}`);
    this.client = await MQTT.connectAsync(`${this.configuration.protocol}://${this.configuration.host}:${this.configuration.port}`, {
      username: this.configuration.username,
      password: this.configuration.password,
    }, true);
    // eslint-disable-next-line max-len
    this.log.info(`connected to ${this.configuration.protocol}://${this.configuration.username}@${this.configuration.host}:${this.configuration.port}`);
  }

  async setup() {
    this.log.info('registering MQTT message handler');
    this.client?.on('message', async (topic, payload) => {
      if( topic !== null ) {
        if( topic.startsWith(this.configuration.homeassistantBaseTopic) ) {
          const result = this.topicRegEx.exec(topic.substring(this.configuration.homeassistantBaseTopic.length+1));
          if( result ) {
            const deviceType = result[1];
            this.log.info(`Received configuration on topic '${topic}'`);
            if( payload !== null ) {
              try {
                const jsonPayload = JSON.parse(payload.toString());
                EventEmitter.emit(Events.ConfigureDevice, {
                  topic,
                  deviceType,
                  payload: jsonPayload,
                });
                //this.handleDeviceConfiguration(topic, jsonPayload as DeviceConfiguration);
              } catch (e: unknown) {
                this.log.error(`error handling payload on topic ${topic} - ${JSON.stringify(e)}`);
              }
            } else {
              this.log.warn('payload was empty');
            }
          } else {
            this.log.debug(`(unhandled configuration message received on topic ${topic}`);
          }
        } else {
          this.log.info(`Received event message in ${topic}`);
          this.log.debug(`Payload: ${payload.toString()}`);
          EventEmitter.emit(Events.MqttMessageReceived, {
            topic,
            payload: payload.toString(),
          });
          /*
          TODO
          const accessory = this.accessories.find(
            (accessory) => accessory.context.configuration.state_topic === topic ||
                            accessory.context.configuration.command_topic === topic,
          );
          if( accessory ) {
            if( topic === accessory?.context.configuration.state_topic ) {
              this.log.debug(`publishing event ${accessory.UUID}:set-current-state} for topic ${topic}`);
              EventEmitter.emit(`${accessory.UUID}:set-current-state`, { payload: payload.toString() } );
            } else if( topic === accessory.context.configuration.command_topic ) {
              this.log.debug(`publishing event ${accessory.UUID}:get-target-state} for topic ${topic}`);
              EventEmitter.emit(`${accessory.UUID}:get-target-state`, { payload: payload.toString() } );
            } else {
              this.log.warn(`have not found an accessory for topic ${topic}`);
            }
          } else {
            this.log.warn(`have not found an accessory for topic ${topic}`);
          }
          */
        }
      } else {
        this.log.warn('Received a message but topic was not set');
      }
    });
    EventEmitter.on(Events.MqttSubscribe, (async (event : MqttSubscribeEvent) => {
      this.log.debug('Received MqttSubscribe Event');
      await this.subscribe(event.topic);
    }).bind(this));
    EventEmitter.on(Events.MqttPublish, (async (event : MqttPublishEvent) => {
      this.log.debug('Received MqttPublish Event');
      await this.publish(event.topic, event.payload);
    }).bind(this));
  }

  private async subscribe(topic : string) {
    this.log.debug(`Subscribing to topic ${topic}`);
    this.client?.subscribe(topic);
  }

  private async publish(topic: string, payload: string) {
    this.log.debug(`Publish data to topic ${topic}`);
    this.log.debug(`payload: ${payload?.toString()}`);
    this.client?.publish(topic, payload);
  }

}