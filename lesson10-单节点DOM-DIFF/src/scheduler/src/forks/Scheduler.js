




// 此处后面我们会实现优先队列
export function scheduleCallback(callback) {
  // requestIdleCallback会在点击事件中的方法执行完成后才会去执行callback
  requestIdleCallback(callback);
}
