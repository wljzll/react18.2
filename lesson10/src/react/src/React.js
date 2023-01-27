import { useReducer, useState } from "./ReactHooks";
import ReactSharedInternals from './ReactSharedInternals';
console.log('导入文件在项目运行的时候就会执行这个文件');
export {
    useReducer,
    useState,
    ReactSharedInternals as _SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
}