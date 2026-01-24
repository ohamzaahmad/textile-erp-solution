
import React, { useState } from 'react';

interface CalendarProps {
  onClose: () => void;
}

const Calendar: React.FC<CalendarProps> = ({ onClose }) => {
  const [date, setDate] = useState(new Date());

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const changeMonth = (offset: number) => {
    const newDate = new Date(date.getFullYear(), date.getMonth() + offset, 1);
    setDate(newDate);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();
  const today = new Date();

  const renderDays = () => {
    const totalDays = daysInMonth(currentMonth, currentYear);
    const firstDay = firstDayOfMonth(currentMonth, currentYear);
    const cells = [];

    // Empty cells for the first week
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Day cells
    for (let i = 1; i <= totalDays; i++) {
      const isToday = i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
      cells.push(
        <div 
          key={i} 
          className={`h-10 flex items-center justify-center text-xs font-semibold rounded-full cursor-default transition-all duration-200 ${
            isToday ? 'bg-[#7d2b3f] text-white shadow-md' : 'text-slate-700 hover:bg-slate-100 hover:scale-110'
          }`}
        >
          {i}
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="absolute top-10 right-10 w-72 bg-white rounded-lg shadow-2xl border border-slate-300 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-4">
      <div className="bg-[#7d2b3f] p-3 flex justify-between items-center text-white text-xs font-bold">
        <span>HA FABRICS Calendar</span>
        <button onClick={onClose} className="hover:text-red-200 transition-all duration-200 hover:rotate-90"><i className="fas fa-times"></i></button>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => changeMonth(-1)} className="text-slate-400 hover:text-slate-800 transition-all duration-200 hover:scale-110"><i className="fas fa-chevron-left"></i></button>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <button onClick={() => changeMonth(1)} className="text-slate-400 hover:text-slate-800 transition-all duration-200 hover:scale-110"><i className="fas fa-chevron-right"></i></button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {days.map(day => (
            <div key={day} className="text-[10px] font-black text-slate-400 uppercase">{day[0]}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {renderDays()}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
           <span className="text-[10px] text-slate-400 font-bold uppercase">Today: {today.toLocaleDateString()}</span>
           <button onClick={() => setDate(new Date())} className="text-[10px] text-blue-600 font-bold hover:underline">Reset</button>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
