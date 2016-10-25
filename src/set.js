import {Typed, Type, Union, Any, typeOf, construct} from "./typed"
import * as Immutable from 'immutable'


const ImmutableSet = Immutable.Set
const {Set: IterableSet} = Immutable.Iterable

const $store = Typed.store
const $type = Typed.type
const $read = Typed.read
const $step = Typed.step
const $init = Typed.init
const $result = Typed.result
const $label = Typed.label
const $typeName= Typed.typeName
const $empty = Typed.empty

const change = (set, f) => {
  const store = f(set[$store])
  if (store === set[$store]) {
    return set;
  } else {
    const result = set.__ownerID ? set : construct(set)
    result[$store] = store
    result.size = store.size
    return result
  }
}

const clear = target => target.clear()

class TypeInferrer extends Type {
  [Typed.typeName]() {
    return 'TypeInferrer'
  }
  [Typed.read](value) {
    const type = typeOf(value).constructor.prototype
    this.type = this.type ? Union(this.type, type) : type
    return value
  }
}

function BaseImmutableSet() {}
BaseImmutableSet.prototype = ImmutableSet.prototype

class TypeInferredSet extends BaseImmutableSet {
  static from(set) {
    const result = construct(this.prototype)
    result[$store] = set[$store]
    result.size = set.size
    return result
  }
  constructor(value) {
    super();
    return TypeInferredSet.prototype[$read](value)
  }
  [Typed.init]() {
    const result = construct(this).asMutable()
    result[$type] = new TypeInferrer()
    return result
  }
  [Typed.result](result) {
    const set = result.asImmutable()
    set[$type] = result[$type].type

    return set
  }
  [Typed.read](input) {
    const Type = this.constructor

    if (input === null || input === void(0)) {
      if (!this[$empty]) {
        const result = construct(this)
        result[$store] = ImmutableSet()
        result.size = 0
        this[$empty] = result
      }

      return this[$empty]
    }

    if (input instanceof Type && input && input.constructor === Type) {
      return input
    }

    const source = IterableSet(input)
    const isEmpty = source.size === 0

    if (isEmpty && this[$empty]) {
      return this[$empty]
    }

    let set = this[$init]()
    set.size = source.size
    source.forEach(value => {
      set.add(value)
    })

    set = this[$result](set)

    if (isEmpty) {
      this[$empty] = set
    }

    return set
  }
  [Typed.step](result, [value]) {
    return change(result, (store = ImmutableSet()) => store.add(value))
  }

  [Typed.typeName]() {
    return this[$label] || `Typed.Set(${this[$type][$typeName]()})`
  }

  toString() {
    return this.__toString(this[$typeName]() + '([', '])')
  }

  has(key) {
    return this[$store].has(key)
  }

  get(key, notSetValue) {
    return this[$store] ? this[$store].get(key, notSetValue) : notSetValue
  }

  clear() {
    if (this.__ownerID) {
      return change(this, clear)
    }

    return this[$empty] || this[$read]()
  }

  add(value) {
    const result = this[$type][$read](value)

    if (result instanceof TypeError) {
      throw new TypeError(`Invalid value: ${result.message}`)
    }

    return change(this, store => store ? store.add(result) : ImmutableSet([result]))
  }

  remove(value) {
    return change(this, store => store && store.delete(value))
  }

  wasAltered() {
    return this[$store].wasAltered()
  }

  __ensureOwner(ownerID) {
    const result = this.__ownerID === ownerID ? this : !ownerID ? this : construct(this)

    result.__ownerID = ownerID
    result[$store] = this[$store] ? this[$store].__ensureOwner(ownerID) : ImmutableSet().__ensureOwner(ownerID)
    result.size = result[$store].size

    return result
  }
  __iterator(type, reverse) {
    return IterableSet(this[$store]).map((_, key) => key).__iterator(type, reverse)
  }

  __iterate(f, reverse) {
    return IterableSet(this[$store]).map((_, key) => key).__iterate(f, reverse)
  }
}
TypeInferredSet.prototype[Typed.DELETE] = TypeInferredSet.prototype.remove

const BaseTypeInferredSet = function() {}
BaseTypeInferredSet.prototype = TypeInferredSet.prototype

class TypedSet extends BaseTypeInferredSet {
  constructor() {
    super()
  }
  [Typed.init]() {
    return construct(this).asMutable()
  }
  [Typed.result](result) {
    return result.asImmutable()
  }
  map(mapper, context) {
    if (this.size === 0) {
      return this
    } else {
      const result = TypeInferredSet.from(this).map(mapper, context)
      if (this[$store] === result[$store]) {
        return this
      }
      if (result[$type] === this[$type]) {
        const set = construct(this)
        set[$store] = result[$store]
        set.size = result.size
        return set
      } else {
        return result
      }
    }
  }
  flatMap(mapper, context) {
    if (this.size === 0) {
      return this
    } else {
      const result = TypeInferredSet.from(this).flatMap(mapper, context)
      if (this[$store] === result[$store]) {
        return this
      }
      if (result[$type] === this[$type]) {
        const set = construct(this)
        set[$store] = result[$store]
        set.size = result.size
        return set
      } else {
        return result
      }
    }
  }
}

export const Set = function(descriptor, label) {
  if (descriptor === void(0)) {
    throw new TypeError("Typed.Set must be passed a type descriptor")
  }

  if (descriptor === Any) {
    return Immutable.Set
  }

  const type = typeOf(descriptor)

  if (type === Any) {
    throw new TypeError(`Typed.Set was passed an invalid type descriptor: ${descriptor}`)
  }

  const SetType = function(value) {
    const isSetType = this instanceof SetType
    const Type = isSetType ? this.constructor : SetType

    if (value instanceof Type) {
      return value
    }

    const result = Type.prototype[$read](value)

    if (result instanceof TypeError) {
      throw result
    }

    if (isSetType && !this[$store]) {
      this[$store] = result[$store]
      this.size = result.size
    } else {
      return result
    }

    return this
  }
  SetType.of = ImmutableSet.of
  SetType.prototype = Object.create(SetPrototype, {
    constructor: {value: SetType},
    [$type]: {value: type},
    [$label]: {value: label}
  })

  return SetType
}
Set.Type = TypedSet
Set.prototype = TypedSet.prototype
const SetPrototype = TypedSet.prototype