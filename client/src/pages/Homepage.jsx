import React, { useState } from "react";
import { statuses } from "../data";
import DropWrapper from "../components/DropWrapper";
import Col from "../components/Col";
import Item from "../components/Item";

const Homepage = () => {
  const [items, setItems] = useState("");

  const onDrop = (item, monitor, status) => {
    const mapping = statuses.find((s) => s.status === status);

    setItems((prevState) => {
      const newItems = prevState
        .filter((i) => i.id !== item.id)
        .concat({ ...item, status, icon: mapping.icon });

      return [...newItems];
    });
  };

  const moveItem = (dragIndex, hoverIndex) => {
    const item = items[dragIndex];
    setItems((prevState) => {
      const newItems = prevState.filter((i, index) => index !== dragIndex);
      newItems.splice(hoverIndex, 0, item);
      return [...newItems];
    });
  };

  return (
    <div className='row'>
      {statuses.map((s) => (
        <div className='col-wrapper' key={s.status}>
          <h2 className='col-header'>{s.status.toUpperCase()}</h2>
          <DropWrapper onDrop={onDrop} status={s.status}>
            <Col>
              {items
                .filter((i) => i.status === s.status)
                .map((item, index) => (
                  <Item
                    key={item.id}
                    item={item}
                    index={index}
                    moveItem={moveItem}
                    status={s}
                  />
                ))}
            </Col>
          </DropWrapper>
        </div>
      ))}
    </div>
  );
};

export default Homepage;
