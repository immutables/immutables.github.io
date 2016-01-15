---
title: 'Functional accessors'
layout: page
---

{% capture v %}2.1.7{% endcapture %}
{% capture depUri %}http://search.maven.org/#artifactdetails|org.immutables{% endcapture %}

Overview
--------
Java 8 provides lambda expressions, which are very handy for functional programming:
```java
people.stream()
      .map(p -> p.name())
```

They are particularly useful for filtering and transforming immutable value objects,
but many programmers, due to customer requirements or other reasons, cannot use Java 8.  [Guava](https://github.com/google/guava) provides 
many of the functional capabilities of Java 8 using their [`Function` and `Predicate`](https://github.com/google/guava/wiki/FunctionalExplained) interfaces:

```java
class PersonNameFunction implements Function<Person, String> {
   @Override
   public String apply(Person person) {
       return person.name();
   }
}

final ImmutableList<String> names = FluentIterables.from(people)
              .transform(new PersonNameFunction());
```

However, without lambdas, writing `Functions` and `Predicates` is verbose and often results in functional 
code less clear than its imperative equivalent.  

With `org.immutables:func`, you can easily generate Guava `Function`s and `Predicate`s for field access without the clutter:
```java
@Value.Immutable
@Functional
abstract class AbstractPerson {
   public abstract String name();
   public abstract String jobTitle();
   public abstract boolean speaksFrench();
}

final List<String> names = Lists.transform(people,PersonFunctions.name());
```

Boolean attributes become `Predicates`:
```java
final List<Person> frenchSpeakers = Lists.filter(people, PersonFunctions.speaksFrench())
```

By placing `@Functional` on a method instead of the class, you can restrict which `Functions` and `Predicates` are generated:
```java
@Value.Immutable
abstract class AbstractPerson {
   @Functional
   public abstract String name();
   // no Function will be generated for jobTitle
   public abstract String jobTitle();
   @Functional
   public abstract boolean speaksFrench();
}
```

This feature has the following compile-time dependencies in addition to a runtime dependency on Guava:

- [org.immutables:value:{{v}}]({{ depUri }}|value|{{ v }}|jar)
- [org.immutables:builder:{{v}}]({{ depUri }}|func|{{ v }}|jar)

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
