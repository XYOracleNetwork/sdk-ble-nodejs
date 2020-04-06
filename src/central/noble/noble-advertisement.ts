import { IXyoAdvertisement, IXyoServiceData } from '../'
import noble from '@xyo-network/noble'

export class NobleAdvertisement implements IXyoAdvertisement {
  public advertisement: noble.Advertisement

  get localName(): string {
    return this.advertisement.localName
  }

  get txPowerLevel(): number {
    return this.advertisement.txPowerLevel
  }

  get manufacturerData(): Buffer {
    return this.advertisement.manufacturerData
  }

  get serviceUuids(): string[] {
    return this.advertisement.serviceUuids
  }

  get serviceData(): Array<IXyoServiceData> {
    return this.advertisement.serviceData as IXyoServiceData[]
  }

  constructor(advertisement: noble.Advertisement) {
    this.advertisement = advertisement
  }
}
