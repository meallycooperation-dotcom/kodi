import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
        const weeks = [];
        let currentWeek = Array(7).fill(null);
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
        setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };
    const goToNextMonth = () => {
        setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };
    const isToday = (dayNumber) => {
        if (dayNumber === null)
            return false;
        return (dayNumber === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear());
    };
    return (_jsxs("div", { className: "calendar", children: [_jsxs("div", { className: "calendar__header", children: [_jsx("button", { type: "button", onClick: goToPrevMonth, children: "\u2039" }), _jsx("strong", { children: monthLabel }), _jsx("button", { type: "button", onClick: goToNextMonth, children: "\u203A" })] }), _jsxs("div", { className: "calendar__grid", children: [weekdayLabels.map((day) => (_jsx("span", { className: "calendar__weekday", children: day }, day))), weeks.flat().map((day, index) => (_jsx("span", { className: `calendar__cell ${day === null ? 'calendar__cell--empty' : ''} ${isToday(day) ? 'calendar__cell--today' : ''}`, children: day ?? '' }, `${day ?? 'empty'}-${index}`)))] })] }));
};
export default Calendar;
