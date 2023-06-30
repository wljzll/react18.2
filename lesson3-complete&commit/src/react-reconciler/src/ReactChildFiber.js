import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import isArray from 'shared/isArray';
import {
  createFiberFromElement,
  FiberNode,
  createFiberFromText,
} from './ReactFiber';
import { Placement } from './ReactFiberFlags';
import { HostText } from './ReactWorkTags';

/**
 * @description 创建子元素协调方法的工厂函数
 * @param {*} shouldTrackSideEffects 是否跟踪副作用
 * @returns 闭包 返回reconcileChildFibers函数
 */
function createChildReconciler(shouldTrackSideEffects) {

  /**
   * 
   * @param {*} returnFiber 替身fiber
   * @param {*} currentFirstChild 老fiber的儿子 null
   * @param {*} element 子元素的虚拟DOM
   * @returns 创建的fiber
   */
  function reconcileSingleElement(returnFiber, currentFirstChild, element) {
    debugger;
    // 根据元素的虚拟DOM创建fiber
    const created = createFiberFromElement(element);
    // 当前创建的fiber的return属性指向替身fiber 也就是指向自己的父亲
    created.return = returnFiber;
    // 返回创建的fiber
    return created;
  }

  /**
   * @description 放置单个儿子 设置副作用
   * @param {*} newFiber 创建的子fiber
   * @returns
   */
  function placeSingleChild(newFiber) {
    // 如果要收集依赖则 |上Placement 要在最后的提交阶段插入此节点 
    if (shouldTrackSideEffects) newFiber.flags |= Placement;
    return newFiber;
  }

  function reconcileSingleTextNode(returnFiber, currentFirstChild, content) {
    const created = new FiberNode(HostText, { content }, null);
    created.return = returnFiber;
    return created;
  }
  
  /**
   * 
   * @param {*} returnFiber 父fiber
   * @param {*} newChild 新儿子
   * @returns 
   */
  function createChild(returnFiber, newChild) {
    // 说明这个一个文本：数字或者文字
    if (
      (typeof newChild === 'string' && newChild !== '') ||
      typeof newChild === 'number'
    ) {
      const created = createFiberFromText(`${newChild}`);
      created.return = returnFiber;
      return created;
    }
    
    // 说明这里可能是一个React元素
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const created = createFiberFromElement(newChild);
          created.return = returnFiber;
          return created;
        }
        default:
          break;
      }
    }
    return null;
  }
  
  /**
   * 放置新fiber
   * @param {*} newFiber 新fiber
   * @param {*} newIndex 索引
   */
  function placeChild(newFiber, newIndex) {
    newFiber.index = newIndex;
    // 如果一个fiber它的flags上有Placement, 说明此节点需要创建真实DOM并插入到父容器中
    // 如果父fiber节点是初次挂在 shouldTrackSideEffects=false 不需要添加flags
    // 这种情况下会在完成阶段把所有的子节点全部添加到自己身上
    debugger;
    if (shouldTrackSideEffects) newFiber.flags |= Placement;
  }

  /**
   * 
   * @param {*} returnFiber 
   * @param {*} currentFirstChild null
   * @param {*} newChildren 
   * @returns 
   */
  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    // 返回的第一个新儿子
    let resultingFirstChild = null;
    // 上一个新fiber
    let previousNewFiber = null;
    let newIdx = 0;
    for (; newIdx < newChildren.length; newIdx++) {
      // 创建一个儿子
      const newFiber = createChild(returnFiber, newChildren[newIdx]);
      if (newFiber === null) {
        continue;
      }
      // 放置新fiber
      placeChild(newFiber, newIdx);
      // 如果previousNewFiber为null, 说明这是第一个fiber
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber; // 说明这个newFiber是大儿子 第一个儿子
      } else { // 否则说明不是大儿子 就把这个newFiber添加到上一个子节点后面
        previousNewFiber.sibling = newFiber;
      }
      // 让newFiber成为最后一个或者说上一个fiber
      previousNewFiber = newFiber;
    }
    // 返回第一个子fiber
    return resultingFirstChild;
  }

  /**
   * 比较子Fibers DOM-DIFF 就是用老的子fiber链表和新的虚拟DOM进行比较的过程
   * @param {*} returnFiber 新的父fiber
   * @param {*} currentFirstChild 老fiber的儿子 默认应该是null
   * @param {*} newChild 更新队列中的element Virtual DOM
   * @returns
   */
  function reconcileChildFibers(returnFiber, currentFirstChild, newChild) {
    // 子元素的类型为object说明有子元素且不是文本元素
    if (typeof newChild === 'object' && newChild !== null) {
      // 如果有$$typeof属性说明是单个子元素 因为单个子元素能直接取到$$typeof属性
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          return placeSingleChild(
            // 协调单个子节点
            reconcileSingleElement(returnFiber, currentFirstChild, newChild)
          );
        }
        default:
          break;
      }
      // newChild [hello文本节点, span虚拟DOM元素]
      if (isArray(newChild)) {
        return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
      }
    }
    if (typeof newChild === 'string') {
      return placeSingleChild(
        reconcileSingleTextNode(returnFiber, currentFirstChild, newChild)
      );
    }
    return null;
  }
  return reconcileChildFibers;
}

// 有老的父fiber用这个
export const reconcileChildFibers = createChildReconciler(true);
// 没有老的父fiber用这个
export const mountChildFibers = createChildReconciler(false);
