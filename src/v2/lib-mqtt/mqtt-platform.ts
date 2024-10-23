import { AsyncMqttClient, connectAsync, IClientOptions } from 'async-mqtt';
import { Logger, PlatformConfig } from 'homebridge';
import { v4 as uuid } from 'uuid';

import { EventEmitter, Events } from '../lib/events/event-channel';
import { MqttCancelSubscription, MqttConfiguration, MqttEvents, MqttMessage, MqttSubscription } from './mqtt-events';

/**
 *
 */
export class MQTTPlatform {

  private client : AsyncMqttClient | null = null;
  private subscriptions : string[] = [];

  /**
   *
   * @param configuration
   * @param log
   */
  constructor(private readonly configuration : PlatformConfig, private readonly log : Logger) {
  }

  /**
   *
   */
  async configure() {
    this.log.info('Configuring MQTTPlatform');
    EventEmitter.on(MqttEvents.ConfigureMQTT, async (payload: MqttConfiguration) => {
      this.log.debug(`MQTT Configuration - ${JSON.stringify(payload)}`);
      this.log.info(`Configure and connect to MQTT broker ${payload.host} with user ${payload.username}`);
      try {
        this.client = await connectAsync(`${this.configuration.protocol}://${this.configuration.host}:${this.configuration.port}`, {
          username: this.configuration.username,
          password: this.configuration.password,
          keepalive: payload.keepalive || 10,
          clean: payload.clean_session || false,
          clientId : payload.client_id || uuid(),
        }, true);
        this.log.debug(`MQTT Client: ${this.client.connected}`);
        EventEmitter.on(MqttEvents.SubscribeTopic, (async (event : MqttSubscription) => {
          this.log.debug('Received MqttSubscribe Event');
          try {
            await this.subscribe(event.topic);
          } catch (e) {
            EventEmitter.emit(MqttEvents.MqttError, {
              'payload': e,
            });
          }
        }).bind(this));
        EventEmitter.on(MqttEvents.PublishMessage, (async (event : MqttMessage) => {
          this.log.debug('Received MqttPublish Event');
          this.log.debug(JSON.stringify(event));
          await this.publish(event.topic, event.payload, event.opts || {});
        }).bind(this));
        EventEmitter.on(MqttEvents.UnsubscribeTopic, (async (event: MqttCancelSubscription) => {
          this.log.debug('Received MqttUnsubscribe Event');
          try {
            await this.unsubscribe(event.topic);
          } catch(e) {
            EventEmitter.emit(MqttEvents.MqttError, {
              'payload': e,
            });
          }
        }).bind(this));
        this.client?.on('connect', () => {
          this.log.info('Connected to MQTT Broker');
          // eslint-disable-next-line max-len
          this.log.info(`connected to ${this.configuration.protocol}://${this.configuration.username}@${this.configuration.host}:${this.configuration.port}`);
        });
        this.client?.on('reconnect', () => {
          this.log.info('Reconnecting to MQTT Broker');
        });
        this.client?.on('close', () => {
          this.log.info('Closing MQTT connection');
        });
        this.client?.on('disconnect', () => {
          this.log.info('Disconnecting from MQTT Broker');
        });
        this.client?.on('message', async (topic, payload) => {
          if( topic !== null ) {
            if( topic.startsWith(`${this.configuration.homebridgeConfigTopic}/devices`) ) {
              this.log.info(`Received device configuration on topic ${topic}`);
              const json = JSON.parse(payload.toString('utf-8'));
              const eventPayload = {
                topic,
                payload: json,
              };
              if(topic.indexOf('/sensors/') > -1) {
                eventPayload['accessory_type'] = 'sensor';
              } else if (topic.indexOf('/locks/') > -1) {
                eventPayload['accessory_type'] = 'lock';
              } else if( topic.indexOf('/switches/') > -1) {
                eventPayload['accessory_type'] = 'switch';
              } else {
                eventPayload['accessory_type'] = 'unknown';
              }
              EventEmitter.emit(Events.RegisterAccessory, eventPayload);
            } else {
              this.log.info(`Received event message in ${topic}`);
              this.log.debug(`Payload: ${payload.toString()}`);
              EventEmitter.emit(`${MqttEvents.MessageReceived}:${topic}`, {
                topic,
                payload: payload.toString(),
              });
            }
          } else {
            this.log.warn('Received a message but topic was not set');
          }
        });
        this.log.debug(`Subscribing to topic ${payload.configuration_topic}`);
        EventEmitter.emit(MqttEvents.SubscribeTopic, {
          'topic': payload.configuration_topic,
        } as MqttSubscription);
      } catch(e) {
        EventEmitter.emit(MqttEvents.MqttError, {
          'payload': e,
        });
      }
    });
  }

  /**
   *
   * @param topic
   */
  private async subscribe(topic : string) {
    this.log.debug(`Subscribing to topic ${topic}`);
    if( this.subscriptions.find((e) => e === topic) !== null ) {
      await this.client?.subscribe(topic);
      this.subscriptions.push(topic);
    } else {
      this.log.info(`Already subscribed to ${topic}`);
    }
  }

  /**
   *
   * @param topics
   */
  private async unsubscribe(topics : string | string[]) {
    this.log.debug(`Unsubscribing from topics ${topics}`);
    if( topics !== null ) {
      if( typeof topics === 'string' || topics.length > 0 ) {
        await this.client?.unsubscribe(topics);
        const x = typeof topics === 'string' ? [topics] : topics;
        this.subscriptions = this.subscriptions.filter((e) => x.find((f) => f === e) == null);
      } else {
        this.log.debug('topics list was empty - no unsubscribe');
      }
    } else {
      this.log.debug('topics provided was null');
    }
  }

  /**
   *
   * @param topic
   * @param payload
   */
  private async publish(topic: string, payload: string, opts: IClientOptions) {
    this.log.debug(`Publish data to topic ${topic}`);
    this.log.debug(`payload: ${payload?.toString()}`);
    await this.client?.publish(topic, payload, opts);
  }

}
