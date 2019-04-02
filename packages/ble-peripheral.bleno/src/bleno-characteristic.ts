
import { IXyoMutableCharacteristic, XyoMutablePermissions, IXyoMutableDescriptor, IXyoMutableCharacteristicListener } from '@xyo-network/ble-peripheral'
import { Characteristic, Bleno, Descriptor, CharacteristicOptions, Property } from 'bleno'
import bleno from 'bleno'
import { BlenoDescriptor } from './bleno-descriptor';
import { XyoLogger } from '@xyo-network/logger';


// uuid: string;
//         properties?: ReadonlyArray<Property> | null;
//         secure?: ReadonlyArray<Property> | null;
//         value?: Buffer | null;
//         descriptors?: ReadonlyArray<Descriptor> | null;
//         onIndicate?: (() => void) | null;
//         onNotify?: (() => void) | null;
//         onReadRequest?: ((
//             offset: number,
//             callback: (result: number, data?: Buffer) => void
//         ) => void) | null;
//         onSubscribe?: ((maxValueSize: number, updateValueCallback: any) => void) | null;
//         onUnsubscribe?: (() => void) | null;
//         onWriteRequest?: ((
//             data: Buffer,
//             offset: number,
//             withoutResponse: boolean,
//             callback: (result: number) => void
//         ) => void) | null;


export class BlenoCharacteristic implements IXyoMutableCharacteristic {
    private logger = new XyoLogger(false, false)
    private listenersMap: Map<string, IXyoMutableCharacteristicListener> = new Map<string, IXyoMutableCharacteristicListener>();
    private notifyChangedCallback : ((value: Buffer) => void) | undefined
    characteristic : Characteristic
    
    get uuid(): string {
        return this.characteristic.uuid
    }

    get permissions(): XyoMutablePermissions[] {
        // todo find way to get permissions
        return []
    }

    // value: (Buffer | undefined) = Buffer.alloc(2)

    get value():  Buffer | undefined {
        const value = this.characteristic.value

        if (value) {
            return value
        }

        return undefined
        
    }

    set value(value: (Buffer | undefined)) {
        if (value) {
            this.characteristic.value = value
        } else {
            this.characteristic.value = null
        }
    }

    get descriptors (): IXyoMutableDescriptor[] {
        const descs: IXyoMutableDescriptor[] = []

        this.characteristic.descriptors.forEach((desc: Descriptor) => {
            descs.push(new BlenoDescriptor(desc))
        })

        return descs
    }
        

    constructor(uuid: string, properties: Property[]) {
        const options: CharacteristicOptions = {
            uuid,
            properties: properties,
            onWriteRequest: this.onWriteRequest,
            onSubscribe: this.onSubscribe,
            onReadRequest: this.onReadRequest,
            onUnsubscribe: this.onUnsubscribe
        }

        this.characteristic = new Characteristic(options)
    }


    private onSubscribe (maxValueSize: number, updateValueCallback: any) {
        this.logger.info("onSubscribe")
        this.notifyChangedCallback = updateValueCallback
    }

    private onUnsubscribe () {
        this.logger.info("onUnsubscribe")
        this.notifyChangedCallback = undefined
    }

    private async onWriteRequest(data: Buffer, offset: number, withoutResponse: boolean, callback: (result: number) => void) {
        this.logger.info("onWriteRequest")
        for (const [_, value] of this.listenersMap) {
            const handle = value.onWrite

            if (handle) {
                const canWrite = await handle(data)

                if (canWrite) {
                    this.characteristic.value = data
                    callback(Characteristic.RESULT_SUCCESS)
                } else {
                    callback(Characteristic.RESULT_UNLIKELY_ERROR)
                }

                return
            }
        }

        callback(Characteristic.RESULT_UNLIKELY_ERROR)
    }

    private onReadRequest (offset: number, callback: (result: number, data?: Buffer) => void) {
        this.logger.info("onReadRequest")
        for (const [_, value] of this.listenersMap) {
            const handle = value.onRead

            if (handle) {
                handle()
            }
        }

        const value = this.characteristic.value

        if (value) {
            callback(Characteristic.RESULT_SUCCESS, value)
            return
        }

        callback(Characteristic.RESULT_SUCCESS)
    }

    public async notifyChanged (): Promise<void> {
        this.logger.info("notifyChanged")
        const value = this.value

        if (this.notifyChangedCallback && value) {
            this.notifyChangedCallback(value)
        }
    }

    public addListener (key: string, listener: IXyoMutableCharacteristicListener) {
        this.listenersMap.set(key, listener)
    }

    public removeListener (key: string) {
        this.listenersMap.delete(key)
    }

}