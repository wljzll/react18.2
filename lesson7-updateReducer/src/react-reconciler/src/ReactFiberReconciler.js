import { createFiberRoot } from './ReactFiberRoot';
import { createUpdate, enqueueUpdate } from "./ReactFiberClassUpdateQueue";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

/**
 *
 * @param {*} containerInfo div#root
 * @returns 创建的FiberRoot
 */
export function createContainer(containerInfo) {
  return createFiberRoot(containerInfo);
}


/**
 * 更新容器，把虚拟DOM element变成真是DOM插入到container容器中
 * @param {*} element 要渲染的元素的虚拟DOM
 * @param {*} container 容器 div#root的fiberRoot
 */
export function updateContainer(element, container) {
  // 拿到根Fiber
  const current = container.current;
  // 创建一个更新
  const update = createUpdate();
  // 往更新上挂载一个payload　要更新的虚拟DOM
  update.payload = { element };
  // 把此更新对象添加到current这个根Fiber的更新队列上 然后返回根节点
  const root = enqueueUpdate(current, update);
  // 在fiber上调度更新 
  scheduleUpdateOnFiber(root);
}
