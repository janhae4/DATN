import { Task } from "@/types";
export const POSITION_GAP = 65535;

/**
 * Calculates a new position based on the neighbors.
 * * @param prevPos - The position of the item BEFORE the insertion point (undefined if inserting at start).
 * @param nextPos - The position of the item AFTER the insertion point (undefined if inserting at end).
 * @returns The calculated new position (number).
 */
export function calculatePosition(prevPos?: number, nextPos?: number): number {
  // Case 1: List is empty (No prev, No next)
  if (prevPos === undefined && nextPos === undefined) {
    return POSITION_GAP;
  }

  // Case 2: Moving to the start of the list (No prev)
  // We halve the first item's position.
  if (prevPos === undefined && nextPos !== undefined) {
    return nextPos / 2;
  }

  // Case 3: Moving to the end of the list (No next)
  // We take the last item's position and add the GAP.
  if (prevPos !== undefined && nextPos === undefined) {
    return prevPos + POSITION_GAP;
  }

  // Case 4: Moving between two items (Both prev and next exist)
  // We take the average (midpoint).
  if (prevPos !== undefined && nextPos !== undefined) {
    return (prevPos + nextPos) / 2;
  }

  return POSITION_GAP;
}


/**
 * Hàm xử lý Drag End chung
 * @param activeId - ID task đang kéo
 * @param overId - ID task bị đè lên (hoặc container)
 * @param visibleTasks - Danh sách task ĐANG HIỂN THỊ trong container đó (đã sort)
 */
export const calculateNewPositionForTask = (activeId: string, overId: string, visibleTasks: Task[]) => {
  const oldIndex = visibleTasks.findIndex(t => t.id === activeId);
  const newIndex = visibleTasks.findIndex(t => t.id === overId);

  const newOrderList = [...visibleTasks];
  const [movedItem] = newOrderList.splice(oldIndex, 1);
  newOrderList.splice(newIndex, 0, movedItem);

  const prevTask = newOrderList[newIndex - 1];
  const nextTask = newOrderList[newIndex + 1];

  // Tính toán
  return calculatePosition(prevTask?.position, nextTask?.position);
};