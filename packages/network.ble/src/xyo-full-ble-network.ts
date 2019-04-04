import { IXyoNetworkProvider, IXyoNetworkProcedureCatalogue, IXyoNetworkPipe } from '@xyo-network/network'
import { XyoClientBluetoothNetwork } from './xyo-client-ble-network'
import { XyoServerNetwork } from './xyo-server-ble-network'
import { XyoLogger } from '@xyo-network/logger';
import { XyoBase } from '@xyo-network/base';


export class XyoFullBleNetwork implements IXyoNetworkProvider {
    private logger = new XyoLogger(false, false)
    private server: XyoServerNetwork
    private client: XyoClientBluetoothNetwork
    private serverHandle: (enable: boolean) => void
    private clientHandle: (enable: boolean) => void

  constructor(client: XyoClientBluetoothNetwork,
              server: XyoServerNetwork,
              clientHandle: (enable: boolean) => void,
              serverHandle: (enable: boolean) => void,) {
  
    this.clientHandle = clientHandle
    this.serverHandle = serverHandle
    this.server = server
    this.client = client
  }

  public async find(catalogue: IXyoNetworkProcedureCatalogue): Promise <IXyoNetworkPipe> {
    var found = false

    while (!found) {
      this.serverHandle(true)
      const pipeFromServer = await this.server.findWithTimeout(30_000)

      if (pipeFromServer) {
        found = true
        this.clientHandle(false)
        this.serverHandle(false)
        return pipeFromServer
      }

      this.serverHandle(false)
      this.clientHandle(true)

      await this.delay(5_000)

      const pipeFromClient = await this.client.findWithTimeout(30_000)

      if (pipeFromClient) {
        found = true
        this.clientHandle(false)
        this.serverHandle(false)
        return pipeFromClient
      }

      this.clientHandle(false)

      await this.delay(5_000)
    }

    throw new Error("Invalid state")
  }

  private delay (mills: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const onDone = () => {
        resolve()
      }

      XyoBase.timeout(onDone, mills)
    })
  }

  public async stopServer(): Promise <void> {
    await this.client.stopServer()
    await this.server.stopServer()
  }
}   