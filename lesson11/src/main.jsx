/********************** 情况一：多个节点的数量和 key 相同，有的 type 不同 ************************/
// import * as React from "react";
// import { createRoot } from "react-dom/client";

// function FunctionComponent() {
//   console.log("FunctionComponent");
//   const [number, setNumber] = React.useState(0);
//   return number === 0 ? (
//     <ul key="container" onClick={() => setNumber(number + 1)}>
//       <li key="A">A</li>
//       <li key="B" id="B">
//         B
//       </li>
//       <li key="C" id="C">
//         C
//       </li>
//     </ul>
//   ) : (
//     <ul key="container" onClick={() => setNumber(number + 1)}>
//       <li key="A">A2</li>
//       <p key="B" id="B2">
//         B2
//       </p>
//       <li key="C" id="C2">
//         C2
//       </li>
//     </ul>
//   );
// }
// let element = <FunctionComponent />;
// const root = createRoot(document.getElementById("root"));
// root.render(element);

/******************************* 情况二：多个节点的key和类型全部相同，有新增节点 ********************************/
// import * as React from "react";
// import { createRoot } from "react-dom/client";

// function FunctionComponent() {
//   console.log("FunctionComponent");
//   const [number, setNumber] = React.useState(0);
//  return number === 0 ? (
//    <ul key="container" onClick={() => setNumber(number + 1)}>
//      <li key="A">A</li>
//      <li key="B" id="B">
//        B
//      </li>
//      <li key="C">C</li>
//    </ul>
//  ) : (
//    <ul key="container" onClick={() => setNumber(number + 1)}>
//      <li key="A">A</li>
//      <li key="B" id="B2">
//        B2
//      </li>
//      <li key="C">C2</li>
//      <li key="D">D</li>
//    </ul>
//  );
// }
// let element = <FunctionComponent />;
// const root = createRoot(document.getElementById("root"));
// root.render(element);

/**************************** 情况三：多节点的key和类型全部相同，有删除老节点 ****************************/
// import * as React from "react";
// import { createRoot } from "react-dom/client";

// function FunctionComponent() {
//   console.log("FunctionComponent");
//   const [number, setNumber] = React.useState(0);
//  return number === 0 ? (
//    <ul key="container" onClick={() => setNumber(number + 1)}>
//      <li key="A">A</li>
//      <li key="B" id="B">
//        B
//      </li>
//      <li key="C">C</li>
//    </ul>
//  ) : (
//    <ul key="container" onClick={() => setNumber(number + 1)}>
//      <li key="A">A</li>
//      <li key="B" id="B2">
//        B2
//      </li>
//    </ul>
//  );
// }
// let element = <FunctionComponent />;
// const root = createRoot(document.getElementById("root"));
// root.render(element);


/************************ 情况四：多节点数量不同key不同 **************************/
import * as React from "react";
import { createRoot } from "react-dom/client";

function FunctionComponent() {
  console.log("FunctionComponent");
  const [number, setNumber] = React.useState(0);
  return number === 0 ? (
    <ul key="container" onClick={() => setNumber(number + 1)}>
     <li key="A">A</li>
     <li key="B" id="b">
       B
     </li>
     <li key="C">C</li>
     <li key="D">D</li>
     <li key="E">E</li>
     <li key="F">F</li>
    </ul>
  ) : (
    <ul key="container" onClick={() => setNumber(number + 1)}>
     <li key="A">A2</li>
     <li key="C">C2</li>
     <li key="E">E2</li>
     <li key="B" id="b2">
       B2
     </li>
     <li key="G">G</li>
     <li key="D">D2</li>
    </ul>
  );
}
let element = <FunctionComponent />;
const root = createRoot(document.getElementById("root"));
root.render(element);
