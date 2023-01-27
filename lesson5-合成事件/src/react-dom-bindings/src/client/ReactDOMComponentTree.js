const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = `__reactFiber$` + randomKey;
const internalPropsKey = `__reactProps$` + randomKey;
/**
 * @description 从真实的DOM节点上获取它对应的fiber节点
 * @param {*} targetNode 
 */
export function getClosestInstanceFromNode(targetNode) {
    const targetInst = targetNode[internalInstanceKey];
    return targetInst;
}

/**
 * @description 提前缓存fiber节点的实例到DOM节点上
 * @param {*} hostInst fiber节点
 * @param {*} node 真实DOM
 */
export function precacheFiberNode(hostInst, node) {
    node[internalInstanceKey] = hostInst;
}

/**
 * 将fiber的props属性直接放到DOM上
 * @param {*} node 真实DOM
 * @param {*} props 虚拟DOM属性
 */
export function updateFiberProps(node, props) {
    node[internalPropsKey] = props;
}

/**
 * 读取node上的props
 * @param {*} node 
 * @returns 
 */
export function getFiberCurrentPropsFromNode(node) {
    return node[internalPropsKey] || null;
}