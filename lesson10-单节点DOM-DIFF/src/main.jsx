// 情况一：单节点，key相同，类型也相同
import * as React from "react";
import { createRoot } from "react-dom/client";

function FunctionComponent() {
  const [number, setNumber] = React.useState(0);
  return number === 0 ? (
    <div onClick={() => setNumber(number + 1)} key="title" id="title">
      title
    </div>
  ) : (
    <div onClick={() => setNumber(number + 1)} key="title" id="title2">
      title2
    </div>
  );
}
let element = <FunctionComponent />;
const root = createRoot(document.getElementById("root"));
root.render(element);

/***************** 情况二：单节点，key不同，类型相同 ******************/
// import * as React from "react";
// import { createRoot } from "react-dom/client";

// function FunctionComponent() {
//   const [number, setNumber] = React.useState(0);
//   return number === 0 ? (
//     <div onClick={() => setNumber(number + 1)} key="title1" id="title">
//       title
//     </div>
//   ) : (
//     <div onClick={() => setNumber(number + 1)} key="title2" id="title2">
//       title2
//     </div>
//   );
// }
// let element = <FunctionComponent />;
// const root = createRoot(document.getElementById("root"));
// root.render(element);

/************************** 情况三：单节点key相同，类型不同 *********************/
// import * as React from "react";
// import { createRoot } from "react-dom/client";

// function FunctionComponent() {
//   const [number, setNumber] = React.useState(0);
//   return number === 0 ? (
//     <div onClick={() => setNumber(number + 1)} key="title1" id="title1">
//       title1
//     </div>
//   ) : (
//     <p onClick={() => setNumber(number + 1)} key="title1" id="title1">
//       title1
//     </p>
//   );
// }
// let element = <FunctionComponent />;
// const root = createRoot(document.getElementById("root"));
// root.render(element);

/************************** 情况四：原来多节点，现在单节点  ***************************/
// import * as React from "react";
// import { createRoot } from "react-dom/client";

// function FunctionComponent() {
//   const [number, setNumber] = React.useState(0);
//   return number === 0 ? (
//     <ul key="container" onClick={() => setNumber(number + 1)}>
//       <li key="A">A</li>
//       <li key="B" id="B">
//         B
//       </li>
//       <li key="C">C</li>
//     </ul>
//   ) : (
//     <ul key="container" onClick={() => setNumber(number + 1)}>
//       <li key="B" id="B2">
//         B2
//       </li>
//     </ul>
//   );
// }
// let element = <FunctionComponent />;
// const root = createRoot(document.getElementById("root"));
// root.render(element);