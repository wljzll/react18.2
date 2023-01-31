import { createHostRootFiber } from "./ReactFiber";
import { initializeUpdateQueue } from "./ReactFiberClassUpdateQueue";

function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo;
}

/**
 * 创建fiberRoot和rootFiber并相互指向
 * @param {*} containerInfo div#root
 * @returns FiberRootNode实例
 */
export function createFiberRoot(containerInfo) {
  // 创建FiberRootNode实例 这个实例就是fiberRoot
  const root = new FiberRootNode(containerInfo);
  // 创建rootFiber
  const uninitializedFiber = createHostRootFiber();
  // 将fiberRoot的current属性指向根fiber
  root.current = uninitializedFiber;
  // 将fiber的stateNode属性指向根FiberRoot
  uninitializedFiber.stateNode = root;
  // 初始化根Fiber的更新队列
  initializeUpdateQueue(uninitializedFiber);
  // 返回创建的fiberRoot
  return root;
}
