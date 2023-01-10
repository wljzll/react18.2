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
 *
 * @param {*} shouldTrackSideEffects 是否应该收集副作用
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
    // 根据元素的虚拟DOM创建fiber
    const created = createFiberFromElement(element);
    // 当前创建的fiber的return属性指向替身fiber 也就是指向自己的父亲
    created.return = returnFiber;
    // 返回创建的fiber
    return created;
  }

  /**
   *
   * @param {*} newFiber 创建的子fiber
   * @returns
   */
  function placeSingleChild(newFiber) {
    // 如果要收集依赖则 |上Placement
    if (shouldTrackSideEffects) newFiber.flags |= Placement;
    return newFiber;
  }

  function reconcileSingleTextNode(returnFiber, currentFirstChild, content) {
    const created = new FiberNode(HostText, { content }, null);
    created.return = returnFiber;
    return created;
  }

  function createChild(returnFiber, newChild) {
    if (
      (typeof newChild === 'string' && newChild !== '') ||
      typeof newChild === 'number'
    ) {
      const created = createFiberFromText(`${newChild}`);
      created.return = returnFiber;
      return created;
    }

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

  function placeChild(newFiber, newIndex) {
    newFiber.index = newIndex;
    if (shouldTrackSideEffects) newFiber.flags |= Placement;
  }

  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    let resultingFirstChild = null;
    let previousNewFiber = null;
    let newIdx = 0;
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx]);
      if (newFiber === null) {
        continue;
      }
      placeChild(newFiber, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
    return resultingFirstChild;
  }

  /**
   *
   * @param {*} returnFiber 新fiber
   * @param {*} currentFirstChild 老fiber的儿子 默认应该是null
   * @param {*} newChild 更新队列中的element Virtual DOM
   * @returns
   */
  function reconcileChildFibers(returnFiber, currentFirstChild, newChild) {
    // 子元素的类型为object说明有子元素且不是文本元素
    if (typeof newChild === 'object' && newChild !== null) {
      // 如果有$$typeof属性说明是单个子元素
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

export const reconcileChildFibers = createChildReconciler(true);
export const mountChildFibers = createChildReconciler(false);
