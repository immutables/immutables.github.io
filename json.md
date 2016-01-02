---
title: 'JSON serialization'
layout: page
---

{% capture v %}2.1.5{% endcapture %}
{% capture depUri %}http://search.maven.org/#artifactdetails|org.immutables{% endcapture %}

Overview
--------

It's not uncommon to use immutable object as messages or documents to transfer or store data.
JSON is a simple and flexible format. Moreover, using libraries like [Jackson](http://wiki.fasterxml.com/JacksonHome), you can use various additional textual and binary formats:
[Smile](https://github.com/FasterXML/jackson-dataformat-smile),
[BSON](https://github.com/michel-kraemer/bson4jackson),
[CBOR](https://github.com/FasterXML/jackson-dataformat-cbor),
[YAML](https://github.com/FasterXML/jackson-dataformat-yaml)... etc.

_Immutables_ JSON integration underwent an overhaul for 2.0. This made integration a lot less exotic and more comprehensible.

Instead of the old generated marshaler infrastructure based on _Jackson_ streaming (jackson-core), two new integrations available:

+ Simplified _Jackson_ integration
  - Generation of `@JsonCreator`, `@JsonProperty` annotations and a helper class.
  - Delegates everything back to Jackson using it's powerful binding engine
+ Comprehensive _Gson_ integration
  - No custom runtime APIs, Gson APIs are used
  - Generation of _TypeAdapterFactories_ which use no reflection.
  - Helper classes to integrate _Gson_ streaming with _Jackson_ streaming to squeeze maximum performance.

<a name="jackson"></a>
Jackson
-------

Overall _Jackson_ doesn't require any serious code generation to be flexible and highly performant
on the JVM. No additional dependencies are required except for _Immutables_ processor and _Jackson_
library. It is recommended to use _Jackson_ version 2.4+, but earlier versions can work also.

Integration works by generating a simple `@JsonCreator` factory method and `@JsonProperty`
annotations on immutable implementations. To enable this, you should use `@JsonSerialize`
or `@JsonDeserialize` annotations (usually it is safest to use both). Point to an immutable
implementation class in `as` annotation attributes:

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
While `ImmutableVal` may not yet generated, the above will compile properly.
You can use `@JsonProperty` to customize JSON field names. You can freely use any other facilities
of the _Jackson_ library if applicable.

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

**Things to be aware of**

- Not all Jackson annotations are propagated by default to the generated code. You can use `Value.Style.additionalJsonAnnotations` style attribute to specify such annotation types.

### Jackson-Guava

If you use Guava, make sure to use the special serialization module `jackson-datatype-guava`.

```xml
<dependency>
  <groupId>com.fasterxml.jackson.datatype</groupId>
  <artifactId>jackson-datatype-guava</artifactId>
  <version>2.4.0</version>
</dependency>
```
```java

ObjectMapper mapper = new ObjectMapper();
// register module with object mapper
mapper.registerModule(new GuavaModule());
```

### Jackson and Java 8

For Java 8 specific datatypes use `jackson-datatype-jdk8` module.

```xml
<dependency>
  <groupId>com.fasterxml.jackson.datatype</groupId>
  <artifactId>jackson-datatype-jdk8</artifactId>
  <version>2.6.3</version>
</dependency>
```

```java
ObjectMapper mapper = new ObjectMapper();
mapper.registerModule(new Jdk8Module());
```

Sometimes you might use high-level application framework which handles _Jackson_ for you. So in order to register modules you need to get to `ObjectMapper` during initialization phase and configure it. Here's the sample of how it looks like for _Dropwizard_

```java
public void run(AppConfiguration configuration, Environment environment) throws Exception {
  environment.getObjectMapper().registerModule(new GuavaModule());
  environment.getObjectMapper().registerModule(new Jdk8Module());
  ...
}
```

----
<a name="gson"></a>
Gson
----

### Dependencies

- [org.immutables:value:{{v}}]({{ depUri }}|value|{{ v }}|jar)
- [org.immutables:gson:{{v}}]({{ depUri }}|gson|{{ v }}|jar)

Gson integration requires the `com.google.gson:gson` compile and runtime modules.
The `org.immutables:gson` module contains compile-time annotations to generate `TypeAdapter` factories.
Optionally, the `org.immutables:gson` module can also be used at runtime to enable the following functionality:

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

- See the [generated code sample](/typeadapters.html)

### Generating Type Adapters

Use the annotation `@org.immutables.gson.Gson.TypeAdapters` to generate a `TypeAdapaterFactory`
implementation which produces adapters to any immutable classes enclosed by
`@Gson.TypeAdapters` annotations. The annotation can be placed on top-level type or package
(using `package-info.java`). The type adapter factory will support all immutable classes in
the corresponding type (directly annotated and all nested immutable values) or package. A
class named `GsonAdapters[NameOfAnnotatedElement]` will be generated in the same package.

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
Type adapter factories are generated in the same package and registered statically as service providers in `META-INF/services/com.google.gson.TypeAdapterFactory`.
You can manually register factories with `GsonBuilder`, but the easiest way to register all such factories is by using `java.util.ServiceLoader`:

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

- When type adapters are not registered, Gson will use default reflective serializer. However, it will fail to deserialize!
- There's the potential to confuse the `com.google.gson.Gson` object with the `@org.immutable.gson.Gson` umbrella annotation, but they are usually not used together in the same source file. If this will be huge PITA, please let us know!

### JAX-RS integration

A JAX-RS message body reader/writer is provided out of the box. In itself it is a generic Gson integration provider, but it has following special capabilities:

* Auto registration of Gson type adapter factories from `META-INF/services/com.google.gson.TypeAdapterFactory`.
* Built in support for [Gson-Jackson](#gson-jackson) bridge. It is turned on by default if the _Jackson_ library is in the classpath at runtime.

To use immutable types in your JAX-RS services, use
`org.immutables.gson.stream.GsonMessageBodyProvider` which implements
`javax.ws.rs.ext.MessageBodyReader` and `javax.ws.rs.ext.MessageBodyWriter`. Also do not forget
to specify an "application/json" content type, so that the provider will match.

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

While this provider can be picked up automatically from the classpath using `META-INF/services/javax.ws.rs.ext.*` by the JAX-RS engine, sometimes you'll need to add it manually.

```java
// Dropwizard Application example
@Override
public void run(DwConfiguration configuration, Environment environment) throws Exception {
  environment.jersey().register(new TestResource());
  environment.jersey().register(new GsonMessageBodyProvider());
}
```

You can create a customized `GsonMessageBodyProvider` instance:

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

While there's certain amount of customization (like changing field names in JSON), the basic idea is
to have direct and straightforward mappings to JSON derived from the structure of value objects,
where value objects are adapted to a representation rather than free-form objects having complex
mappings to JSON representations.

To add custom binding for types, other than immutable values, use Gson APIs. Please refer to [Gson reference](https://sites.google.com/site/gson/gson-user-guide#TOC-Custom-Serialization-and-Deserialization)

#### Field names
By default, the JSON field name is the same as the attribute name.
However, it is very easy to specify the JSON field name as it should appear in the JSON representation.
Use the `value` attribute of the `com.google.gson.annotations.SerializedName` annotation placed on an attribute accessor.

```java
@Value.Immutable
@Gson.TypeAdapters
public abstract class ValueObject {
  @SerializedName("_id")
  public abstract long getId();
  @SerializedName("name")
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

`valueObject` will be marshaled as:

```js
{
  "_id": 1123,
  "name": "Valuable One",
  "otherAttribute": 0
}
```

`@Gson.Named` is deprecated in favor of _Gson_'s `SerializedName` annotation.
As of _Gson_ v2.5 `SerializedName` is applicable to methods and renders _Immutables'_ custom annotation unnecessary. In addition to that, there's support for `SerializedName.alternate` attribute which allows to specify alternative names used during deserialization.

<a name="field-naming-strategy"></a>
When running on an Oracle JVM, there's an option to enable field naming strategy support.
Use `@Gson.TypeAdapters(fieldNamingStrategy = true)` to enable generation of code which uses a field naming strategy. See Javadoc for [Gson.TypeAdapters#fieldNamingStrategy](https://github.com/immutables/immutables/blob/master/gson/src/org/immutables/gson/Gson.java#L78)

#### Ignoring attributes

Collection, optional and default attributes can be ignored during marshaling by using `@Gson.Ignore` annotation.

#### Omitting empty fields

Use Gson's configuration `GsonBuilder.serializeNulls()` to include empty optional and nullable
fields as `null`. By default those will be omitted, this generally helps to keep JSON clean and to
reduce its size if there are a lot of optional attributes. If you want to omit empty collection
attributes in the same way as nullable fields &mdash; use `@Gson.TypeAdapters(emptyAsNulls = true)`

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

One of the interesting features of _Immutables_ JSON marshaling is the ability to map tuples
(triples and so on) of constructor arguments. While not universally useful, some data types
could be compactly represented in JSON as array of values. Consider, for example, spatial
coordinates or RGB colors.

In order to marshal object as tuple, you need to annotate [constructor](/immutable.html#constructor) arguments and disable generation of [builders](/immutable.html#builder).

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
`coordinates` will be marshaled as a JSON array rather than a JSON object

```js
[37.783333, -122.416667]
```

A special case of this are values with single constructor parameter.
Having a tuple of 1 argument is essentially equivalent to having just a single argument. Therefore
you can marshal and unmarshal such objects as a value of its single argument.
If you want to make value to be a wrapper type (for the purposes of adding type-safety), but
nevertheless invisible in BSON, you can define it as having no builder and single argument
constructor, so that it will become a pure wrapper:

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

This makes it possible to achieve the desired level of abstraction and type safety without cluttering JSON data structure.

<a name="poly"></a>
#### Polymorphic mapping

An interesting feature of _Immutables_ Gson marshaling is the ability to map an abstract type to one of
it's subclasses by structure as opposed to by a "discriminator" field.

Define a common supertype class and subclasses, then use
`@org.immutables.gson.Gson.ExpectedSubtypes` annotation to list the expected subtypes. Then, you
can use a supertype in an attribute as a plain reference or as a collection.

`@Gson.ExpectedSubtypes` can be placed on:

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

As you can guess, the above JSON fragment may be deserialized to `HostDocument`, the `value`
attribute of which will contain instances of `InterestingValue`, followed by `RelevantValue`,
and finally `InterestingValue`.

In addition, when using a value [nested in enclosing](/style.html#nesting), the exact set of
subclasses can be figured out from the set of nested types in the enclosing scope. In that case,
the `@Gson.ExpectedSubtypes` annotation may have its "value" attribute omitted.

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

Although a nice feature, you should generally avoid the use of polymorphic marshaling if performance is
important. Current implementation may suffer JIT deoptimizations due to exceptions being thrown
and caught during regular deserialization. This renders the polymorphic deserialization feature
useful for auxiliary uses (such as configuration or model serialization), but less useful for
high-throughput document streaming. However, the implementation can be changed (improved) in future.

**Things to be aware of**

+ If none of expected subclasses matches the structure of the JSON, a `RuntimeException`s is thrown during deserialization
+ If subclass structures have a collision, the first matching type wins
+ Run-time performance

<a name="gson-jackson"></a>
### Gson-Jackson bridge

We can push _Gson_'s performance to it's limits by delegating low-level streaming to
_Jackson_. _Gson_ is pretty optimized in itself, but _Jackson_ is playing an "unfair game"
by optimizing the whole chain of JSON streaming, including UTF-8 encoding handling, recycling
of special buffers, DIY number parsing and formatting etc. This can be as much as 200% faster
for some workloads.

There's sample benchmark which we used only to see relative difference. As usual, take those
numbers with a grain of salt: it's just some numbers for some JSON documents on some MacBook.

```
Benchmark                                             Mode  Samples     Score     Error  Units
o.i.s.j.JsonBenchmarks.autoJackson                    avgt        5   709.249 ±  19.170  us/op
o.i.s.j.JsonBenchmarks.immutablesGson                 avgt        5  1155.550 ±  48.843  us/op
o.i.s.j.JsonBenchmarks.immutablesGsonJackson          avgt        5   682.605 ±  20.839  us/op
o.i.s.j.JsonBenchmarks.pojoGson                       avgt        5  1402.759 ± 101.077  us/op
o.i.s.j.JsonBenchmarks.pojoGsonJackson                avgt        5   935.107 ±  58.210  us/op
o.i.s.j.JsonBenchmarks.pojoJackson                    avgt        5   721.767 ±  47.782  us/op
```

It is possible use _Gson_ to serialize to and from various additional textual and binary serialization formats supported by _Jackson_:

[Smile](https://github.com/FasterXML/jackson-dataformat-smile),
[BSON](https://github.com/michel-kraemer/bson4jackson),
[CBOR](https://github.com/FasterXML/jackson-dataformat-cbor),
[YAML](https://github.com/FasterXML/jackson-dataformat-yaml)... etc.

* JAX-RS provider also integrates Gson-Jackson bridge out of the box. Use it as an example of how to integrate Gson-Jackson bridge.
* See class [JsonGeneratorWriter](https://github.com/immutables/immutables/blob/master/gson/src/org/immutables/gson/stream/JsonGeneratorWriter.java)
* See class [JsonParserReader](https://github.com/immutables/immutables/blob/master/gson/src/org/immutables/gson/stream/JsonParserReader.java)
* See sample [benchmark code](https://github.com/immutables/samples/tree/master/json/src/org/immutables/samples/json)
