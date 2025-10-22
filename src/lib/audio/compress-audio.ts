/**
 * Audio Compression Utility
 * Converts WebM/Opus audio to compressed MP3
 */

interface CompressionOptions {
  bitrate?: number; // kbps (default: 64 for voice)
  sampleRate?: number; // Hz (default: 22050 for voice)
}

export async function compressAudioToMP3(
  audioBlob: Blob,
  options: CompressionOptions = {}
): Promise<{ blob: Blob; originalSize: number; compressedSize: number }> {
  const { bitrate = 64, sampleRate = 22050 } = options;

  try {
    console.log('🎵 Starting audio compression to MP3...');
    console.log(`  Original size: ${(audioBlob.size / 1024).toFixed(2)} KB`);

    // 1. Decode WebM to PCM audio data
    const audioContext = new ((window as any).AudioContext ||
      (window as any).webkitAudioContext)();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    console.log(`  Duration: ${audioBuffer.duration.toFixed(2)}s`);
    console.log(`  Original sample rate: ${audioBuffer.sampleRate}Hz`);

    // 2. Resample to lower rate for voice (22.05kHz is fine for voice)
    const offlineContext = new OfflineAudioContext(
      1, // mono
      Math.ceil(audioBuffer.duration * sampleRate),
      sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();

    console.log(`  Resampling to ${sampleRate}Hz mono...`);
    const resampledBuffer = await offlineContext.startRendering();

    // 3. Get PCM data
    const pcmData = resampledBuffer.getChannelData(0);

    // 4. Convert float32 PCM to int16
    const int16Data = new Int16Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      const s = Math.max(-1, Math.min(1, pcmData[i]));
      int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    console.log(`  Encoding to MP3 at ${bitrate}kbps...`);

    // 5. Encode to MP3 using lamejs
    const lamejs = await import('lamejs');
    const mp3encoder = new (lamejs as any).Mp3Encoder(1, sampleRate, bitrate);
    const mp3Data: Int8Array[] = [];

    const sampleBlockSize = 1152; // LAME block size
    for (let i = 0; i < int16Data.length; i += sampleBlockSize) {
      const sampleChunk = int16Data.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }

    // Flush remaining data
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    // 6. Create MP3 blob
    const mp3Blob = new Blob(mp3Data, { type: 'audio/mpeg' });

    const reduction = ((audioBlob.size - mp3Blob.size) / audioBlob.size) * 100;

    console.log('✅ Audio Compression Complete:');
    console.log(
      `  Original: ${(audioBlob.size / 1024).toFixed(2)} KB (${audioBlob.type})`
    );
    console.log(`  Compressed: ${(mp3Blob.size / 1024).toFixed(2)} KB (MP3)`);
    console.log(`  Reduction: ${reduction.toFixed(1)}%`);

    return {
      blob: mp3Blob,
      originalSize: audioBlob.size,
      compressedSize: mp3Blob.size,
    };
  } catch (error) {
    console.error('❌ Error compressing audio:', error);
    throw new Error('Failed to compress audio to MP3');
  }
}


