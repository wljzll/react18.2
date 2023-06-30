import * as React from 'react';
import { createRoot } from "react-dom/client";

function reducer(state, action) {
  if (action.type === 'add') return state + 1;
  return state;
}

function FunctionComponent() {
  debugger;
  const [number1, setNumber1] = React.useReducer(reducer, 1);
  const [number2, setNumber2] = React.useReducer(reducer, 2);
  const [number3, setNumber3] = React.useReducer(reducer, 3);

  return <button onClick={() => {
    setNumber1({ type: 'add', payload: 1 })
    setNumber1({ type: 'add', payload: 2 })
    setNumber1({ type: 'add', payload: 3 })
  }}>{number1}</button>
}


let element = <FunctionComponent />
console.log(element);
const root = createRoot(document.getElementById("root"));
root.render(element);
