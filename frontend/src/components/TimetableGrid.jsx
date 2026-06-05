import { useState, useEffect } from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];
// Forces Tailwind to compile all 20 rich color classes for the runtime data
const TAILWIND_SAFELIST = [
    'bg-red-200 border-red-400',
    'bg-blue-200 border-blue-400',
    'bg-green-200 border-green-400',
    'bg-yellow-200 border-yellow-400',
    'bg-purple-200 border-purple-400',
    'bg-orange-200 border-orange-400',
    'bg-pink-200 border-pink-400',
    'bg-teal-200 border-teal-400',
    'bg-indigo-200 border-indigo-400',
    'bg-lime-200 border-lime-400',
    'bg-amber-200 border-amber-400',
    'bg-cyan-200 border-cyan-400',
    'bg-fuchsia-200 border-fuchsia-400',
    'bg-emerald-200 border-emerald-400',
    'bg-violet-200 border-violet-400',
    'bg-rose-200 border-rose-400',
    'bg-sky-200 border-sky-400',
    'bg-slate-200 border-slate-400',
    'bg-stone-200 border-stone-400',
    'bg-zinc-200 border-zinc-400'
];

// --- DRAGGABLE COMPONENT ---
function DraggableBlock({ slot }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: slot.id,
        data: slot,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`w-full h-full border rounded p-2 flex flex-col justify-center items-center cursor-grab active:cursor-grabbing shadow-sm hover:shadow transition-shadow ${slot.color || 'bg-blue-50 border-blue-200'}`}
        >
            <span className="font-bold text-gray-800 text-sm">{slot.subject}</span>
            <span className="text-xs text-gray-600 mt-1">{slot.teacher}</span>
        </div>
    );
}

// --- DROPPABLE COMPONENT ---
function DroppableCell({ day, period, children }) {
    const { isOver, setNodeRef } = useDroppable({
        id: `${day}-${period}`,
        data: { day, period }
    });

    return (
        <td
            ref={setNodeRef}
            className={`p-2 border-r border-gray-100 align-top w-40 h-28 transition-colors ${isOver ? 'bg-blue-50' : ''}`}
        >
            {children ? children : (
                <div className="w-full h-full border-2 border-dashed border-gray-100 rounded flex items-center justify-center text-gray-300 text-xs">
                    Empty
                </div>
            )}
        </td>
    );
}

// --- MAIN GRID COMPONENT ---
export default function TimetableGrid() {
    const [schedule, setSchedule] = useState([]);
    const [log, setLog] = useState({ message: 'Connecting to backend server...', type: 'info' });

    // *** THIS IS THE BRIDGE TO THE BACKEND ***
    useEffect(() => {
        fetch('http://localhost:5000/api/schedule')
            .then(res => {
                if (!res.ok) throw new Error("Network response was not ok");
                return res.json();
            })
            .then(data => {
                setSchedule(data);
                setLog({ message: 'Successfully loaded generated schedule from backend!', type: 'success' });
            })
            .catch(err => {
                console.error("Error fetching data:", err);
                setLog({ message: 'Failed to connect to backend. Is the server running on port 5000?', type: 'error' });
            });
    }, []);

    const getSlotData = (day, period) => {
        return schedule.find(slot => slot.day === day && slot.period === period);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;

        const draggedBlockId = active.id;
        const newDay = over.data.current.day;
        const newPeriod = over.data.current.period;

        const draggedBlock = schedule.find(slot => slot.id === draggedBlockId);
        const occupant = schedule.find(slot => slot.day === newDay && slot.period === newPeriod);

        if (occupant) {
            setSchedule(prevSchedule => prevSchedule.map(slot => {
                if (slot.id === occupant.id) return { ...slot, day: draggedBlock.day, period: draggedBlock.period };
                if (slot.id === draggedBlockId) return { ...slot, day: newDay, period: newPeriod };
                return slot;
            }));
            setLog({ message: `Swapped ${draggedBlock.subject} with ${occupant.subject}.`, type: 'success' });
        } else {
            setSchedule(prevSchedule => prevSchedule.map(slot =>
                slot.id === draggedBlockId ? { ...slot, day: newDay, period: newPeriod } : slot
            ));
            setLog({ message: `Moved ${draggedBlock.subject} to ${newDay} Period ${newPeriod}.`, type: 'success' });
        }
    };

    return (
        <DndContext onDragEnd={handleDragEnd}>
            <div className="p-8 max-w-[90rem] mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Class 5A - Schedule</h2>
                        <p className="text-gray-500 text-sm mt-1">AI Generated Draft</p>
                    </div>
                </div>

                {/* Validation Log Panel */}
                <div className={`mb-6 p-4 rounded-md border ${log.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                    log.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
                        'bg-blue-50 border-blue-200 text-blue-700'
                    }`}>
                    <div className="flex items-center">
                        <span className="font-medium">{log.message}</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="py-3 px-4 border-r border-gray-200 w-32 text-gray-500 font-medium text-left">Day</th>
                                {PERIODS.map(period => (
                                    <th key={period} className="py-3 px-4 border-r border-gray-200 text-gray-700 font-semibold w-40">
                                        Period {period}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {DAYS.map(day => (
                                <tr key={`day-${day}`} className="border-b border-gray-100">
                                    <td className="py-2 px-4 border-r border-gray-200 bg-gray-50 text-gray-700 font-semibold text-left">
                                        {day}
                                    </td>
                                    {PERIODS.map(period => {
                                        const slot = getSlotData(day, period);
                                        return (
                                            <DroppableCell key={`${day}-${period}`} day={day} period={period}>
                                                {slot && <DraggableBlock slot={slot} />}
                                            </DroppableCell>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DndContext>
    );
}