/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { IXyoOriginStateRepository, XyoStructure, IXyoSigner} from '@xyo-network/sdk-core-nodejs'
// import { IXyoFileOriginState } from '../persist/xyo-file-origin-state-repository'
/*
interface IXyoFileOriginState {
  index: string | undefined
  previousHash: string | undefined
  signers: string[]
}
*/

export class XyoRamOriginStateRepository implements IXyoOriginStateRepository {
  private indexCache: XyoStructure | undefined
  private previousHashCache: XyoStructure | undefined
  private signersCache: IXyoSigner[] = []

  public addSigner(signer: IXyoSigner) {
    this.signersCache.push(signer)
  }

  public removeOldestSigner() {
    if (this.signersCache.length > 0) {
      this.signersCache.shift()
    }
  }

  public putIndex(index: XyoStructure): void {
    this.indexCache = index
  }

  public putPreviousHash(previousHash: XyoStructure): void {
    this.previousHashCache = previousHash
  }

  public getIndex(): XyoStructure | undefined {
    return this.indexCache
  }

  public getPreviousHash(): XyoStructure | undefined {
    return this.previousHashCache
  }

  public getSigners(): IXyoSigner[] {
    if (this.signersCache) {
      return this.signersCache
    }

    return []
  }

  public commit(): Promise<void> {
    return new Promise((resolve, reject) => {
      resolve()
    })
  }
}