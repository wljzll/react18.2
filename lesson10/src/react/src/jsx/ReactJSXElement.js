import hasOwnProperty from 'shared/hasOwnProperty';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';

const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true,
};
function hasValidRef(config) {
  return config.ref !== undefined;
}

/**
 * 创建虚拟DOM
 * @param {*} type
 * @param {*} key
 * @param {*} ref
 * @param {*} props
 * @returns
 */
const ReactElement = (type, key, ref, props) => {
  const element = {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
  };
  return element;
};

// Babel将JSX语法编译后会默认调用jsxDEV方法
/**
 *
 * @param {*} type 元素类型 span
 * @param {*} config 包括子元素的DOM属性 {style: {}, children: 'world'}
 * @param {*} maybeKey 元素的key
 * @returns
 */

export function jsxDEV(type, config, maybeKey) {
  let propName;
  const props = {};
  let key = null;
  let ref = null;

  // 如果有key
  if (maybeKey !== undefined) {
    // 转成字符串
    key = '' + maybeKey;
  }

  // 如果有ref
  if (hasValidRef(config)) {
    ref = config.ref;
  }

  // 构建props
  for (propName in config) {
    if (
      hasOwnProperty.call(config, propName) &&
      !RESERVED_PROPS.hasOwnProperty(propName)
    ) {
      props[propName] = config[propName];
    }
  }
  return ReactElement(type, key, ref, props);
}
