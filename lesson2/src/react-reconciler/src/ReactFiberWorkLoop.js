import { scheduleCallback } from 'scheduler';
import { createWorkInProgress } from "./ReactFiber";

let workInProgress = null;
export function scheduleUpdateOnFiber(root) {
  ensureRootIsScheduled(root);
}
function ensureRootIsScheduled(root) {
  scheduleCallback(performConcurrentWorkOnRoot.bind(null, root));
}
function performConcurrentWorkOnRoot(root) {
  renderRootSync(root);
}
function prepareFreshStack(root) {
  // 创建当前fiber的替身
  workInProgress = createWorkInProgress(root.current, null);
  console.log(workInProgress);
}
function renderRootSync(root) {
  prepareFreshStack(root);
  workLoopSync();
}

function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(unitOfWork) {
  const current = unitOfWork.alternate;
  const next = beginWork(current, unitOfWork);
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  if (next === null) {
    //completeUnitOfWork(unitOfWork);
    workInProgress = null;
  } else {
    workInProgress = next;
  }
}
