import { getFiberCurrentPropsFromNode } from "../client/ReactDOMComponentTree";

/**
 * @description 获取此fiber上对应的事件的回调函数
 * @param {*} inst fiber实例
 * @param {*} registrationName 事件名
 */
export default function getListener(inst, registrationName) {
    const { stateNode } = inst;
    if (stateNode === null)
        return null;
    const props = getFiberCurrentPropsFromNode(stateNode);
    if (props === null)
        return null;
    const listener = props[registrationName] // props.onClick
    return listener;
}
