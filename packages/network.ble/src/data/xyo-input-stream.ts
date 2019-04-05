
export class XyoInputStream {
    private donePackets: Buffer[] = []
    private nextWaitingSize: number | undefined
    private currentBuffer: Buffer | undefined


    public addChunk(chunk: Buffer) {
        const currentBuffer = this.currentBuffer
        const nextWaitingSize = this.nextWaitingSize

        if (currentBuffer && nextWaitingSize) {
            this.currentBuffer = Buffer.concat([currentBuffer, chunk])
        } else {
            this.currentBuffer = chunk
        }

        this.checkSize()
        this.checkDone()
    } 

    public getOldestPacket (): Buffer | undefined {
        if (this.donePackets.length > 0) {
            const oldestPacket = this.donePackets[0]
            this.nextWaitingSize = undefined
            this.currentBuffer = undefined
            return oldestPacket
        }

        return undefined
    }

    private checkSize () {
        const currentBuffer = this.currentBuffer

        if (currentBuffer) {
            if (currentBuffer.length >= 4) {
                this.nextWaitingSize = currentBuffer.readUInt32BE(0)
            }
        }
    }

    private checkDone () {
        const waitingSize = this.nextWaitingSize
        const currentBuffer = this.currentBuffer

        if (waitingSize && currentBuffer) {
            if (waitingSize <= currentBuffer.length) {
                const donePacket = currentBuffer.slice(4, this.nextWaitingSize)
                this.donePackets.push(donePacket)
            }
        }
    }
}