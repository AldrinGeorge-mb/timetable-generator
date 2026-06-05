import { useState } from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

// --- 1. THE DRAGGABLE BLOCK COMPONENT ---
function DraggableBlock({ slot }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: slot.id, // This unique ID tells dnd-kit exactly WHICH block is being dragged
        data: slot,  // We pass the class data so we know what we are dragging
    });

    // This applies the actual movement to the block when you drag it
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
            className={`w-full h-full border rounded p-2 flex flex-col justify-center items-center cursor-grab active:cursor-grabbing shadow-sm hover:shadow transition-shadow ${slot.color}`}
        >
            <span className="font-bold text-gray-800 text-sm">{slot.subject}</span>
            <span className="text-xs text-gray-600 mt-1">{slot.teacher}</span>
        </div>
    );
}

// --- 2. THE DROPPABLE CELL COMPONENT ---
function DroppableCell({ day, period, children }) {
    const { isOver, setNodeRef } = useDroppable({
        id: `${day}-${period}`, // e.g., "Monday-1" - Tells dnd-kit exactly WHERE the drop zone is
        data: { day, period }
    });

    return (
        <td
            ref={setNodeRef}
            // If we are hovering over this cell, give it a slight blue tint to show it's ready to receive
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

// --- 3. THE MAIN GRID COMPONENT ---
export default function TimetableGrid() {
    const [schedule, setSchedule] = useState([
        { id: '1', day: 'Monday', period: 1, subject: 'HINDI', teacher: 'BETTY TR', color: 'bg-orange-100 border-orange-300' },
        { id: '2', day: 'Monday', period: 2, subject: 'SCI', teacher: 'NEETHU TR', color: 'bg-green-100 border-green-300' },
        { id: '3', day: 'Tuesday', period: 1, subject: 'MATHS', teacher: 'RAVEENA TR', color: 'bg-blue-100 border-blue-300' },
        { id: '4', day: 'Tuesday', period: 2, subject: 'ENG', teacher: 'EMY TR', color: 'bg-purple-100 border-purple-300' },
    ]);

    // This state holds the current message and whether it's an error or success
    const [log, setLog] = useState({ message: 'Ready to schedule. Drag a block to move it.', type: 'info' });

    const getSlotData = (day, period) => {
        return schedule.find(slot => slot.day === day && slot.period === period);
    };

    // --- 4. THE DRAG LOGIC ---
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;

        const draggedBlockId = active.id;
        const newDay = over.data.current.day;
        const newPeriod = over.data.current.period;

        // Find the actual data of the block we are dragging
        const draggedBlock = schedule.find(slot => slot.id === draggedBlockId);

        // Find if someone is already sitting in the drop zone
        const occupant = schedule.find(slot => slot.day === newDay && slot.period === newPeriod);

        if (occupant) {
            // SWAP LOGIC: 
            // 1. Move the occupant to the dragged block's old home
            // 2. Move the dragged block to the new home
            setSchedule(prevSchedule => prevSchedule.map(slot => {
                if (slot.id === occupant.id) {
                    return { ...slot, day: draggedBlock.day, period: draggedBlock.period };
                }
                if (slot.id === draggedBlockId) {
                    return { ...slot, day: newDay, period: newPeriod };
                }
                return slot;
            }));
            setLog({ message: `Successfully swapped ${draggedBlock.subject} with ${occupant.subject}.`, type: 'success' });
        } else {
            // MOVE LOGIC (Empty cell)
            setSchedule(prevSchedule => prevSchedule.map(slot =>
                slot.id === draggedBlockId ? { ...slot, day: newDay, period: newPeriod } : slot
            ));
            setLog({ message: `Moved ${draggedBlock.subject} to ${newDay} Period ${newPeriod}.`, type: 'success' });
        }
    };

    return (
        <DndContext onDragEnd={handleDragEnd}>
            <div className="p-8 max-w-[90rem] mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Class 5A - Schedule</h2>
                        <p className="text-gray-500 text-sm mt-1">Interactive Draft Mode</p>
                    </div>
                </div>
                {/* Validation Log Panel */}
                <div className={`mb-6 p-4 rounded-md border ${log.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                        log.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
                            'bg-blue-50 border-blue-200 text-blue-700'
                    }`}>
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
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
                                            // We wrap every cell in our new DroppableCell component
                                            <DroppableCell key={`${day}-${period}`} day={day} period={period}>
                                                {/* If there is data, render the DraggableBlock inside it */}
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