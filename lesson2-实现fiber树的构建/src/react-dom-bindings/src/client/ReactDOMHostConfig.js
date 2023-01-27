



/**
 * @description 判断当前的fiber的儿子是不是一个单独的文本
 * @param {*} type 
 * @param {*} props 
 * @returns 
 */
export function shouldSetTextContent(type, props) {
  return typeof props.children === "string" || typeof props.children === "number";
}
