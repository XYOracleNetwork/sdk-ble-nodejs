import { IXyoNetworkProvider, IXyoNetworkProcedureCatalogue, IXyoNetworkPipe } from '@xyo-network/network'
import { XyoClientBluetoothNetwork } from './xyo-client-ble-network'
import { XyoServerNetwork } from './xyo-server-ble-network'
import { XyoLogger } from '@xyo-network/logger';
import { XyoBase } from '@xyo-network/base';


export class XyoFullBleNetwork implements IXyoNetworkProvider {
    private logger = new XyoLogger(false, false)
    private server: XyoServerNetwork
    private client: XyoClientBluetoothNetwork
    private resumedOnServer = true
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

  private getRandomInterval (): number {
    return 30_000 + (Math.random() * 30_000)
  }

  public async find(catalogue: IXyoNetworkProcedureCatalogue): Promise <IXyoNetworkPipe> {
    var found = false

    this.clientHandle(false)
    this.serverHandle(false)

    while (!found) {
      await this.delay(2_500)
      this.serverHandle(true)
      await this.delay(2_500)
      const pipeFromServer = await this.server.findWithTimeout(this.getRandomInterval())

      if (pipeFromServer) {
        found = true
        this.resumedOnServer = true
        return pipeFromServer
      }

      this.serverHandle(false)
      await this.delay(2_500)
      this.clientHandle(true)
      await this.delay(2_500)

      const pipeFromClient = await this.client.findWithTimeout(this.getRandomInterval() / 2)

      if (pipeFromClient) {
        found = true
        this.resumedOnServer = false
        return pipeFromClient
      }

      this.clientHandle(false)
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