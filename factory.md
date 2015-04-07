---
title: 'Factory builders'
layout: page
---

{% capture v %}2.0.6{% endcapture %}
{% capture depUri %}http://search.maven.org/#artifactdetails|org.immutables{% endcapture %}

Overview
--------
Do not repeat yourself writing builders for your APIs, with all that overhead of fluent structure and checking. Generate builders for static factory methods as easily as you would generate builders for [immutable values](/immutable.html). Factory builders are some form of partial function application, supplying named parameters one by one and invoking function in the end. But if you need builder doing processing along the way while values are being collected, then, probably, stucture of factory builders will not suit your case.

+ In addition to this guide, see JavaDocs of [org.immutables.builder.Builder](https://github.com/immutables/immutables/blob/master/builder/src/org/immutables/builder/Builder.java)

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

Place `@org.immutables.builder.Builder.Factory` annotation on static factory method to generate builder in the same package. 

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

By default (when not customizing [styles](/style.html)), name of builder and it's visibility modifier is derived from the annotated static factory methods. Build method invokes static factory methods and returns value. Just like when using builders for immutable objects, builders for factory methods take care of parameter null-checking, conversion to immutable collection and verifying that all attributes are set.

Use `@Value.Style(newBuilder)` naming template to customize name of a builder constuctor. By default `newBuilder = "new"`, so factory builder generated having plain constructor. You might change it to something else to have static factory method to produce builder.

```java
@Value.Style(newBuilder = "newBuilder")
@Builder.Factory
public static int sum(int a, int b) {
  return a + b;
}

...
int sumOf1and2 = SumBuilder.newBuilder()
    .a(1)
    .b(2)
    .build();
```

Couple of other features and styles works for factory builders in the same way as for immutable objects:

+ Array, Collection and Map parameters
+ Optional and Nullable parameters
+ Strict builders
+ Various naming style customizations

See [immutable values](/immutable.html) and [styles](/style.html) for additional details.

Note that `@Value.Default`, `@Value.Lazy`, `@Value.Derived` etc annotation are **not applicable** to parameters of factory methods, moreover they usually don't make any sense for factory builders.

To have default parameters just use `Optional` parameteres.

```java
@Builder.Factory
public static int sum(Optional<Integer> a, Optional<Integer> b) {
  return a.or(0) + b.or(0);
}
```

### Parameters

Sometimes you might want to have some factory parameters to be turned into parameters of builder's contructor. Annotate parameter with `@Builder.Parameter` to achieve this. Generated builder will accept such parameters via constuctor and not by initialization methods.

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

### Switch parameters

Switch parameters are a way to provide some sugar to builders.
Let's say you can create object in some state and want builder to have exressive methods to switch modes. Modes could be simple as boolean ON/OFF or any enumeration like LIQUID/SOLID/GAS.

Use `@Builder.Switch` on parameters of enum type to turn initialization methots into a switch methods.

```java
enum Color {RED, YELLOW, GREEN}

public static TrafficLight trafficLight(@Builder.Switch Color light, boolean blink) {
  ...
}

new TrafficLightBuilder()
  .redLight() 
  .blink(false)
  .build();

```

In the above example `.redLight()`, `.yellowLight()` or `.greenLight()` should be invoked to set color switch parameter. Name of switch methods are derived from enum constant and parameter names combined.

Builder will check that any corresponding light switch method should be invoked at least once (only once for [strict builders](/immutable.html#strict-builder)). To make one of the switch state as default, use enum constant name in annotation attribute.

```java
enum Color {RED, YELLOW, GREEN}
enum Blink {NONE, START}

public static TrafficLight trafficLight(
    @Builder.Switch Color light,
    @Builder.Switch(defaultName = "NONE") boolean blinking) {
  ...
}

new TrafficLightBuilder()
  .yellowLight() 
  .startBlinking()
  .build();

```

If omit `.startBlinking()`, the default value `Blink.NONE` will be passed to factory.

