import { Modifier } from "@dnd-kit/core";

export const snapCenterToCursor: Modifier = ({
    transform,
    activatorEvent,
    draggingNodeRect,
    overlayNodeRect,
}) => {
    if (!activatorEvent || !draggingNodeRect || !overlayNodeRect) {
        return transform;
    }

    const activatorCoordinates = {
        x: 'clientX' in activatorEvent ? activatorEvent.clientX : (activatorEvent as any).touches[0].clientX,
        y: 'clientY' in activatorEvent ? activatorEvent.clientY : (activatorEvent as any).touches[0].clientY,
    };

    const offsetX = activatorCoordinates.x - draggingNodeRect.left;
    const offsetY = activatorCoordinates.y - draggingNodeRect.top;

    const shiftX = offsetX - (overlayNodeRect.width / 2);
    const shiftY = offsetY - (overlayNodeRect.height / 2);

    return {
        ...transform,
        x: transform.x + shiftX,
        y: transform.y + shiftY,
    };
};