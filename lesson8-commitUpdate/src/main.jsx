// import * as React from 'react';
// import { createRoot } from "react-dom/client";

// function reducer(state, action) {
//   if (action.type === 'add') return state + action.payload;
//   return state;
// }

// function FunctionComponent1() {
//   const [number, setNumber1] = React.useReducer(reducer, 0);
//   let attrs = { id: 'btn1' };
//   if (number === 6) {
//     delete attrs.id;
//     attrs.style = { color: 'red' };
//   }
//   return <button {...attrs} onClick={() => {
//     setNumber1({ type: 'add', payload: 1 })
//   }}>{number}</button>
// }


// const root = createRoot(document.getElementById("root"));
// root.render(
//   <FunctionComponent1 />);


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
    setNumber1({ type: 'add', payload: 1 })
    setNumber2({ type: 'add', payload: 2 })
    // setNumber1({ type: 'add', payload: 3 })
  }}>{number1}</button>
}


let element1 = <FunctionComponent1 />
// let element2 = <FunctionComponent2 />
console.log(element1);
const root = createRoot(document.getElementById("root"));
root.render(<FunctionComponent1 />);
