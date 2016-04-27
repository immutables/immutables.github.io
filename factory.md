---
title: 'Factory builders'
layout: page
---

{% capture v %}2.1.18{% endcapture %}
{% capture depUri %}http://search.maven.org/#artifactdetails|org.immutables{% endcapture %}

Overview
--------
Do not repeat yourself writing builders for your APIs, with all that overhead of fluent structure and checking.
Generate builders for static factory methods as easily as you would generate builders for [immutable values](/immutable.html).
A factory builder can be seen as a form of partial function application - Supply named parameters one by one and evaluate the function at the end.

This handles the common case of constructing immutable objects. However, if extra processing is required during the construction
(whilst values are being provided to the builder), then factory builders may not be suitable.

+ In addition to this guide, see the JavaDocs of [org.immutables.builder.Builder](https://github.com/immutables/immutables/blob/master/builder/src/org/immutables/builder/Builder.java)

Compile dependencies:

- [org.immutables:value:{{v}}]({{ depUri }}|value|{{ v }}|jar)
- [org.immutables:builder:{{v}}]({{ depUri }}|builder|{{ v }}|jar)

```xml
<dependency>
  <groupId>org.immutables</groupId>
  <artifactId>value</artifactId>
  <version>{{ v }}</version>
  <scope>provided</scope>
</dependency>
<dependency>
  <groupId>org.immutables</groupId>
  <artifactId>builder</artifactId>
  <version>{{ v }}</version>
  <scope>provided</scope>
</dependency>
```

### Factory

Place a `@org.immutables.builder.Builder.Factory` annotation on a static factory method to generate a builder in the same package.

```java
@Builder.Factory
public static int sum(int a, int b) {
  return a + b;
}

...
int sumOf1and2 = new SumBuilder()
    .a(1)
    .b(2)
    .build();
```

By default (when not using a custom [style](/style.html)), the name of the builder and its visibility modifier are derived from the annotated static factory methods.
The build method invokes static factory methods and returns a value.
As with builders generated for immutable objects, builders for factory methods take care of parameter null-checking, conversion to immutable collections, and verify that all attributes are set.

Use a `@Value.Style(newBuilder)` naming template to customize the name of a builder constuctor.
By default `newBuilder = "new"`, which will result in the generated factory builder having a plain `public` constructor.
It is sometimes desirable, depending on your organization's code standards, to instead have a static factory method that produces builders.
Styles can be applied to classes or packages, but not to individual methods.

```java
// put styles on enclosing class or package
@Value.Style(newBuilder = "newBuilder")
class Factories {

  @Builder.Factory
  public static int sum(int a, int b) {
    return a + b;
  }
}

...
int sumOf1and2 = SumBuilder.newBuilder()
    .a(1)
    .b(2)
    .build();
```

Other features and styles work similarly for factory builders as for immutable objects:

+ [Array, Collection and Map parameters](/immutable.html##collection)
+ [Optional](/immutable.html#optional) and [Nullable](/immutable.html#nullable) parameters
+ [Strict builders](/immutable.html#strict-builder)
+ Various naming [style customizations](/style.html)

Note that `@Value.Default`, `@Value.Lazy`, `@Value.Derived`, etc, annotations are **not applicable** to the parameters of factory methods.
Moreover, they usually don't make sense for factory builders in the way that they do for immutable value objects.

To have default parameters, use `Optional` parameters:

```java
@Builder.Factory
public static int sum(Optional<Integer> a, Optional<Integer> b) {
  return a.or(0) + b.or(0);
}
```

### Parameters

Sometimes, it might be preferable to have some factory parameters turned into parameters of the generated builder's constructor.
Annotate parameters with `@Builder.Parameter` to achieve this. Generated builders will then accept the annotated parameters via the
generated constructor instead of as parameter methods:

```java
@Builder.Factory
public static Pet pet(
    @Builder.Parameter AnimalKind kind,
    String name,
    int age) {
  Pet pet = ...
  return pet;
}

Pet p = new PetBuilder(AnimalKind.DOG) // Parameter
    .name("Fluffy")
    .age(3)
    .build();
```

This is invaluable for statically guaranteeing that required parameters are set.

### Switch parameters

Switch parameters are a way to provide some syntactic sugar for builders.
Let's say you can create objects with different modes, and want the builder to have expressive methods to switch modes.
Modes could be simple as a `boolean` `ON|OFF`, or could be an enumeration such as `LIQUID|SOLID|GAS|PLASMA`.

Use `@Builder.Switch` on parameters of `enum` types to turn regular initialization methods into switch methods:

```java
enum Color {RED, YELLOW, GREEN}

public static TrafficLight trafficLight(@Builder.Switch Color light, boolean blink) {
  ...
}

new TrafficLightBuilder()
    .redLight() // a switch method
    .blink(false) // a regular initializer
    .build();

```

In the above example `.redLight()`, `.yellowLight()` or `.greenLight()` should be invoked to set the color switch parameter.
Names of switch methods are derived from the combined names of the enum constants and corresponding parameter names.

The builder will check that any corresponding light switch method has been invoked at least once (only once for [strict builders](/immutable.html#strict-builder)).
To make one of the switch states the default, use the `enum` constant in the annotation's `defaultName` attribute:

```java
enum Color {RED, YELLOW, GREEN}
enum Blink {NONE, START}

public static TrafficLight trafficLight(
    @Builder.Switch Color light,
    @Builder.Switch(defaultName = "NONE") Blink blinking) {
  ...
}

new TrafficLightBuilder()
    .yellowLight()
    .startBlinking()
    .build();

```

If the call to `.startBlinking()` is omitted, the default value `Blink.NONE` will be passed to factory.
