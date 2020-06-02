import { IXyoScan, IXyoBluetoothDevice, getIBeacon } from '../central'
import { createPipeFromDevice } from './ble-pipe'
import {
  XyoBase,
  IXyoBoundWitnessMutexDelegate
} from '@xyo-network/sdk-base-nodejs'
import { receiveProcedureCatalog } from './data/xyo-recive-catalog'
import {
  XyoOriginState,
  XyoSha256,
  XyoOriginPayloadConstructor,
  XyoZigZagBoundWitnessHander,
  XyoGenesisBlockCreator,
  XyoNetworkHandler,
  XyoBoundWitnessInserter,
  addAllDefaults,
  IXyoOriginBlockRepository,
  IXyoNetworkPipe,
  XyoMemoryBlockRepository
} from '@xyo-network/sdk-core-nodejs'
import bs58 from 'bs58'
import { NobleScan } from '../central/noble/noble-scan'
import { XyoRamOriginStateRepository } from './test/xyo-ram'
import { XyoMutexHandler } from './test/mutex'
import noble from '@s524797336/noble-mac'

export class XyoNode extends XyoBase {
  private tryingBw = false
  public blockRepository: IXyoOriginBlockRepository
  public state: XyoOriginState
  public hasher: XyoSha256
  public inserter: XyoBoundWitnessInserter
  public payloadProvider: XyoOriginPayloadConstructor
  public handler: XyoZigZagBoundWitnessHander
  public mutexHandler: IXyoBoundWitnessMutexDelegate
  private scanner: IXyoScan

  constructor(
    state: XyoOriginState,
    blockRepository: IXyoOriginBlockRepository,
    mutexHandler: IXyoBoundWitnessMutexDelegate,
    scanner: IXyoScan
  ) {
    super()
    this.blockRepository = blockRepository
    this.state = state
    this.mutexHandler = mutexHandler

    this.hasher = new XyoSha256()
    this.inserter = new XyoBoundWitnessInserter(
      this.hasher,
      this.state,
      this.blockRepository
    )
    this.payloadProvider = new XyoOriginPayloadConstructor(this.state)
    this.handler = new XyoZigZagBoundWitnessHander(this.payloadProvider)
    this.scanner = scanner

    addAllDefaults()
  }

  private handlePipe = async (pipe: IXyoNetworkPipe): Promise<void> => {
    this.logInfo('New bridge request!')

    if (!this.mutexHandler.acquireMutex()) {
      await pipe.close()
      return
    }

    try {
      const networkHandle = new XyoNetworkHandler(pipe)

      const boundWitness = await this.handler.boundWitness(
        networkHandle,
        receiveProcedureCatalog,
        this.state.getSigners()
      )

      if (boundWitness) {
        await this.inserter.insert(boundWitness)
      }
    } catch (error) {
      console.log('error bw', error)
      this.logWarning(`Error creating bound witness: ${error}`)
    }

    await pipe.close()
    this.mutexHandler.releaseMutex()
  }

  public async start(): Promise<boolean> {
    await this.scanner.startScan()

    if (this.state.getIndexAsNumber() === 0) {
      const genesisBlock = await XyoGenesisBlockCreator.create(
        this.state.getSigners(),
        this.payloadProvider
      )
      this.logInfo(
        `Created genesis block with hash: ${bs58.encode(
          genesisBlock
            .getHash(this.hasher)
            .getAll()
            .getContentsCopy()
        )}`
      )
      await this.inserter.insert(genesisBlock)
    }

    setInterval(async () => {
      const devices = this.scanner.getDevices().filter(device => {
        return this.isXyoCompatible(device)
      })

      console.log(`${devices.length} devices found`)

      if (devices.length > 0 && !this.tryingBw) {
        this.tryingBw = true
        console.log('trying to create pipe')
        const pipe = await createPipeFromDevice(devices[0])
        console.log('created pipe')

        await this.handlePipe(pipe)
        this.tryingBw = false
      }
    }, 5_000)

    return true
  }

  public isXyoCompatible(device: IXyoBluetoothDevice): boolean {
    const asIBeacon = getIBeacon(device.advertisement)

    if (asIBeacon == null) {
      return false
    }

    return (
      asIBeacon.uuid.toLocaleLowerCase() ===
      'd684352edf36484ebc982d5398c5593e'.toLocaleLowerCase()
    )
  }
}

const main = async (): Promise<void> => {
  const scanner = new NobleScan()
  const stateStore = new XyoRamOriginStateRepository()
  const state = new XyoOriginState(stateStore)
  const store = new XyoMemoryBlockRepository()
  const mutex = new XyoMutexHandler()

  const brige = new XyoNode(state, store, mutex, scanner)

  noble.on('stateChange', async (state: string) => {
    console.log(state)
    if (state === 'poweredOn') {
      await brige.start()
    }
  })
}

// this is used for temp testing
main()
