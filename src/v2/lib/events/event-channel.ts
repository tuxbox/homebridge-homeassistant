import { EventEmitter as NodeEventEmitter } from 'events';

export const EventEmitter = new NodeEventEmitter();
export const Events = {
  'ConfigureAccessory': 'configure:accessory',
  'RegisterAccessory': 'register:accessory',
  'UnregisterAccessory': 'unregister:accessory',
  'ObsoleteAccessory': 'obsolete:accessory',
  'AccessoryConfigured': 'configured:accessory',
  'UpdateAccessoryState': 'state:accessory:update',
  'UpdateAccessoryTargetState': 'state:accessory:target:update',
  'PublishAccessoryState': 'state:accessory:publish',
  'PublishAccessoryTargetState': 'state:accessory:target:publish',
};
