import { Service } from 'hap-nodejs';

export class EveElgatoService extends Service {

  constructor(displayName: string | undefined, subtype?: string) {
    super(displayName, 'E863F007-079E-48FF-8F27-9C2605A29F52', subtype);
  }

}