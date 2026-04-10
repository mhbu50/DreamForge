import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import DashboardWidget from './DashboardWidget';
import { WordCountWidget, ImagePreviewWidget, ProgressWidget, LoreWidget } from './Widgets';

interface WidgetGridProps {
  widgets: string[];
  onReorder: (newOrder: string[]) => void;
  onRemove: (id: string) => void;
}

export default function WidgetGrid({ widgets, onReorder, onRemove }: WidgetGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgets.indexOf(active.id as string);
      const newIndex = widgets.indexOf(over.id as string);
      onReorder(arrayMove(widgets, oldIndex, newIndex));
    }
  };

  const renderWidget = (id: string) => {
    switch (id) {
      case 'word-count':
        return (
          <DashboardWidget key={id} id={id} title="Word Count" onRemove={() => onRemove(id)}>
            <WordCountWidget />
          </DashboardWidget>
        );
      case 'image-preview':
        return (
          <DashboardWidget key={id} id={id} title="Visual References" onRemove={() => onRemove(id)}>
            <ImagePreviewWidget />
          </DashboardWidget>
        );
      case 'progress':
        return (
          <DashboardWidget key={id} id={id} title="Project Progress" onRemove={() => onRemove(id)}>
            <ProgressWidget />
          </DashboardWidget>
        );
      case 'lore':
        return (
          <DashboardWidget key={id} id={id} title="Lore Quick Access" onRemove={() => onRemove(id)}>
            <LoreWidget />
          </DashboardWidget>
        );
      default:
        return null;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={widgets}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map(renderWidget)}
        </div>
      </SortableContext>
    </DndContext>
  );
}
