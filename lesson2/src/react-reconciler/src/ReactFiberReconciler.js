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
 *
 * @param {*} element 要渲染的元素的虚拟DOM
 * @param {*} container 容器 div#root的fiberRoot
 */
export function updateContainer(element, container) {
  // 拿到根Fiber
  const current = container.current;
  // 创建一个更新
  const update = createUpdate();
  // 往更新上挂载一个payload
  update.payload = { element };
  // 向根fiber上挂载更新
  const root = enqueueUpdate(current, update);

  console.log(root);
  scheduleUpdateOnFiber(root);
}
