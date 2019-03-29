export interface IXyoAdvertisement {
    localName: string
    txPowerLevel: number
    manufacturerData: Buffer
    serviceUuids: string[]
    serviceData: Array<IXyoServiceData>
  }

  export interface IXyoServiceData {
      uuid: string,
      data: Buffer
  }

  export interface IXyoBluetoothDevice {
    lastSeen: number
    id: string
    uuid: string
    connectable: boolean
    advertisement: IXyoAdvertisement
    rssi: number
    services: IXyoService[]
    state: 'error' | 'connecting' | 'connected' | 'disconnecting' | 'disconnected'
  
    connect(): Promise<void>
    disconnect(): Promise<void>
    updateRssi(): Promise<number>
    discoverServicesForUuids(serviceUUIDs: string[]): Promise<IXyoService[]>
    discoverServices(): Promise<IXyoService[]>
  }
  
  export interface IXyoCharacteristic {
    uuid: string
    name: string
    type: string
    properties: string[]
    descriptors: IXyoDescriptor[]
  
    read(): Promise<Buffer>
    write(value: Buffer): Promise<void>
    discoverDescriptors(): Promise<IXyoDescriptor[]>
    subscribe(): Promise<void>
    unsubscribe(): Promise<void>
  
    on(event: "notification", listener: (data: Buffer, isNotification: boolean) => void): this
  }
  
  export interface IXyoDescriptor {
    uuid: string
    name: string
    type: string
  
    readValue(): Promise<Buffer>
    writeValue(value: Buffer): Promise<void>
  }

  export interface IXyoIBeacon {
    major: number
    minor: number
    uuid: string
    powerLevel: number
  }
  
  export interface IXyoScan {
    startScan (): Promise<void>
    stopScan (): Promise<void>
    getDevices (): IXyoBluetoothDevice[]
  }

  export interface IXyoService {
    uuid: string
    name: string
    type: string
    characteristics: IXyoCharacteristic[]
  
    discoverCharacteristics(): Promise<IXyoCharacteristic[]>
  }
  
  