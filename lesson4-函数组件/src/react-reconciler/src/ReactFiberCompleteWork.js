import logger from "shared/logger";
import { HostComponent, HostRoot, HostText } from "./ReactWorkTags";
import {
    createTextInstance,
    appendInitialChild,
    finalizeInitialChildren,
    createInstance
} from 'react-dom-bindings/src/client/ReactDOMHostConfig'
import { NoFlags } from "./ReactFiberFlags";


/**
 * @description 把当前完成的fiber所有的子节点对应的真实DOM都挂载到自己父parent真实DOM节点上
 * @param {*} parent 当前完成的fiber真实的DOM节点
 * @param {*} workInprogerss 完成的fiber
 */
function appendAllChildren(parent, workInprogerss) {
    // 获取当前fiber的儿子
    let node = workInprogerss.child;
    
    // 如果一直有儿子
    while (node) {
        // 此节点是真实的DOM节点
        if (node.tag === HostComponent || node.tag === HostText) {
            appendInitialChild(parent, node.stateNode);
        } else if (node.child !== null) { // 走到这里说明不是DOM节点　可能是函数式组件或者类组件节点
            // 那么直接取它的儿子　然后重新循环
            node = node.child;
            continue;
        }

        // 如果递归查到的节点已经是父节点了就结束了
        if (node === workInprogerss) {
            return;
        }

        // 如果当前的节点没有弟弟 就一直递归往上找 找他真正的父亲
        // 可能存在的情况是，这个node的父亲是函数式组件1 函数式组件1的父亲还是函数式组件 然后函数式组件2还没有兄弟节点
        while (node.sibling === null) {
            // 如果找到的父节点是当前的正在完成的节点说明整个流程就结束了
            if (node.return === null || node.return === workInprogerss) {
                return;
            }
            // 回到父节点
            node = node.return;
        }
        // 处理完当前node处理当前node的兄弟节点 兄弟节点也是node的父节点的儿子
        node = node.sibling;
    }
}

/**
 * 完成一个fiber节点：完成一个节点的意思是将这个fiber对应的虚拟DOM创建成真实DOM并赋值给当前fiber的stateNode属性
 * 以便在提交阶段递归的将真实DOM渲染到对应的父节点中 最后渲染到页面上
 * @param {*} current 老fiber
 * @param {*} workInProgress 新构建的fiber
 */
export function completeWork(current, workInProgress) {
    logger('completeWork', workInProgress)
    const newProps = workInProgress.pendingProps;
    switch (workInProgress.tag) {
        case HostRoot:
            // 向上冒泡副作用
            bubblePropertise(workInProgress);
            break;
        case HostComponent: // 完成的是原生节点
            /********************* 现在只是在处理创建或者说挂在新节点的逻辑，后面此处进行区分是在挂载还是更新 ***********************/
            // 创建真实的DOM节点
            const { type } = workInProgress;
            const instance = createInstance(type, newProps, workInProgress);
            // 把自己所有的儿子都添加到自己身上
            workInProgress.stateNode = instance;
            appendAllChildren(instance, workInProgress,)
            finalizeInitialChildren(instance, type, newProps);
            bubblePropertise(workInProgress);
            break;

        case HostText: // 此fiber节点是文本节点
            // props就是文本内容
            const newText = newProps;
            // 将文本fiber创建成文本真是的文本DOM节点并关联到fiber的stateNode属性上
            workInProgress.stateNode = createTextInstance(newText);
            // 向上冒泡副作用
            bubblePropertise(workInProgress);
            break;
    }
}

/**
 * @description 将儿子节点的副作用向上冒泡到自己身上
 * 儿子节点的副作用冒泡了孙子节点的副作用
 * 孙子节点的副作用冒泡了重孙的副作用
 * 因此总的父节点上其实能反映出他的所有儿子的副作用
 * @param {*} completedWork 当前完成的fiber
 */
function bubblePropertise(completedWork) {
    let subtreeFlags = NoFlags;
    let child = completedWork.child;
    // 遍历当前fiber的所有子节点 把所有子节点的副作用以及子节点的子节点的副作用全部合并起来
    while (child !== null) {
        // 子节点对应的副作用标识
        subtreeFlags |= child.subtreeFlags;
        // flags自己的副作用标识
        subtreeFlags |= child.flags;
        child = child.sibling;
    }
    completedWork.subtreeFlags = subtreeFlags;
}