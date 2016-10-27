import test from "./test"
import * as Immutable from "immutable"
import {Record} from "../record"
import {Set} from "../set"
import {Typed, Union, Maybe} from "../typed"

const inc = x => x + 1
const isEvent = x => x % 2 === 0
const sum = (x, y) => x + y
const concat = (xs, ys) => xs.concat(ys)

const NumberSet = Set(Number)
const StringSet = Set(String)
const Point = Record({x: Number(0),
    y: Number(0)},
  'Point')

const Points = Set(Point, 'Points')

test("typed set creation", assert => {

  assert.throws(_ => Set(), /Typed.Set must be passed a type descriptor/)

  assert.throws(_ => Set({}), /Typed.Set was passed an invalid type descriptor:/)
})

test("number set", assert => {
  const ns1 = NumberSet()
  assert.ok(ns1 instanceof Immutable.Set)
  assert.ok(ns1 instanceof Set)
  assert.ok(ns1 instanceof NumberSet)
  assert.equal(ns1.size, 0)
  assert.notOk(ns1.has(5))

  const ns2 = ns1.add(5)
  assert.ok(ns2 instanceof Immutable.Set)
  assert.ok(ns2 instanceof Set)
  assert.ok(ns2 instanceof NumberSet)
  assert.equal(ns2.size, 1)
  assert.ok(ns2.has(5))
  assert.equal(ns2.get(5), 5)

  const ns3 = ns2.add(5)
  assert.ok(ns3 instanceof Immutable.Set)
  assert.ok(ns3 instanceof Set)
  assert.ok(ns3 instanceof NumberSet)
  assert.equal(ns3.size, 1)
  assert.ok(ns3.has(5))

  const ns4 = ns3.delete(5)
  assert.ok(ns4 instanceof Immutable.Set)
  assert.ok(ns4 instanceof Set)
  assert.ok(ns4 instanceof NumberSet)
  assert.equal(ns4.size, 0)
  assert.notOk(ns4.has(5))

})

test("empty record set", assert => {
  const v = Points()

  assert.ok(v instanceof Immutable.Set)
  assert.ok(v instanceof Set)
  assert.ok(v instanceof Points)

  assert.equal(v.size, 0)


})

test("make list as function call", assert => {
  const v = Points([{x: 1}])

  assert.ok(v instanceof Immutable.Set)
  assert.ok(v instanceof Set)
  assert.ok(v instanceof Points)

  assert.equal(v.size, 1)

  assert.ok(v.first() instanceof Record)
  assert.ok(v.first() instanceof Point)

  assert.deepEqual(v.toJSON(), [{x:1, y:0}])
})

test("make set of records", assert => {
  const v = Points.of({x:10}, {x:15}, {x:17})
  assert.ok(v instanceof Immutable.Set)
  assert.ok(v instanceof Set)
  assert.ok(v instanceof Points)

  assert.equal(v.size, 3)

  v.forEach(value => {
    assert.ok(value instanceof Record)
    assert.ok(value instanceof Point)
  });

  assert.deepEqual(v.toJSON(), [{x:10, y:0},
    {x:15, y:0},
    {x:17, y:0}])
})

test("make set with new", assert => {
  const v = new Points([{x: 3}])

  assert.ok(v instanceof Immutable.Set)
  assert.ok(v instanceof Set)
  assert.ok(v instanceof Points)

  assert.equal(v.size, 1)

  assert.ok(v.first() instanceof Record)
  assert.ok(v.first() instanceof Point)
  assert.deepEqual(v.toJSON(), [{x:3, y:0}])
})

test("toString on typed set", assert => {
  const points = Points.of({x: 10}, {y: 2})
  const numbers = NumberSet.of(1, 2, 3)
  const strings = StringSet.of("hello", "world")

  assert.equal(points.toString(),
    `Points([ Point({ "x": 10, "y": 0 }), Point({ "x": 0, "y": 2 }) ])`)

  assert.equal(numbers.toString(),
    `Typed.Set(Number)([ 1, 2, 3 ])`)

  assert.equal(strings.toString(),
    `Typed.Set(String)([ "hello", "world" ])`)
})

test("create set from entries", assert => {
  const ns1 = NumberSet.of(1, 2, 3, 4)
  assert.equal(ns1.toString(),
    "Typed.Set(Number)([ 1, 2, 3, 4 ])")
  assert.equal(ns1[Typed.typeName](),
    "Typed.Set(Number)")

  assert.deepEqual(ns1.toJSON(),
    [1, 2, 3, 4])
})

test("converts sequences to set", assert => {
  const seq = Immutable.Seq([{x: 1}, {x: 2}])
  const v = Points(seq)

  assert.ok(v instanceof Immutable.Set)
  assert.ok(v instanceof Set)
  assert.ok(v instanceof Points)

  assert.equal(v.size, 2)

  v.forEach(val => {
    assert.ok(val instanceof Record)
    assert.ok(val instanceof Point)
  })

  assert.deepEqual(v.toJSON(), [{x:1, y:0},
    {x:2, y:0}])
})

test("can be subclassed", assert => {
  class Graph extends Points {
    foo() {
      const first = this.first()
      const last = this.last()
      return last.x - first.x
    }
  }

  const v1 = new Graph([{y:3},{x:7},{x:9, y:4}])

  assert.ok(v1 instanceof Immutable.Set)
  assert.ok(v1 instanceof Set)
  assert.ok(v1 instanceof Points)
  assert.ok(v1 instanceof Graph)

  assert.equal(v1.foo(), 9)
  assert.deepEqual(v1.toJSON(),
    [{x:0, y:3},
      {x:7, y:0},
      {x:9, y:4}])

})

test("short-circuits if already a list", assert => {
  const v1 = Points.of({x: 2, y: 4},
    {x: 8, y: 3})

  assert.equal(v1, Points(v1))

  assert.equal(v1, new Points(v1))

  const OtherPoints = Set(Point)

  assert.ok(OtherPoints(v1) instanceof OtherPoints)
  assert.notOk(OtherPoints(v1) instanceof Points)
  assert.notEqual(v1, OtherPoints(v1))
  assert.ok(v1.equals(OtherPoints(v1)))

  assert.ok(new OtherPoints(v1) instanceof OtherPoints)
  assert.notOk(new OtherPoints(v1) instanceof Points)
  assert.notEqual(v1, new OtherPoints(v1))
  assert.ok(v1.equals(new OtherPoints(v1)))

  class SubPoints extends Points {
    head() {
      return this.first()
    }
  }

  assert.notEqual(v1, new SubPoints(v1))
  assert.ok(v1.equals(new SubPoints(v1)))


  assert.equal(new SubPoints(v1).head(),
    v1.first())
})

test("can be cleared", assert => {
  const v1 = Points.of({x:1}, {x:2}, {x:3})
  const v2 = v1.clear()

  assert.ok(v1 instanceof Points)
  assert.ok(v2 instanceof Points)

  assert.equal(v1.size, 3)
  assert.equal(v2.size, 0)

  assert.deepEqual(v1.toJSON(),
    [{x:1, y:0}, {x:2, y:0}, {x:3, y:0}])

  assert.deepEqual(v2.toJSON(),
    [])

  assert.equal(v2.first(), void(0))
})

test("can construct records", assert => {
  const v1 = Points()
  const v2 = v1.add({x:1})
  const v3 = v2.add({y:2})
  const v4 = v3.add({x:3, y:3})
  const v5 = v4.add(void(0))

  assert.ok(v1 instanceof Points)
  assert.ok(v2 instanceof Points)
  assert.ok(v3 instanceof Points)
  assert.ok(v4 instanceof Points)
  assert.ok(v5 instanceof Points)

  assert.equal(v1.size, 0)
  assert.equal(v2.size, 1)
  assert.equal(v3.size, 2)
  assert.equal(v4.size, 3)
  assert.equal(v5.size, 4)

  assert.deepEqual(v1.toJSON(), [])
  assert.deepEqual(v2.toJSON(), [{x:1, y:0}])
  assert.deepEqual(v3.toJSON(), [{x:1, y:0},
    {x:0, y:2}])
  assert.deepEqual(v4.toJSON(), [{x:1, y:0},
    {x:0, y:2},
    {x:3, y:3}])
  assert.deepEqual(v5.toJSON(), [{x:1, y:0},
    {x:0, y:2},
    {x:3, y:3},
    {x:0, y:0}])
})

test("serialize & parse", assert => {
  const ns1 = NumberSet.of(1, 2, 3, 4)

  assert.ok(NumberSet(ns1.toJSON()).equals(ns1),
    "parsing serialized typed list")

  assert.ok(ns1.constructor(ns1.toJSON()).equals(ns1),
    "parsing with constructor")
})


test("serialize & parse nested", assert => {
  const v1 = Points.of({x:1}, {x:2}, {y:3})

  assert.ok(Points(v1.toJSON()).equals(v1))
  assert.ok(v1.constructor(v1.toJSON()).equals(v1))
  assert.ok(v1.equals(new Points(v1.toJSON())))

  assert.ok(Points(v1.toJSON()).first() instanceof Point)
})

test("construct with array", assert => {
  const ns1 = NumberSet([1, 2, 3, 4, 5])

  assert.ok(ns1 instanceof NumberSet)
  assert.ok(ns1.size, 5)
  assert.equal(ns1.get(1), 1)
  assert.equal(ns1.get(2), 2)
  assert.equal(ns1.get(3), 3)
  assert.equal(ns1.get(4), 4)
  assert.equal(ns1.get(5), 5)
})


test("construct with indexed seq", assert => {
  const seq = Immutable.Seq([1, 2, 3])
  const ns1 = NumberSet(seq)

  assert.ok(ns1 instanceof NumberSet)
  assert.ok(ns1.size, 3)
  assert.equal(ns1.get(1), 1)
  assert.equal(ns1.get(2), 2)
  assert.equal(ns1.get(3), 3)
})

test("does not construct form a scalar", assert => {
  assert.throws(_ => NumberSet(3),
    /Expected Array or iterable object of values/)
})


test("can not construct with invalid data", assert => {
  const Point = Record({x:Number, y:Number}, "Point")
  const Points = Set(Point, "Points")

  assert.throws(_ => Points.of({x:1, y:0}, {y:2, x:2}, {x:3}),
    /"undefined" is not a number/)
})

test("coerces keys to the type", assert => {
  // Of course, TypeScript protects us from this, so cast to "any" to test.
  const v1 = Points.of({x: 1, y: 0}, {x: 2}, {});

  assert.ok(v1.has({x: 1}))
  assert.ok(v1.has({x: 0, y: 0}))

  assert.ok(v1.get({x: 1}))
  assert.ok(v1.get({x: 0, y: 0}))
  assert.ok(v1.add({x: 4}).get({x: 4, y: 0}))
})

test("can not add invalid value", assert => {
  const ns = NumberSet()

  assert.throws(_ => ns.add("foo"),
    /"foo" is not a number/)

  assert.equal(ns.size, 0)
})


test("can not add invalid structure", assert => {
  const v = Points()

  assert.throws(_ => v.add(5),
    /Invalid data structure/)
})


test("adding creates a new instance", assert => {
  const v1 = NumberSet.of(1)
  const v2 = v1.add(15)

  assert.equal(v1.get(1), 1)
  assert.equal(v1.get(15), void(0))
  assert.equal(v2.get(1), 1)
  assert.equal(v2.get(15), 15)

  assert.ok(v1 instanceof NumberSet)
  assert.ok(v2 instanceof NumberSet)
})

test('can contain a large number of indices', assert => {
  const input = Immutable.Range(0,20000)
  const numbers = NumberSet(input)

  assert.equal(numbers.size, 20000)
  assert.ok(input.every(value => numbers.get(value) === value))
})


test('maps values', assert => {
  var v0 = NumberSet.of(1, 2, 3)
  var v1 = v0.map(inc)

  assert.ok(v0 instanceof NumberSet)
  assert.ok(v1 instanceof NumberSet)
  assert.ok(v1 instanceof Immutable.Set)

  assert.equal(v0.size, 3)
  assert.equal(v1.size, 3)

  assert.deepEqual(v0.toArray(), [1, 2, 3])
  assert.deepEqual(v1.toArray(), [2, 3, 4])
})


test('maps records to any', assert => {
  const v0 = Points.of({x:1}, {y:2}, {x:3, y:3})
  const v1 = v0.map(({x, y}) => ({x: x+1, y: y*y}))

  assert.ok(v0 instanceof Points)
  assert.notOk(v1 instanceof Points)
  assert.ok(v1 instanceof Immutable.Set)
  assert.equal(v1[Typed.typeName](), 'Typed.Set(Any)')

  assert.equal(v0.size, 3)
  assert.equal(v1.size, 3)

  assert.deepEqual(v0.toJSON(),
    [{x:1, y:0},
      {x:0, y:2},
      {x:3, y:3}])

  assert.deepEqual(v1.toJSON(),
    [{x:2, y:0},
      {x:1, y:4},
      {x:4, y:9}])
})

test('maps records to records', assert => {
  const v0 = Points.of({x:1}, {y:2}, {x:3, y:3})
  const v1 = v0.map(point => point.update('x', inc)
    .update('y', inc))

  assert.ok(v0 instanceof Points)
  assert.ok(v1 instanceof Points)
  assert.ok(v1 instanceof Immutable.Set)

  assert.equal(v0.size, 3)
  assert.equal(v1.size, 3)

  assert.deepEqual(v0.toJSON(),
    [{x:1, y:0},
      {x:0, y:2},
      {x:3, y:3}])

  assert.deepEqual(v1.toJSON(),
    [{x:2, y:1},
      {x:1, y:3},
      {x:4, y:4}])
})


test('filters values', assert => {
  const v0 = NumberSet.of(1, 2, 3, 4, 5, 6)
  const v1 = v0.filter(isEvent)

  assert.ok(v0 instanceof NumberSet)
  assert.ok(v1 instanceof NumberSet)

  assert.equal(v0.size, 6)
  assert.equal(v1.size, 3)

  assert.deepEqual(v0.toArray(), [1, 2, 3, 4, 5, 6])
  assert.deepEqual(v1.toArray(), [2, 4, 6])
})


test('reduces values', assert => {
  const v = NumberSet.of(1, 10, 100)

  assert.equal(v.reduce(sum), 111)
  assert.equal(v.reduce(sum, 1000), 1111)

  assert.ok(v instanceof NumberSet)
  assert.deepEqual(v.toArray(), [1, 10, 100])
})

test('reduces from the right', assert => {
  const v = StringSet.of('a','b','c')

  assert.equal(v.reduceRight(concat), 'cba')
  assert.equal(v.reduceRight(concat, 'seeded'), 'seededcba')

  assert.ok(v instanceof StringSet)
  assert.deepEqual(v.toArray(), ['a', 'b', 'c'])
})
