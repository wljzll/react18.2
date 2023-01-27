import {
  HostRoot,
  IndeterminateComponent,
  HostComponent,
  HostText,
} from './ReactWorkTags';
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
  // 已经生效的属性
  this.memoizedProps = null;
  // 每个fiber身上可能还有更新队列
  this.updateQueue = null;
  // 类组件对应的fiber 存的就是类的实例状态 HostRoot存的就是要渲染的元素
  this.memoizedState = null;
  // 副作用的标识 表示要针对此fiber节点进行何种操作
  this.flags = NoFlags;
  // 子节点对应的副作用标识
  this.subtreeFlags = NoFlags;
  // 替身 轮替
  this.alternate = null;
  this.index = 0;
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
/**
 * @description 基于老的fiber和新的属性创建新的fiber
 * @param {*} current 老fiber
 * @param {*} pendingProps 新属性
 * @returns 
 */
export function createWorkInProgress(current, pendingProps) {
  // 拿到老fiber的轮替
  let workInProgress = current.alternate;

  // 第一次是null
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

/**
 *
 * @param {*} type Virtual DOM的元素类型
 * @param {*} key Virtual DOM的key
 * @param {*} pendingProps Virtual DOM的props
 * @returns 根据Virtual DOM创建的fiber
 */
export function createFiberFromTypeAndProps(type, key, pendingProps) {
  // 未确定的类型
  let fiberTag = IndeterminateComponent;
  // 如果元素类型是string　说明此Fiber类型是一个原生组件　div span
  if (typeof type === 'string') {
    // 给fiberTag赋值
    fiberTag = HostComponent;
  }
  // 创建fiber
  const fiber = createFiber(fiberTag, pendingProps, key);
  // 给fiber的type赋值
  fiber.type = type;
  // 返回fiber
  return fiber;
}

/**
 *
 * @param {*} element 对应元素的虚拟DOM
 * @returns
 */
export function createFiberFromElement(element) {
  // 解构出type
  const { type } = element;
  // 解构出key
  const { key } = element;
  // 拿到props
  const pendingProps = element.props;
  const fiber = createFiberFromTypeAndProps(type, key, pendingProps);
  return fiber;
}

/**
 * 为文本(包括数字)创建fiber节点
 * @param {*} content 文本或者数字内容
 * @returns 
 */
export function createFiberFromText(content) {
  const fiber = createFiber(HostText, content, null);
  return fiber;
}
