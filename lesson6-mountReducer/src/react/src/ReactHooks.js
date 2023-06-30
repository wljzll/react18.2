import ReactCurrentDispatch from "./ReactCurrentDispatcher";

function resolveDispatcher() {
    return ReactCurrentDispatch.current;
}

/**
 * 这个方法将被使用者在组件内导入使用
 * @param {*} reducer 处理函数 用于根据老状态和动作计算新状态
 * @param {*} initialArg 初始状态
 */
export function useReducer(reducer, initialArg) {
    // 当调用useReducer方法时 调用resolveDispatcher 返回ReactCurrentDispatch.current属性
    const dispatcher = resolveDispatcher();
    // 返回
    return dispatcher.useReducer(reducer, initialArg);
}

/**
 * 1）程序员从React中导入 useReducer方法 这时方法未执行
 * 
 * 2）React解析到函数组件执行函数组件之前, ReactFiberHooks文件中的renderWithHooks方法将会给
 *   ReactCurrentDispatcher的current属性赋值成{ useReducer: mountReducer }
 * 
 */