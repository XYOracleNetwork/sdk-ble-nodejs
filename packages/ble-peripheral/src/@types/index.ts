import { addListener, disconnect } from "cluster";

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

  onUnsubscribe?: () => void
  onSubscribe?: () => void
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
  addListener: (key: string, listener: IXyoBluetoothPeripheralListener) => void,
  removeListener: (key: string) => void
  disconnect(): Promise<void>
}

export interface IXyoBluetoothPeripheralListener {
  // todo find way to get device ids
  onConnect ?(): void,
  onDisconnect ?(): void
}