import { IXyoMutableCharacteristic, IXyoMutableCharacteristicListener, IXyoPeripheral, IXyoBluetoothPeripheral, IXyoBluetoothPeripheralListener } from '@xyo-network/ble-peripheral'
import { IXyoNetworkPipe, IXyoNetworkProvider, IXyoNetworkProcedureCatalogue, CatalogueItem, IXyoNetworkPeer } from '@xyo-network/network';
import { XyoCharacteristicHandle } from './xyo-characteristic-handle'
import { XyoAdvertisement } from './data/xyo-advertisement';
import { XyoLogger } from '@xyo-network/logger';
import { rejects } from 'assert';
import { XyoBase } from '@xyo-network/base';

export class XyoServerNetwork implements IXyoNetworkProvider {
    private currentDeviceId: string = ""
    private logger = new XyoLogger(false, false)
    private advData = new XyoAdvertisement(0, 0)
    private server: IXyoBluetoothPeripheral
    private deviceRouter: { [key:string]:XyoCharacteristicHandle; } = {};
    private pipeCharacteristic: IXyoMutableCharacteristic
    private onNewPipe: ((pipe: IXyoNetworkPipe) => void) | undefined

    private serverEndpoint: IXyoMutableCharacteristicListener = {
        onWrite: async (value: Buffer): Promise<boolean> => {
            // todo get device id here

            const deviceKey = "0"
            const handler = this.deviceRouter[deviceKey]

            if (handler) {
                handler.onWrite(value)
                return true
            }

            const peer: IXyoNetworkPeer = {
                getTemporaryPeerId: () => {
                    return Buffer.from(deviceKey)
                }
            }

            const firstSend = this.phraseFirstSend(value)
            this.currentDeviceId = deviceKey

            this.deviceRouter[deviceKey] = new XyoCharacteristicHandle(
                peer,
                firstSend, 
                this.pipeCharacteristic,
                this.closeHandler
            )

            const callback = this.onNewPipe

            if (callback) {
                callback(this.deviceRouter[deviceKey])
            }

            return true
        },

        onUnsubscribe: () => {
            delete this.deviceRouter[this.currentDeviceId]
        }
    }

    private serverListener: IXyoBluetoothPeripheralListener = {
        onConnect: () => {
            delete this.deviceRouter[this.currentDeviceId]
        },

        onDisconnect: () => {
            delete this.deviceRouter[this.currentDeviceId]
        }
    }

    constructor(pipeCharacteristic: IXyoMutableCharacteristic, server: IXyoBluetoothPeripheral) {
        this.pipeCharacteristic = pipeCharacteristic
        this.server = server
        pipeCharacteristic.addListener("server_xyo_main", this.serverEndpoint)
        this.server.addListener("server_xyo_main", this.serverListener)
    }

    private closeHandler = (id: string) => {
        this.logger.info("Closing pipe")
        delete this.deviceRouter[id]
    }

    public async findWithTimeout (timeoutInMills: number): Promise <IXyoNetworkPipe | undefined> {  
        return new Promise((resolve, reject) => {
            var hasResumed = false
            this.server.startAdvertising(this.advData.advertisementData(), this.advData.getScanResponse())
            this.logger.info("Find start for server")

            const onTimeout = async () => {
                if (!hasResumed) {
                    this.logger.info("Timeout for pipe")
                    this.onNewPipe = undefined
                    await this.server.stopAdvertising()
                    resolve(undefined)
                }
            }

            XyoBase.timeout(onTimeout, timeoutInMills)

            this.logger.info("Waiting for pipe")

            this.onNewPipe = async (pipe: IXyoNetworkPipe) => {
                this.logger.info("Resuming with pipe")
                hasResumed = true
                this.onNewPipe = undefined
                await this.server.stopAdvertising()
                resolve(pipe)
            }
        })
    }

    public async find(catalogue: IXyoNetworkProcedureCatalogue): Promise <IXyoNetworkPipe> { 
        this.logger.info("Find start for server")

        await this.server.startAdvertising(this.advData.advertisementData(), this.advData.getScanResponse())

        const result = await new Promise((resolve, reject) => {
            this.logger.info("Waiting for pipe")

            this.onNewPipe = (pipe: IXyoNetworkPipe) => {
                this.onNewPipe = undefined
                resolve(pipe)
            }
        }) as IXyoNetworkPipe

        await this.server.stopAdvertising()

        this.logger.info("Returning pipe")
        return result
    }

    private phraseFirstSend (buffer: Buffer): Buffer {
        return buffer.slice(4, buffer.length)
    }

    public async stopServer(): Promise <void> {
        this.logger.info("Stopping server")

        await this.server.stopAdvertising()
    }
}

