import {
  createContainer,
  updateContainer,
} from 'react-reconciler/src/ReactFiberReconciler';
import { listenToAllSupportedEvents } from 'react-dom-bindings/src/events/DOMPluginEventSystem';

/**
 * @description 声明ReactDOMRoot构造函数 将
 * @param {*} internalRoot fiberRoot
 */
function ReactDOMRoot(internalRoot) {
  // 将fiberRoot保存在实例的_internalRoot上
  this._internalRoot = internalRoot;
}

/**
 * @description 在原型上添加render方法
 * @param {*} children 要渲染的虚拟DOM
 */
ReactDOMRoot.prototype.render = function render(children) {
  // 拿到FiberRoot
  const root = this._internalRoot;
  // 清空原有内容
  root.containerInfo.innerHTML = '';
  updateContainer(children, root);
};


/**
 * @description 创建ReactDOMRoot
 * @param {*} container div#root
 * @returns ReactDOMRoot实例
 */
export function createRoot(container) {
  // 创建的FiberRoot
  debugger;
  const root = createContainer(container);
  debugger;
  listenToAllSupportedEvents(container);
  return new ReactDOMRoot(root);
}
