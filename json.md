---
title: 'JSON serialization'
layout: page
---

{% capture v %}2.0.4{% endcapture %}
{% capture depUri %}http://search.maven.org/#artifactdetails|org.immutables{% endcapture %}

Overview
--------

It's not uncommon to use immutable object as messages or documents to transfer or store data.
JSON is a simple and flexible format. Moreover, using libraries like [Jackson](http://wiki.fasterxml.com/JacksonHome), you can use various additional textual and binary formats:
[Smile](https://github.com/FasterXML/jackson-dataformat-smile),
[BSON](https://github.com/michel-kraemer/bson4jackson),
[CBOR](https://github.com/FasterXML/jackson-dataformat-cbor),
[YAML](https://github.com/FasterXML/jackson-dataformat-yaml)... etc.

Immutables' JSON integration underwent overhaul for 2.0. This made integration less exotic, and at the same time more valuable and better serve the Java JSON ecosystem.

_JSON Documentation for versions 1.x of Immutables is located at [immutables.github.io//site1.x/json.html](/site1.x/json.html)_

Instead of old generated marshaler infrastructure based on _Jackson Streaming_ (jackson-core), two new integrations available:

+ Simplified _Jackson_ integration
  - Generation of simple `@JsonCreator` factory method and `@JsonProperty` annotations
  - Delegates everything back to Jackson, which is cool on it's own!
+ Comprehensive _Gson_ integration
  - No custom runtime APIs, Gson APIs are used
  - Generation of _TypeAdapterFactories_ which use no reflection.
  - Optional classes to integrate _Gson_ streaming with _Jackson_ streaming to squize maximum performance.

For more background on this change you can visit related issues.

+ [immutables/issues/68](https://github.com/immutables/immutables/issues/68)
+ [immutables/issues/80](https://github.com/immutables/immutables/issues/80)
+ [immutables/issues/71](https://github.com/immutables/immutables/issues/71)
+ [immutables/issues/75](https://github.com/immutables/immutables/issues/75)

<a name="jackson"></a>
Jackson
-------

Overall _Jackson_ is so cool that it doesn't require any serious code generation to be flexible and high performant.
No additional depedencies are required except for _Immutables_ value processor and _Jackson_ library. It is recommended to use _Jackson_ version 2.4+, but earlier versions can work also.

Integration works by generating simple `@JsonCreator` factory method and `@JsonProperty` annotations on immutable implementation. To enable this, you should use `@JsonSerialize` or
`@JsonDeserialized` annotation (usually it is most safe to use both). Point to immutable implementation class in `as` annotation attribute.

```java
import com.fasterxml.jackson.annotation.*;
import org.immutables.value.Value;

@Value.Immutable
@JsonSerialize(as = ImmutableVal.class)
@JsonDeserialized(as = ImmutableVal.class)
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

If you use Guava, make sure to use special serializers module `com.fasterxml.jackson.datatype:jackson-datatype-guava`.

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

+ Field naming strategy support
+ Polymorphic serialization by structure
+ Gson to Jackson streaming bridge

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

THIS GUIDE IS INCOMPLETE, IT WILL BE UPDATED SOON, SORRY FOR INCOVENIENCE!

Please refer to

+ Gson TypeAdapter generation
  - See javadocs [Gson](https://github.com/immutables/immutables/blob/master/gson/src/org/immutables/gson/Gson.java)
  - See page with [generated code sample](/typeadapters.html)
  - See sample [benchmark module](https://github.com/immutables/samples/tree/master/json/src/org/immutables/samples/json)
+ JAX-RS integration
  - See class [GsonMessageBodyProvider](https://github.com/immutables/immutables/blob/master/gson/src/org/immutables/gson/stream/GsonMessageBodyProvider.java)
+ Jackson bridge
  - See class [JsonGeneratorWriter](https://github.com/immutables/immutables/blob/master/gson/src/org/immutables/gson/stream/JsonGeneratorWriter.java)
  - See class [JsonParserReader](https://github.com/immutables/immutables/blob/master/gson/src/org/immutables/gson/stream/JsonParserReader.java)


### Generating Type Adapters
...
### Type Adapter registration
...
### Field names
...
### JAX-RS integration
...