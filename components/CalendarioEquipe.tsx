
import React, { useState, useMemo } from 'react';
import { FeriadoEmpresa } from '../tipos';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import { useAuth } from '../hooks/useAuth';
import { getDescendantUnitIds } from '../constants';

interface CalendarEvent {
    type: 'vacation' | 'holiday' | 'collective';
    title: string;
}

const CalendarioEquipe: React.FC = () => {
    const { user: currentUser, activeEmployees, holidays, collectiveVacationRules, orgUnits } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());

    const changeMonth = (amount: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setUTCMonth(newDate.getUTCMonth() + amount);
            return newDate;
        });
    };

    const employeesToDisplay = useMemo(() => {
        if (!currentUser) return [];

        switch (currentUser.role) {
            case 'manager':
                const managedUnits = orgUnits.filter(u => u.name === currentUser.departamento && u.type === 'Área');
                const managedUnitIds = managedUnits.map(u => u.id);

                const descendantUnitIds: string[] = [];
                managedUnits.forEach(unit => {
                    descendantUnitIds.push(...getDescendantUnitIds(unit.id, orgUnits));
                });

                const allManagedUnitNames = [...new Set([
                    ...managedUnits.map(u => u.name),
                    ...orgUnits.filter(u => descendantUnitIds.includes(u.id)).map(u => u.name)
                ])];

                return activeEmployees.filter(emp => {
                    if (emp.id === currentUser.id) return true; // Always include the manager themselves
                    return allManagedUnitNames.includes(emp.departamento);
                });
            case 'user':
                // User sees everyone in their 'departamento' (Área).
                return activeEmployees.filter(emp => emp.departamento === currentUser.departamento);
            default:
                // Admin, RH, etc. see everyone.
                return activeEmployees;
        }
    }, [currentUser, activeEmployees, orgUnits]);

    const { monthName, year, daysInMonth, firstDayOfMonth } = useMemo(() => {
        const year = currentDate.getUTCFullYear();
        const month = currentDate.getUTCMonth();
        const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' }).format(currentDate);

        return {
            monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            year: year,
            // Use Date.UTC to ensure we get the correct number of days and start day relative to UTC
            // day 0 of month + 1 gives last day of current month
            daysInMonth: new Date(Date.UTC(year, month + 1, 0)).getUTCDate(),
            // day 1 of current month
            firstDayOfMonth: new Date(Date.UTC(year, month, 1)).getUTCDay(),
        };
    }, [currentDate]);

    const eventsByDate = useMemo(() => {
        const events = new Map<string, CalendarEvent[]>();

        // Process collective vacations first to give them priority
        if (collectiveVacationRules) {
            collectiveVacationRules.forEach(rule => {
                const start = new Date(`${rule.inicio}T12:00:00Z`);
                const end = new Date(`${rule.fim}T12:00:00Z`);

                for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
                    const dateString = d.toISOString().split('T')[0];
                    // Set the collective vacation event, overwriting others for simplicity.
                    // The rendering logic will handle displaying only this.
                    events.set(dateString, [{ type: 'collective', title: rule.descricao }]);
                }
            });
        }

        // Employee vacations
        employeesToDisplay.forEach(emp => {
            emp.periodosAquisitivos.forEach(pa => {
                pa.fracionamentos.forEach(vac => {
                    if (vac.status === 'scheduled' || vac.status === 'enjoyed' || vac.status === 'enjoying') {
                        const startDate = new Date(`${vac.inicioFerias}T12:00:00Z`);
                        for (let i = 0; i < vac.quantidadeDias; i++) {
                            const date = new Date(startDate);
                            date.setUTCDate(date.getUTCDate() + i);
                            const dateString = date.toISOString().split('T')[0];

                            // If the day is already marked as collective vacation, skip adding individual vacations
                            if (events.get(dateString)?.some(e => e.type === 'collective')) {
                                continue;
                            }

                            if (!events.has(dateString)) {
                                events.set(dateString, []);
                            }
                            const nameParts = emp.nome.split(' ');
                            const shortName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[1].charAt(0)}.` : nameParts[0];
                            events.get(dateString)!.push({ type: 'vacation', title: shortName });
                        }
                    }
                });
            });
        });

        // Holidays
        holidays.forEach(holiday => {
            const dateString = holiday.data;
            // If the day is already marked as collective vacation, skip adding holidays
            if (events.get(dateString)?.some(e => e.type === 'collective')) {
                return;
            }
            if (!events.has(dateString)) {
                events.set(dateString, []);
            }
            events.get(dateString)!.push({ type: 'holiday', title: holiday.descricao });
        });

        return events;
    }, [employeesToDisplay, holidays, collectiveVacationRules]);

    const calendarGrid = useMemo(() => {
        const grid = [];
        const year = currentDate.getUTCFullYear();
        const month = currentDate.getUTCMonth();

        const prevMonthDays = new Date(Date.UTC(year, month, 0)).getUTCDate();

        // Days from previous month
        for (let i = firstDayOfMonth; i > 0; i--) {
            const day = prevMonthDays - i + 1;
            const date = new Date(Date.UTC(year, month - 1, day));
            grid.push({ day, date, isCurrentMonth: false });
        }

        // Days from current month
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(Date.UTC(year, month, i));
            grid.push({ day: i, date, isCurrentMonth: true });
        }

        // Days from next month
        const gridLength = grid.length;
        // Fill remaining cells to complete 42 (6 rows * 7 cols) or 35 (5 rows)
        const totalCells = gridLength > 35 ? 42 : 35;

        for (let i = 1; grid.length < totalCells; i++) {
            const date = new Date(Date.UTC(year, month + 1, i));
            grid.push({ day: i, date, isCurrentMonth: false });
        }

        return grid;
    }, [firstDayOfMonth, daysInMonth, currentDate]);

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const renderEvent = (event: CalendarEvent, key: number) => {
        const classes = {
            vacation: 'bg-blue-100 text-blue-800',
            holiday: 'bg-slate-200 text-slate-700',
            collective: 'bg-green-200 text-green-800 border border-green-300',
        };
        return (
            <div key={key} className={`text-[11px] font-semibold px-2 py-0.5 rounded-md mt-1 truncate ${classes[event.type]}`}>
                {event.title}
            </div>
        );
    }

    return (
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-200">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h3 className="text-xl font-bold text-slate-800">Calendário da Equipe</h3>
                <div className="flex items-center space-x-4">
                    <button onClick={() => changeMonth(-1)} className="bg-white p-1.5 rounded-full hover:bg-slate-100">
                        <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
                    </button>
                    <span className="text-lg font-semibold text-slate-700 w-40 text-center">{monthName} {year}</span>
                    <button onClick={() => changeMonth(1)} className="bg-white p-1.5 rounded-full hover:bg-slate-100">
                        <ChevronRightIcon className="h-5 w-5 text-slate-600" />
                    </button>
                </div>
            </div>

            <div className="flex items-center space-x-6 mb-4">
                <div className="flex items-center"><span className="h-3 w-3 rounded-full bg-blue-100 mr-2 border border-blue-300"></span><span className="text-sm text-slate-600">Férias</span></div>
                <div className="flex items-center"><span className="h-3 w-3 rounded-full bg-green-50 mr-2 border border-green-300"></span><span className="text-sm text-slate-600">Férias Coletivas</span></div>
                <div className="flex items-center"><span className="h-3 w-3 rounded-full bg-slate-200 mr-2 border border-slate-300"></span><span className="text-sm text-slate-600">Folga</span></div>
            </div>

            <div className="grid grid-cols-7 gap-px border-t border-l border-slate-300 bg-slate-300">
                {weekDays.map((day, index) => (
                    <div key={day} className={`text-center py-2 bg-slate-100 text-xs font-bold ${index === 0 ? 'text-danger' : 'text-slate-600'} uppercase`}>{day}</div>
                ))}

                {calendarGrid.map(({ day, date, isCurrentMonth }, index) => {
                    const dateString = date.toISOString().split('T')[0];
                    const dayEvents = eventsByDate.get(dateString) || [];
                    const isCollective = dayEvents.some(e => e.type === 'collective');
                    const isHoliday = !isCollective && dayEvents.some(e => e.type === 'holiday');
                    const isSunday = date.getUTCDay() === 0;

                    // Determine cell background classes
                    let cellClasses = 'relative p-2 h-28';
                    if (isCollective) {
                        cellClasses += ' bg-green-50';
                    } else if (isHoliday) {
                        cellClasses += ' bg-warning-light';
                    } else if (isCurrentMonth) {
                        cellClasses += ' bg-white';
                    } else {
                        cellClasses += ' bg-slate-50';
                    }

                    // Determine day number classes
                    let dayNumberClasses = 'text-sm font-semibold';
                    if (isSunday && isCurrentMonth) {
                        dayNumberClasses += ' text-danger';
                    } else if (isCurrentMonth) {
                        dayNumberClasses += ' text-slate-800';
                    } else {
                        dayNumberClasses += ' text-slate-400';
                    }

                    return (
                        <div key={index} className={cellClasses}>
                            <span className={dayNumberClasses}>{day}</span>
                            <div className="overflow-y-auto max-h-[80px]">
                                {isCollective ? renderEvent(dayEvents[0], 0) : dayEvents.slice(0, 3).map(renderEvent)}
                                {!isCollective && dayEvents.length > 3 && <div className="text-[11px] text-slate-500 mt-1">+ {dayEvents.length - 3} mais</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarioEquipe;
