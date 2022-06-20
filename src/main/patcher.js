module.exports = new class rawPatcher {
  Symbol = Symbol("DrApi")
  hook(module, fn) {
    if (!module[fn]) module[fn] = function() {}
    const original = module[fn]

    let hook = module[fn][this.Symbol]

    if (!(this.Symbol in module[fn])) {

      hook = module[fn][this.Symbol] = {
        before: new Set(),
        instead: new Set(),
        after: new Set()
      }

      module[fn] = function() {
        let args = Array.from(arguments)
        for (const { callback } of [...hook.before]) {
          const result = callback(this, args)
          if (Array.isArray(result)) args = result
        }

        let res
        if (!hook.instead.size) res = original.apply(this, args)
        else for (const { callback } of [...hook.instead]) res = callback(this, args, original)
        
        for (const { callback } of [...hook.after]) {
          const result = callback(this, args, res)
          if (typeof result !== "undefined") res = result
        }

        return res
      }

      Object.assign(module[fn], original)

      module[fn].toString = () => original.toString()
      module[fn].toString.toString = () => original.toString.toString()
    }

    return hook
  }
  before(id, mod, fn, callback) {
    const hook = this.hook(mod, fn)
    const obj = { callback, id }
    hook.before.add(obj)
    return () => hook.after.delete(obj)
  }
  instead(id, mod, fn, callback) {
    const hook = this.hook(mod, fn)
    const obj = { callback, id }
    hook.instead.add(obj)
    return () => hook.after.delete(obj)
  }
  after(id, mod, fn, callback) {
    const hook = this.hook(mod, fn)
    const obj = { callback, id }
    hook.after.add(obj)
    return () => hook.after.delete(obj)
  }
}