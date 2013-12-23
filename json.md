---
title: 'JSON marshaling reference'
layout: page
---

{% capture v %}0.7{% endcapture %}
{% capture depUri %}http://search.maven.org/#artifactdetails|org.immutables{% endcapture %}

Overview
--------

It's not uncommon to use immutable object as messages or documents to transfer or store data.
JSON is a simple and flexible format, and underlying [Jackson](http://wiki.fasterxml.com/JacksonHome)
parsers and generators makes it possible to use various additional textual and binary formats:
[Smile](https://github.com/FasterXML/jackson-dataformat-smile),
[BSON](https://github.com/michel-kraemer/bson4jackson),
[YAML](https://github.com/FasterXML/jackson-dataformat-yaml)... etc.

We _do not use_ [ObjectMapper](https://github.com/FasterXML/jackson-databind) and bean/POJO mapping facilities,
so _Immutables_ provides an alternative binding based on straightforward code generation.

* Clean JSON representation without any synthetic fields and quite flexible ways to map immutable object graphs
* Use of code-generation and mostly compile-time overload resolution to create high-performance binding
* By using _Jackson core API_ we gain high-performance and flexibility to switch "dataformat" adapters

Additional advantages arise from how _Immutables_ facilities work together, specifically,
very convenient _MongoDB_ repositories are built on top of JSON document marshaling and BSON dataformat.

-----
Usage
-----

### Enable marshaling
In addition to dependencies that are listed in [getting started guide](/gettingstarted.html) you should add
_org.immutable.common_ library

- [org.immutables:common:{{v}}]({{ depUri }}|common|{{ v }}|jar)
  + Compile and runtime utilities used during marshaling

```xml
<dependency>
  <groupId>org.immutables</groupId>
  <artifactId>common</artifactId>
  <version>{{ v }}</version>
</dependency>
```
In order to enable marshaling, put `org.immutables.annotation.GenerateMarshaler`
annotation on a abstract value class alongside with `org.immutables.annotation.GenerateImmutable` annotation.

```java
@GenerateImmutable
@GenerateMarshaler
public abstract class ValueObject {
  public abstract String name();
  public abstract List<Integer> numbers();
  public abstract Optional<String> optional();
}
```
This will generate `ValueObjectMarshaler` marshaler class in the same package.

There's convenient static methods on class `org.immutables.common.marshal.Marshaling`
for marshaling immutable objects back and forth to standard textual JSON.
While not particularly suited for production, but are fine for simple usage and evaluation.

```java
ValueObject valueObject = ImmutableValueObject.builder()
        .name("Nameless")
        .optional("present")
        .addNumbers(1)
        .addNumbers(2)
        .build();

String valueObjectJson = Marshaling.toJson(valueObject);

Marshaling.fromJson(valueObjectJson, ValueObject.class);
```
`valueObjectJson` string:

```js
{
  "name": "Nameless",
  "optional": "present",
  "numbers": [1, 2]
}
```

**Possible problems**

+ Parsing or generation problem that may occur
  - `IOException`s for input output errors and JSON syntax problems
  - `RuntimeException`s during unmarshaling in case of missing required attributes or JSON structure do not match attribute type

+ If certain types of attributes do not support marshaling
  - Will fail to compile, `marshal` method with proper overload will not be found
  - In some cases, will be marshaled as `toString`

### JAX-RS marshaling provider

To use immutable types in your JAX-RS services use `org.immutables.common.service.MarshalingMessageBodyProvider` which
implements `javax.ws.rs.ext.MessageBodyReader` and `javax.ws.rs.ext.MessageBodyWriter`. Also do not forget to specify
"application/json" content type, so provider will match.

```java
// Contrived illustration for marshaling of immutable abstract types: InputValue and OutputValue
// using MarshalingMessageBodyProvider
@Path("/test")
public class TestResource {
  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public OutputValue post(InputValue input) {
    int val = input.inputAttribute();
    return ImmutableOutputValue.builder()
       .outputAttribute(val);
       .build();
  }
  ...
}
```
See your JAX-RS implementation reference on how to install providers, but SPI-based auto-registration should work
if you just add [org.immutables:annotation]({{ depUri }}|common|{{ v }}|jar) and [org.immutables:common]({{ depUri }}|common|{{ v }}|jar) jars in a classpath of a web application.

### Jackson core marshaling

For the maximum flexibility you can use marshaler directly with lower level
[Jackson core API](https://github.com/FasterXML/jackson-core).

```java
JsonFactory jsonFactory = new JsonFactory();
...
StringWriter writer = new StringWriter();

ValueObject valueObject = ImmutableValueObject.builder()
        .name("Nameful")
        .build();

ValueObjectMarshaler marshaler = ValueObjectMarshaler.instance();

try (JsonGenerator generator = jsonFactory.createGenerator(writer)) {
  marshaler.marshalInstance(generator, object);
}

String json = writer.toString()

try (JsonParser parser = jsonFactory.createParser(json)) {
  parser.nextToken(); // required before calling unmarshal
  marshaler.unmarshalInstance(parser);
}
```

To obtain marshaler reflectively if type of abstract value class will be known only in runtime,
use `Marshaling.marshalerFor` method.

```java
Class<?> expectedType = ...
Marshaler<?> marshaler = Marshaling.marshalerFor(expectedType);
```
For a nice examples see the source code for `org.immutables.common.marshal.Marshaling` class.

**Possible problems**

+ Parsing or generation problems
  - `IOException`s for input output errors and JSON syntax problems
  - `RuntimeException`s during unmarshaling in case of missing required attributes or JSON structure do not match attribute type
  - `ClassNotFoundException` if marshaler could not be found reflectively

----------------
Mapping features
----------------

### Straightforward binding
Automatically generated bindings are straightforward and generally useful without customization.

#### Supported attribute types

* Java primitives, Strings, Enums — work as built-in types
* Nested documents - abstract value classes, also annotated with `@GenerateMarshaler`
* Lists, Sets, Maps and Optional of the above types
  - Collections mapped to JSON arrays
  - Maps mapped to JSON object (keys forced to strings)
  - Optional attributes - as simple fields

But there are couple of ways to customize binding with support for additional custom types or just tweak output.

### Specify field name
By default JSON field name is the same as an attribute name of abstract value class,
however it is very easy to specify field name is marshaled representation.
Use `value` attribute of `org.immutables.annotation.GenerateMarshaled` annotation placed on attribute accessor.

```java
@GenerateImmutable
@GenerateMarshaler
public abstract class ValueObject {
  @GenerateMarshaled("_id")
  public abstract long id();
  @GenerateMarshaled("name")
  public abstract String namedAs();
  public abstract int otherAttribute();
}

ValueObject valueObject = ImmutableValueObject.builder()
  .id(1123)
  .namedAs("Valuable One")
  .otherAttribute(0)
  .build();
```
`valueObject` will be marshaled as

```js
{
  "_id": 1123,
  "name": "Valuable One",
  "otherAttribute": 0
}
```

### Include optional values an `null`

By default, absent values of `com.google.common.base.Optional` are being omitted from JSON document.
This generally help to keep JSON cleaner and reduce its size if there are a lot of optional attributes.
When you do want to force output of absent attribute using `null` value, use `forceEmpty = true`
of `org.immutables.annotation.GenerateMarshaled` annotation placed on attribute accessor.

```java
@GenerateImmutable
@GenerateMarshaler
public abstract class OptionalObject {
  @GenerateMarshaled(forceEmpty = true)
  public abstract Optional<String> v1();
  public abstract Optional<String> v2();
}

// both v1 and v2 attributes are absent, i.e, not specified
OptionalObject objectWithOptions = ImmutableOptionalObject.builder().build();
```
`objectWithOptions` will be marshaled as

```js
{
  "v1": null
}
```

`forceEmpty` used for marshaling, but optional attributes could be unmarshaled from JSON representation either way:
missing field or field with `null` value.

### Include empty arrays

By default, empty `List` and `Set` attributes are being omited from JSON.
This generally help to keep JSON cleaner and slightly reduce its size.
When you do want to force output of empty collections using empty JSON array`null` value. Use `forceEmpty = true`
of `org.immutables.annotation.GenerateMarshaled` annotation placed on attribute accessor.

```java
@GenerateImmutable
@GenerateMarshaler
public abstract class CollectionObject {
  @GenerateMarshaled(forceEmpty = true)
  public abstract Set<String> c1();
  public abstract List<String> c2();
}

// both c1 and c2 collections are empty
CollectionObject collectionObject = ImmutableCollectionObject.builder().build();
```
`collectionObject` will be marshaled as

```js
{
  "c1": []
}
```
`forceEmpty` used for marshaling, but collection attributes could be unmarshaled from JSON representation either way:
missing field or field with empty array.

### Tuples of constructor arguments
One of the interesting features of _Immutables_ JSON marshaling is the ability to map tuples (triples and so on)
of constructor arguments. While not always useful, some canonical data types could be compactly represented in JSON
as array of values, consider, for example, dimensional coordinates or RGB colors.

In order to marshal object as tuple, you need to annotate constructor arguments and disable generation of builder.

```java
@GenerateImmutable(builder = false)
@GenerateMarshaler
public abstract class Coordinates {
  @GenerateConstructorParameter(order = 0)
  public abstract double latitude();
  @GenerateConstructorParameter(order = 1)
  public abstract double longitude();
}

// both c1 and c2 collections are empty
Coordinates coordinates = ImmutableCoordinates.of(37.783333, -122.416667);
```
`coordinates` will be marshaled as array rather that object

```js
[37.783333, -122.416667]
```

### Custom types

Sometimes there is a need to marshal/unmarshal some custom-made or third-party immutable objects as part
of object with `@GenerateImmutable` and `@GenerateMarshaler` annotations. Our unique approach it to use
static routines with special signatures and use java compiler to resolve most specific overload.

```java
// Signature to unmarshal instance of T
public static T unmarshal(
    JsonParser parser,
    T nullInstance, // allway will be called with null, parameter exists only for overload resolution
    Class<?> expectedClass) throws IOException {
  T t = ...// take parser and extract value of T, leave parser on last token of a read value
  return t;
}
// Signature to marshal instance of T
public static void marshal(
    JsonGenerator generator,
    T instance) throws IOException {
  // write value to the generator
}
```

Put static methods into a public class, lets name it `MyRoutines` for example.
Then reference classes with marshaling methods using `importRoutines` attribute on `@GenerateMarshaler` annotation.

```java
@GenerateMarshaler(importRoutines={ MyRoutines.class })
public abstract class MyDocument {
  public abstract T customTypeAttribute();
}
```

Such classes as `MyRoutines` may contain methods to marshal many different custom type, thus serving a "marshaling library".
You may share `importRoutines` definition across all marshaled documents in a package if you put
`@GenerateMarshaler` annotation on a package declaration using special `package-info.java` file in a package.

```java
//package-info.java
@org.immutables.annotation.GenerateMarshaler(importRoutines = {
    my.pack.util.MyRoutines.class,
    my.pack.util.MyOtherRoutines.class
})
package my.pack;
```
Be sure to verify that any static marshaling routines could be correctly referenced from generated marshaler classes.

-----
### Polymorphic mapping

Another interesting features of _Immutables_ JSON marshaling is the ability to map abstract type to one of
it's subclasses by structure (not by "discriminator" field).

Define common supertype class and it's subclasses, then use `org.immutables.annotation.GenerateMarshaledSubclasses`
annotation to list expected superclasses. Then you can use supertype as attribute type in the document,
as plain reference or as list and set of sypertype.

```java
@GenerateMarshaledSubclasses({
    InterestingValue.class,
    RelevantValue.class
})
public abstract class AbstractValue {}
...
@GenerateImmutable
@GenerateMarshaler
public abstract class InterestingValue extends AbstractValue {
  public abstract int number();
}
...
@GenerateImmutable
@GenerateMarshaler
public abstract class RelevantValue extends AbstractValue {
  public abstract String string();
}
...
// This is host document, which could contain list of value
@GenerateImmutable
@GenerateMarshaler
public abstract class HostDocument {
  public abstract List<AbstractValue> value();
}
```
As you could guess, following JSON fragment may be unmarshaled to `HostDocument`, which `value` attribute will contain
instances of `InterestingValue` and `RelevantValue` and then `InterestingValue` again

```js
{
  "values": [
    { "number": 2 },
    { "string": "Relevant?" },
    { "number": 1 },
  ]
}
```
Although nice feature, you should generally avoid to overuse polymorphic marshaling if performance is important.

**Possible problems**

+ If none of expected subclasses matches structure of JSON
  - `RuntimeException`s during unmarshaling
+ Subclass structures have collision
  - First matching unmarshaler wins
