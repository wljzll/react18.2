import ReactSharedInternals from "shared/ReactSharedInternals";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates'

const { ReactCurrentDispatcher } = ReactSharedInternals;
// 当前正在渲染中的fiber
let currentlyRenderingFiber = null;
// 当前正在使用中的hook
let workInProgressHook = null;
// 当前正在更新的hook对应的老的hook
let currentHook = null;

// 初次渲染时给ReactCurrentDispatch.current赋值的useReducer
const HookDispatcherOnMount = {
  useReducer: mountReducer
}

const HooksDispatcherOnUpdate = {
  useReducer: updateReducer
}

function updateWorkInProgressHook() {
  // 获取将要构建的新的Hook的老hook
  if (currentHook === null) {
    const current = currentlyRenderingFiber.alternate;
    currentHook = current.memoizedState;
  } else {
    currentHook = currentHook.next;
  }

  // 根据老hook创建新hook
  const newHook = {
    memoizedState: currentHook.memoizedState,
    queue: currentHook.queue,
    next: null,
  }

  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
  } else {
    workInProgressHook = workInProgressHook.next = newHook;
  }
  return workInProgressHook;
}

function updateReducer(reducer) {
  // 获取新的hook
  const hook = updateWorkInProgressHook();
  // 获取新的hook的更新队列
  const queue = hook.queue;
  // 获取老的hook
  const current = currentHook;
  // 获取将要生效的更新队列
  const pendingQueue = queue.pending;
  // 定义新的变量 取值为当前的老状态
  let newState = current.memoizedState;

  
  if (pendingQueue !== null) {
    queue.pending = null;
    const firstUpdate = pendingQueue.next;
    let update = firstUpdate;

    // 递归该fiber中所有的更新
    do {
      const action = update.action;
      // 交给reducer执行 获取最新的状态
      newState = reducer(newState, action);
      update = update.next;
    } while (update !== null && update !== firstUpdate)
  }

  // 本次更新完成 新的状态成了老的
  hook.memoizedState = newState;
  return [hook.memoizedState, queue.dispatch];
}

/**
 * @description 初次渲染时 组件内执行useReducer会触发 可能会触发多次
 * @param {*} reducer 用户传过来的reducer
 * @param {*} initialArg 用户传过来的初始值
 * @returns 
 */
function mountReducer(reducer, initialArg) {
  // 创建一个hook
  const hook = mountWorkInProgressHook();
  // hook历史状态就是当前值
  hook.memoizedState = initialArg;
  // 声明一个更细队列
  const queue = {
    pending: null
  }
  // 将queue添加到hook的queue上
  hook.queue = queue;
  // 这里会形成闭包
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
 * @description 挂载构建中的hook 把一个fiber中的hook组成一个hook链表
 */
function mountWorkInProgressHook() {
  // 定义一个新hook
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
  // 如果有老的fiber 并且有老的hook链表 说明是更新
  debugger;
  if (current !== null && current.memoizedState !== null) {
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
  } else { // 否则是首次挂载
    // 需要在函数组件执行前给ReactCurrentDispatcher.current赋值
    ReactCurrentDispatcher.current = HookDispatcherOnMount;
  }

  const children = Component(props);

  // 每个fiber使用完清空
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  return children;
}