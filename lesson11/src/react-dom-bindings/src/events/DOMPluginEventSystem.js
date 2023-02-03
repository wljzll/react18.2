import { allNativeEvents } from './EventRegistry';
import * as SimpleEventPlugin from './plugins/SimpleEventPlugin';
import { IS_CAPTURE_PHASE } from './EventSystemFlags';
import { createEventListenerWrapperWithPriority } from './ReactDOMEventListener'
import { addEventCaptureListener, addEventBubbleListener } from './EventListener';
import { getEventTarget } from './getEventTarget';
import { HostComponent } from 'react-reconciler/src/ReactWorkTags';
import getListener from './getListener';


// 会先执行这个方法 给allNativeEvents赋值
SimpleEventPlugin.registerEvents();

const listeningMarker = `_reaceListening` + Math.random().toString(36).slice(2);

export function listenToAllSupportedEvents(rootContainerElement) {
    // 监听根容器 也就是div#root只监听一次
    if (!rootContainerElement[listeningMarker]) {
        rootContainerElement[listeningMarker] = true;
        // 遍历所有的原生事件比如click 进行监听
        allNativeEvents.forEach((domEventName) => {
            listenToNativeEvent(domEventName, true, rootContainerElement);
            listenToNativeEvent(domEventName, false, rootContainerElement);
        })
    }

}

/**
 * 注册原生事件
 * @param {*} domEventName 原生事件 click
 * @param {*} isCapturePhaseListener 是否是捕获阶段 true false
 * @param {*} target 目标DOM节点 div#root 容器节点
 */
export function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
    let eventSystemFlags = 0; // 默认是0 0：冒泡 4：捕获
    // 如果是捕获阶段将flag修改
    if (isCapturePhaseListener) {
        eventSystemFlags |= IS_CAPTURE_PHASE;
    }
    addTrappedEventListener(target, domEventName, eventSystemFlags, isCapturePhaseListener);
}

/**
 * @description 创建事件监听函数 并为根元素添加添加事件监听
 * @param {*} target 根元素div#root
 * @param {*} domEventName 事件名
 * @param {*} eventSystemFlags 事件系统标识
 * @param {*} isCapturePhaseListener 是否是捕获阶段
 */
function addTrappedEventListener(target, domEventName, eventSystemFlags, isCapturePhaseListener) {
    // 创建带有优先级的事件监听函数 事件处理函数
    const listener = createEventListenerWrapperWithPriority(target, domEventName, eventSystemFlags);

    // 创建完成监听事件后 用事件监听函数去绑定事件
    if (isCapturePhaseListener) {// 捕获阶段
        addEventCaptureListener(target, domEventName, listener);
    } else { // 冒泡阶段
        addEventBubbleListener(target, domEventName, listener);
    }
}

/**
 * @description 派发事件
 * @param {*} domEventName
 * @param {*} eventSystemFlags
 * @param {*} nativeEvent
 * @param {*} targetInst
 * @param {*} targetContainer
 */
export function dispatchEventForPluginEventSystem(
    domEventName,
    eventSystemFlags,
    nativeEvent,
    targetInst,
    targetContainer
) {
    dispatchEventForPlugins(
        domEventName,
        eventSystemFlags,
        nativeEvent,
        targetInst,
        targetContainer
    );
}

/**
 * @description 派发事件
 * @param {*} domEventName
 * @param {*} eventSystemFlags
 * @param {*} nativeEvent
 * @param {*} targetInst
 * @param {*} targetContainer
 */
function dispatchEventForPlugins(
    domEventName,
    eventSystemFlags,
    nativeEvent,
    targetInst,
    targetContainer) {
    // 获取事件源 获取事件源的方法有兼容性问题因此要兼容性的获取
    const nativeEventTarget = getEventTarget(nativeEvent);
    // 派发事件的数组
    const dispatchQueue = [];
    // 提取事件
    extractEvents(
        dispatchQueue,
        domEventName,
        targetInst,
        nativeEvent,
        nativeEventTarget,
        eventSystemFlags,
        targetContainer
    );
    processDispatchQueue(dispatchQueue, eventSystemFlags);
}

function processDispatchQueue(dispatchQueue, eventSystemFlags) {
    // 判断是否在捕获阶段
    const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
    for (let i = 0; i < dispatchQueue.length; i++) {
        const { event, listeners } = dispatchQueue[i];
        processDispatchQueueItemsInOrder(event, listeners, inCapturePhase);
    }
}

function excuteDispatch(event, listener, currentTarget) {
    // 合成事件实例 currentTarget是在不断变化的
    // event nativeEventTarget 它是原始的事件源 是永远不变的
    // event currentTarget 当前的事件源 它会随着事件回调的执行不断变化的
    event.currentTarget = currentTarget;
    listener(event);
}
function processDispatchQueueItemsInOrder(event, dispatchListeners, inCapturePhase) {
    if (inCapturePhase) { // 捕获阶段 数组倒序执行
        for (let i = dispatchListeners.length - 1; i >= 0; i--) {
            const { listener, currentTarget } = dispatchListeners[i];
            if (event.isPropagationStopped()) {
                return;
            }
            // listener(event);
            excuteDispatch(event, listener, currentTarget);
        }
    } else {
        for (let i = 0; i < dispatchListeners.length; i++) {
            const { listener, currentTarget } = dispatchListeners[i];
            if (event.isPropagationStopped()) {
                return;
            }
            excuteDispatch(event, listener, currentTarget);
        }
    }
}

/**
 * @description 执行事件处理函数之前先把所有的相关节点的事件都收集起来
 * @param {*} dispatchQueue
 * @param {*} domEventName
 * @param {*} targetInst
 * @param {*} nativeEvent
 * @param {*} nativeEventTarget
 * @param {*} eventSystemFlags
 * @param {*} targetContainer
 */
function extractEvents(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer
) {
    SimpleEventPlugin.extractEvents(
        dispatchQueue,
        domEventName,
        targetInst,
        nativeEvent,
        nativeEventTarget,
        eventSystemFlags,
        targetContainer
    )
}

/**
 * @description 从fiber上获取对应的事件的事件处理函数
 * @param {*} targetFiber 事件源对应的fiber
 * @param {*} reactName 原生事件对应的React事件事件名
 * @param {*} nativeEventType 原生事件名
 * @param {*} isCapturePhase 是否是捕获阶段
 * @returns 收集的事件处理函数
 */
export function accumulateSinglePhaseListeners(
    targetFiber,
    reactName,
    nativeEventType,
    isCapturePhase
) {
    const captureName = reactName + 'Capture';
    const reactEventName = isCapturePhase ? captureName : reactName;
    const listeners = [];
    let instance = targetFiber;
    while (instance !== null) {
        const { stateNode, tag } = instance; // 当前执行回调的DOM节点
        if (tag === HostComponent && stateNode !== null) {
            if (reactEventName !== null) {
                const listener = getListener(instance, reactEventName);
                if (listener) {
                    listeners.push(createDispatchListener(instance, listener, stateNode));
                }
            }
        }
        instance = instance.return;
    }
    return listeners;
}

function createDispatchListener(instance, listener, currentTarget) {
    return {
        instance,
        listener,
        currentTarget
    }
}
