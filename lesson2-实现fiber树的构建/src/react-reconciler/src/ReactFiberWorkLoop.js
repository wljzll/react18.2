import { scheduleCallback } from 'scheduler';
import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import {completeWork} from './ReactFiberCompleteWork'

// 声明全局的根fiber的替身 正在构建中的fiber树
let workInProgress = null; 

/**
 * @description 计划更新root 在源码里此处有一个调度任务的功能
 * @param {*} root
 */
export function scheduleUpdateOnFiber(root) {
  // 确保调度执行root上的更新
  ensureRootIsScheduled(root);
}

/**
 * @description 确保根fiber调度了
 * @param {*} root
 */
function ensureRootIsScheduled(root) {
  // 告诉浏览器要执行performConcurrentWorkOnRoot
  scheduleCallback(performConcurrentWorkOnRoot.bind(null, root));
}

/**
 * @description 执行root上的并发更新工作 根据虚拟DOM构建fiber树 
 * fiber树创建完成后 要创建真实的DOM节点　还需要把真实的DOM节点插入容器
 * @param {*} root
 */
function performConcurrentWorkOnRoot(root) {
  // 第一次渲染以同步的方式渲染根节点 初次渲染的时候 都是同步
  renderRootSync(root);
}

/**
 * @description 准备刷新栈
 * @param {*} root
 */
function prepareFreshStack(root) {
  // 创建当前fiber的替身并赋值给workInProgress
  workInProgress = createWorkInProgress(root.current, null);
  console.log(workInProgress);
}

/**
 * @description 同步渲染root
 * @param {*} root
 */
function renderRootSync(root) {
  // 准备一个新鲜的栈 
  prepareFreshStack(root);
  // 工作循环同步
  workLoopSync();
}

/**
 * @description 同步执行工作循环
 */
function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

/**
 * @description 执行工作单元
 * @param {*} unitOfWork 当前fiber的替身
 */
function performUnitOfWork(unitOfWork) {
  // 老fiber
  const current = unitOfWork.alternate;
  // 开始工作 完成当前fiber的子fiber链表构建后 beginWork返回的是构建完成的fiber的子fiber
  const next = beginWork(current, unitOfWork);
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  // next等于null说明没有子节点了说明构建已经完成了
  if (next === null) {
    completeUnitOfWork(unitOfWork);
  } else { // 如果有子节点 让子节点成为下一个工作单元
    workInProgress = next;
  }
}

function completeUnitOfWork(unitOfWork) {
  debugger
  let completedWork = unitOfWork;
  do{
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;
    // 执行此fiber的完成工作 如果是原生组件
    completeWork(current, completedWork);
    // 如果有弟弟 就构建弟弟对应的fiber子链表
    const siblingFiber = completedWork.sibling;
    if(siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }
    // 如果没有弟弟 说明当前完成的就是父fiber的最后一个节点
    // 也就是说一个父fiber 所有的子fiber全部完成了
    completedWork = returnFiber;
    workInProgress = completedWork;
  } while(completedWork !== null);
}
