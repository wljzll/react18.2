// 用来给 allNativeEvents 赋值
import { registerSimpleEvents, topLevelEventsToReactNames } from '../DOMEventProperties';
import { IS_CAPTURE_PHASE } from '../EventSystemFlags';
import { accumulateSinglePhaseListeners } from '../DOMPluginEventSystem';
import { SyntheticMouseEvent } from '../SyntheticEvent';

/**
 * 把要执行的回调函数添加到dispatchQueue中
 * @param {*} dispatchQueue 派发队列 里面放置我们的监听函数
 * @param {*} domEventName DOM事件名　click
 * @param {*} targetInst 目标fiber
 * @param {*} nativeEvent 原生事件
 * @param {*} nativeEventTarget 原生事件源
 * @param {*} eventSystemFlags 事件系统标识 0 冒泡 4 捕获
 * @param {*} targetContainer 目标容器 div#root
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
    let SyntheticEventCtor;
    switch (domEventName) {
        case 'click':
            SyntheticEventCtor = SyntheticMouseEvent;
            break;
        default:
            break;
    }
    // 根据原生事件的名字找到react事件的名字 根据click获取onClick
    const reactName = topLevelEventsToReactNames.get(domEventName);
    // 是否是捕获阶段
    const isCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
    // 累加单阶段监听
    const listeners = accumulateSinglePhaseListeners(
        targetInst,
        reactName,
        nativeEvent.type,
        isCapturePhase
    )
    // 如果有要执行的事件监听函数
    if (listeners.length > 0) {
        const event = new SyntheticEventCtor(reactName, domEventName, targetInst, nativeEvent, nativeEventTarget);
        dispatchQueue.push({
            event, // 合成事件的实例
            listeners // 监听函数数组
        });
    }
}

export { registerSimpleEvents as registerEvents, extractEvents };