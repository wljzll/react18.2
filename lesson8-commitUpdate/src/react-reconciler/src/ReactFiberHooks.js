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
    // 拿到对应的hook
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

/**
 * @description 更新时先将useReducer赋值成updateReducer函数 执行函数时 执行到useReducer就是
 *              执行这个函数 这个时候就不是赋初始值了 就是计算对应的setReducer传入的action
 * @param {*} reducer 
 * @returns 
 */
function updateReducer(reducer) {
  // 获取新的hook
  const hook = updateWorkInProgressHook();
  // 获取新的hook的更新队列
  const queue = hook.queue;
  // 获取老的hook
  const current = currentHook;
  // 获取将要生效的更新队列
  const pendingQueue = queue.pending;
  // 初始化一个新的状态 取值为当前的状态
  let newState = current.memoizedState;
  if (pendingQueue !== null) {
    queue.pending = null;
    const firstUpdate = pendingQueue.next;
    let update = firstUpdate;
    do {
      console.log('update~~~~~~~~~~~~~~~~~~~~', update)
      const action = update.action;
      newState = reducer(newState, action);
      update = update.next;
    } while (update !== null && update !== firstUpdate)
  }
  hook.memoizedState = newState;
  return [hook.memoizedState, queue.dispatch];
}

/**
 * @description 初次渲染useReducer调用的函数
 * @param {*} reducer 处理函数
 * @param {*} initialArg 初始值
 * @returns 
 */
function mountReducer(reducer, initialArg) {
  // 创建一个hook
  const hook = mountWorkInProgressHook();
  // 给hook对象的memoizedState赋值 值为传入的初始值
  hook.memoizedState = initialArg;
  // 定义queue对象
  const queue = {
    pending: null
  }
  // 将queue添加到hook的queue上
  hook.queue = queue;
  // 这是dispatch方法
  const dispatch = (queue.dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, queue));
  return [hook.memoizedState, dispatch];
}

/**
 * @description 用户dispatch修改值调用的真正的方法
 * @param {*} fiber 
 * @param {*} queue 
 * @param {*} action 用户给reducer传入的action对象
 */
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
  // 定义一个hook对象
  const hook = {
    memoizedState: null, // hook的状态
    queue: null, // 存放本hook的更新队列 queue.pending = update的循环链表
    next: null, // 指向下一个hook, 一个函数里可以会有多个hook 它们会组成一个单项链表
  };
  if (workInProgressHook === null) {
    // 当前函数对应的fiber的状态等于第一个hook对象
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // 将页面中的多个hooks使用next组成链表
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
  // 如果有老的fiber 并且有老的hook链表 说明是更新 将useReducer赋值成更新函数
  if (current !== null && current.memoizedState !== null) {
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
  } else { // 否则是首次挂载
    // 需要在函数组件执行前给ReactCurrentDispatcher.current赋值
    ReactCurrentDispatcher.current = HookDispatcherOnMount;
  }
  // 执行函数组件 - 函数组件内会出发mountReducer或mountReducer
  const children = Component(props);
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  currentHook = null;
  return children;
}