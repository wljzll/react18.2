import { markUpdateLaneFromFiberToRoot } from './ReactFiberConcurrentUpdates';
import assign from "shared/assign";

export const UpdateState = 0;
/**
 * @description 给fiber上挂载updateQueue属性指向queue对象 也就是初始化fiber的更新队列
 * @param {*} fiber 根Fiber
 */
export function initializeUpdateQueue(fiber) {
  // 创建queue对象
  const queue = {
    shared: {
      pending: null,
    },
  };
  // 将queue对象挂在到fiber的updateQueue属性上
  fiber.updateQueue = queue;
}

/**
 * @description 创建update对象并返回
 * @returns 返回创建的update
 */
export function createUpdate() {
  const update = { tag: UpdateState };
  return update;
}

/**
 * @description 构建fiber的update闭环链表
 * @param {*} fiber 根fiber
 * @param {*} update {tag: 0, payload: {element}}
 * @returns div#root
 */
export function enqueueUpdate(fiber, update) {
  // 获取fiber上的updateQueue
  const updateQueue = fiber.updateQueue;
  // 拿到updateQueue上的shared
  const sharedQueue = updateQueue.shared;
  // 拿到shared的pending
  const pending = sharedQueue.pending;
  // 如果pending为null
  if (pending === null) {
    // 说明是第一次 将update的next指向自己
    update.next = update; // {tag: 0, payload: {element}, next: update}
  } else {
    // 不是第一次 构造闭环链表
    // 将最新的update的next指向上一个老的update
    update.next = pending.next;
    // pending的next就是上一个update 将上一个update的next指向最新的update
    pending.next = update;
  }
  // pending指向最新的update
  updateQueue.shared.pending = update;
  // 目前是返回div#root
  return markUpdateLaneFromFiberToRoot(fiber);
}

function getStateFromUpdate(update, prevState) {
  switch (update.tag) {
    case UpdateState: {
      const { payload } = update;
      const partialState = payload;
      return assign({}, prevState, partialState);
    }
    default:
      return prevState;
  }
}


/**
 * @description 合并更新并更新到 memoizedState上
 * @param {*} workInProgress
 */
export function processUpdateQueue(workInProgress) {
  const queue = workInProgress.updateQueue;
  // 保存pending
  const pendingQueue = queue.shared.pending;
  if (pendingQueue !== null) {
    // 清空fiber的updateQueue的pending
    queue.shared.pending = null;
    // 拿到最后的更新也就是pending指向的那一个 这个是最后添加到链表里的
    const lastPendingUpdate = pendingQueue; // {next, payload, tag}
    // 获取第一个更新
    const firstPendingUpdate = lastPendingUpdate.next;
    // 剪断链表的环 成为了单链表
    lastPendingUpdate.next = null;
    // 获取初始的memoizedState 初始为null
    let newState = workInProgress.memoizedState;
    // 拿到第一个更新
    let update = firstPendingUpdate;
    // 只要update存在 就一直处理合并
    while (update) {
      newState = getStateFromUpdate(update, newState);
      update = update.next;
    }
    // 最后将合并后的state赋值到memoizedState上
    workInProgress.memoizedState = newState;
  }
}
