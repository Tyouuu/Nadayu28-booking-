import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';

// ==================== CUSTOM DATE PICKER ====================

interface DatePickerProps {
  value: string; // yyyy-MM-dd
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function CustomDatePicker({ value, onChange, required, className }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const today = new Date();
  const selected = value ? new Date(value + 'T00:00:00') : null;
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const selectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
  };

  const isToday = (day: number) =>
    viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();

  const isSelected = (day: number) =>
    selected && viewYear === selected.getFullYear() && viewMonth === selected.getMonth() && day === selected.getDate();

  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d < t;
  };

  const displayValue = selected
    ? `${selected.getDate()} ${MONTHS[selected.getMonth()].slice(0, 3)} ${selected.getFullYear()}`
    : '';

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      {required && <input type="text" required value={value} onChange={() => {}} className="sr-only" tabIndex={-1} />}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl font-medium text-base transition-all hover:border-gray-300 focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/10 outline-none text-left"
      >
        <Calendar size={18} className="text-gray-400 flex-shrink-0" />
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? displayValue : 'Select a date'}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[320px] bg-white border border-gray-200 rounded-2xl shadow-xl p-5 animate-fade-in">
          {/* Month/Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <h4 className="font-bold text-gray-900 text-sm">
              {MONTHS[viewMonth]} {viewYear}
            </h4>
            <button type="button" onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const sel = isSelected(day);
              const tod = isToday(day);
              const past = isPast(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={past}
                  onClick={() => selectDay(day)}
                  className={`
                    w-full aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all
                    ${sel
                      ? 'bg-[#111111] text-white shadow-lg'
                      : tod
                        ? 'bg-[#C8FF00] text-[#111111] font-bold'
                        : past
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const m = String(today.getMonth() + 1).padStart(2, '0');
                const d = String(today.getDate()).padStart(2, '0');
                onChange(`${today.getFullYear()}-${m}-${d}`);
                setOpen(false);
              }}
              className="text-xs font-bold text-[#111111] bg-[#C8FF00] px-3 py-1.5 rounded-lg hover:bg-[#b8ef00] transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


// ==================== CUSTOM TIME PICKER ====================

interface TimePickerProps {
  value: string; // HH:mm
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export function CustomTimePicker({ value, onChange, required, className }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  const [selHour, setSelHour] = useState(() => value ? parseInt(value.split(':')[0]) : -1);
  const [selMinute, setSelMinute] = useState(() => value ? parseInt(value.split(':')[1]) : -1);

  useEffect(() => {
    if (value) {
      setSelHour(parseInt(value.split(':')[0]));
      setSelMinute(parseInt(value.split(':')[1]));
    }
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open) {
      // scroll to selected items
      setTimeout(() => {
        if (hourRef.current && selHour >= 0) {
          const el = hourRef.current.querySelector(`[data-hour="${selHour}"]`);
          el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        if (minuteRef.current && selMinute >= 0) {
          const el = minuteRef.current.querySelector(`[data-minute="${selMinute}"]`);
          el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 50);
    }
  }, [open]);

  const confirmTime = (h: number, m: number) => {
    if (h >= 0 && m >= 0) {
      onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      setOpen(false);
    }
  };

  const handleHourClick = (h: number) => {
    setSelHour(h);
    if (selMinute >= 0) confirmTime(h, selMinute);
  };

  const handleMinuteClick = (m: number) => {
    setSelMinute(m);
    if (selHour >= 0) confirmTime(selHour, m);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 5-min intervals

  const displayValue = value
    ? (() => {
        const h = parseInt(value.split(':')[0]);
        const m = value.split(':')[1];
        const period = h >= 12 ? 'PM' : 'AM';
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${h12}:${m} ${period}`;
      })()
    : '';

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      {required && <input type="text" required value={value} onChange={() => {}} className="sr-only" tabIndex={-1} />}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl font-medium text-base transition-all hover:border-gray-300 focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/10 outline-none text-left"
      >
        <Clock size={18} className="text-gray-400 flex-shrink-0" />
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value ? displayValue : 'Select time'}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[260px] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-[#111111] px-5 py-3 flex items-center justify-between">
            <span className="text-white font-bold text-sm">Select Time</span>
            <span className="text-[#C8FF00] font-mono font-bold text-lg">
              {selHour >= 0 ? String(selHour).padStart(2, '0') : '--'}:{selMinute >= 0 ? String(selMinute).padStart(2, '0') : '--'}
            </span>
          </div>

          {/* Columns */}
          <div className="flex divide-x divide-gray-100">
            {/* Hours */}
            <div className="flex-1">
              <div className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider py-2 bg-gray-50">Hour</div>
              <div ref={hourRef} className="h-[200px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                {hours.map(h => {
                  const period = h >= 12 ? 'PM' : 'AM';
                  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                  return (
                    <button
                      key={h}
                      type="button"
                      data-hour={h}
                      onClick={() => handleHourClick(h)}
                      className={`w-full px-4 py-2.5 text-sm font-medium transition-all flex items-center justify-between
                        ${selHour === h
                          ? 'bg-[#111111] text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span>{h12}</span>
                      <span className={`text-[10px] font-bold ${selHour === h ? 'text-[#C8FF00]' : 'text-gray-400'}`}>{period}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minutes */}
            <div className="flex-1">
              <div className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider py-2 bg-gray-50">Min</div>
              <div ref={minuteRef} className="h-[200px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                {minutes.map(m => (
                  <button
                    key={m}
                    type="button"
                    data-minute={m}
                    onClick={() => handleMinuteClick(m)}
                    className={`w-full px-4 py-2.5 text-sm font-medium transition-all text-center
                      ${selMinute === m
                        ? 'bg-[#111111] text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    :{String(m).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { onChange(''); setSelHour(-1); setSelMinute(-1); setOpen(false); }}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear
            </button>
            {selHour >= 0 && selMinute >= 0 && (
              <button
                type="button"
                onClick={() => confirmTime(selHour, selMinute)}
                className="text-xs font-bold text-[#111111] bg-[#C8FF00] px-3 py-1.5 rounded-lg hover:bg-[#b8ef00] transition-colors"
              >
                Confirm
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
