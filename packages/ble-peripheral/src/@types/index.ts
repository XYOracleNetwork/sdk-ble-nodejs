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
  value: Buffer | undefined,
  descriptors?: IXyoMutableDescriptor[],
  notifyChanged: () => Promise<void>,
  addListener: (key: string, listener: IXyoMutableCharacteristicListener) => void,
  removeListener: (key: string) => void
}

export interface IXyoMutableCharacteristicListener {

  // todo find way to get device
  // onWrite?: (value: Buffer, device: IXyoPeripheral) => Promise<boolean>
  // onRead?: (value: Buffer, device: IXyoPeripheral) => Promise<boolean>

  onWrite?: (value: Buffer) => Promise<boolean>
  onRead?: () => void
}

export interface IXyoMutableService {
  uuid: string,
  characteristics: IXyoMutableCharacteristic[]
}

export interface IXyoBluetoothPeripheral {
  startAdvertising: (adv: Buffer, scanResponse: Buffer) => Promise<void>
  stopAdvertising: () => Promise<void>
}