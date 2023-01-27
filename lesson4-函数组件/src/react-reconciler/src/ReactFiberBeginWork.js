import { HostRoot, HostComponent, HostText, IndeterminateComponent, FunctionComponet } from "./ReactWorkTags";
import { processUpdateQueue } from "./ReactFiberClassUpdateQueue";
import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";
import { shouldSetTextContent } from "react-dom-bindings/src/client/ReactDOMHostConfig";
import logger, { indent } from "shared/logger";
import { renderWithHooks } from "./ReactFiberHooks";

/**
 * 根据新的虚拟DOM生成新的Fiber链表
 * @param {*} current 老的父fiber
 * @param {*} workInProgress 老fiber的替身
 * @param {*} nextChildren fiber的儿子的Virtual DOM
 */
function reconcileChildren(current, workInProgress, nextChildren) {
  // 如果此新fiber没有老fiber 说明此新fiber是新创建的
  if (current === null) {
    // 挂载子fiber链表
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  } else {
    // 有老fiber和老fiber的替身
    // 如果没有老fiber的话 做DOM-DIFF 拿老的子fiber链表和新的子虚拟DOM进行比较　进行最小化更新
    workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren);
  }
}

/**
 *
 * @param {*} current 老fiber
 * @param {*} workInProgress 老fiber的替身
 * @returns
 */
function updateHostRoot(current, workInProgress) {
  // 处理更新队列
  processUpdateQueue(workInProgress); // workInProgress.memoizedState = {element}
  // 取出更新
  const nextState = workInProgress.memoizedState;
  // 更新队列中的element就是当前fiber的子元素 使用element的Virtual DOM构建子fiber
  const nextChildren = nextState.element;
  // 协调子节点 DOM-DIFF算法 根据新的虚拟DOM生成子fiber链表
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child; // {tag: 5, type: 'h1'}
}


/**
 * @description 构建原生组件的子Fiber链表
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber h1
 * @returns 
 */
function updateHostComponent(current, workInProgress) {
  // 获取fiber的type
  const { type } = workInProgress;
  // 获取fiber对应的虚拟DOM的props pendingProps来源于element.props
  const nextProps = workInProgress.pendingProps;
  let nextChildren = nextProps.children;
  // 判断当前虚拟DOM它的儿子是不是一个文本独生子
  const isDirectTextChild = shouldSetTextContent(type, nextProps);
  // 如果是的话
  if (isDirectTextChild) {
    // 将儿子清空
    nextChildren = null;
  }
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

/**
 * @description 挂载函数式组件
 * @param {*} current 
 * @param {*} workInProgress 
 * @param {*} ComponentProps 
 */
export function mountIndeterminateComponent(current, workInProgress, Component) {
  const props = workInProgress.pendingProps;
  const value = renderWithHooks(null, workInProgress, Component, props);
  workInProgress.tag = FunctionComponet;
  reconcileChildren(null, workInProgress, value);
  return workInProgress.child;
}

/**
 * @description 根据虚拟DOM 构建新的fiber子链表
 * @param {*} current 老fiber
 * @param {*} workInProgress 老fiber的替身
 * @returns
 */
export function beginWork(current, workInProgress) {
  logger(" ".repeat(indent.number) + "beginWork", workInProgress);
  // 判断老fiber替身的类型
  switch (workInProgress.tag) {
    // 因为在React里组件其实有两种 一种是函数组件 一种是类组件 但是它们都是函数
    case IndeterminateComponent:
      return mountIndeterminateComponent(current, workInProgress, workInProgress.type);
    case HostRoot: // 根fiber
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case HostText:
    default:
      return null;
  }
}
