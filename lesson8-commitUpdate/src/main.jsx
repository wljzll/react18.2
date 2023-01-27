import * as React from 'react';
import { createRoot } from "react-dom/client";

function reducer(state, action) {
  if (action.type === 'add') return state + action.payload;
  return state;
}

function FunctionComponent1() {
  const [number, setNumber1] = React.useReducer(reducer, 0);
  let attrs = { id: 'btn1' };
  if (number === 6) {
    delete attrs.id;
    attrs.style = { color: 'red' };
  }
  return <button {...attrs} onClick={() => {
    setNumber1({ type: 'add', payload: 1 })
  }}>{number}</button>
}


const root = createRoot(document.getElementById("root"));
root.render(
  <FunctionComponent1 />);
