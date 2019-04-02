
 export function chunkBytes(data: Buffer, maxSize: number): Buffer[] {
    const chunks: Buffer[] = []
    let currentIndex = 0

    while (currentIndex !== data.length) {
      const chunkSize = Math.min(maxSize, data.length - currentIndex)
      chunks.push(data.slice(currentIndex, currentIndex + chunkSize))
      currentIndex += chunkSize
    }

    return chunks
}
