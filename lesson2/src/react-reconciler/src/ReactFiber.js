import { HostRoot } from './ReactWorkTags';
import { NoFlags } from './ReactFiberFlags';
export function FiberNode(tag, pendingProps, key) {
  this.tag = tag;
  this.key = key;
  this.type = null;
  this.stateNode = null;

  this.return = null;
  this.child = null;
  this.sibling = null;

  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.updateQueue = null;
  this.memoizedState = null;

  this.flags = NoFlags;
  this.subtreeFlags = NoFlags;
  this.alternate = null;
}

/**
 *
 * @param {*} tag 定义的根fiber的tag
 * @param {*} pendingProps 属性 默认是null
 * @param {*} key key 默认是null
 * @returns 返回fiber实例
 */
function createFiber(tag, pendingProps, key) {
  // new 一个fiberNode实例并返回
  return new FiberNode(tag, pendingProps, key);
}

/**
 * 创建根fiber
 * @returns 根fiber
 */
export function createHostRootFiber() {
  return createFiber(HostRoot, null, null);
}

// We use a double buffering pooling technique because we know that we'll
// only ever need at most two versions of a tree. We pool the "other" unused
// node that we're free to reuse. This is lazily created to avoid allocating
// extra objects for things that are never updated. It also allow us to
// reclaim the extra memory if needed.
//我们使用双缓冲池技术，因为我们知道一棵树最多只需要两个版本
//我们将“其他”未使用的我们可以自由重用的节点
//这是延迟创建的，以避免分配从未更新的内容的额外对象。它还允许我们如果需要，回收额外的内存
export function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    workInProgress = createFiber(current.tag, pendingProps, current.key);
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
  }
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  return workInProgress;
}
