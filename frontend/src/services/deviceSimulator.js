let micStream = null;
let noiseLevel = null;

const getHeartbeat = () => 70 + Math.floor(Math.random() * 30);

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

export { getHeartbeat, getNoiseLevel, startMicrophone, stopMicrophone, isMicrophoneEnabled };
