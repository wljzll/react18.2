import { markUpdateLaneFromFiberToRoot } from './ReactFiberConcurrentUpdates';

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
 *
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
  } else { // 不是第一次 构造闭环链表
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
