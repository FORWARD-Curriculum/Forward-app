import {
  useState,
  type CSSProperties,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useResponse } from "../hooks";
import type { DndMatch, DndMatchResponse } from "../types";
import { SortableContext, useSortable, arrayMove } from "@dnd-kit/sortable";
import {
  DndContext,
  type UniqueIdentifier,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  useDroppable,
  useDndContext,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { saveCurrentResponseThunk } from "../slices/userLessonDataSlice";

type Item = DndMatch["content"][0]["matches"][0];

const id = (m: Item): UniqueIdentifier =>
  typeof m === "string" ? m : m.key || "";

// Draggable component updated to support a clean DragOverlay experience.
function Draggable({
  isDraggable,
  item,
  isCorrect,
  isOverlay = false,
}: {
  isDraggable: boolean;
  item: Item;
  isCorrect?: boolean;
  isOverlay?: boolean;
}) {
  const itemId = id(item);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemId, disabled: !isDraggable });

  const isBeingDragged = isDragging || isOverlay;

  const style: CSSProperties = {
    transform: isOverlay ? undefined : CSS.Transform.toString(transform),
    transition,
    cursor: isBeingDragged ? "grabbing" : "grab",
    opacity: isDragging ? 0 : 1,
    zIndex: isBeingDragged ? 100 : "auto",
    boxShadow: isBeingDragged
      ? "0 4px 8px rgba(0,0,0,0.2)"
      : "0 1px 3px rgba(0,0,0,0.1)",
  };

  const correctnessClass =
    isCorrect === true
      ? "bg-green-400/25"
      : isCorrect === false
        ? "bg-error/25"
        : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      className={`flex min-h-25 touch-none items-center justify-center rounded-md border-2 border-secondary-border drop-shadow-sm bg-background p-2 text-center shadow-sm ${correctnessClass} ${
        !isDraggable ? "pointer-events-none !cursor-default select-none" : ""
      }`}
    >
      {typeof item !== "string" ? (
        <img alt="" src={item.image} className="aspect-auto h-25 rounded" />
      ) : (
        item
      )}
    </div>
  );
}

function DroppableCategory({
  id,
  classname,
  children,
}: {
  id: string;
  classname?: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const { over } = useDndContext();
  const mayOver =
    over?.id === id || over?.data.current?.sortable.containerId === id;

  return (
    <div
      ref={setNodeRef}
      className={`transition-colors border-foreground-border border ${
        isOver || mayOver ? "bg-primary/7 ring-2 ring-primary/30" : ""
      } ${classname}`}
    >
      {children}
    </div>
  );
}

export default function DndMatch({ dndmatch }: { dndmatch: DndMatch }) {
  const [activeItem, setActiveItem] = useState<Item | null>(null);

  const [response, setResponse] =
    useResponse<DndMatchResponse, DndMatch>({
      activity: dndmatch,
      initialFields: {
        submission: dndmatch.content.map((e) => ({
          category: e.category,
          matches: [],
        })),
        attempts_left: dndmatch.strict ? 3 : 1,
        partial_response: true,
      },
    });

  // Use a Map for efficient category lookups and updates.
  const [submission, setSubmission] = useState(
    () => new Map(response.submission.map((g) => [g.category, g.matches])),
  );

  // Memoize a map of all items by their ID for O(1) lookups.
  const allItems = useMemo(() => {
    const itemsMap = new Map<UniqueIdentifier, Item>();
    dndmatch.content.forEach((group) => {
      group.matches.forEach((item) => {
        itemsMap.set(id(item), item);
      });
    });
    return itemsMap;
  }, [dndmatch.content]);

  const [unmatchedItems, setUnmatchedItems] = useState(() => {
    const submittedIds = new Set(
      Array.from(submission.values())
        .flat()
        .map((item) => id(item)),
    );
    return Array.from(allItems.values())
      .filter((item) => !submittedIds.has(id(item)))
      .sort(() => Math.random() - 0.5);
  });

  // Effect to synchronize the internal Map state back to the useResponse hook.
  useEffect(() => {
    const submissionArray = Array.from(submission.entries()).map(
      ([category, matches]) => ({ category, matches: Array.from(matches) }),
    );
    setResponse((prev) => ({
      ...prev,
      submission: submissionArray,
    }));
  }, [submission]);

  const [itemValidation, setItemValidation] = useState(
    new Map<UniqueIdentifier, boolean>(),
  );

  // correctAnswers already uses Map and Set, which is great.
  const correctAnswers = useMemo(() => {
    const out = new Map<string, Set<UniqueIdentifier>>();
    dndmatch.content.forEach((group) => {
      out.set(group.category, new Set(group.matches.map((item) => id(item))));
    });
    return out;
  }, [dndmatch.content]);

  const handleDragStart = useCallback(
    (e: DragStartEvent) => {
      if (response.partial_response) setItemValidation(new Map());
      setActiveItem(allItems.get(e.active.id) ?? null);
    },
    [response.partial_response, allItems],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveItem(null);
      const { active, over } = event;
      if (!over || !active.id || active.id === over.id) return;
      const getCategoryName = (containerId: string) =>
        containerId.replace(/^category-/, "");

      const activeId = active.id;
      const overId = over.id;
      const sourceContainerId = getCategoryName(
        active.data.current?.sortable.containerId as string,
      );
      const destContainerId = getCategoryName(
        (over.data.current?.sortable.containerId || over.id) as string,
      );
      const draggedItem = allItems.get(activeId);
      if (!draggedItem) return;

      // Reordering within the same container
      if (sourceContainerId === destContainerId) {
        if (sourceContainerId === "unmatched") {
          setUnmatchedItems((items) => {
            const oldIndex = items.findIndex((item) => id(item) === activeId);
            const newIndex = items.findIndex((item) => id(item) === overId);
            return arrayMove(items, oldIndex, newIndex);
          });
        } else {
          setSubmission((currentSubmission) => {
            const newSubmission = new Map(currentSubmission);
            const items = newSubmission.get(sourceContainerId) || [];
            const oldIndex = items.findIndex((item) => id(item) === activeId);
            const newIndex = items.findIndex((item) => id(item) === overId);
            newSubmission.set(
              sourceContainerId,
              arrayMove(items, oldIndex, newIndex),
            );
            return newSubmission;
          });
        }
      }
      // Moving between containers
      else {
        // Create new copies for immutable update
        let newUnmatchedItems = [...unmatchedItems];
        const newSubmission = new Map(submission);

        // Remove from source
        if (sourceContainerId === "unmatched") {
          newUnmatchedItems = newUnmatchedItems.filter(
            (item) => id(item) !== activeId,
          );
        } else {
          const sourceItems =
            newSubmission
              .get(sourceContainerId)
              ?.filter((item) => id(item) !== activeId) || [];
          newSubmission.set(sourceContainerId, sourceItems);
        }

        // Add to destination
        if (destContainerId === "unmatched") {
          const overIndex = newUnmatchedItems.findIndex(
            (item) => id(item) === overId,
          );
          if (overIndex > -1) {
            newUnmatchedItems.splice(overIndex, 0, draggedItem);
          } else {
            newUnmatchedItems.push(draggedItem);
          }
        } else {
          const destItems = [...(newSubmission.get(destContainerId) || [])];
          const overIndex = destItems.findIndex((i) => id(i) === overId);
          if (overIndex > -1) {
            destItems.splice(overIndex, 0, draggedItem);
          } else {
            destItems.push(draggedItem);
          }
          newSubmission.set(destContainerId, destItems);
        }

        setUnmatchedItems(newUnmatchedItems);
        setSubmission(newSubmission);
      }
    },
    [allItems, unmatchedItems, submission],
  );

  const dispatch = useDispatch<AppDispatch>()

  const handleCheck = useCallback(() => {
    const { strict } = dndmatch;
    const newItemValidation = new Map<UniqueIdentifier, boolean>();
    let allCorrect = true;

    if (!strict) {
      for (const [, submittedItems] of submission.entries()) {
        submittedItems.forEach((item) => {
          newItemValidation.set(id(item), true);
        });
      }
    } else {
      const matched = new Set();

      for (const [category, submittedItems] of submission.entries()) {
        const correctItems = correctAnswers.get(category);
        if (!correctItems) {
          submittedItems.forEach((item) => {
            newItemValidation.set(id(item), false);
          });
          allCorrect = false;
          continue;
        }

        for (const item of submittedItems) {
          const itemId = id(item);
          if (correctItems.has(itemId)) {
            newItemValidation.set(itemId, true);
            matched.add(itemId);
          } else {
            newItemValidation.set(itemId, false);
            allCorrect = false;
          }
        }
      }

      const totalCorrectItems = Array.from(correctAnswers.values()).reduce(
        (acc, set) => acc + set.size,
        0,
      );

      if (matched.size !== totalCorrectItems || unmatchedItems.length > 0) {
        allCorrect = false;
      }
    }

    setItemValidation(newItemValidation);
    setResponse((prev) => {
      const newAttemptsLeft = prev.attempts_left - 1;
      const newPartialResponse =  !(!strict || allCorrect || newAttemptsLeft <= 0);
            
      
      
      return ({
      ...prev,
      partial_response: newPartialResponse,
      attempts_left: newPartialResponse ? prev.attempts_left - 1 : 0,
    })});
    if (!response.partial_response) dispatch(saveCurrentResponseThunk());
  }, [
    submission,
    correctAnswers,
    dndmatch,
    setResponse,
    unmatchedItems.length,
    response.partial_response,
    dispatch,
  ]);

  useEffect(() => {
    if (!response.partial_response) {
      handleCheck();
    }
  }, []);

  const handleReset = useCallback(() => {
    setSubmission(new Map(dndmatch.content.map((e) => [e.category, []])));
    setUnmatchedItems(Array.from(allItems.values()));
    setItemValidation(new Map());
  }, [dndmatch.content, allItems]);

  return (
    <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <div className="flex w-full flex-col items-center px-4 md:px-15">
        <div className="grid w-full grid-cols-1 space-y-4">
          {Array.from(submission.entries()).map(([categoryName, items]) => (
            <SortableContext
              key={categoryName}
              id={`category-${categoryName}`}
              items={items.map((i) => id(i))}
            >
              <DroppableCategory
                id={`category-${categoryName}`}
                classname="rounded-xl bg-background p-2"
              >
                <div className="flex flex-col">
                  <h3 className="mb-3 text-lg font-semibold">{categoryName}</h3>
                  <div className="grid min-h-25 grid-cols-1 gap-4 p-2 break-words whitespace-break-spaces transition-colors md:grid-cols-4 lg:grid-cols-6">
                    {items.map((m) => (
                      <Draggable
                        key={id(m)}
                        item={m}
                        isDraggable={response.partial_response}
                        isCorrect={itemValidation.get(id(m))}
                      />
                    ))}
                  </div>
                </div>
              </DroppableCategory>
            </SortableContext>
          ))}
        </div>

        <SortableContext
          id="category-unmatched"
          items={unmatchedItems.map((i) => id(i))}
        >
          <DroppableCategory
            id="category-unmatched"
            classname="mt-4 w-full md:w-3/4 rounded-xl bg-background p-2"
          >
            <div className="flex flex-col">
              <h3 className="mb-3 text-lg font-semibold">Item Bank</h3>
              <div className="grid min-h-25 grid-cols-1 gap-4 rounded p-2 transition-colors md:grid-cols-4 lg:grid-cols-5">
                {unmatchedItems.map((m) => (
                  <Draggable
                    key={id(m)}
                    item={m}
                    isDraggable={response.partial_response}
                    isCorrect={itemValidation.size>0? false : undefined}
                  />
                ))}
              </div>
            </div>
          </DroppableCategory>
        </SortableContext>
        <div className="mt-8 flex justify-center gap-4 mb-4">
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
            Check Answers {response.attempts_left}/{dndmatch.strict ? 3 : 1}
          </button>
        </div>
        <DragOverlay>
          {activeItem ? (
            <Draggable
              item={activeItem}
              isDraggable={response.partial_response}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}