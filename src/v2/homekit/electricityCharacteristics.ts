import { Formats, Perms } from 'homebridge';
import {Characteristic, CharacteristicProps} from 'hap-nodejs';

export class TotalEnergyCharacteristic extends Characteristic {

  //private static readonly ID: string = 'E863F10C-079E-48FF-8F27-9C2605A29F52';

  constructor() {
    super('Total Energy', 'E863F10C-079E-48FF-8F27-9C2605A29F52', {
      'format': Formats.FLOAT,
      'unit': 'kWh',
      'minValue': 0.0,
      'minStep': 0.01,
      'perms': [
        Perms.PAIRED_READ, Perms.NOTIFY,
      ],
    });
    this.value = this.getDefaultValue();
  }

}

export class PowerCharacteristic extends Characteristic {

  //private static readonly ID: string = 'E863F10D-079E-48FF-8F27-9C2605A29F52';

  constructor() {
    super('Power', 'E863F10D-079E-48FF-8F27-9C2605A29F52', {
      'format': Formats.FLOAT,
      'unit': 'W',
      'minValue': 0.0,
      'minStep': 0.01,
      'perms': [
        Perms.PAIRED_READ, Perms.NOTIFY,
      ],
    });
    this.value = this.getDefaultValue();
  }

}

export class VoltageCharacteristic extends Characteristic {

  //public static readonly UUID: string = 'E863F10A-079E-48FF-8F27-9C2605A29F52';

  constructor() {
    super('Voltage', 'E863F10A-079E-48FF-8F27-9C2605A29F52', {
      'format': Formats.FLOAT,
      'unit': 'V',
      'minValue': 0.0,
      'minStep': 0.01,
      'perms': [
        Perms.PAIRED_READ, Perms.NOTIFY,
      ],
    });
    this.value = this.getDefaultValue();
  }

}

export class CurrentCharacteristic extends Characteristic {

  //public static readonly UUID: string = 'E863F126-079E-48FF-8F27-9C2605A29F52';

  constructor() {
    super('Current', 'E863F126-079E-48FF-8F27-9C2605A29F52', {
      'format': Formats.FLOAT,
      'unit': 'A',
      'minValue': 0.0,
      'minStep': 0.01,
      'perms': [
        Perms.PAIRED_READ, Perms.NOTIFY,
      ],
    });
    this.value = this.getDefaultValue();
  }

}