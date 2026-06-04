const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

function getBeijingDateParts(date: Date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    date: date.getUTCDate(),
    day: date.getUTCDay(),
    hour: date.getUTCHours(),
  };
}

export function getChinaLotterySalesDayWindow(now = new Date()) {
  const beijingNow = new Date(now.getTime() + BEIJING_OFFSET_MS);
  const current = getBeijingDateParts(beijingNow);
  const salesDayBase =
    current.hour < 11 ? new Date(Date.UTC(current.year, current.month, current.date - 1)) : beijingNow;
  const { year, month, date, day } = getBeijingDateParts(salesDayBase);
  const cutoffHour = day === 0 || day === 6 ? 23 : 22;

  return {
    start: new Date(Date.UTC(year, month, date, 11, 0, 0) - BEIJING_OFFSET_MS),
    end: new Date(Date.UTC(year, month, date + 1, 11, 0, 0) - BEIJING_OFFSET_MS),
    cutoffAt: new Date(Date.UTC(year, month, date, cutoffHour, 0, 0) - BEIJING_OFFSET_MS),
    cutoffHour,
  };
}

export const getBeijingDayPredictionWindow = getChinaLotterySalesDayWindow;
