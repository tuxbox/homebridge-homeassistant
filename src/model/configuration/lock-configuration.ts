import { DeviceConfiguration } from './device-configuration';

export type LockConfiguration = DeviceConfiguration & {

  payload_unlock: string;
  payload_lock: string;
  state_unlocked: string;
  state_locked: string;
  command_topic: string;

};
