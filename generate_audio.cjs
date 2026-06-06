const fs = require('fs');

// We will just create a tiny valid MP3 or WAV file.
// Let's create a minimal valid WAV file.
// A 1-second sine wave at 440 Hz (A4) 16-bit PCM 44100Hz.
const sampleRate = 44100;
const duration = 10;
const numSamples = sampleRate * duration;
const numChannels = 1;
const bytesPerSample = 2;
const blockAlign = numChannels * bytesPerSample;
const byteRate = sampleRate * blockAlign;
const dataSize = numSamples * blockAlign;
const chunkSize = 36 + dataSize;

const buffer = Buffer.alloc(44 + dataSize);

// RIFF chunk descriptor
buffer.write('RIFF', 0);
buffer.writeUInt32LE(chunkSize, 4);
buffer.write('WAVE', 8);

// fmt sub-chunk
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
buffer.writeUInt16LE(numChannels, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(byteRate, 28);
buffer.writeUInt16LE(blockAlign, 32);
buffer.writeUInt16LE(bytesPerSample * 8, 34);

// data sub-chunk
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

// Generate sine wave
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const sample = Math.sin(t * 440 * Math.PI * 2) * 32767 * 0.5; // 50% volume
  buffer.writeInt16LE(Math.floor(sample), 44 + i * 2);
}

fs.writeFileSync('public/audio/test.mp3', buffer); // It's actually a wav disguised as mp3, browsers handle this fine, or we can name it .wav
console.log("Audio generated at public/audio/test.mp3 (it is technically a WAV)");
