import { addListener } from "cluster";

export enum XyoMutablePermissions {
  READ,
  WRITE,
  NOTIFY,
  INDICATE
}

export interface IXyoPeripheral {
  id: string
}

export interface IXyoMutableDescriptor {
  uuid: string,
  permissions: XyoMutablePermissions[],
  value?: Buffer
}

export interface IXyoMutableCharacteristic  {
  uuid: string,
  permissions: XyoMutablePermissions[],
  value: Buffer,
  descriptors?: IXyoMutableDescriptor[],
  notifyChanged: () => Promise<void>,
  addListener: (key: string, listener: IXyoMutableCharacteristicListener) => void,
  removeListener: (key: string) => void
}

export interface IXyoMutableCharacteristicListener {
  onWrite: (value: Buffer, device: IXyoPeripheral) => void
}

export interface IXyoMutableService {
  uuid: string,
  characteristics: IXyoMutableCharacteristic[]
}