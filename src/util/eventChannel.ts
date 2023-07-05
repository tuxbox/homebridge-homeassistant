import { EventEmitter as NodeEventEmitter } from 'events';

export const EventEmitter = new NodeEventEmitter();
export const Events= {
  'ConfigureDevice': 'configure:device',
  'MqttSubscribe': 'mqtt:subscribe',
  'MqttPublish': 'mqtt:publish',
  'MqttMessageReceived': 'mqtt:message:received',
  'SetCurrentState': 'set-current-state',
  'GetTargetState': 'get-target-state',
  'SetTargetState': 'set-target-state',
};
