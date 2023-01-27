import { createRoot } from "react-dom/client";

function FunctionComponent() {
  return (
    <h1 onClick={() => { console.log('ParentBubble') }} onClickCapture={() => { console.log('ParentCapture') }}>
      <span onClick={() => { console.log('ChildBubble') }} onClickCapture={() => { console.log('ChildCapture') }}>    world</span>
    </h1>
  )
}


let element = <FunctionComponent />
console.log(element);
const root = createRoot(document.getElementById("root"));
root.render(element);
