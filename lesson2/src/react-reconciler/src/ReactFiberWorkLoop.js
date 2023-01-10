import { scheduleCallback } from 'scheduler';
import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";

let workInProgress = null; // 声明全局的根fiber的替身

/**
 * @description 在fiber上调度更新
 * @param {*} root
 */
export function scheduleUpdateOnFiber(root) {
  ensureRootIsScheduled(root);
}

/**
 * @description 确保根fiber调度了
 * @param {*} root
 */
function ensureRootIsScheduled(root) {
  scheduleCallback(performConcurrentWorkOnRoot.bind(null, root));
}

/**
 * @description
 * @param {*} root
 */
function performConcurrentWorkOnRoot(root) {
  renderRootSync(root);
}

/**
 * @description 准备刷新栈
 * @param {*} root
 */
function prepareFreshStack(root) {
  // 创建当前fiber的替身并赋值给workInProgress
  workInProgress = createWorkInProgress(root.current, null);
  console.log(workInProgress);
}

/**
 * @description 同步渲染root
 * @param {*} root
 */
function renderRootSync(root) {
  prepareFreshStack(root);
  workLoopSync();
}

/**
 * @description 同步执行工作循环
 */
function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

/**
 * @description 执行工作单元
 * @param {*} unitOfWork 当前fiber的替身
 */
function performUnitOfWork(unitOfWork) {
  // 老fiber
  const current = unitOfWork.alternate;
  // 开始工作
  const next = beginWork(current, unitOfWork);
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  if (next === null) {
    //completeUnitOfWork(unitOfWork);
    workInProgress = null;
  } else {
    workInProgress = next;
  }
}
