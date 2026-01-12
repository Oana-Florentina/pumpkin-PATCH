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

export { getHeartbeat, getAltitude };
