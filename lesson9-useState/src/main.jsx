import * as React from 'react';
import { createRoot } from "react-dom/client";

function reducer(state, action) {
  if (action.type === 'add') return state + action.payload;
  return state;
}

function FunctionComponent1() {
  const [number, setNumber] = React.useState(0);
  return <button onClick={() => setNumber(number + 1)}>{number}</button>;
}

debugger
const root = createRoot(document.getElementById("root"));
root.render(
  <FunctionComponent1 />);
