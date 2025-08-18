import type { DndMatch, DndMatchResponse } from "@/features/curriculum/types";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState, type CSSProperties, type FC } from "react";
import { useResponse } from "../hooks";

const ITEM_POOL_ID = "item-pool";

// Utility function to shuffle an array
function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default function DndMatch({ dndmatch }: { dndmatch: DndMatch }) {
  // --- State Management ---
  // `response` is the single source of truth for the user's submission.
  const [response, setResponse] = useResponse<DndMatchResponse, DndMatch>({
    type: "DndMatch",
    activity: dndmatch,
    initialFields: {
      // The submission is an array of arrays, where each inner array holds
      // the items for the corresponding drop zone.
      submission: Array.from({ length: dndmatch.content.length }, () => []),
      attempts_left: 3,
    },
  });

  // Other UI-specific state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<
    Record<string, "correct" | "incorrect">
  >({});

  // --- Derived Data & Memoization ---
  // All static data about items and targets is calculated once.
  const { targetIds, allItemsById, correctAnswers, allItemIds } =
    useMemo(() => {
      const targets = dndmatch.content;
      const targetIds = targets.map((_, index) => `t-${index}`);
      const allItemsById: Record<string, { id: string; label: string }> = {};
      const correctAnswers = new Map<string, string[]>();
      let draggableIndex = 0;

      targets.forEach((group, groupIndex) => {
        const targetId = targetIds[groupIndex];
        const correctItemIds: string[] = [];
        // Start from 1 to skip the category label
        group.slice(1).forEach((label) => {
          if (label) {
            // The ID format `d-groupIndex-draggableIndex` is crucial for
            // reconstructing the submission data.
            const id = `d-${groupIndex}-${draggableIndex++}`;
            allItemsById[id] = { id, label };
            correctItemIds.push(id);
          }
        });
        correctAnswers.set(targetId, correctItemIds);
      });

      const allItemIds = Object.keys(allItemsById);
      return { targetIds, allItemsById, correctAnswers, allItemIds };
    }, [dndmatch.content]);

  // The visual state of the containers (`itemsByContainer`) is derived
  // directly from the `response.submission` state. This ensures there's
  // only one source of truth.
  const itemsByContainer = useMemo(() => {
    const containers: Record<string, string[]> = {};
    const placedItemIds = new Set<string>();

    // Populate the target drop zones from the submission data
    targetIds.forEach((targetId, targetIndex) => {
      const itemCoordinates = response.submission[targetIndex] ?? [];
      const itemIds = itemCoordinates.map(([groupIndex, draggableIndex]) => {
        const id = `d-${groupIndex}-${draggableIndex}`;
        placedItemIds.add(id);
        return id;
      });
      containers[targetId] = itemIds;
    });

    // The item pool contains all items that haven't been placed
    containers[ITEM_POOL_ID] = shuffle(
      allItemIds.filter((id) => !placedItemIds.has(id)),
    );

    return containers;
  }, [response.submission, targetIds, allItemIds]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // --- Co-located Components for Simplicity ---
  const Draggable: FC<{ id: string }> = ({ id }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id, disabled: !response.partial_response});
    const style: CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      cursor: "grab",
      opacity: isDragging ? 0 : 1,
    };
    const label = allItemsById[id]?.label ?? "Unknown";
    const isImage = label.startsWith("image:");

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`touch-none rounded-md  bg-foreground shadow-sm ${!response.partial_response ? "!cursor-default":""} ${
          isImage ? "overflow-clip" : "px-4 py-2"
        }`}
      >
        {isImage ? <img src={label.replace("image:", "")} /> : label}
      </div>
    );
  };

  const DropZone: FC<{
    id: string;
    label: string;
    itemIds: string[];
    validationStatus?: "correct" | "incorrect";
  }> = ({ id, label, itemIds, validationStatus }) => {
    const { setNodeRef, isOver } = useSortable({ id });
    const stateClasses =
      validationStatus === "correct"
        ? "border-green-500 bg-green-500/10"
        : validationStatus === "incorrect"
          ? "border-error bg-error/10"
          : isOver
            ? "border-primary bg-primary/10"
            : "border-muted bg-background";

    return (
      <div className="flex flex-col items-center gap-2">
        <h3 className="max-w-56 text-center font-semibold text-secondary-foreground bright">
          {label}
        </h3>
        <SortableContext items={itemIds}>
          <div
            ref={setNodeRef}
            className={`flex h-full min-h-32 w-56 flex-col gap-2 rounded-lg border-2 border-dashed p-4 transition-colors ${stateClasses}`}
          >
            {itemIds.map((itemId) => (
              <Draggable key={itemId} id={itemId} />
            ))}
          </div>
        </SortableContext>
      </div>
    );
  };

  // --- Event Handlers ---
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setValidationResults({});
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const findContainer = (id: string) =>
      Object.keys(itemsByContainer).find((key) =>
        itemsByContainer[key].includes(id),
      );

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string);
    const destinationContainer = overContainer ?? (over.id as string);

    if (
      !activeContainer ||
      !destinationContainer ||
      !itemsByContainer[destinationContainer]
    ) {
      return;
    }

    // Calculate the new visual layout of items first
    const newItems = { ...itemsByContainer };
    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeContainer === destinationContainer) {
      const activeIndex = itemsByContainer[activeContainer].indexOf(activeId);
      const overIndex = itemsByContainer[destinationContainer].indexOf(overId);
      newItems[activeContainer] = arrayMove(
        itemsByContainer[activeContainer],
        activeIndex,
        overIndex,
      );
    } else {
      newItems[activeContainer] = itemsByContainer[activeContainer].filter(
        (id) => id !== activeId,
      );
      const overIndex = itemsByContainer[destinationContainer].indexOf(overId);
      const newIndex =
        overIndex !== -1
          ? overIndex
          : itemsByContainer[destinationContainer].length;
      newItems[destinationContainer] = [
        ...itemsByContainer[destinationContainer].slice(0, newIndex),
        activeId,
        ...itemsByContainer[destinationContainer].slice(newIndex),
      ];
    }

    // Now, update the single source of truth (`response`) based on the new layout.
    setResponse((prev) => {
      const newSubmission: number[][][] = Array.from(
        { length: dndmatch.content.length },
        () => [],
      );

      // Reconstruct the submission data from the calculated `newItems` layout
      Object.entries(newItems).forEach(([key, value]) => {
        if (key === ITEM_POOL_ID) return; // Skip the item pool
        const keyIndex = parseInt(key.substring(2), 10);
        if (!isNaN(keyIndex) && newSubmission[keyIndex] !== undefined) {
          const valueIndices: number[][] = value.map((v) => [
            parseInt(v.split("-")[1], 10),
            parseInt(v.split("-")[2], 10),
          ]);
          newSubmission[keyIndex] = valueIndices;
        }
      });

      return { ...prev, submission: newSubmission };
    });
  };

  const handleReset = () => {
    // Reset the submission to its initial empty state
    setResponse((prev) => ({
      ...prev,
      submission: Array.from({ length: dndmatch.content.length }, () => []),
    }));
    setValidationResults({});
  };

  const handleCheck = () => {
    let fullCorrect = true;

    const results: Record<string, "correct" | "incorrect"> = {};
    targetIds.forEach((targetId, index) => {
      const label = dndmatch.content[index][0];
      if (!label) return; // skip null-labeled groups

      const assignedIds = new Set(itemsByContainer[targetId]);
      const correctIds = new Set(correctAnswers.get(targetId) ?? []);
      const isCorrect =
        assignedIds.size === correctIds.size &&
        [...assignedIds].every((id) => correctIds.has(id));
      results[targetId] = isCorrect ? "correct" : "incorrect";
      fullCorrect = fullCorrect && isCorrect;
    });
    setResponse((prev) => ({
      ...prev,
      attempts_left: fullCorrect ? 0 : prev.attempts_left - 1,
      partial_response: fullCorrect ? false : prev.attempts_left - 1 > 0,
    }));
    setValidationResults(results);
  };

  const activeItem = activeId ? allItemsById[activeId] : null;

  return (<>
    <p className="mb-4 font-light">{dndmatch.instructions}</p>
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-center gap-8">
          {dndmatch.content.map((item, index) => {
            const targetId = targetIds[index];
            const label = item[0];
            return (
              label && (
                <DropZone
                  key={targetId}
                  id={targetId}
                  label={label}
                  itemIds={itemsByContainer[targetId] ?? []}
                  validationStatus={validationResults[targetId]}
                />
              )
            );
          })}
        </div>

        <DropZone
          id={ITEM_POOL_ID}
          label="Item Bank"
          itemIds={itemsByContainer[ITEM_POOL_ID] ?? []}
        />

        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={handleReset}
            disabled={response.attempts_left <= 0}
            className="bg-accent disabled:bg-muted rounded-md px-6 py-2 font-semibold shadow-sm hover:bg-gray-600 disabled:!cursor-not-allowed disabled:opacity-50"
          >
            Reset
          </button>
          <button
            onClick={handleCheck}
            disabled={response.attempts_left <= 0}
            className={`bg-primary text-primary-foreground hover:primary/110 disabled:bg-muted rounded-md px-6 py-2 font-semibold shadow-sm disabled:!cursor-not-allowed disabled:opacity-50`}
          >
            Check Answers {response.attempts_left}/3
          </button>
        </div>
      </div>

      <DragOverlay>
        {activeItem ? <Draggable id={activeItem.id} /> : null}
      </DragOverlay>
      {/* {JSON.stringify(response)} */}
    </DndContext>
  </>);
}
