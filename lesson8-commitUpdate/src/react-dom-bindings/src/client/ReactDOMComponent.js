import { setValueForStyles } from './CSSPropertyOperations';
import setTextContent from './setTextContent';
import { setValueForProperty } from './DOMPropertyOperations';


const STYLE = 'style';
const CHILDREN = 'children';
function setInitialDOMProperties(tag, domElement, nextProps) {
    for (const propKey in nextProps) {
        if (Object.hasOwnProperty.call(nextProps, propKey)) {
            const nextProp = nextProps[propKey];
            if (propKey === STYLE) {
                setValueForStyles(domElement, nextProp);
            } else if (propKey === CHILDREN) {
                // 处理独生子文本节点
                if (typeof nextProp === 'string') {
                    setTextContent(domElement, nextProp);
                } else if (typeof nextProp === 'number') {
                    setTextContent(domElement, `${nextProp}`)
                }
            }
        } else if (nextProp !== null) {
            setValueForProperty(domElement, propKey, nextProp);
        }
    }
}




export function setInitialProperties(domElement, tag, props) {
    setInitialDOMProperties(tag, domElement, props);
}

export function diffProperties(domElement, tag, lastProps, nextProps) {
    let updatePayload = null;
    let propKey;
    let styleName;
    let styleUpdates = null;

    /**
     * 老的有新的没有删除
     * 新的有老的也有但是新的不等于老的
     */

    // 处理属性的删除 如果说一个属性在老对象里有 在新对象里没有的话 那就意味着删除
    // 遍历老的属性
    for (propKey in lastProps) {
        // 如果新属性对象里有此属性 或者老的没有此属性 或者老的是个null 跳过不需要处理
        if (nextProps.hasOwnProperty(propKey) || !lastProps.hasOwnProperty(propKey) || lastProps[propKey] === null) {
            continue;
        }
        /******************** 走到这里就是老的有新的没有 就是删除逻辑 *******************/
        // 这里是删除整个style对象
        if (propKey === STYLE) { // 老的有style属性新的没有style属性 将style的所有属性都置为空字符串
            const lastStyle = lastProps[propKey];
            for (styleName in lastStyle) {
                if (lastStyle.hasOwnProperty(styleName)) {
                    if (!styleUpdates) {
                        styleUpdates = {};
                    }
                    styleUpdates[styleName] = '';
                }
            }
        } else { // 对于其他属性直接置为null
            (updatePayload = updatePayload || []).push(propKey, null);
        }
    }

    // 遍历新的属性
    for (propKey in nextProps) {
        const nextProp = nextProps[propKey]; // 新属性中的属性值
        const lastProp = lastProps != null ? lastProps[propKey] : undefined; // 老属性中的属性值
        // 新的不存在 | 新的等于老的 | 新的&老的都为null 跳过不需要处理
        if (!nextProps.hasOwnProperty(propKey) || nextProp === lastProp || (nextProp == null && lastProp == null)) {
            continue;
        }
        /******************** 到这里的都是新的有且不等于老的 ********************/
        if (propKey === STYLE) { // 1、新的老的都有STYLE属性 2、新的有STYLE老的没有
            if (lastProp) {
                // 计算要删除的行内样式 这里是删除style里部分属性
                for (styleName in lastProp) {
                    // 如果此样式对象里在某个老的style里有 新的style里没有
                    if (lastProp.hasOwnProperty(styleName) && (!nextProp || !nextProp.hasOwnProperty(styleName))) {
                        if (!styleUpdates) {
                            styleUpdates = {};
                        }
                        styleUpdates[styleName] = "";
                    }
                }
                // 遍历新的样式对象
                for (styleName in nextProp) { // 这里是新老属性值不一样 替换成最新的
                    // 如果说新的属性有 并且新属性的值和老属性不一样
                    if (nextProp.hasOwnProperty(styleName) && lastProp[styleName] !== nextProp[styleName]) {
                        if (!styleUpdates) {
                            styleUpdates = {};
                        }
                        styleUpdates[styleName] = nextProp[styleName];
                    }
                }
            } else { // 老的style属性不存在
                // Relies on `updateStylesByID` not mutating `styleUpdates`.
                if (!styleUpdates) {
                    if (!updatePayload) {
                        updatePayload = [];
                    }
                    updatePayload.push(propKey, styleUpdates);
                }
                // 将新的style属性直接赋值
                styleUpdates = nextProp;
            }
        } else if (propKey === CHILDREN) {
            if (typeof nextProp === "string" || typeof nextProp === "number") {
                (updatePayload = updatePayload || []).push(propKey, "" + nextProp);
            }
        } else {
            (updatePayload = updatePayload || []).push(propKey, nextProp);
        }
    }
    if (styleUpdates) {
        (updatePayload = updatePayload || []).push(STYLE, styleUpdates);
    }
    return updatePayload; // [key1, value1, key2, value2]
}

export function updateProperties(domElement, updatePayload) {
    updateDOMProperties(domElement, updatePayload);
}

function updateDOMProperties(domElement, updatePayload) {
    for (let i = 0; i < updatePayload.length; i += 2) {
        const propKey = updatePayload[i];
        const propValue = updatePayload[i + 1]
        if (propKey === STYLE) {
            setValueForStyles(domElement, propValue);
        } else if (propKey === CHILDREN) {
            setTextContent(domElement, propValue);
        } else {
            setValueForProperty(domElement, propKey, propValue);
        }
    }
}