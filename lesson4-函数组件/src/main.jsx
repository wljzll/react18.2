import { createRoot } from "react-dom/client";

function FunctionComponent() {
  return (
    <h1>
      hello<span style={{ color: "red" }}>    world</span>
    </h1>
  )
}


let element = <FunctionComponent />
console.log(element);
const root = createRoot(document.getElementById("root"));
root.render(element);
