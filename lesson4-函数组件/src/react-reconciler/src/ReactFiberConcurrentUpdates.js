// Concurrent 并发

import { HostRoot } from './ReactWorkTags';

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
