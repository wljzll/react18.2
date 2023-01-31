import { MutationMask, Placement, Update } from "./ReactFiberFlags";
import { FunctionComponet, HostComponent, HostRoot, HostText } from "./ReactWorkTags";
import { appendChild, insertBefore, commitUpdate } from "react-dom-bindings/src/client/ReactDOMHostConfig";
import { removeChild } from "react-dom-bindings/src/client/ReactDOMHostConfig";


let hostParent = null;
/**
 * 
 * @param {*} root 根节点
 * @param {*} returnFiber 父fiber
 * @param {*} deletedFiber 要删除的子fiber节点
 */
function commitDeletionEffects(root, returnFiber, deletedFiber) {
    let parent = returnFiber;
    // 一直往上找找到真实的DOM节点为止
    findParent: while (parent !== null) {
        switch (parent.tag) {
            case HostComponent: {
                hostParent = parent.stateNode;
                break findParent; // 找到了就跳出while循环
            }
            case HostRoot: {
                hostParent = parent.stateNode.containerInfo;
                break findParent; // 找到了就跳出while循环
            }
            default:
                break;
        }
        parent = parent.return;
    }
    // 找到父真实DOM后 提交删除
    commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
    hostParent = null;
}

/**
 * @description 删除子fiber节点对应的真实DOM
 * @param {*} finishedRoot 根节点
 * @param {*} nearestMountedAncestor 父fiber
 * @param {*} deletedFiber 要删除的fiber
 */
function commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, deletedFiber) {
    switch (deletedFiber.tag) {
        case HostComponent:
        case HostText:
            {
                // 先去递归删除儿子的儿子 要删除当前的子fiber，就要递归去删除这个儿子下所有的节点
                recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
                // 递归删除完这个儿子下的所有节点后 再去删除这个儿子
                if (hostParent !== null) {
                    removeChild(hostParent, deletedFiber.stateNode)
                }
            }
            break;
        default:
            break;
    }
}

/**
 * @description 递归删除子节点
 * @param {*} finishedRoot 根fiber
 * @param {*} nearestMountedAncestor 父fiber 
 * @param {*} parent 
 */
function recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, parent) {
    // 获取要删除的fiber的子fiber
    let child = parent.child;
    while (child !== null) {
        commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, child);
        child = child.sibling;
    }
}

/**
 * 在父fiber上提交变更副作用
 * @param {*} root 根节点
 * @param {*} parentFiber 父fiber 
 */
function recursivelyTraverseMutationEffects(root, parentFiber) {
    const deletions = parentFiber.deletions; // 拿到父节点上要删除的子fiber列表
    if (deletions !== null) {
        // 遍历要删除的儿子节点
        for (let i = 0; i < deletions.length; i++) {
            const childToDelete = deletions[i];
            commitDeletionEffects(root, parentFiber, childToDelete);
        }
    }
    // 说明子fiber里有副作用
    if (parentFiber.subtreeFlags & MutationMask) {
        // 拿到父fiber的大儿子
        let { child } = parentFiber;
        while (child !== null) {
            // 递归处理
            commitMutationEffectsOnfiber(child, root);
            child = child.sibling;
        }
    }
}

/**
 * 
 * @param {*} finishedWork 
 */
function commitReconciliationEffects(finishedWork) {
    const { flags } = finishedWork;
    // 说明是插入操作
    if (flags & Placement) {
        // 进行插入操作 也就是把此fiber对应的真实DOM节点添加到父真实DOM节点上
        commitPlacement(finishedWork);
        // 把flags里的Placement删除
        finishedWork.flags &= ~Placement;
    }
}

/**
 * 判断当前的fiber是不是真实DOM对应的fiber
 * @param {*} fiber fiber节点
 * @returns 
 */
function isHostParent(fiber) {
    // HostRoot是div#root  HostComponent是DOM节点
    return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

/**
 * @description 找到当前fiber的是真实DOM的父fiber 剔除函数式组件和类组件这种fiber节点
 * @param {*} fiber fiber节点
 * @returns 
 */
function getHostParentFiber(fiber) {
    // 获取此fiber的父fiber节点
    let parent = fiber.return;
    while (parent !== null) {
        // 如果当前找到的父fiber是真实DOM节点就找到了并返回
        if (isHostParent(parent)) {
            return parent;
        }
        // 如果当前的父fiber不是真实DOM节点继续往上找
        parent = parent.return;
    }

    return parent;

}



/**
 * @description 将此fiber对应的真实DOM节点插入到父DOM中
 * @param {*} node 将要插入的fiber节点
 * @param {*} parent 父DOM
 */
function insertOrAppendPlacementNode(node, before, parent) {
    // 获取此fiber的tag类型
    const { tag } = node;
    // 此fiber是不是原生DOM节点或文本类型的节点 
    const isHost = tag === HostComponent || tag === HostText;
    if (isHost) { // 如果此fiber对应的是真实DOM节点
        // 获取真实DOM
        const { stateNode } = node;
        if (before) { // 如果有before就插入before之前
            insertBefore(parent, stateNode, before);
        } else { // 否则就追加父元素的尾部
            // 将真实DOM插入到父DOM中
            appendChild(parent, stateNode);
        }

    } else { // 不是真实DOM
        const { child } = node;
        if (child !== null) {
            // 递归
            insertOrAppendPlacementNode(child, before, parent);
            // 递归插入完成当前节点后 处理兄弟节点
            let { sibling } = child;
            while (sibling !== null) {
                // 递归处理兄弟节点
                insertOrAppendPlacementNode(sibling, before, parent);
                // 处理完成后再处理下一个
                sibling = sibling.sibling;
            }
        }
    }
}

/**
 * 找到要插入的锚点
 * 找到可以插在它的前面的那个fiber对应的真实DOM
 * @param {*} finishedWork 
 */
function getHostSibling(finishedWork) {
    let node = finishedWork;
    siblings: while (true) {
        // 去找当前fiber节点的弟弟 如果弟弟节点不存在 则递归向上找node节点的父亲/爷爷/曾爷爷等,然后找到父亲/爷爷/曾爷爷的兄弟节点
        while (node.sibling === null) { // 没有弟弟 可能是父节点是函数式组件或类组件的情况 具体看图
            // 也没有父亲 或者父亲是原生节点 就是没有兄弟锚点 此时就是将当前的fiber的真实DOM直接append到父真实DOM中去
            if (node.return === null || isHostParent(node.return)) {
                return null;
            }
            // 如果当前fiber的父节点存在 就重新赋值 然后走while递归 没有弟弟就去找父亲
            node = node.return;
        }
        // 对应的node节点有弟弟节点了
        node = node.sibling;
        // 如果弟弟不是原生节点也不是文本节点 可能是函数组件或类组件
        while (node.tag !== HostComponent && node.tag !== HostText) {
            // 如果 & 上Placement不为0 说明这个弟弟节点是一个将要插入的新节点 则跳出当前的while循环继续sibling这个while循环去找对应的真实DOM节点
            if (node.flags & Placement) {
                continue siblings;
            } else {
                node = node.child;
            }
        }
        if (!(node.flags & Placement)) {
            return node.stateNode;
        }

    }
}


/**
 * @description 把此fiber的真实DOM插入到父DOM里
 * @param {*} finishedWork 
 */
function commitPlacement(finishedWork) {
    // 要往上找到真实DOM父fiber 此fiber节点的父亲可能不是真实DOM 比如函数式组件或类组件等 
    const parentFiber = getHostParentFiber(finishedWork);
    switch (parentFiber.tag) {
        case HostRoot: // 根节点的真实DOM是在stateNode的containerInfo上 div#root
            // 用 {} 包起来是因为有命名冲突
            {
                const parent = parentFiber.stateNode.containerInfo;
                // 获取最近的弟弟真实DOM节点
                const before = getHostSibling(finishedWork);
                // 目的: 将此fiber的真实DOM添加到父DOM上
                insertOrAppendPlacementNode(finishedWork, before, parent);
                break;
            }

        case HostComponent: // 如果父fiber是原生组件
            {
                const parent = parentFiber.stateNode;
                // 获取最近的弟弟真实DOM节点
                const before = getHostSibling(finishedWork);
                insertOrAppendPlacementNode(finishedWork, before, parent);
                break;
            }

        default:
            break;
    }
}

/**
 * @description 遍历fiber树 执行fiber上的副作用
 * @param {*} finishedWork fiber节点
 * @param {*} root 根节点
 */
export function commitMutationEffectsOnfiber(finishedWork, root) {
    const current = finishedWork.alternate;
    const flags = finishedWork.flags;
    switch (finishedWork.tag) {
        case FunctionComponet:
        case HostRoot:
        case HostText: {
            // 先遍历它们的子节点 处理它们的子节点上的副作用
            recursivelyTraverseMutationEffects(root, finishedWork);
            // 再处理自己身上的副作用
            commitReconciliationEffects(finishedWork);
            break;

        }
        case HostComponent: {
            // 先遍历它们的子节点 处理它们的子节点上的副作用
            recursivelyTraverseMutationEffects(root, finishedWork);
            // 再处理自己身上的副作用
            commitReconciliationEffects(finishedWork);
            if (flags & Update) {
                // 获取真实DOM
                const instance = finishedWork.stateNode;
                if (instance !== null) {
                    const newProps = finishedWork.memoizedProps;
                    const oldProps = current !== null ? current.memoizedProps : newProps;
                    const type = finishedWork.type;
                    const updatePayload = finishedWork.updateQueue;
                    finishedWork.updateQueue = null;
                    if (updatePayload) {
                        commitUpdate(instance, updatePayload, type, oldProps, newProps, finishedWork);
                    }

                }
            }
            break;
        }
        default:
            break;

    }
}