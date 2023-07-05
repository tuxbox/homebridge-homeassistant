import { ActorConfiguration } from './actorConfiguration';

export type SwitchConfiguration = ActorConfiguration & {

  value_template: string;
  payload_on: string;
  payload_off: string;
  command_topic: string;
  state_on: string;
  state_off: string;

};