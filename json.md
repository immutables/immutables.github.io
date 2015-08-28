---
title: 'JSON serialization'
layout: page
---

{% capture v %}2.0.21{% endcapture %}
{% capture depUri %}http://search.maven.org/#artifactdetails|org.immutables{% endcapture %}

Overview
--------

It's not uncommon to use immutable object as messages or documents to transfer or store data.
JSON is a simple and flexible format. Moreover, using libraries like [Jackson](http://wiki.fasterxml.com/JacksonHome), you can use various additional textual and binary formats:
[Smile](https://github.com/FasterXML/jackson-dataformat-smile),
[BSON](https://github.com/michel-kraemer/bson4jackson),
[CBOR](https://github.com/FasterXML/jackson-dataformat-cbor),
[YAML](https://github.com/FasterXML/jackson-dataformat-yaml)... etc.

Immutables' JSON integration underwent overhaul for 2.0. This made integration a lot less exotic and comprehensible.

_JSON documentation for versions 1.x of Immutables is located at [immutables.github.io/site1.x/json.html](/site1.x/json.html)_

Instead of old generated marshaler infrastructure based on _Jackson_ streaming (jackson-core), two new integrations available:

+ Simplified _Jackson_ integration
  - Generation of simple `@JsonCreator` factory method and `@JsonProperty` annotations
  - Delegates everything back to Jackson, which is cool on it's own!
+ Comprehensive _Gson_ integration
  - No custom runtime APIs, Gson APIs are used
  - Generation of _TypeAdapterFactories_ which use no reflection.
  - Optional classes to integrate _Gson_ streaming with _Jackson_ streaming to squeeze maximum performance.

For more background on this change you can visit related issues:

+ [issues/68](https://github.com/immutables/immutables/issues/68)
+ [issues/80](https://github.com/immutables/immutables/issues/80)
+ [issues/71](https://github.com/immutables/immutables/issues/71)
+ [issues/75](https://github.com/immutables/immutables/issues/75)

<a name="jackson"></a>
Jackson
-------

Overall _Jackson_ is so cool that it doesn't require any serious code generation to be flexible and high-performant on JVM. No additional depedencies are required except for _Immutables_ processor and _Jackson_ library. It is recommended to use _Jackson_ version 2.4+, but earlier versions can work also.

Integration works by generating simple `@JsonCreator` factory method and `@JsonProperty` annotations on immutable implementation. To enable this, you should use `@JsonSerialize` or
`@JsonDeserialize` annotation (usually it is most safe to use both). Point to immutable implementation class in `as` annotation attribute.

```java
import com.fasterxml.jackson.annotation.*;
import org.immutables.value.Value;

@Value.Immutable
@JsonSerialize(as = ImmutableVal.class)
@JsonDeserialize(as = ImmutableVal.class)
interface Val {
  int a();
  @JsonProperty("b") String second();
}

```
While `ImmutableVal` might not be generated yet, it will compile properly.
You can use `@JsonProperty` to customize JSON field name. You can freely use any other facilities of _Jackson_ library if applicable.

```java
ObjectMapper objectMapper = new ObjectMapper();
String json = objectMapper.writeValueAsString(
    ImmutableVal.builder()
        .a(1)
        .second("B")
        .build());
```

```js
{ "a": 1,
  "b": "B" }
```

Make sure that _Jackson_ can serialize any other type that is used as attribute type.

### Jackson-Guava

If you use Guava, make sure to use special serialization module `com.fasterxml.jackson.datatype:jackson-datatype-guava`.

```xml
<dependency>
  <groupId>com.fasterxml.jackson.datatype</groupId>
  <artifactId>jackson-datatype-guava</artifactId>
  <version>2.5.0</version>
</dependency>
```
```java

ObjectMapper mapper = new ObjectMapper();
// register module with object mapper
mapper.registerModule(new GuavaModule());
```

----
<a name="gson"></a>
Gson
----

### Dependencies

- [org.immutables:value:{{v}}]({{ depUri }}|value|{{ v }}|jar)
- [org.immutables:gson:{{v}}]({{ depUri }}|gson|{{ v }}|jar)

Gson integration require `com.google.gson:gson` compile and runtime module.
`org.immutables:gson` module contains compile time annotation to generate `TypeAdapter` factories.
Optionally, `org.immutables:gson` module could also be used at runtime to enable following functionality:

+ [Field naming strategy support](#field-naming-strategy)
+ [Polymorphic serialization by structure](#poly)
+ [Gson to Jackson streaming bridge](#gson-jackson)

```xml
<dependency>
  <groupId>org.immutables</groupId>
  <artifactId>gson</artifactId>
  <version>{{ v }}</version>
  <!-- If you don't need runtime capabilities - make it compile-only
  <scope>provided</scope>-->
</dependency>
<dependency>
  <groupId>org.immutables</groupId>
  <artifactId>value</artifactId>
  <version>{{ v }}</version>
  <scope>provided</scope>
</dependency>
```

**Can't wait to see generated code?**

- See page with [generated code sample](/typeadapters.html)

### Generating Type Adapters

Use annotation `@org.immutables.gson.Gson.TypeAdapters` to generate `TypeAdapaterFactory` implementation which produces adapters to any immutable classes enclosed by `@Gson.TypeAdapters` annotation. The annotation could be placed on top-level type or package (using `package-info.java`). Type adapter factory will support all immutable classes in corresponding type (directly annotated and all nested immutable values) or package. Class named `GsonAdapters[NameOfAnnotatedElement]` will be generated in the same package.

```java
// generated GsonAdaptersAdapt factory will handle all immutable types here:
// Adapt, Inr, Nst
@Gson.TypeAdapters
@Value.Immutable
public interface Adapt {
  long id();
  Optional<String> description();
  Set<Inr> set();
  Multiset<Nst> bag();

  @Value.Immutable
  public interface Inr {
    int[] arr();
    List<Integer> list();
    Map<String, Nst> map();
    SetMultimap<Integer, Nst> setMultimap();
  }

  @Value.Immutable
  public interface Nst {
    int value();
    String string();
  }
}
```

- See javadocs in [Gson](https://github.com/immutables/immutables/blob/master/gson/src/org/immutables/gson/Gson.java)

<a name="adapter-registration"></a>
### Type Adapter registration
Type adapter factory is generated in the same package and registered statically as service providers in `META-INF/services/com.google.gson.TypeAdapterFactory`.
You can manually register factories with `GsonBuilder`, but the most easy way to register all such factories using `java.util.ServiceLoader`.

```java
import com.google.gson.GsonBuilder;
import com.google.gson.Gson;
import com.google.gson.TypeAdapterFactory;
import java.util.ServiceLoader;
...

GsonBuilder gsonBuilder = new GsonBuilder();
for (TypeAdapterFactory factory : ServiceLoader.load(TypeAdapterFactory.class)) {
  gsonBuilder.registerTypeAdapterFactory(factory);
}

// Manual registration is also an option
gsonBuilder.registerTypeAdapterFactory(new GsonAdaptersMyDocument());

Gson gson = gsonBuilder.create();

String json = gson.toJson(
    ImmutableValueObject.builder()
        .id(1)
        .name("A")
        .build());
// { "id": 1, "name": "A" }
```

**Things to be aware of**

- when type adapters are not registered, Gson will use default reflective serializer, however it will fail to deserialize.
- There's potential to confuse `com.google.gson.Gson` object with `@org.immutable.gson.Gson` umbrella annotation, but they are usually not used together in one source file. If it will be huge PITA, please, let us know.

### JAX-RS integration

JAX-RS message body reader/writer provided out of the box. In itself it is generic Gson integration provider, but it has following special capabilities:

* Auto registration of Gson type adapter factories from `META-INF/services/com.google.gson.TypeAdapterFactory`.
* Built in support for [Gson-Jackson](#gson-jackson) bridge. It will be turned on by default if _Jackson_ library will be present in classpath at runtime.

To use immutable types in your JAX-RS services use `org.immutables.gson.stream.GsonMessageBodyProvider` which implements `javax.ws.rs.ext.MessageBodyReader` and `javax.ws.rs.ext.MessageBodyWriter`. Also do not forget to specify "application/json" content type, so provider will match.

```java
// Contrived illustration for marshaling of immutable abstract types: InputValue and OutputValue
// using GsonMessageBodyProvider
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

While this provider could be picked up automatically from classpath using `META-INF/services/javax.ws.rs.ext.*` by JAX-RS engine, sometimes you need to add it manually.

```java
// Dropwizard Application example
@Override
public void run(DwConfiguration configuration, Environment environment) throws Exception {
  environment.jersey().register(new TestResource());
  environment.jersey().register(new GsonMessageBodyProvider());
}
```

You can create customized `GsonMessageBodyProvider` instance

```java
new GsonMessageBodyProvider(
    new GsonProviderOptionsBuilder()
        .gson(new Gson()) // build custom Gson instance using GsonBuilder methods
        .addMediaTypes(MediaType.TEXT_PLAIN_TYPE) // specify custom media types
        .allowJackson(false) // you can switch off Gson-Jackson bridge
        .lenient(true) // you can enable non-strict mode
        .build()) {
// Some JAX-RS implementations (Jersey) track message body providers by class identity,
// Anonymous class could be defined to create unique class.
// It allows to register couple of GsonMessageBodyProvider with different configuration
// by having unique classes.
};
```

- See class [GsonMessageBodyProvider](https://github.com/immutables/immutables/blob/master/gson/src/org/immutables/gson/stream/GsonMessageBodyProvider.java)

### Mapping Features

Automatically generated bindings are straightforward and generally useful.

* Java primitives and Strings — work as built-in types
* Nested documents/objects - supported as long as corresponding type adapter would be registered with Gson
* Lists, Sets, Maps, Optional and other supported containers of the above types:
  - Collections mapped to JSON arrays
  - Map and Multimaps mapped to JSON object (keys always converted to strings)
  - Optional attributes - as nullable fields
* Immutable values having only constructor - arrays of constructor arguments.

While there's certain amount of customization (like changing field names in JSON), basic idea is to have direct and straightforward mapping to JSON derived from the structure of value object, where value objects are adapted to a representation rather than free-form object have complex mapping to JSON representation.

To add custom binding for types, other than immutable values, use Gson APIs. Please refer to [Gson reference](https://sites.google.com/site/gson/gson-user-guide#TOC-Custom-Serialization-and-Deserialization)

#### Field names
By default JSON field name is the same as an attribute name.
However, it is very easy to specify JSON field name as it should appear in JSON representation.
Use `value` attribute of `org.immutables.gson.Gson.Named` annotation placed on attribute accessor.

```java
@Value.Immutable
@Gson.TypeAdapters
public abstract class ValueObject {
  @Gson.Named("_id")
  public abstract long getId();
  @Gson.Named("name")
  public abstract String getNamedAs();
  public abstract int getOtherAttribute();
}

ValueObject valueObject =
    ImmutableValueObject.builder()
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

`@Gson.Named` is similar to _Gson_'s `SerializedName` annotation.
Unfortunately Gson's annotations are only applicable to fields, therefore could not be used on accessor methods.

<a name="field-naming-strategy"></a>
When running on Oracle JVM, there's an option to enable field naming strategy support.
Use `@Gson.TypeAdapters(fieldNamingStrategy = true)` to enable generation of code which use field naming strategy. See javadoc for [Gson.TypeAdapters#fieldNamingStrategy](https://github.com/immutables/immutables/blob/master/gson/src/org/immutables/gson/Gson.java#L78)

#### Ignoring attributes

Collection, optional and default attributes could be ignored during marshaling by using `@Gson.Ignore` annotation.

#### Omitting empty fields

Use Gson's configuration `GsonBuilder.serializeNulls()` to include empty optional and nullable fields as `null`. By default those will be omitted, this generally helps to keep JSON clean and reduce its size if there are a lot of optional attributes. If you want to omit empty collection attributes in the same way as nullable fields &mdash; use `@Gson.TypeAdapters(emptyAsNulls = true)`

```java
@Value.Immutable
@Gson.TypeAdapters(emptyAsNulls = true)
interface Omits {
  Optional<String> string();
  List<String> strings();
}

String json = gson.toJson(ImmutableOmits.builder().build());
```

```js
// omits all empty
{ }
```

```js
// with GsonBuilder.serializeNulls()
{ "string": null,
  "strings": [] }
```

#### Tuples of constructor arguments
One of the interesting features of _Immutables_ JSON marshaling is the ability to map tuples (triples and so on) of constructor arguments. While not universally useful, some data types could be compactly represented in JSON as array of values, consider, for example, spatial coordinates or RGB colors.

In order to marshal object as tuple, you need to annotate [constructor](/immutable.html#constructor) arguments and disable generation of [builder](/immutable.html#builder).

```java
@Value.Immutable(builder = false)
@Gson.TypeAdapters
public interface Coordinates {
  @Value.Parameter double latitude();
  @Value.Parameter double longitude();
}

...
Coordinates coordinates = ImmutableCoordinates.of(37.783333, -122.416667);
```
`coordinates` will be marshaled as JSON array rather that JSON object

```js
[37.783333, -122.416667]
```

As special case of this are values with single constructor parameter.
Having a tuple of 1 argument, is essentially equivalent to having just a value of argument. Therefore you can marshal and unmarshal such objects as value of it's single argument.
If you want to make value to be a wrapper invisible in BSON,
you can define it as having no builder and single argument constructor, so it will become pure wrapper.

```java
@Gson.TypeAdapters
interface WrapperExample {
  // Name will become wrapper around name string, invisible in JSON
  @Value.Immutable(builder = false)
  interface Name {
    @Value.Parameter String value();
  }

  // Id will become wrapper around id number, invisible in JSON
  @Value.Immutable(builder = false)
  interface Id {
    @Value.Parameter int value();
  }

  @Value.Immutable(builder = false)
  interface Val {
    Id id();
    Name name();
  }
}

Val val = ImmutableVal.build()
  .id(ImmutableId.of(124))
  .name(ImmutableName.of("Nameless"))
  .build();
```

```js
{
  "id": 124,
  "name": "Nameless"
}
```

This allows to archive needed level of abstraction and type safety without cluttering JSON data structure.

<a name="poly"></a>
#### Polymorphic mapping

Interesting features of _Immutables_ Gson marshaling is the ability to map abstract type to one of
it's subclasses by structure, not by "discriminator" field.

Define common supertype class and it's subclasses, then use `@org.immutables.gson.Gson.ExpectedSubtypes` annotation to list expected subtypes. Then you can use supertype in attribute as plain reference or as collection.

`@Gson.ExpectedSubtypes` could be placed on:

+ Abstract supertype
+ Attribute with reference or collection of references to supertype.

```java
@Value.Immutable
@Gson.TypeAdapters
public interface HostDocument {
  // Host document contain list of values
  // @Gson.ExpectedSubtypes annotation could be also placed on attribute.
  List<AbstractValue> value();

  @Gson.ExpectedSubtypes({
    InterestingValue.class,
    RelevantValue.class
  })
  public interface AbstractValue {}

  @Value.Immutable
  public interface InterestingValue extends AbstractValue {
    int number();
  }

  @Value.Immutable
  public interface RelevantValue extends AbstractValue {
    String string();
  }
}
```

```js
{
  "values": [
    { "number": 2 },
    { "string": "Relevant?" },
    { "number": 1 },
  ]
}
```

As you could guess, above JSON fragment may be deserialized to `HostDocument`, which `value` attribute will contain instances of `InterestingValue` and `RelevantValue` and then again `InterestingValue`.

In addition, when using value [nested in enclosing](/style.html#nesting), exact set of subclasses could be figured out from the set nested types in enclosing scope. In that case `@Gson.ExpectedSubtypes` annotation may omit "value" attribute.

```java
@Gson.TypeAdapters
@Value.Enclosing
interface Enc {
  interface A {}
  @Value.Immutable interface B extends A { int b(); }
  @Value.Immutable interface C extends A { double c(); }
  @Value.Immutable interface E {
    @Gson.ExpectedSubtypes A a(); // B and C will be discovered
  }
}
```

Although nice feature, you should generally avoid to use polymorphic marshaling if performance is important. Current implementation may suffer JIT deoptimizations due to exceptions being thrown and caught during regular deserialization. This renders polymorphic deserialization feature useful for auxiliary usages (such as configuration or model serialization), but less useful for high-throughput document streaming. However, implementation can be changed (improved) in future.

**Things to be aware of**

+ If none of expected subclasses matches structure of JSON the `RuntimeException`s during deserialization is thrown
+ If subclass structures have collision first matching type wins
+ Runtime performance

<a name="gson-jackson"></a>
### Gson-Jackson bridge

We can push _Gson_'s performance to it's limits by delegating low-level streaming to _Jackson_. While _Gson_ is pretty optimized in itself, but _Jackson_ is playing "unfair game" by optimizing the whole chain of JSON streaming, including UTF-8 encoding handling, recycling of special buffers, DIY number parsing and formatting etc. This could get as 2 times faster for some workloads.

There's sample benchmark which we used only to see relative difference. As usual, take those numbers with a grain of salt: it's just some numbers for some JSON documents on some macbook.

```
Benchmark                                             Mode  Samples     Score     Error  Units
o.i.s.j.JsonBenchmarks.autoJackson                    avgt        5   709.249 ±  19.170  us/op
o.i.s.j.JsonBenchmarks.immutablesGson                 avgt        5  1155.550 ±  48.843  us/op
o.i.s.j.JsonBenchmarks.immutablesGsonJackson          avgt        5   682.605 ±  20.839  us/op
o.i.s.j.JsonBenchmarks.pojoGson                       avgt        5  1402.759 ± 101.077  us/op
o.i.s.j.JsonBenchmarks.pojoGsonJackson                avgt        5   935.107 ±  58.210  us/op
o.i.s.j.JsonBenchmarks.pojoJackson                    avgt        5   721.767 ±  47.782  us/op
```

It is possible use _Gson_ to serialized to and from various additional textual and binary serialization formats supported by _Jackson_:
[Smile](https://github.com/FasterXML/jackson-dataformat-smile),
[BSON](https://github.com/michel-kraemer/bson4jackson),
[CBOR](https://github.com/FasterXML/jackson-dataformat-cbor),
[YAML](https://github.com/FasterXML/jackson-dataformat-yaml)... etc.

* JAX-RS provider also integrates Gson-Jackson bridge out of the box. Use it as example of how to integrate Gson-Jackson bridge.
* See class [JsonGeneratorWriter](https://github.com/immutables/immutables/blob/master/gson/src/org/immutables/gson/stream/JsonGeneratorWriter.java)
* See class [JsonParserReader](https://github.com/immutables/immutables/blob/master/gson/src/org/immutables/gson/stream/JsonParserReader.java)
* See sample [benchmark code](https://github.com/immutables/samples/tree/master/json/src/org/immutables/samples/json)
