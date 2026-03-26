import { useMemo, useState } from 'react';

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Calendar = () => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const { weeks, monthLabel } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = Array(7).fill(null);
    let dayCounter = 1;
    const startOffset = firstDayOfMonth.getDay();

    for (let i = 0; i < startOffset; i += 1) {
      currentWeek[i] = null;
    }

    for (; dayCounter <= totalDays; dayCounter += 1) {
      const dayIndex = (startOffset + dayCounter - 1) % 7;
      currentWeek[dayIndex] = dayCounter;

      if (dayIndex === 6 || dayCounter === totalDays) {
        weeks.push(currentWeek);
        currentWeek = Array(7).fill(null);
      }
    }

    const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return { weeks, monthLabel };
  }, [currentDate]);

  const goToPrevMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const isToday = (dayNumber: number | null) => {
    if (dayNumber === null) return false;
    return (
      dayNumber === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="calendar">
      <div className="calendar__header">
        <button type="button" onClick={goToPrevMonth}>
          ‹
        </button>
        <strong>{monthLabel}</strong>
        <button type="button" onClick={goToNextMonth}>
          ›
        </button>
      </div>
      <div className="calendar__grid">
        {weekdayLabels.map((day) => (
          <span key={day} className="calendar__weekday">
            {day}
          </span>
        ))}
        {weeks.flat().map((day, index) => (
          <span
            key={`${day ?? 'empty'}-${index}`}
            className={`calendar__cell ${day === null ? 'calendar__cell--empty' : ''} ${
              isToday(day) ? 'calendar__cell--today' : ''
            }`}
          >
            {day ?? ''}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
