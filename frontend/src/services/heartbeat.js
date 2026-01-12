const getHeartbeat = () => {
  const baseBPM = 70;
  const variation = Math.floor(Math.random() * 30);
  return baseBPM + variation;
};

export { getHeartbeat };
