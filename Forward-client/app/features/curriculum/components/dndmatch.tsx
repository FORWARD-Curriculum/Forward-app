import type { DndMatch } from "@/features/curriculum/types";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState, type CSSProperties, useEffect } from "react";

const ITEM_POOL_ID = "item-pool";

// A simple, reusable item that can be dragged.
function Draggable({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none rounded-md border bg-white px-4 py-2 shadow-sm"
    >
      {label}
    </div>
  );
}

// A container that can hold draggable items.
function DropZone({
  id,
  label,
  itemIds,
  idToLabelMap,
  validationStatus,
}: {
  id: string;
  label: string;
  itemIds: string[];
  idToLabelMap: Map<string, string>;
  validationStatus?: "correct" | "incorrect";
}) {
  const { setNodeRef, isOver } = useSortable({ id });

  const stateClasses =
    validationStatus === "correct"
      ? "border-green-500 bg-green-50"
      : validationStatus === "incorrect"
        ? "border-red-500 bg-red-50"
        : isOver
          ? "border-blue-500 bg-blue-100"
          : "border-gray-300 bg-gray-50";

  return (
    <div className="flex flex-col items-center gap-2">
      <h3 className="font-semibold text-gray-700 max-w-56 text-center">{label}</h3>
      <SortableContext items={itemIds}>
        <div
          ref={setNodeRef}
          className={`flex min-h-32 w-56 flex-col gap-2 rounded-lg border-2 border-dashed p-4 transition-colors ${stateClasses}`}
        >
          {itemIds.map((itemId) => (
            <Draggable
              key={itemId}
              id={itemId}
              label={idToLabelMap.get(itemId) ?? "Unknown"}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function DndMatch({ dndmatch }: { dndmatch: DndMatch }) {
  // Memoize all derived data from props. This calculation runs only when
  // the content of the dndmatch prop changes.
  const {
    targetIds,
    allDraggableItems,
    idToLabelMap,
    correctAnswers,
    initialItems,
  } = useMemo(() => {
    const targets = dndmatch.content;
    const targetIds = targets.map((_, index) => `target-${index}`);

    const allDraggableItems = targets
      .flatMap((group) => group.slice(1)) // Get all items, excluding category labels
      .filter((d): d is string => d !== null)
      .map((label, index) => ({ id: `draggable-${index}`, label }));

    const idToLabelMap = new Map(
      allDraggableItems.map((item) => [item.id, item.label])
    );
    const labelToIdMap = new Map(
      allDraggableItems.map((item) => [item.label, item.id])
    );

    const correctAnswers = new Map<string, string[]>();
    targets.forEach((group, index) => {
      const targetId = targetIds[index];
      const correctItemIds = group
        .slice(1)
        .map((label) => (label ? labelToIdMap.get(label) : undefined))
        .filter((id): id is string => !!id);
      correctAnswers.set(targetId, correctItemIds);
    });

    const initialItems: Record<string, string[]> = {
      [ITEM_POOL_ID]: allDraggableItems.map((item) => item.id),
    };
    targetIds.forEach((id) => (initialItems[id] = []));

    return {
      targetIds,
      allDraggableItems,
      idToLabelMap,
      correctAnswers,
      initialItems,
    };
  }, [dndmatch.content]);

  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<
    Record<string, "correct" | "incorrect">
  >({});

  const activeItem = useMemo(
    () => allDraggableItems.find((item) => item.id === activeId),
    [activeId, allDraggableItems]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setValidationResults({});
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the container the active item is in.
    const activeContainerId = Object.keys(items).find((key) =>
      items[key].includes(activeId)
    );
    // Find the container the user is dropping over. This can be an item in a
    // container or the container itself.
    const overContainerId = Object.keys(items).find((key) =>
      items[key].includes(overId)
    );
    // The final destination container.
    const destinationContainerId = overContainerId ?? overId;

    if (!activeContainerId || !items[destinationContainerId]) return;

    setItems((prev) => {
      const newItems = { ...prev };
      // Case 1: Reordering items within the same container.
      if (activeContainerId === destinationContainerId) {
        const activeIndex = newItems[activeContainerId].indexOf(activeId);
        const overIndex = newItems[destinationContainerId].indexOf(overId);
        newItems[activeContainerId] = arrayMove(
          newItems[activeContainerId],
          activeIndex,
          overIndex
        );
      } else {
        // Case 2: Moving an item to a different container.
        // Remove item from its original container.
        const activeIndex = newItems[activeContainerId].indexOf(activeId);
        const [movedItem] = newItems[activeContainerId].splice(activeIndex, 1);

        // Add item to the new container.
        const overIndex = newItems[destinationContainerId].indexOf(overId);
        if (overIndex !== -1) {
          // Dropped on a specific item, insert before it.
          newItems[destinationContainerId].splice(overIndex, 0, movedItem);
        } else {
          // Dropped on the container itself, add to the end.
          newItems[destinationContainerId].push(movedItem);
        }
      }
      return newItems;
    });
    console.log(items)
  };

  const handleReset = () => {
    setItems(initialItems);
    setValidationResults({});
  };

  const handleCheck = () => {
    const results: Record<string, "correct" | "incorrect"> = {};
    for (const targetId of targetIds) {
      const assignedIds = new Set(items[targetId]);
      const correctIds = new Set(correctAnswers.get(targetId) ?? []);
      const isCorrect =
        assignedIds.size === correctIds.size &&
        [...assignedIds].every((id) => correctIds.has(id));
      results[targetId] = isCorrect ? "correct" : "incorrect";
    }
    setValidationResults(results);
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="space-y-8">
        <div className="flex flex-wrap justify-center gap-8 items-end">
          {dndmatch.content.map((item, index) => {
            const targetId = targetIds[index];
            return item[0] && (
              <DropZone
                key={targetId}
                id={targetId}
                label={item[0] ?? "Unnamed Category"}
                itemIds={items[targetId] ?? []}
                idToLabelMap={idToLabelMap}
                validationStatus={validationResults[targetId]}
              />
            );
          })}
        </div>

        <DropZone
          id={ITEM_POOL_ID}
          label="Item Bank"
          itemIds={items[ITEM_POOL_ID] ?? []}
          idToLabelMap={idToLabelMap}
        />

        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={handleReset}
            className="rounded-md bg-gray-500 px-6 py-2 font-semibold text-white shadow-sm hover:bg-gray-600"
          >
            Reset
          </button>
          <button
            onClick={handleCheck}
            className="rounded-md bg-blue-600 px-6 py-2 font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Check Answers
          </button>
        </div>
      </div>

      <DragOverlay>
        {activeItem ? (
          <Draggable id={activeItem.id} label={activeItem.label} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}