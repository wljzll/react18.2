import { getEventTarget } from './getEventTarget';
import { getClosestInstanceFromNode } from '../client/ReactDOMComponentTree';
import { dispatchEventForPluginEventSystem } from './DOMPluginEventSystem';

/**
 * @description 创建事件监听函数
 * @param {*} targetContainer 根元素 div#root
 * @param {*} domEventName dom事件名
 * @param {*} eventSystemFlags 标识是捕获还是冒泡
 * @returns
 */
export function createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags) {
    const listenerWrapper = dispatchDiscreteEvent;
    // 用bind绑定并返回 等待事件触发时 执行dispatchDiscreteEvent函数
    return listenerWrapper.bind(null, domEventName, eventSystemFlags, targetContainer);
}

/**
 * @description 派发离散的事件的监听函数 比如click这种就是离散的，像scroll这种就不是离散的
 * @param {*} domEventName 事件名 click
 * @param {*} eventSystemFlags 阶段 0 冒泡 4 捕获
 * @param {*} container
 * @param {*} nativeEvent
 */
function dispatchDiscreteEvent(domEventName, eventSystemFlags, container, nativeEvent) {
    dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
}


/**
 * @description 此方法就是委托给容器的回调 当容器div#root在捕获或者说冒泡阶段
 * 处理事件的时候会执行此函数
 * @param {*} domEventName
 * @param {*} eventSystemFlags
 * @param {*} targetContainer
 * @param {*} nativeEvent
 */
export function dispatchEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent) {
  debugger;
    // 获取事件源
    const nativeEventTarget = getEventTarget(nativeEvent);
    // 从事件源获取事件源最近的fiber节点
    const targetInst = getClosestInstanceFromNode(nativeEventTarget);
    // 为插件系统派发事件
    dispatchEventForPluginEventSystem(
        domEventName, // click
        eventSystemFlags, // 0 4
        nativeEvent, // 原生事件
        targetInst, // 此真实DOM对应的fiber
        targetContainer); // 目标容器
}
