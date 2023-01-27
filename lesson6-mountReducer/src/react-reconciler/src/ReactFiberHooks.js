import ReactSharedInternals from "shared/ReactSharedInternals";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import {enqueueConcurrentHookUpdate} from './ReactFiberConcurrentUpdates'

const { ReactCurrentDispatcher } = ReactSharedInternals;
// 当前正在渲染中的fiber
let currentlyRenderingFiber = null;
// 当前正在使用中的hook
let workInProgressHook = null;


const HookDispatcherOnMount = {
  useReducer: mountReducer
}

function mountReducer(reducer, initialArg) {
  // 创建一个hook
  const hook = mountWorkInProgressHook();
  hook.memoizedState = initialArg;
  const queue = {
    pending: null
  }
  // 将queue添加到hook的queue上
  hook.queue = queue;
  const dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, queue);
  return [hook.memoizedState, dispatch];
}

function dispatchReducerAction(fiber, queue, action) {
  // 在每个hook里会存放一个更新队列 更新队列是一个更新对象的循环链表 update1.next = update2.next = update3
  const update = {
    action, // {type: 'add', payload: 1}
    next: null,
  }
  // 入队并发的hook更新 把当前最新的更新添加到更新队列中 并且返回当前的根fiber
  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  scheduleUpdateOnFiber(root);
}

/**
 * @description 挂载构建中的hook
 */
function mountWorkInProgressHook() {
  // 定义hook
  const hook = {
    memoizedState: null, // hook的状态
    queue: null, // 存放本hook的更新队列 queue.pending = update的循环链表
    next: null, // 指向下一个hook, 一个函数里可以会有多个hook 它们会组成一个单项链表
  };
  if (workInProgressHook === null) {
    // 当前函数对应的fiber的状态等于第一个hook对象
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}

/**
 * @description 渲染函数组件
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 * @param {*} Component 组件定义
 * @param {*} props 组件属性
 * @returns 虚拟DOM或者说React元素
 */
export function renderWithHooks(current, workInProgress, Component, props) {
  // 函数式组件执行时将当前的fiber赋值给currentRenderingFiber
  currentlyRenderingFiber = workInProgress;
  // 需要在函数组件执行前给ReactCurrentDispatcher.current赋值
  ReactCurrentDispatcher.current = HookDispatcherOnMount;
  const children = Component(props);
  return children;
}