---
title: 'Functions and Predicates'
layout: page
---

{% capture v %}2.7.3{% endcapture %}
{% capture depUri %}https://search.maven.org/artifact/org.immutables{% endcapture %}

### Overview

Java 8 provides lambda expressions, which are very handy for functional programming:

```java
people.stream()
      .map(p -> p.name())
```

They are particularly useful for filtering and transforming immutable value objects,
but many programmers, due to customer requirements or other reasons, cannot use Java 8.  [Guava](https://github.com/google/guava) provides many of the functional capabilities of Java 8 using their [`Function` and `Predicate`](https://github.com/google/guava/wiki/FunctionalExplained) interfaces:

```java
class PersonNameFunction implements Function<Person, String> {
  @Override
  public String apply(Person person) {
    return person.name();
  }
}

ImmutableList<String> names = FluentIterables.from(people)
    .transform(new PersonNameFunction());
```

However, without lambdas, writing `Function`s and `Predicate`s is verbose and often results in functional code less clear than its imperative equivalent.  

### Generate functions and predicates

With `org.immutables:func`, you can easily generate Guava `Function`s and `Predicate`s for field access without the clutter. Special class `*Functions` is generated and provides function and predicate instances.

```java
@Value.Immutable
@Functional
abstract class Person {
  public abstract String name();
  public abstract String jobTitle();
  public abstract boolean speaksFrench();
}

List<String> names = Lists.transform(people, PersonFunctions.name());
// Boolean attributes become `Predicates`
Iterable<Person> frenchSpeakers = Iterables.filter(people, PersonFunctions.speaksFrench());
```

By placing `@Functional` on a method instead of the class, you can restrict which `Functions` and `Predicates` are generated:

```java
@Value.Immutable
abstract class Person {
  @Functional
  public abstract String name();
  // no Function will be generated for jobTitle
  public abstract String jobTitle();
  @Functional
  public abstract boolean speaksFrench();
}
```

Of course, you can use static imports to further reduce clutter.

```java
import ...PersonFunctions.*;
import ...FluentIterable.*;

List<String> frenchSpeakerNames =
    from(people)
        .filter(speaksFrench())
        .transform(name())
        .toList();
```

### Generate functions with bound parameters

`@Functional.BindParameters` annotation can be place on non-accessor methods of abstract value type to generate function to which parameters can be bound.

```java
@Value.Immutable
public abstract class Xyz {
  @Functional
  public abstract String getX();

  @Functional.BindParameters
  public String computeZ(String y) {
    return getX() + y;
  }
}
...
// Generated functions
public final class XyzFunctions {
  ...
  public static Function<Xyz, String> computeZ(String y) {
    return new Function<Xyz, String>() {
      @Override
      public String apply(Xyz input) {
        return input.computeZ(y);
      }
      @Override
      public String toString() {
        return "XyzFunctions.computeZ(y)";
      }
    };
  }
}
...
// use as
Function<Xyz, String> fn = XyzFunctions.computeZ("Y");
```

### Dependencies

This feature has the following compile-time dependencies in addition to a runtime dependency on Guava:

- [org.immutables:value:{{v}}]({{ depUri }}/value/{{ v }}/jar)
- [org.immutables:func:{{v}}]({{ depUri }}/func/{{ v }}/jar)

```xml
<dependency>
  <groupId>org.immutables</groupId>
  <artifactId>value</artifactId>
  <version>{{ v }}</version>
  <scope>provided</scope>
</dependency>
<dependency>
  <groupId>org.immutables</groupId>
  <artifactId>func</artifactId>
  <version>{{ v }}</version>
  <scope>provided</scope>
</dependency>
```
