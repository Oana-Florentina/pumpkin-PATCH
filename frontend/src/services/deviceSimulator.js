let micStream = null;
let noiseLevel = null;
let currentHeartRate = 70;

const getHeartbeat = () => {
  currentHeartRate = Math.min(currentHeartRate + 0.5, 120);
  return Math.round(currentHeartRate);
};

const resetHeartRate = () => {
  currentHeartRate = 70;
};

const getNoiseLevel = () => noiseLevel;

const isMicrophoneEnabled = () => micStream !== null;

const startMicrophone = async () => {
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    ctx.createMediaStreamSource(micStream).connect(analyser);
    analyser.fftSize = 256;
    const data = new Uint8Array(analyser.frequencyBinCount);
    
    const update = () => {
      if (!micStream) return;
      analyser.getByteFrequencyData(data);
      noiseLevel = Math.round(20 + (data.reduce((a, b) => a + b) / data.length) * 0.4);
      requestAnimationFrame(update);
    };
    update();
    return true;
  } catch (e) {
    return false;
  }
};

const stopMicrophone = () => {
  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
    micStream = null;
  }
  noiseLevel = null;
};

export { getHeartbeat, resetHeartRate, getNoiseLevel, startMicrophone, stopMicrophone, isMicrophoneEnabled };
