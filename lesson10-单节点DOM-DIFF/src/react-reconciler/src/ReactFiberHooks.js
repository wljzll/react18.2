import ReactSharedInternals from "shared/ReactSharedInternals";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates'
import is from "shared/objectIs";

// 解构出dispatcher生成函数
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

const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateState,
}

/**
 * 根据老的hook复用memoizedState属性和queue队列
 * @returns
 */
function updateWorkInProgressHook() {
  // 获取将要构建的新的Hook的老hook
  if (currentHook === null) { // 如果在函数组件中有两个 useReducer 第一次进入是null 第二次就存在了
    const current = currentlyRenderingFiber.alternate; // 获取老fiber
    currentHook = current.memoizedState; // 拿到老fiber的memoizedState也就是对应的hook
  } else { // 如果是第二次进入 就取第一次hook的next 依此类推
    currentHook = currentHook.next;
  }

  // 根据老hook创建新hook
  const newHook = {
    memoizedState: currentHook.memoizedState, // 复用老的状态
    queue: currentHook.queue, // 复用老的更新队列
    next: null,
  }

  // 重新构建更新队列链表
  if (workInProgressHook === null) { // 首次进入更新
    currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
  } else { // 非首次
    workInProgressHook = workInProgressHook.next = newHook;
  }
  // 返回最后一个hook
  return workInProgressHook;
}

/**
 * @description 内置的reducer 传递给updateReducer这个公用的方法的兼容性的reducer
 * @param {*} state 老的状态
 * @param {*} action 新的状态
 * @returns
 */
function basicStateReducer(state, action) {
  return typeof action === "function" ? action(state) : action;
}

/**
 * 更新state 函数重新执行回进入updateState
 * @returns [状态, setState]
 */
function updateState() {
  // 然后会进入updateReducer
  return updateReducer(basicStateReducer);
}

/**
 * @description 真正的useState的dispatch方法
 * @param {*} fiber 函数组件的fiber
 * @param {*} queue 更新队列
 * @param {*} action 传入的值  0 1 2类似这种
 * @returns
 */
 function dispatchSetState(fiber, queue, action) {
  const update = {
    action,
    hasEagerState: false,
    eagerState: null,
    next: null,
  };
  const lastRenderedReducer = queue.lastRenderedReducer;
  const currentState = queue.lastRenderedState;
  // 调用scheduleUpdateOnFiber更新前先计算最新值 如果和老值相等 就不用更新
  const eagerState = lastRenderedReducer(currentState, action);
  update.hasEagerState = true;
  update.eagerState = eagerState;
  // 如果新老相等不用更新
  if (is(eagerState, currentState)) {
    return;
  }
  // 将hook更新按照格式存放
  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  // 更新准备完成 开始调度更新
  scheduleUpdateOnFiber(root, fiber);
}

/**
 * @description 初次挂载useState
 * @param {*} initialState 初始状态
 * @returns
 */
function mountState(initialState) {
  const hook = mountWorkInProgressHook(); // 创建一个hook 其实就是一个破对象
  hook.memoizedState = hook.baseState = initialState; // 赋初始值
  // 创建queue队列
  const queue = {
    pending: null, // 保存更新
    dispatch: null, // dispatch方法
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState, // 此次更新的上一次的状态
  };
  hook.queue = queue; // 将更新队列赋值给hook
  const dispatch = (queue.dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue)); // 定义dispatch方法
  // 返回
  return [hook.memoizedState, dispatch];
}

/**
 * 将初次挂载时构建的hook更新链递归交给reducer执行 生成新的状态
 * @param {*} reducer
 * @returns
 */
function updateReducer(reducer) {
  const hook = updateWorkInProgressHook(); // 根据老的hook复用后获取新的hook

  const queue = hook.queue; // 获取新的hook的更新队列

  const current = currentHook; // 获取老的hook

  const pendingQueue = queue.pending; // 获取将要生效的更新队列

  let newState = current.memoizedState; // 初始化一个新的状态 取值为当前的状态
  // 如果有更新要计算 计算更新
  if (pendingQueue !== null) {
    queue.pending = null;
    const firstUpdate = pendingQueue.next;
    let update = firstUpdate;
    do {
      if (update.hasEagerState) {
        newState = update.eagerState
      } else {
        const action = update.action
        newState = reducer(newState, action)
      }
      update = update.next;
    } while (update !== null && update !== firstUpdate)
  }
  hook.memoizedState = newState;
  return [hook.memoizedState, queue.dispatch];
}

function mountReducer(reducer, initialArg) {
  const hook = mountWorkInProgressHook(); // 创建一个hook 其实就是一个破对象
  hook.memoizedState = initialArg; // 赋初始值
  // 创建queue队列
  const queue = {
    pending: null
  }
  // 将queue添加到hook的queue上 hook.queue指向了queue这个空间地址
  // dispatch中对更新的入队操作的都是queue这个空间 也就改变了fiber上对应的hook
  hook.queue = queue;
  // 这是dispatch方法
  const dispatch = (queue.dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, queue));
  return [hook.memoizedState, dispatch];
}

// reducer的dispatch方法
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
 * @description 挂载构建中的hook 创建hook对象并返回
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
  if (current !== null && current.memoizedState !== null) {
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
  } else { // 否则是首次挂载
    // 首次挂载在函数组件执行前给useReducer和useState赋值
    ReactCurrentDispatcher.current = HookDispatcherOnMount;
  }

  const children = Component(props);
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  currentHook = null;
  return children;
}


/**
 * 触发dispatch更新的逻辑:
 * 1. 执行dispatch先去将update按照格式存入到数组中
 * 2. 此次click事件全部执行完成，更新全部存入到数组中后, requestIdleCallback才会调用scheduleUpdateOnFiber
 * 3. 由根节点进入fiber树重新计算更新, 先是由finishQueueingConcurrentUpdates()将(1)中数组存放的更新将更新
 *    构建成闭环链表
 * 4. 当fiber构建到函数组件时, 会再次执行函数组件, 这时函数组件的新fiber已经构建完成, 会进入到更新逻辑
 * 5. 将click事件中的所有的更新操作交给reducer执行 将最后的结果赋值给最新的状态并返回[state, dispatch]
 * 6. 继续进行fiber的构建和提交最后更新的就是最新的状态
 */

/**
 * useReducer和useState的区别：
 * 1. useState传入的是想要改成什么值就传入什么值,
 *   useState(0)
 *
 * 2. useReducer的控制权在reducer函数
 *    useReducer(处理函数, 初始值)
 */


/**
 * 更新队列问题：
 * 1、在mount阶段声明了queue, 后续会将update存放到queue的pending上
 *    首次挂载就到此结束都是空的
 *
 * 2、用户触发点击事件, 调用了dispatch, 这是更新的开端, dispatch传入的值或参数
 *    就是本次点击事件要更新的数据, dispatch里会先把这些参数和更新处理成闭环的
 *    链表
 *
 * 3、将更新处理成闭环链表后，dispatch里调用方法开始调度更新，
 *    根Fiber更新的时候就将对应的更新赋值到对应的fiber的更新队列中了
 *    然后开始更新FunctionComponent, 重新执行FunctionComponent函数,
 *    函数执行之前先将useState和useReducer重新赋值成update系列
 *    然后开始执行函数体
 *    执行updateState或updateReducer
 *    然后拿到对应的更新队列, 拆解链表执行更新, 将最终的状态返回给函数
 *    然后重新生成虚拟DOM的时候拿到的就是最新的状态了
 *    然后就用新状态更新就可以了
 *
 *
 */
