import { ActorConfiguration } from './actorConfiguration';

export type LockConfiguration = ActorConfiguration & {

  payload_unlock: string;
  payload_lock: string;
  state_unlocked: string;
  state_locked: string;
  command_topic: string;

};
