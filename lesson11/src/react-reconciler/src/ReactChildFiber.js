import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import isArray from 'shared/isArray';
import {
  createFiberFromElement,
  FiberNode,
  createFiberFromText,
  createWorkInProgress,
} from './ReactFiber';
import { ChildDeletion, Placement } from './ReactFiberFlags';
import { HostText } from './ReactWorkTags';

/**
 * @description 创建子元素协调方法的工厂函数
 * @param {*} shouldTrackSideEffects 是否跟踪副作用
 * @returns 闭包 返回reconcileChildFibers函数
 */
function createChildReconciler(shouldTrackSideEffects) {

  /**
   * @description 基于新fiber的属性复用老fiber 用新的虚拟DOM的属性更新复用的fiber上
   * @param {*} fiber 老的可复用的fiber
   * @param {*} pendingProps 新虚拟DOM对应的属性
   * @returns
   */
  function useFiber(fiber, pendingProps) {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }

  /**
   * @description 删除子节点
   * @param {*} returnFiber 父fiber
   * @param {*} childDeletion 要删除的儿子fiber
   */
  function deleteChild(returnFiber, childDeletion) {
    if (!shouldTrackSideEffects) {
      return;
    }
    const deletions = returnFiber.deletions; // 获取父fiber上的要删除的儿子
    if (deletions === null) { // 如果存在
      returnFiber.deletions = [childDeletion];
      returnFiber.flags |= ChildDeletion;
    } else {
      deletions.push(childDeletion);
    }
  }

  /**
   * @description 删除子fiber节点
   * @param {*} returnFiber 父fiber
   * @param {*} currentFirstChild 要删除的子fiber
   * @returns
   */
  function deleteRemaingChildren(returnFiber, currentFirstChild) {
    if (!shouldTrackSideEffects) {
      return null;
    }
    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete)
      childToDelete = childToDelete.sibling;
    }
    return null;
  }


  /**
   *
   * @param {*} returnFiber 替身fiber
   * @param {*} currentFirstChild 老fiber的儿子 null
   * @param {*} element 子元素的虚拟DOM
   * @returns 创建的fiber
   */
  function reconcileSingleElement(returnFiber, currentFirstChild, element) {
    // 新的虚拟DOM的key 也就是唯一标识
    const key = element.key;
    // 老的子fiber 初次挂载为null 不为null说明是更新
    let child = currentFirstChild;
    while (child !== null) { // 儿子存在
      // 判断此老子fiber的key和新的虚拟DOM对象的key是否一样 都是null null === null
      if (child.key === key) {
        // 判断老fiber对应的类型和新虚拟DOM元素对应的类型是否相同
        if (child.type === element.type) {
          // key一样 type也一样 那就删除剩下其他的儿子
          deleteRemaingChildren(returnFiber, child.sibling);
          // 如果key一样 类型也一样 则认为此节点可以服用
          const existing = useFiber(child, element.props); // 复用老fiber并返回根据老fiber复用生成的新fiber
          existing.return = returnFiber; // 给新fiber创建父子关系
          return existing; // 能复用就不往下走了
        } else { // key相同但是type不同 那就全部都不能复用 全部删除
          deleteRemaingChildren(returnFiber, child);
          break;
        }
      } else { // key不同则删除这个子节点 因为新的儿子只有一个所以只要不相同就删除
        deleteChild(returnFiber, child);
      }
      // 如果老子fiber的key和新虚拟DOM对象的key不一样 则和兄弟节点对比
      child = child.sibling;
    }

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
    // 如果要收集以来 并且当前的fiber没有老fiber 说明是初次挂载 才需要插入 否则是更新则不需要插入
    if (shouldTrackSideEffects && newFiber.alternate === null) newFiber.flags |= Placement;
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
    if (shouldTrackSideEffects) newFiber.flags |= Placement;
  }

  function updateElement(returnFiber, oldFiber, newChild) {
    const elementType = element.type;
    if(current !== null) {
      
    }
  }
  
  /**
   * @description 
   * @param {*} returnFiber 父fiber
   * @param {*} oldFiber 老的子fiber
   * @param {*} newChild 新的子fiber
   */
  function updateSlot(returnFiber, oldFiber, newChild) {
    const key = oldFiber !== null ? oldFiber.key : null; // 获取老fiber的key
    if(typeof newChild === 'object' && newChild !== null) { // 如果新fiber存在
      switch(newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: { // 新fiber是元素节点
          if(newChild.key === key) {
            return updateElement(returnFiber, oldFiber, newChild);
          }
        }
      }
    }
  }

  /**
   *
   * @param {*} returnFiber
   * @param {*} currentFirstChild null
   * @param {*} newChildren
   * @returns
   */
  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {

    let resultingFirstChild = null; // 返回的第一个新儿子

    let previousNewFiber = null; // 上一个新fiber
    let newIdx = 0; // 开始遍历的索引
    let oldFiber = currentFirstChild; // 老的子fiber的第一个儿子
    let nextOldFiber = null; // 老的子fiber的下一个儿子

    for (; oldFiber !== null && nexIdx < newChildren.length; newIdx++) {
      nextOldFiber = oldFiber.sibling; // 获取老子fiber的下一个儿子
      const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx]);
      if (newFiber === null) {
        break;
      }
    }

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
