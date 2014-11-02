---
title: 'JSON marshaling'
layout: page
---

{% capture v %}1.0.1{% endcapture %}
{% capture depUri %}http://search.maven.org/#artifactdetails|org.immutables{% endcapture %}

Overview
--------

It's not uncommon to use immutable object as messages or documents to transfer or store data.
JSON is a simple and flexible format, and underlying [Jackson](http://wiki.fasterxml.com/JacksonHome)
parsers and generators makes it possible to use various additional textual and binary formats:
[Smile](https://github.com/FasterXML/jackson-dataformat-smile),
[BSON](https://github.com/michel-kraemer/bson4jackson),
[CBOR](https://github.com/FasterXML/jackson-dataformat-cbor),
[YAML](https://github.com/FasterXML/jackson-dataformat-yaml)... etc.

* Clean JSON representation without any synthetic fields and quite flexible ways to map immutable object graphs, also supporting polymorphic unmarshaling by structure
* Use of code-generation and mostly compile-time overload resolution to create high-performance binding
* By using _Jackson core API_ we gain high-performance and flexibility to switch "dataformat" adapters

We _do not use_ [ObjectMapper](https://github.com/FasterXML/jackson-databind) — the bean/POJO mapping facilities.
_Immutables_ provides an alternative bindings based on straightforward code generation.
However, you can integrate with POJO/Object mapper by using additional annotation @[Jackson.Mapped](https://github.com/immutables/immutables/blob/master/value/src/org/immutables/value/Jackson.java).

Additional advantages arise from how _Immutables_ facilities work together, specifically,
very convenient _MongoDB_ repositories are built on top of JSON document marshaling and BSON dataformat.

-----
Usage
-----

### Enable marshaling
In addition to annotation-processor dependencies, you need to add runtime libraries.

<a name="dependencies"></a>

- [org.immutables:common:{{v}}]({{ depUri }}|common|{{ v }}|jar)
  + Compile and runtime utilities used during marshaling

_Common_ artifact specifically excludes any external dependencies (Jackson etc) to be picked manually.
For quick start you should rather use _quickstart_ artifact that combines all needed dependencies.

- [org.immutables:quickstart:{{v}}]({{ depUri }}|quickstart|{{ v }}|jar)
  + All needed transitive runtime dependencies 

Snippet of maven dependencies:

```xml
<dependency>
  <groupId>org.immutables</groupId>
  <artifactId>quickstart</artifactId>
  <version>{{ v }}</version>
</dependency>
<dependency>
  <groupId>org.immutables</groupId>
  <artifactId>value-standalone</artifactId>
  <version>{{ v }}</version>
  <scope>provided</scope>
  <optional>true</optional>
</dependency>
```
In order to enable marshaling, put `org.immutables.value.Json.Marshaled`
annotation on a abstract value class alongside with `org.immutables.value.Value.Immutable` annotation.

```java
@Value.Immutable
@Json.Marshaled
public abstract class ValueObject {
  public abstract String name();
  public abstract List<Integer> numbers();
  public abstract Optional<String> optional();
}
```
This will generate `ValueObjectMarshaler` marshaler class in the same package.

There're convenient static methods on class `org.immutables.common.marshal.Marshaling`
for marshaling immutable objects back and forth to standard textual JSON.

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

+ If certain types of attributes do not support marshaling — it will be marshaled as `toString`

### JAX-RS marshaling provider

To use immutable types in your JAX-RS services use `org.immutables.common.marshal.JaxrsMessageBodyProvider` which
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
See your JAX-RS implementation reference on how to install providers, but SPI-based auto-registration should work if you just have all [runtime dependencies](#dependencies) in the classpath of a web application.

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
  marshaler.unmarshalInstance(parser);
}
```

To obtain marshaler if type of abstract value class will be known only in runtime,
use `Marshaling.marshalerFor` method.

```java
Class<?> expectedType = ...
Marshaler<?> marshaler = Marshaling.marshalerFor(expectedType);
```

**Possible problems**

+ Parsing or generation problems
  - `IOException`s for input output errors and JSON syntax problems
  - `RuntimeException`s during unmarshaling in case of missing required attributes or JSON structure do not match attribute type
  - Autogenerated entries in `/META-INF/services/*` may end up corrupted or missing due to jar repackaging or custom build processes, this may cause problems while locating marshalers for types.

----------------
Mapping features
----------------

### Straightforward binding
Automatically generated bindings are straightforward and generally useful without customization.

#### Supported attribute types

* Java primitives, Strings, Enums — work as built-in types
* Nested documents - abstract value classes that are also annotated with `@Json.Marshaled`
* Lists, Sets, Maps and Optional of the above types
  - Collections mapped to JSON arrays
  - Maps mapped to JSON object (keys always converted to strings)
  - Optional attributes - as regular fields

But there are couple of ways to customize binding with support for additional custom types or just tweak output.

### Specify field name
By default JSON field name is the same as an attribute name of abstract value class.
However, it is very easy to specify field name as it should appear in JSON representation.
Use `value` attribute of `org.immutables.value.Json.Named` annotation placed on attribute accessor.

```java
@Value.Immutable
@Json.Marshaled
public abstract class ValueObject {
  @Json.Named("_id")
  public abstract long id();
  @Json.Named("name")
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
When you do want to force output of absent attribute using `null` value, use `@Json.ForceEmpty`
annotation placed on attribute accessor.

```java
@Value.Immutable
@Json.Marshaled
public abstract class OptionalObject {
  @Json.ForceEmpty
  public abstract Optional<String> v1();
  public abstract Optional<String> v2();
}
...
// both v1 and v2 attributes are absent, i.e, not specified
OptionalObject objectWithOptions = ImmutableOptionalObject.builder().build();
```
`objectWithOptions` will be marshaled as

```js
{
  "v1": null
}
```

Optional attributes could be unmarshaled from JSON representation either way:
missing field or field with `null` value.

### Include empty arrays

By default, empty `List` and `Set` attributes are being omitted from JSON.
This generally help to keep JSON cleaner and slightly reduce its size.
When you do want to force output of empty collections using empty JSON array `null` value. Use `@Json.ForceEmpty` annotation placed on attribute accessor.

```java
@Value.Immutable
@Json.Marshaled
public abstract class CollectionObject {
  @Json.Named(forceEmpty = true)
  public abstract Set<String> c1();
  public abstract List<String> c2();
}
...
// both c1 and c2 collection attributes are empty
CollectionObject collectionObject = ImmutableCollectionObject.builder().build();
```
`collectionObject` will be marshaled as

```js
{
  "c1": []
}
```
Collection attributes could be unmarshaled from JSON representation either way:
missing field or field with empty array.

### Ignoring attributes.
Collection, optional and default attributes could be ignored during marshaling by using `@Json.Ignore` annotation.

### Tuples of constructor arguments
One of the interesting features of _Immutables_ JSON marshaling is the ability to map tuples (triples and so on)
of constructor arguments. While not always useful, some data types could be compactly represented in JSON
as array of values, consider, for example, dimensional coordinates or RGB colors.

In order to marshal object as tuple, you need to annotate [constructor](/immutable.html#constructor) arguments and disable generation of [builder](/immutable.html#builder).

```java
@Value.Immutable(builder = false)
@Json.Marshaled
public abstract class Coordinates {
  @Value.Parameter
  public abstract double latitude();
  @Value.Parameter
  public abstract double longitude();
}

...
Coordinates coordinates = ImmutableCoordinates.of(37.783333, -122.416667);
```
`coordinates` will be marshaled as array rather that object

```js
[37.783333, -122.416667]
```

### Custom types

Sometimes there is a need to marshal/unmarshal some custom-made or third-party immutable objects as part
of object with `@Value.Immutable` and `@Json.Marshaled` annotations. Our unique approach it to use
static routines with special signatures and use java compiler to resolve most specific overload.

```java
// Method signature to unmarshal instance of T
public static T unmarshal(
    JsonParser parser,
    T nullInstance, // allway will be called with null, parameter exists only for overload resolution
    Class<?> expectedClass) throws IOException {
  T t = ...// take parser and extract value of T, leave parser on last token of a read value
  return t;
}
// Method signature to marshal instance of T
public static void marshal(
    JsonGenerator generator,
    T instance) throws IOException {
  // write value to the generator
}
```

Put static methods into a public class, lets name it `MyRoutines` for example.
Then reference classes with marshaling methods using `@Json.Import` annotation.

```java
@Json.Import({ MyRoutines.class })
@Json.Marshaled
public abstract class MyDocument {
  public abstract T customTypeAttribute();
}
```

Such classes as `MyRoutines` may contain methods to marshal many different custom type, thus serving a "marshaling library".
You may share imported definition across all marshaled documents in a package if you put
`@Json.Import` annotation on a package declaration using special `package-info.java` file in a package.

```java
//package-info.java
@org.immutables.value.Json.Import({
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

Define common supertype class and it's subclasses, then use `org.immutables.value.Json.Subclasses`
annotation to list expected superclasses. Then you can use supertype as attribute type in the document,
as plain reference or as list and set of sypertype.

```java
@Json.Subclasses({
    InterestingValue.class,
    RelevantValue.class
})
public abstract class AbstractValue {}
...
@Value.Immutable
@Json.Marshaled
public abstract class InterestingValue extends AbstractValue {
  public abstract int number();
}
...
@Value.Immutable
@Json.Marshaled
public abstract class RelevantValue extends AbstractValue {
  public abstract String string();
}
...
// This is host document, which could contain list of value
@Value.Immutable
@Json.Marshaled
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
