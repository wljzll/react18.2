import { HostRoot, HostComponent, HostText } from "./ReactWorkTags";
import { processUpdateQueue } from "./ReactFiberClassUpdateQueue";
import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";
import { shouldSetTextContent } from "react-dom-bindings/src/client/ReactDOMHostConfig";
import logger, { indent } from "shared/logger";

/**
 *
 * @param {*} current 老fiber
 * @param {*} workInProgress 老fiber的替身
 * @param {*} nextChildren fiber的儿子的Virtual DOM
 */
function reconcileChildren(current, workInProgress, nextChildren) {
  if (current === null) {
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  } else {
    // 有老fiber和老fiber的替身
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
  // 将更新队列合并后添加到fiber的memoizedState上
  processUpdateQueue(workInProgress);
  console.log('workInProgressworkInProgressworkInProgress', workInProgress);
  // 取出更新
  const nextState = workInProgress.memoizedState;
  // 更新队列中的element就是当前fiber的子元素 使用element的Virtual DOM构建子fiber
  const nextChildren = nextState.element;
  // 协调儿子
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

function updateHostComponent(current, workInProgress) {
  const { type } = workInProgress;
  const nextProps = workInProgress.pendingProps;
  let nextChildren = nextProps.children;
  const isDirectTextChild = shouldSetTextContent(type, nextProps);
  if (isDirectTextChild) {
    nextChildren = null;
  }
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

/**
 *
 * @param {*} current 老fiber
 * @param {*} workInProgress 老fiber的替身
 * @returns
 */
export function beginWork(current, workInProgress) {
  logger(" ".repeat(indent.number) + "beginWork", workInProgress);
  // 判断老fiber替身的类型
  switch (workInProgress.tag) {
    case HostRoot: // 根fiber
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case HostText:
    default:
      return null;
  }
}
