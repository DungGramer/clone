import React, { cloneElement } from "react";
import { useDrop } from "react-dnd";
import ITEM_TYPE from "../data/types";
import { statuses } from "../data";

const DropWrapper = ({ onDrop, children, status }) => {
  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    canDrop: (item, monitor) => {
      const itemIndex = statuses.findIndex((s) => s.status === item.status);
      const statusIndex = statuses.findIndex((s) => s.status === status);

      //? Can drop if the item is being dragged to the next or previous status
      return [itemIndex + 1, itemIndex - 1].includes(statusIndex);
    },
    drop: (item, monitor) => {
      onDrop(item, monitor, status);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div ref={drop} className='drop-wrapper'>
      {cloneElement(children, { isOver })}
    </div>
  );
};

export default DropWrapper;
