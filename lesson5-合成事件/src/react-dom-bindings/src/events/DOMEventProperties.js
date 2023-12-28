import { registerTwoPhaseEvent } from './EventRegistry';

// dom所有的事件数组 这里只写了一个click
const simpleEventPluginEvents = ['click'];

// React事件名和原生事件名的映射
export const topLevelEventsToReactNames = new Map();

function registerSimpleEvent(domEventName, reactName) {
    // 把原生事件名和处理函数的名字进行映射或者说绑定 click => onClick
    topLevelEventsToReactNames.set(domEventName, reactName);
    // 注册两个阶段的事件
    registerTwoPhaseEvent(reactName, [domEventName]);
}

/**
 * @description 注册简单事件
 */
export function registerSimpleEvents() {
    for (let i = 0; i < simpleEventPluginEvents.length; i++) {
        const eventName = simpleEventPluginEvents[i]; // 拿到对应的原生事件 click
        const domEventName = eventName.toLowerCase(); // 转小写 click
        const capitalizeEvent = eventName[0].toUpperCase() + eventName.slice(1); // 将首字母大写 变成了Click
        registerSimpleEvent(domEventName, `on${capitalizeEvent}`); // click onClick
    }
}