function getTimeBasedAlerts(userPhobias = []) {
  const now = new Date();
  const hour = now.getHours();
  const month = now.getMonth(); // 0-11
  const dayOfWeek = now.getDay(); // 0-6 (Sunday-Saturday)
  const alerts = [];

  // Nighttime alert (Nyctophobia - fear of darkness)
  if (hour >= 20 || hour < 6) {
    alerts.push({
      type: 'info',
      title: 'Nighttime Alert',
      message: 'It\'s nighttime. Keep lights on if you have nyctophobia (fear of darkness).',
      trigger: 'time',
      source: 'System Time',
      timestamp: now.toISOString()
    });
  }

  // Morning medication reminder
  if (hour >= 7 && hour < 9) {
    alerts.push({
      type: 'info',
      title: 'Morning Reminder',
      message: 'Good morning! Don\'t forget to take your morning medication if prescribed.',
      trigger: 'time',
      source: 'System Time',
      timestamp: now.toISOString()
    });
  }

  // Evening medication reminder
  if (hour >= 18 && hour < 22) {
    alerts.push({
      type: 'info',
      title: 'Evening Reminder',
      message: 'Evening reminder: Take your medication and practice relaxation exercises.',
      trigger: 'time',
      source: 'System Time',
      timestamp: now.toISOString()
    });
  }

  // Spring season (March-May) - Pollen allergy
  if (month >= 2 && month <= 4) {
    alerts.push({
      type: 'warning',
      title: 'Spring Season Alert',
      message: 'Spring is here. Pollen levels may be high. Keep antihistamines ready.',
      trigger: 'seasonal',
      source: 'System Date',
      timestamp: now.toISOString()
    });
  }

  // Fall season (September-November) - Seasonal depression
  if (month >= 8 && month <= 10) {
    alerts.push({
      type: 'info',
      title: 'Fall Season Alert',
      message: 'Fall season. Days are getting shorter. Consider light therapy if you have seasonal affective disorder.',
      trigger: 'seasonal',
      source: 'System Date',
      timestamp: now.toISOString()
    });
  }

  // Weekend social events (Friday-Sunday)
  if (dayOfWeek >= 5 || dayOfWeek === 0) {
    alerts.push({
      type: 'info',
      title: 'Weekend Alert',
      message: 'It\'s the weekend. Prepare for potential social gatherings if you have social phobia.',
      trigger: 'time',
      source: 'System Date',
      timestamp: now.toISOString()
    });
  }

  // Workday morning (Monday-Friday, 7-9 AM)
  if (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 7 && hour < 9) {
    alerts.push({
      type: 'info',
      title: 'Workday Morning',
      message: 'Start your day with breathing exercises. You\'ve got this!',
      trigger: 'time',
      source: 'System Time',
      timestamp: now.toISOString()
    });
  }

  return alerts;
}

function getSeasonName() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
}

module.exports = {
  getTimeBasedAlerts,
  getSeasonName,
  getTimeOfDay
};
