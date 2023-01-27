import { setInitialProperties } from "./ReactDOMComponent";




/**
 * @description 判断当前的fiber的儿子是不是一个单独的文本
 * @param {*} type 
 * @param {*} props 
 * @returns 
 */
export function shouldSetTextContent(type, props) {
  return typeof props.children === "string" || typeof props.children === "number";
}

/**
 * @description 创建文本节点的DOM元素
 * @param {*} content 文本节点fiber的文本内容
 * @returns 
 */
export function createTextInstance(content) {
  return document.createTextNode(content);
}

/**
 * @description 创建真实DOM元素
 * @param {*} type fiber对应的真实DOM的标签名
 * @param {*} props 真实DOM的属性
 * @returns 
 */
export function createInstance(type) {
  const domElement = document.createElement(type);
  // 更新fiber属性
  // updateFiberProps(domElement, props)
  return domElement;
}


/**
 * @description 将子DOM节点追加到父DOM节点中
 * @param {*} parent 父DOM节点
 * @param {*} child 子DOM节点
 */
export function appendInitialChild(parent, child) {
  parent.appendChild(child);
}

/**
 * 
 * @param {*} domElement 
 * @param {*} type 
 * @param {*} props 
 */
export function finalizeInitialChildren(domElement, type, props) {
  setInitialProperties(domElement, type, props);
}


/**
 * @description 将儿子插入到父DOM中
 * @param {*} parentInstance 父DOM
 * @param {*} child 子DOM
 */
export function appendChild(parentInstance, child) {
  parentInstance.appendChild(child);
}

export function insertBefore(parparentInstanceent, beforeChild) {
  parentInstance.insertBefore(child, beforeChild);
}