// 用来进行校验的函数
function validate(binding) {
  if (typeof binding.value !== 'function') { // 校验该指令所绑定的value是否是一个函数
    console.warn('[Vue-click-outside:] provided expression', binding.expression, 'is not a function.')
    return false
  }

  return true
}

function isPopup(popupItem, elements) {
  if (!popupItem || !elements)
    return false

  for (var i = 0, len = elements.length; i < len; i++) { // 循环遍历事件传播过程中的所有元素，判断该元素是否在popupItem中
    try {
      if (popupItem.contains(elements[i])) { // 事件传播中的元素被popupItem所包含了
        return true
      }
      if (elements[i].contains(popupItem)) { // 事件传播中的元素包含popupItem，说明点击到了组件外部
        return false
      }
    } catch(e) {
      return false
    }
  }

  return false
}

function isServer(vNode) { // 判断该vNode是否运行在服务器上（即是否为服务端渲染）
  return typeof vNode.componentInstance !== 'undefined' && vNode.componentInstance.$isServer
}

// 自定义指令配置
exports = module.exports = {
  bind: function (el, binding, vNode) {
    if (!validate(binding)) return

    // Define Handler and cache it on the element
    // 事件触发的回调函数
    function handler(e) {
      if (!vNode.context) return // 指令绑定的vNode没有上下文，直接返回

      // some components may have related popup item, on which we shall prevent the click outside event handler.
      // 翻译：某些组件可能有相关的弹出项，我们将在该项上阻止click outside事件处理程序。
      var elements = e.path || (e.composedPath && e.composedPath()) // 1.获取事件传播过程中的所有元素 2.解决移动端e.path可能失效的情况
      elements && elements.length > 0 && elements.unshift(e.target) // 排除掉点击元素本身

      if (el.contains(e.target) || isPopup(vNode.context.popupItem, elements)) return // 点击到的是元素以内的区域，或者点击的是该元素中的popupItem类弹出元素

      el.__vueClickOutside__.callback(e) // 执行v-click-oustside指令中的函数
    }

    // add Event Listeners
    el.__vueClickOutside__ = {
      handler: handler,
      callback: binding.value
    }
    const clickHandler = 'ontouchstart' in document.documentElement ? 'touchstart' : 'click'; // 判断是移动端还是PC端
    !isServer(vNode) && document.addEventListener(clickHandler, handler) // 不在服务端渲染时，才绑定事件监听函数
  },

  // 所在组件的 VNode 更新时调用，但是可能发生在其子 VNode 更新之前。指令的值可能发生了改变，也可能没有
  update: function (el, binding) {
    if (validate(binding)) el.__vueClickOutside__.callback = binding.value // 执行回调函数
  },

  // 只调用一次，指令与元素解绑时调用
  unbind: function (el, binding, vNode) {
    // Remove Event Listeners
    const clickHandler = 'ontouchstart' in document.documentElement ? 'touchstart' : 'click';
    !isServer(vNode) && el.__vueClickOutside__ && document.removeEventListener(clickHandler, el.__vueClickOutside__.handler)
    delete el.__vueClickOutside__ // 删除vueClickOutside对象
  }
}
