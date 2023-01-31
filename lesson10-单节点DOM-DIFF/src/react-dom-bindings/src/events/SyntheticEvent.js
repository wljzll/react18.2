import assign from "shared/assign";

function functionThatReturnsTrue() {
    return true;
}

function functionThatReturnsFalse() {
    return false;
}
const MouseEventInterfase = {
    clientX: 0,
    clientY: 0
}

function createSyntheticEvent(inter) {
    // 
    /**
     * @description 合成事件的基类
     * @param {*} reactName React属性名 onClick
     * @param {*} reactEventType click
     * @param {*} targetInst 事件源对应的fiber实例
     * @param {*} nativeEvent 原生事件对象
     * @param {*} nativeEventTarget 原生事件源 span 事件源对应的真实DOM
     */
    function SyntheticBaseEvent(reactName, reactEventType, targetInst, nativeEvent, nativeEventTarget) {
        this._reactName = reactName;
        this.type = reactEventType;
        this._targetInst = targetInst;
        this.nativeEvent = nativeEvent;
        this.target = nativeEventTarget;
        // 把此接口上对应的属性从原生事件上拷贝到合成事件实例上
        for (const propName in inter) {
            if (!inter.hasOwnProperty(propName)) {
                continue;
            }
            this[propName] = nativeEvent[propName];
        }
        // 是否已经阻止默认事件
        this.isDefaultPrevented = functionThatReturnsFalse;
        // 是否已经阻止继续传播
        this.isPropagationStopped = functionThatReturnsFalse;
        return this;
    };
    assign(SyntheticBaseEvent.prototype, {
        // 阻止默认事件兼容
        preventDefault() {
            // 获取原生的事件对象
            const event = this.nativeEvent;
            // 如果有prevenDefault方法说明不是IE浏览器
            if (event.preventDefault) {
                event.preventDefault();
            } else { // 说明是IE浏览器 
                event.returnValue = false;
            }
            // 将事件对象上的是否已经阻止默认事件函数修改
            this.isDefaultPrevented = functionThatReturnsTrue;
        },
        // 阻止冒泡兼容
        stopPropagation() {
            // 获取原生的事件对象
            const event = this.nativeEvent;
            // 如果有prevenDefault方法说明不是IE浏览器
            if (event.stopPropagation) {
                event.stopPropagation();
            } else { // 说明是IE浏览器 
                event.cancelBubble = true;
            }
            // 将事件对象上的是否已经阻止冒泡修改
            this.isPropagationStopped = functionThatReturnsTrue;
        }
    })
    return SyntheticBaseEvent;
}

export const SyntheticMouseEvent = createSyntheticEvent(MouseEventInterfase); 