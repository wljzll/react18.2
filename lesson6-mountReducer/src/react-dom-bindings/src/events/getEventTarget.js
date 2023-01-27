/**
 * @description 兼容性的获取事件源
 * @param {*} nativeEvent 
 * @returns 事件源
 */
export function getEventTarget(nativeEvent) {
    const target = nativeEvent.target || nativeEvent.scrElement || window;
    return target;
}