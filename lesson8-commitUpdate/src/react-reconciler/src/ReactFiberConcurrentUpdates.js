// Concurrent 并发
import { HostRoot } from './ReactWorkTags';

// 并发更新队列
const concurrentQueue = [];
// 并发更新队列索引
let concurrentQueueIndex = 0;

/**
 * 
 */
export function finishQueueingConcurrentUpdates() {
  const endIndex = concurrentQueueIndex;
  concurrentQueueIndex = 0;
  let i = 0;
  while (i < endIndex) {
    const fiber = concurrentQueue[i++];
    const queue = concurrentQueue[i++]; // {pending: null}
    const update = concurrentQueue[i++]; // { action, // {type: 'add', payload: 1} next: null,}
    if (queue !== null && update !== null) {
      const pending = queue.pending;
      if (pending === null) {
        update.next = update;
      } else {
        update.next = pending.next;
        pending.next = update;
      }
      queue.pending = update;
    }
  }
}

/**
 * @description 把更新队列添加到更新队列中
 * @param {*} fiber 函数组件对应的fiber
 * @param {*} queue 要更新的hook对应的更新队列
 * @param {*} update 更新对象
 */
export function enqueueConcurrentHookUpdate(fiber, queue, update) {
  enqueueUpdate(fiber, queue, update);
  return getRootForUpdateFiber(fiber);
}

function getRootForUpdateFiber(sourceFiber) {
  let node = sourceFiber;
  let parent = node.return;
  while (parent !== null) {
    node = parent;
    parent = node.return;
  }
  // FiberRootNode div#root
  return node.tag === HostRoot ? node.stateNode : null;
}

/**
 * @description 把更新先缓存到concurrentQueue数组中
 * @param {*} fiber 
 * @param {*} queue 
 * @param {*} update 
 */
function enqueueUpdate(fiber, queue, update) {
  // 012 setNumber1 345 setNumber2 678 setNumber3
  concurrentQueue[concurrentQueueIndex++] = fiber;
  concurrentQueue[concurrentQueueIndex++] = queue;
  concurrentQueue[concurrentQueueIndex++] = update;
  console.log(concurrentQueue, 'concurrentQueue');
}
/**
 * @description 找到根DOM元素 本来这个风法要处理更新优先级的问题
 * @param {*} sourceFiber 根fiber
 * @returns
 */
export function markUpdateLaneFromFiberToRoot(sourceFiber) {
  let node = sourceFiber;
  // 获取根fiber的return属性 也就是当前fiber的父fiber
  let parent = sourceFiber.return;
  // 如果parent不为null就递归往上找
  while (parent !== null) {
    node = parent;
    parent = parent.return;
  }
  // 如果fiber的tag是根fiber
  if (node.tag === HostRoot) {
    // 拿到div#root
    const root = node.stateNode;
    // 返回div#root
    return root;
  }
  return null;
}
