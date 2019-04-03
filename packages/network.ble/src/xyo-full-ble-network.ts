import { IXyoNetworkProvider, IXyoNetworkProcedureCatalogue, IXyoNetworkPipe } from '@xyo-network/network'
import { XyoClientBluetoothNetwork } from './xyo-client-ble-network'
import { XyoServerNetwork } from './xyo-server-ble-network'
import { XyoLogger } from '@xyo-network/logger';


export class XyoFullBleNetwork implements IXyoNetworkProvider {
    private logger = new XyoLogger(false, false)
    private server: XyoServerNetwork
    private client: XyoClientBluetoothNetwork

  constructor(client: XyoClientBluetoothNetwork, server: XyoServerNetwork) {
    this.server = server
    this.client = client
  }

  public async find(catalogue: IXyoNetworkProcedureCatalogue): Promise <IXyoNetworkPipe> {
    return new Promise((resolve, reject) => {
      let onServer = false
      let cycles = 0

      let interval: NodeJS.Timeout

      const tryLambda = () => {
        if (cycles != 0) {
          if (onServer) {
            this.client.stopServer()
          } else {
            this.server.stopServer()
          }
        }

        cycles++
        if (onServer) {
          this.server.find(catalogue).then((pipe) => {
            clearInterval(interval)
            resolve(pipe)
          })

          onServer = !onServer
        } else {
          this.client.find(catalogue).then((pipe) => {
            clearInterval(interval)
            resolve(pipe)
          })

          onServer = !onServer
        }  
      }

      interval = setInterval(tryLambda, 15000)
    })
  }

  public async stopServer(): Promise <void> {
    await this.client.stopServer()
    await this.server.stopServer()
  }
}   