import * as React from 'react';
import { createRoot } from "react-dom/client";

function reducer(state, action) {
  if (action.type === 'add') return state + 1;
  return state;
}

function FunctionComponent1() {
  const [number1, setNumber1] = React.useReducer(reducer, 1);
  const [number2, setNumber2] = React.useReducer(reducer, 2);
  return <button onClick={() => {
    debugger
    setNumber1({ type: 'add', payload: 1 })
    setNumber1({ type: 'add', payload: 2 })
    setNumber1({ type: 'add', payload: 3 })
  }}>{number1}</button>
}


let element1 = <FunctionComponent1 />
// let element2 = <FunctionComponent2 />
console.log(element1);
const root = createRoot(document.getElementById("root"));
root.render(<div>
  <FunctionComponent1 />
  {/* <FunctionComponent2 /> */}
</div>);
