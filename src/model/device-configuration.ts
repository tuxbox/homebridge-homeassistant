import { DeviceDetails } from './device-details';

export type DeviceConfiguration = {
  unique_id : string;
  state_topic: string;
  value_template: string;
  name: string;
  device: DeviceDetails | null;
};
