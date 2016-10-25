import test from "./test"
import * as Immutable from "immutable"
import {Record} from "../record"
import {Set} from "../set"
import {Typed, Union, Maybe} from "../typed"

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

test("toString on typed list", assert => {
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
