import ReactSharedInternals from "shared/ReactSharedInternals";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates'
import is from "shared/objectIs";

// 解构出ReactCurrentDispatcher
const { ReactCurrentDispatcher } = ReactSharedInternals;

// 当前正在渲染中的fiber
let currentlyRenderingFiber = null;

// 当前正在使用中的hook
let workInProgressHook = null;

// 当前正在更新的hook对应的老的hook
let currentHook = null;

// 初次渲染时给ReactCurrentDispatch.current赋值的useReducer
const HookDispatcherOnMount = {
  useReducer: mountReducer,
  useState: mountState,
}

// 更新时useReducer调用的其实是updateReducer
const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateState,
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
    memoizedState: currentHook.memoizedState, // 上一次的状态
    queue: currentHook.queue, // 更新链表
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
 * @description 内置的reducer
 * @param {*} state 
 * @param {*} action 
 * @returns 
 */
function basicStateReducer(state, action) {
  debugger
  return typeof action === "function" ? action(state) : action;
}

function updateState() {
  return updateReducer(basicStateReducer);
}

function mountState(initialState) {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = hook.baseState = initialState;
  const queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState,
  };
  hook.queue = queue;
  const dispatch = (queue.dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue));
  return [hook.memoizedState, dispatch];
}

function dispatchSetState(fiber, queue, action) {
  const update = {
    action,
    hasEagerState: false,
    eagerState: null,
    next: null,
  };
  const lastRenderedReducer = queue.lastRenderedReducer;
  const currentState = queue.lastRenderedState;
  const eagerState = lastRenderedReducer(currentState, action);
  update.hasEagerState = true;
  update.eagerState = eagerState;
  if (is(eagerState, currentState)) {
    return;
  }
  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  scheduleUpdateOnFiber(root, fiber);
}

/**
 * @description 组件更新时 useReducer会执行这个
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
    // 断开闭环链表 形成单向链表
    queue.pending = null;

    const firstUpdate = pendingQueue.next;
    
    // 拿到第一个更新
    let update = firstUpdate;

    do {
      // useState设置的值和上一次相同
      if (update.hasEagerState) {
        newState = update.eagerState
      } else {
        const action = update.action
        newState = reducer(newState, action)
      }
      update = update.next;
    } while (update !== null && update !== firstUpdate)
  }
  
  // 新生成的状态成了上一次的老状态
  hook.memoizedState = newState;
  
  return [hook.memoizedState, queue.dispatch];
}

/**
 * 
 * @param {*} reducer 用户传递进来的处理函数
 * @param {*} initialArg 初始值
 * @returns 
 */
function mountReducer(reducer, initialArg) {
  // 创建一个hook
  const hook = mountWorkInProgressHook();


  hook.memoizedState = initialArg;
  
  // 更新队列
  const queue = {
    pending: null
  }

  // 将queue添加到hook的queue上 更新队列和fiber没有直接关系
  hook.queue = queue;

  // 这是dispatch方法 这里会形成闭包
  const dispatch = (queue.dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, queue));

  return [hook.memoizedState, dispatch];
}

/**
 * @description 这个方法会被闭包调用 同一个dispatch方法可能会被调用多次
 * @param {*} fiber 
 * @param {*} queue 
 * @param {*} action 
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
 * @description 挂载构建中的hook 创建hook对象并返回, 将一个组件(fiber)内的hooks 组成一个链表
 */
function mountWorkInProgressHook() {

  // 定义一个新hook
  const hook = {
    memoizedState: null, // hook的状态值
    queue: null, // 存放本hook的更新队列 queue.pending = update的循环链表
    next: null, // 指向下一个hook, 一个函数里可以会有多个hook 它们会组成一个单项链表
  };

  if (workInProgressHook === null) {

    // 当前函数对应的fiber的状态等于第一个hook对象
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // 构建hook的链表
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
  if (current !== null && current.memoizedState !== null) {
    // 重写current的值
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
  } else { // 否则是首次挂载
    // 需要在函数组件执行前给ReactCurrentDispatcher.current赋值
    ReactCurrentDispatcher.current = HookDispatcherOnMount;
  }

  const children = Component(props);
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  currentHook = null;
  return children;
}