import { EventEmitter } from '../lib/events/event-channel';
import { MqttCancelSubscription, MqttEvents, MqttMessage, MqttSubscription } from './mqtt-events';

const publishMessage = async function(event : MqttMessage) {
  EventEmitter.emit(MqttEvents.PublishMessage, event);
};

const subscribeTopic = async function(event : MqttSubscription) {
  EventEmitter.emit(MqttEvents.SubscribeTopic, event);
};

const unsubscribeTopics = async function(event: MqttCancelSubscription) {
  EventEmitter.emit(MqttEvents.UnsubscribeTopic, event);
};

export { publishMessage, subscribeTopic, unsubscribeTopics };