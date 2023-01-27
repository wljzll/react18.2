import ReactCurrentDispatch from "./ReactCurrentDispatcher";
console.log('导入文件在项目运行的时候就会执行这个文件');
function resolveDispatcher() {
    return ReactCurrentDispatch.current;
}
/**
 * 
 * @param {*} reducer 处理函数 用于根据老状态和动作计算新状态
 * @param {*} initialArg 初始状态
 */
export function useReducer(reducer, initialArg) {
    const dispatcher = resolveDispatcher();
    // current上的reducer上的函数是执行函数式组件之前给挂载上去的 在渲染函数式组件之前current是null
    return dispatcher.useReducer(reducer, initialArg);
}