"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { cn } from "@/lib/utils"

interface KanbanColumnProps {
  id: string
  children: React.ReactNode
}

export function KanbanColumn({ id, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        "flex-1 flex flex-col h-full transition-colors duration-300 rounded-[48px]",
        isOver && "bg-slate-200/50"
      )}
    >
      {children}
    </div>
  )
}
