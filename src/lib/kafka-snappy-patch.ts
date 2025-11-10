/**
 * Patch for KafkaJS to support Snappy compression
 * This registers Snappy compression codec with KafkaJS
 * 
 * IMPORTANT: This must be imported BEFORE any Kafka instances are created
 */

import * as snappy from 'snappy';
import { CompressionTypes, CompressionCodecs } from 'kafkajs';

try {
  // Register Snappy codec with KafkaJS
  // CompressionCodecs[type] should be a function that returns an object with compress/decompress methods
  // Snappy compression codec number is 2 (CompressionTypes.Snappy)
  (CompressionCodecs as any)[CompressionTypes.Snappy] = () => ({
    async compress(encoder: any) {
      const buffer = encoder.buffer.slice(encoder.start, encoder.offset);
      const compressed = await snappy.compress(buffer);
      return Buffer.from(compressed);
    },
    async decompress(buffer: Buffer) {
      const decompressed = await snappy.uncompress(buffer, { asBuffer: true });
      // Ensure we return a Buffer
      if (Buffer.isBuffer(decompressed)) {
        return decompressed;
      }
      return Buffer.from(decompressed);
    },
  });
  
  console.log('[SNAPPY-PATCH] ✓ Snappy compression codec registered with KafkaJS');
} catch (error) {
  console.error('[SNAPPY-PATCH] ❌ Error registering Snappy codec:', error);
  // Don't throw - allow the application to continue even if patch fails
  // The error will be caught when trying to read Snappy-compressed messages
}

export async function decompressSnappy(buffer: Buffer): Promise<Buffer> {
  try {
    const decompressed = await snappy.uncompress(buffer, { asBuffer: true });
    // Ensure we return a Buffer
    if (Buffer.isBuffer(decompressed)) {
      return decompressed;
    }
    return Buffer.from(decompressed);
  } catch (error) {
    console.error('Error decompressing Snappy:', error);
    throw error;
  }
}

