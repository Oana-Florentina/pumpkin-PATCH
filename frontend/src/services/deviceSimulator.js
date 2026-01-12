const getHeartbeat = () => {
  const baseBPM = 70;
  const variation = Math.floor(Math.random() * 30);
  return baseBPM + variation;
};

const getAltitude = () => {
  const baseAltitude = 10;
  const variation = Math.floor(Math.random() * 50);
  return baseAltitude + variation;
};

const getNoiseLevel = () => {
  const baseNoise = 40;
  const variation = Math.floor(Math.random() * 40);
  return baseNoise + variation;
};

const getRoomSize = () => {
  const sizes = ['Small (8m²)', 'Medium (15m²)', 'Large (25m²)', 'Very Large (40m²)'];
  return sizes[Math.floor(Math.random() * sizes.length)];
};

export { getHeartbeat, getAltitude, getNoiseLevel, getRoomSize };
