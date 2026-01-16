import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Clock, MapPin, ChevronRight, Bus, Navigation, Info, Car, TramFront, Bike, Ship, FileText, Pencil, GripVertical, Copy, Trash2, MoreHorizontal, ArrowUp, ArrowDown, Check, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Activity {
    id: string;
    title: string;
    dayId: string;
    timeStart: string | null;
    durationMin?: number;
    location?: string;
    notes?: string;
    pinned?: boolean;

    orderIndex?: number;
    images?: { id: string; url: string; filename: string }[];
    avatar?: string;
}

interface Day {
    id: string;
    title: string;
    date: string;
    tripId: string;
}

interface PWATripItineraryProps {
    days: Day[];
    activitiesByDay: Record<string, Activity[]>;
    onAddActivity: (dayId: string) => void;
    onEditActivity: (activityId: string) => void;
    onDuplicateActivity: (activityId: string) => void;
    onDeleteActivity: (activity: Activity) => void;
    onAddDay: () => void;
    onEditDay: (dayId: string) => void;
    onDeleteDay?: (day: Day) => void;
    onReorderDays?: (newOrderIds: string[]) => Promise<void>;

    // Activity Drag
    onDragStart?: (e: React.DragEvent, activityId: string, dayId: string) => void;
    onDragOver?: (e: React.DragEvent, activityId: string, dayId: string) => void;
    onDragEnd?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent, activityId: string, dayId: string) => void;
    draggedActivity?: { id: string, dayId: string } | null;
    dragOverActivityId?: string | null;
    justDroppedId?: string | null;

    // Day Drag
    onDayDragStart?: (e: React.DragEvent, dayId: string) => void;
    onDayDragOver?: (e: React.DragEvent, dayId: string) => void;
    onDayDragEnd?: (e: React.DragEvent) => void;
    onDayDrop?: (e: React.DragEvent, dayId: string) => void;
    draggedDayId?: string | null;
    dragOverDayId?: string | null;
    justDroppedDayId?: string | null;

    isOwner?: boolean;
    isTabsVisible?: boolean;
    activeDayId?: string;
    onActiveDayChange?: (dayId: string) => void;
}

const DEFAULT_ACTIVITY_IMAGE = "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=400&auto=format&fit=crop";

export const PWATripItinerary: React.FC<PWATripItineraryProps> = ({
    days,
    activitiesByDay,
    onAddActivity,
    onEditActivity,
    onDuplicateActivity,
    onDeleteActivity,
    onAddDay,
    onEditDay,
    onDeleteDay,
    onReorderDays,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDrop,
    draggedActivity,
    dragOverActivityId,
    justDroppedId,

    // Day Drag
    onDayDragStart,
    onDayDragOver,
    onDayDragEnd,
    onDayDrop,
    draggedDayId,
    dragOverDayId,
    justDroppedDayId,

    isOwner,
    isTabsVisible = true,
    activeDayId: propActiveDayId,
    onActiveDayChange
}) => {
    const [internalSelectedDayId, setInternalSelectedDayId] = useState<string>(days[0]?.id || '');
    const [touchDelta, setTouchDelta] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // Use prop if provided, otherwise use internal state
    const selectedDayId = propActiveDayId !== undefined ? propActiveDayId : internalSelectedDayId;

    const setSelectedDayId = (id: string) => {
        if (onActiveDayChange) {
            onActiveDayChange(id);
        } else {
            setInternalSelectedDayId(id);
        }
    };

    const navigate = useNavigate();
    const dayTabsRef = useRef<HTMLDivElement>(null);

    // Swipe handling
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);
    const touchEndY = useRef<number | null>(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        touchEndX.current = null;
        touchEndY.current = null;
        touchStartX.current = e.targetTouches[0].clientX;
        touchStartY.current = e.targetTouches[0].clientY;
        setIsDragging(true);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || !touchStartX.current) return;
        const currentX = e.targetTouches[0].clientX;
        const currentY = e.targetTouches[0].clientY;

        // Check if it's a vertical swipe to allow scrolling
        if (touchStartY.current) {
            const diffY = Math.abs(currentY - touchStartY.current);
            const diffX = Math.abs(currentX - touchStartX.current);
            if (diffY > diffX && diffY > 5) { // Sensitivity increased to 5px
                setIsDragging(false);
                setTouchDelta(0);
                return;
            }
        }

        let deltaX = currentX - touchStartX.current;
        const currentIndex = days.findIndex(d => d.id === selectedDayId);

        // Rubber banding at edges
        if ((currentIndex === 0 && deltaX > 0) || (currentIndex === days.length - 1 && deltaX < 0)) {
            deltaX = deltaX * 0.35; // Fine-tuned rubber band multiplier
        }

        setTouchDelta(deltaX);
        touchEndX.current = currentX;
    };

    const onTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        const finalDelta = touchDelta;
        setTouchDelta(0);

        if (Math.abs(finalDelta) > minSwipeDistance) {
            const currentIndex = days.findIndex(d => d.id === selectedDayId);
            if (finalDelta < 0) {
                // Swiped left -> next day
                if (currentIndex < days.length - 1) {
                    setSelectedDayId(days[currentIndex + 1].id);
                }
            } else {
                // Swiped right -> previous day
                if (currentIndex > 0) {
                    setSelectedDayId(days[currentIndex - 1].id);
                }
            }
        }

        touchStartX.current = null;
        touchStartY.current = null;
    };

    useEffect(() => {
        if (days.length > 0) {
            const dayExists = days.some(d => d.id === selectedDayId);
            if (!selectedDayId || !dayExists) {
                setSelectedDayId(days[0].id);
            }
        }
    }, [days, selectedDayId]);

    // Scroll selected day into view
    useEffect(() => {
        if (dayTabsRef.current && selectedDayId) {
            const selectedTab = dayTabsRef.current.querySelector(`[data-day-id="${selectedDayId}"]`) as HTMLElement;
            if (selectedTab) {
                selectedTab.scrollIntoView({
                    behavior: 'smooth',
                    inline: 'center',
                    block: 'nearest'
                });
            }
        }
    }, [selectedDayId]);

    const activeDayIndex = days.findIndex(d => d.id === selectedDayId);
    const selectedDay = days.find(d => d.id === selectedDayId);
    const selectedDayActivities = activitiesByDay[selectedDayId] || [];

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatTime = (timeString: string | null): string => {
        if (!timeString) return '';
        if (timeString.includes('T')) {
            try {
                const timePart = timeString.split('T')[1];
                return timePart.substring(0, 5); // HH:mm
            } catch (e) {
                const date = new Date(timeString);
                if (isNaN(date.getTime())) return timeString;
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                return `${hours}:${minutes}`;
            }
        }
        return timeString;
    };

    return (
        <div
            className="flex flex-col w-full bg-background min-h-screen"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Day Selector Header */}
            <div
                className={cn(
                    "sticky z-40 bg-background border-b border-border transition-[top] duration-300",
                    isTabsVisible ? "top-[124px]" : "top-[60px]"
                )}
            >
                <div
                    ref={dayTabsRef}
                    className="flex items-center justify-start w-full gap-4 px-4 py-2 overflow-x-auto scrollbar-hide"
                    onTouchStart={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center gap-1">
                        {days.map((day, index) => {
                            const isActive = day.id === selectedDayId;
                            const isDragged = draggedDayId === day.id;
                            const isDragOver = dragOverDayId === day.id;

                            return (
                                <button
                                    key={day.id}
                                    data-day-id={day.id} // Added for scrolling
                                    onClick={() => setSelectedDayId(day.id)}
                                    // Drag Handlers
                                    draggable={isOwner}
                                    onDragStart={(e) => isOwner && onDayDragStart?.(e, day.id)}
                                    onDragOver={(e) => isOwner && onDayDragOver?.(e, day.id)}
                                    onDragEnd={onDayDragEnd}
                                    onDrop={(e) => isOwner && onDayDrop?.(e, day.id)}
                                    className={cn(
                                        "flex flex-col items-center flex-1 min-w-[100px] py-3 px-1 rounded-xl transition-all relative select-none",
                                        isActive ? "bg-primary/10" : "",
                                        isDragged && "opacity-50 scale-95 ring-2 ring-primary border-dashed border-2 border-primary/50",
                                        isDragOver && "scale-105 bg-primary/20 ring-2 ring-primary z-10",
                                        justDroppedDayId === day.id && "animate-pulse ring-2 ring-green-500"
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute top-1 right-1" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground/60 hover:text-foreground transition-colors"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="min-w-[140px] rounded-xl">
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEditDay(day.id);
                                                        }}
                                                        className="gap-2 font-medium"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                        Chỉnh sửa
                                                    </DropdownMenuItem>
                                                    {onDeleteDay && (
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteDay(day);
                                                            }}
                                                            className="gap-2 text-destructive focus:text-destructive font-medium"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            Xóa ngày
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    )}
                                    <span className={cn(
                                        "text-[15px] font-bold flex items-center gap-1",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        Ngày {index + 1}
                                        {isOwner && !isActive && <GripVertical className="w-3 h-3 text-muted-foreground/30" />}
                                    </span>
                                    {isActive && (
                                        <div className="absolute -bottom-[8px] left-0 right-0 h-1 bg-primary rounded-t-full shadow-primary/30" />
                                    )}
                                </button>
                            );
                        })}
                    </div>


                    {days.length > 0 && isOwner && (
                        <button
                            onClick={onAddDay}
                            className="flex items-center justify-center min-w-[40px] h-[40px] rounded-full bg-secondary text-secondary-foreground ml-2 flex-shrink-0 border border-border transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5 text-primary" />
                        </button>
                    )}
                </div>
            </div>

            {/* Activities Timeline */}
            <div className="flex-1 overflow-hidden relative">
                <div
                    className={cn(
                        "flex w-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                        isDragging ? "duration-0" : ""
                    )}
                    style={{
                        transform: `translateX(calc(${-activeDayIndex * 100}% + ${touchDelta}px))`,
                        willChange: 'transform'
                    }}
                >
                    {days.map((day, dIdx) => {
                        const dayActivities = activitiesByDay[day.id] || [];
                        return (
                            <div key={day.id} className="w-full flex-shrink-0 px-4 py-6">
                                <div className="mb-6">
                                    <h2 className="text-xl font-black text-foreground text-center">
                                        {day.title || `Ngày ${dIdx + 1}`}
                                    </h2>
                                </div>

                                {dayActivities.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                            <Clock className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="text-sm font-medium">Chưa có hoạt động nào</p>
                                        {isOwner && (
                                            <Button
                                                variant="outline"
                                                className="mt-4 rounded-xl border-dashed border-2 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary hover:border-primary transition-all"
                                                onClick={() => onAddActivity(day.id)}
                                            >
                                                <Plus className="w-4 h-4 mr-2" /> Thêm hoạt động
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="relative pl-10">
                                        {/* Vertical Line */}
                                        <div className="absolute left-[18px] top-4 bottom-10 border-l-[1.5px] border-dotted border-border" />

                                        <div className="space-y-6">
                                            {dayActivities.map((activity, index) => (
                                                <div key={activity.id} className="relative">
                                                    {/* Timeline Point */}
                                                    <div className="absolute -left-[38px] top-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black z-10 border-[3px] border-background shadow-sm">
                                                        {index + 1}
                                                    </div>

                                                    {/* Activity Content */}
                                                    <div className="flex flex-col gap-4">
                                                        {/* Time & Edit Link */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-[15px] font-bold text-foreground">
                                                                {activity.timeStart ? formatTime(activity.timeStart) : "09:00"}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <button
                                                                            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground/60 hover:text-foreground transition-colors"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <MoreHorizontal className="w-4 h-4" />
                                                                        </button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="min-w-[140px] rounded-xl z-50 bg-background/95 backdrop-blur-sm shadow-xl border-border/50">
                                                                        <DropdownMenuItem
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onDuplicateActivity(activity.id);
                                                                            }}
                                                                            className="gap-2 font-medium py-2.5 cursor-pointer"
                                                                        >
                                                                            <Copy className="w-3.5 h-3.5 text-blue-500" />
                                                                            Sao chép
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onEditActivity(activity.id);
                                                                            }}
                                                                            className="gap-2 font-medium py-2.5 cursor-pointer"
                                                                        >
                                                                            <Pencil className="w-3.5 h-3.5 text-primary" />
                                                                            Chỉnh sửa
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onDeleteActivity(activity);
                                                                            }}
                                                                            className="gap-2 text-destructive focus:text-destructive font-medium py-2.5 cursor-pointer"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                            Xóa hoạt động
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>

                                                        {/* Card */}
                                                        <div
                                                            className={cn(
                                                                "flex gap-4 active:scale-[0.98] transition-all relative group",
                                                                draggedActivity?.id === activity.id && "opacity-40",
                                                                dragOverActivityId === activity.id && "border-primary border-t-2",
                                                                justDroppedId === activity.id && "ring-2 ring-primary/40 bg-primary/[0.03] border-primary/50 scale-[1.01] shadow-lg z-20"
                                                            )}
                                                            draggable={isOwner}
                                                            onDragStart={(e) => onDragStart?.(e, activity.id, activity.dayId)}
                                                            onDragOver={(e) => onDragOver?.(e, activity.id, activity.dayId)}
                                                            onDragEnd={(e) => onDragEnd?.(e)}
                                                            onDrop={(e) => onDrop?.(e, activity.id, activity.dayId)}
                                                            onClick={() => onEditActivity(activity.id)}
                                                        >
                                                            {/* Drag Handle for Owner */}
                                                            {isOwner && (
                                                                <div className="absolute -left-8 top-1/2 -translate-y-1/2 p-2 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <GripVertical className="w-5 h-5" />
                                                                </div>
                                                            )}

                                                            {/* Image */}
                                                            <div className="w-[85px] h-[85px] rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-border">
                                                                <img
                                                                    src={activity.avatar || DEFAULT_ACTIVITY_IMAGE}
                                                                    alt={activity.title}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>

                                                            {/* Info */}
                                                            <div className="flex-1 py-0 min-w-0">
                                                                <h4 className="font-bold text-foreground text-[17px] leading-tight mb-1">
                                                                    {activity.title}
                                                                </h4>
                                                                {activity.location && (
                                                                    <div
                                                                        className="flex flex-col gap-0.5 group/loc cursor-pointer mt-1"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            window.location.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location!)}`;
                                                                        }}
                                                                    >
                                                                        <span className="flex items-start gap-1 text-muted-foreground group-hover/loc:text-primary transition-colors text-[13px]">
                                                                            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-red-500" />
                                                                            <span className="flex-1 truncate leading-relaxed">
                                                                                {activity.location}
                                                                            </span>
                                                                        </span>
                                                                        <div className="flex items-center gap-1 ml-4 overflow-hidden">
                                                                            <span className="text-[10px] text-primary font-bold hover:underline underline-offset-2 transition-all">
                                                                                Xem trong bản đồ
                                                                            </span>
                                                                            <ChevronRight className="w-3 h-3 text-primary animate-pulse" />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground/60 mt-2">
                                                                    {activity.durationMin ? (
                                                                        <span className="flex items-center gap-1 flex-shrink-0">
                                                                            <Clock className="w-3.5 h-3.5 flex-shrink-0 text-yellow-500" /> {activity.durationMin}p
                                                                        </span>
                                                                    ) : null}
                                                                </div>

                                                                {activity.notes && (
                                                                    <div className="mt-2 pt-2 border-t border-border/50 flex gap-1.5 items-start w-full">
                                                                        <FileText className="w-3 h-3 mt-0.5 flex-shrink-0 text-muted-foreground/40" />
                                                                        <p className="text-[11px] text-muted-foreground/60 leading-relaxed italic whitespace-normal truncate">
                                                                            {activity.notes}
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {!activity.notes && isOwner && (
                                                                    <div className="text-primary text-[10px] font-bold mt-2">
                                                                        Thêm ghi chú, thời lượng & chi phí
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Bottom Add Activity Button */}
                                            {isOwner && (
                                                <div className="pt-4 pb-10">
                                                    <Button
                                                        variant="outline"
                                                        className="w-full rounded-2xl border-dashed border-2 border-border text-muted-foreground h-14 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary hover:border-primary transition-all font-bold group"
                                                        onClick={() => onAddActivity(day.id)}
                                                    >
                                                        <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" /> Thêm hoạt động
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Floating Add Day Button when Trip is Empty */}
            {days.length === 0 && isOwner && createPortal(
                <div className="fixed bottom-24 right-1 z-[100] group flex flex-col items-center">
                    {/* Tooltip */}
                    <div className="mb-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-sm text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap -translate-y-2 group-hover:translate-y-0">
                        Thêm ngày mới
                    </div>

                    <button
                        onClick={onAddDay}
                        className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center active:scale-90 active:brightness-110 active:ring-4 active:ring-primary/30 transition-all duration-200 animate-in zoom-in"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
};
