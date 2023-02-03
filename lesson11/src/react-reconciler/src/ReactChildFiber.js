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
   * @description 删除剩下的子fiber节点
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
   *
   * @param {*} newFiber 新的子fiber
   * @param {*} lastPlacedIndex 上一个不需要移动位置的老fiber的索引
   * @param {*} newIndex
   * @returns
   */
  function placeChild(newFiber, lastPlacedIndex, newIndex) {
    newFiber.index = newIndex; // 更新新fiber的索引
    if(!shouldTrackSideEffects) { // 不需要跟踪副作用就直接返回这个索引
      return lastPlacedIndex;
    }
    const current = newFiber.alternate; // 拿到新fiber的替身
    if(current !== null) { // 有替身说明是复用的
      const oldIndex = current.index; // 拿到上一次的索引位置
      if(oldIndex < lastPlacedIndex) { // 如果这个fiber的老索引 小于上一次不需要移动位置的老fiber的索引 说明这个复用的老fiber要移动位置了
        newFiber.flags |= Placement;
        return lastPlacedIndex; // 这时候上一个不需要移动的复用的老fiber的索引就不需要改变
      } else { // 复用的这个老fiber的索引 大于上一次不需要移动位置的老fiber的索引 说明这个老fiber不需要移动位置
        return oldIndex; // 更新lastPlacedIndex
      }
    } else { // 说明是新创建 新创建的就需要插入了
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    }
    // 如果一个fiber它的flags上有Placement, 说明此节点需要创建真实DOM并插入到父容器中
    // 如果父fiber节点是初次挂在 shouldTrackSideEffects=false 不需要添加flags
    // 这种情况下会在完成阶段把所有的子节点全部添加到自己身上
  }

  /**
   *
   * @param {*} returnFiber 父fiber
   * @param {*} current 老的子fiber为null
   * @param {*} element 新子元素的虚拟DOM
   * @returns
   */
  function updateElement(returnFiber, current, element) {
    const elementType = element.type;
    if(current !== null) { // 说明有对应的老节点
      if(current.type === elementType) { // 如果类型也相同就复用
        const existing = useFiber(current, element.props);
        existing.return = returnFiber;
        return existing;
      }
    }
    // 其他情况就创建新的
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    // 返回复用的fiber或者新创建的
    return created;
  }

  /**
   * @description
   * @param {*} returnFiber 父fiber
   * @param {*} oldFiber 老的子fiber
   * @param {*} newChild 新的子fiber
   */
  function updateSlot(returnFiber, oldFiber, newChild) {
    const key = oldFiber !== null ? oldFiber.key : null; // 获取老fiber的key
    if(typeof newChild === 'object' && newChild !== null) { // 如果新fiber存在并且是object类型的子节点
      switch(newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: { // 新fiber是元素节点
          if(newChild.key === key) { // 如果新老节点的key相同
            return updateElement(returnFiber, oldFiber, newChild);
          }
        }
        default: null;
      }
      return null;
    }
  }

  /**
   *
   * @param {*} returnFiber 父fiber 这个方法里其实没用 为什么要传过来哪 源码瞎几把写这里也跟源码保持一致
   * @param {*} currentFirstChild 当前未遍历到的第一个新的子节点
   * @returns
   */
  function mapRemainingChildren(returnFiber, currentFirstChild) {
    const existingChildren = new Map(); // 创建map
    let existingChild = currentFirstChild; // 未遍历过的第一个儿子
    while (existingChild !== null) { // 存在就一直递归
      if (existingChild.key !== null) { // 有key 就用key做map数据结构的键
        existingChildren.set(existingChild.key, existingChild);
      } else { // 没有key: 1. 压根没写 2. 文本元素 那就用索引代替
        existingChildren.set(existingChild.index, existingChild);
      }
      existingChild = existingChild.sibling; // 自己添加完了 去添加自己的弟弟
    }
    return existingChildren; // 最后返回这个map
  }

  /**
   *
   * @param {*} returnFiber 父fiber
   * @param {*} current 当前的老fiber
   * @param {*} textContent 新的文本内容
   * @returns
   */
  function updateTextNode(returnFiber, current, textContent) {
    if (current === null || current.tag !== HostText) { // 不存在老节点或这老节点类型不同不能复用就创建新的
      const created = createFiberFromText(textContent);
      created.return = returnFiber;
      return created;
    } else { // 能复用就复用
      const existing = useFiber(current, textContent);
      existing.return = returnFiber;
      return existing;
    }
  }

  /**
   *
   * @param {*} existingChildren 剩下的儿子组成的map
   * @param {*} returnFiber 父fiber
   * @param {*} newIdx 当前遍历到的新儿子的在新fiber树中的索引
   * @param {*} newChild 新儿子的虚拟DOM
   * @returns
   */
  function updateFromMap(existingChildren, returnFiber, newIdx, newChild) {
    if ((typeof newChild === "string" && newChild !== "") || typeof newChild === "number") { // 文本或数字节点
      const matchedFiber = existingChildren.get(newIdx) || null; // map中有取map 无则为null
      return updateTextNode(returnFiber, matchedFiber, "" + newChild);
    }
    if (typeof newChild === "object" && newChild !== null) { // 元素节点
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: { // 如果是原生节点
          const matchedFiber = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null; // 尝试取出对应的老节点
          return updateElement(returnFiber, matchedFiber, newChild); // 尝试复用老节点或创建新节点更新
        }
      }
    }
    return null;
  }

  /**
   *
   * @param {*} returnFiber
   * @param {*} currentFirstChild null
   * @param {*} newChildren
   * @returns
   */
  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    // 多个节点数量不同、key 不同
    // 第一轮比较 A 和 A，相同可以复用，更新，然后比较 B 和 C，key 不同直接跳出第一个循环
    // 把剩下 oldFiber 的放入 existingChildren 这个 map 中
    // 然后声明一个lastPlacedIndex变量，表示不需要移动的老节点的索引
    // 继续循环剩下的虚拟 DOM 节点
    // 如果能在 map 中找到相同 key 相同 type 的节点则可以复用老 fiber,并把此老 fiber 从 map 中删除
    // 如果能在 map 中找不到相同 key 相同 type 的节点则创建新的 fiber
    // 如果是复用老的 fiber,则判断老 fiber 的索引是否小于 lastPlacedIndex，如果是要移动老 fiber，不变
    // 如果是复用老的 fiber,则判断老 fiber 的索引是否小于 lastPlacedIndex，如果否则更新 lastPlacedIndex 为老 fiber 的 index
    // 把所有的 map 中剩下的 fiber 全部标记为删除
    // (删除#li#F)=>(添加#li#B)=>(添加#li#G)=>(添加#li#D)=>null


    let resultingFirstChild = null; // 返回的第一个新儿子

    let previousNewFiber = null; // 上一个新fiber
    let newIdx = 0; // 开始遍历的索引
    let oldFiber = currentFirstChild; // 老的子fiber的第一个儿子
    let nextOldFiber = null; // 老的子fiber的下一个儿子
    let lastPlacedIndex = 0; // 上一个未移动的老fiber的索引

    // 第一次遍历：
    // 1. newChildren遍历完成，oldFiber刚好为null，说明新老节点一样多
    // 2. newChildren遍历完成，oldFiber不为null，说明老节点比新节点多
    // 3. newChildrend未遍历完成，oldFiber为null了，说明新节点比老节点多
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      nextOldFiber = oldFiber.sibling; // 缓存老子fiber的下一个儿子 为什么要缓存 怕中间改掉了
      const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx]); // 对比新老节点后 返回复用的fiber或新创建的fiber
      if (newFiber === null) { // 当比较的两个元素key不同时 updateSlot会返回null 此时第一次遍历就会跳出
        break;
      }

      if(shouldTrackSideEffects) { // 如果要收集依赖
        if(oldFiber && newFiber.alternate === null) { // 有老fiber但是新创建的fiber没有替身，说明不是复用的，那就要删除老fiber
          deleteChild(returnFiber, oldFiber); // 删除老fiber
        }
      }
      // 更新索引 添加副作用
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }

    if (newIdx === newChildren.length) { // 进入这个判断 新节点刚好遍历完了 这个时候老节点 >= 新节点数 解决首次遍历存在的(2)情况
      deleteRemaingChildren(returnFiber, oldFiber); // 删除可能多余的老节点
      return resultingFirstChild; // 返回新的第一个fiber
    }


    if(oldFiber === null) { // 进入这个判断有两种情况: 1. 首次渲染 2. 更新的时候新节点比原老节点多(解决(3)情况)
      // 第二次遍历：
      for (; newIdx < newChildren.length; newIdx++) { // 遍历创建新fiber
        // 创建一个新的子节点的fiber
        const newFiber = createChild(returnFiber, newChildren[newIdx]);
        if (newFiber === null) { // 这种情况一般不存在
          continue;
        }
        // 放置新fiber
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        // 如果previousNewFiber为null, 说明这是第一个fiber
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber; // 说明这个newFiber是大儿子 第一个儿子
        } else { // 否则说明不是大儿子 就把这个newFiber添加到上一个子节点后面
          previousNewFiber.sibling = newFiber;
        }
        // 让newFiber成为最后一个或者说上一个fiber
        previousNewFiber = newFiber;
      }
    }

    const existingChildren = mapRemainingChildren(returnFiber, oldFiber); // 将剩余的老fiber全都放到map中
    for (; newIdx < newChildren.length; newIdx++) { // 从上次跳出的元素后开始重新遍历
      const newFiber = updateFromMap(existingChildren, returnFiber, newIdx, newChildren[newIdx]);
      if (newFiber !== null) { // 如果有新fiber
        if (shouldTrackSideEffects) {
          if (newFiber.alternate !== null) { // 走到这里说明是复用的老fiber
            existingChildren.delete(newFiber.key === null ? newIdx : newFiber.key); // 把map里复用过的删了
          }
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx); // 更新索引 还要看是否更改lastPlacedIndex
        // 下面是构建链表
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }
    if (shouldTrackSideEffects) { // 新的都遍历完了 把没用的老的全删除了
      existingChildren.forEach((child) => deleteChild(returnFiber, child));
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
