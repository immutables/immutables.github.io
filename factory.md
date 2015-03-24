---
title: 'Factory builders'
layout: page
---

{% capture v %}2.0{% endcapture %}
{% capture depUri %}http://search.maven.org/#artifactdetails|org.immutables{% endcapture %}

Overview
--------
Do not repeat yourself writing builders for your APIs, with all that overhead of fluent structure and checking. Generate builders for static factory methods as easily as you would generate builders for [immutable values](/immutable.html).

Use `@org.immutables.builder.Builder.Factory` annotation on factory methods

This guide is incomplete yet, please refere to

+ See JavaDocs [org.immutables.builder.Builder](https://github.com/immutables/immutables/blob/master/builder/src/org/immutables/builder/Builder.java)


```xml
<dependency>
  <groupId>org.immutables</groupId>
  <artifactId>value</artifactId>
  <version>{{ v }}</version>
  <scope>provided</scope>
  <optional>true</optional>
</dependency>
<dependency>
  <groupId>org.immutables</groupId>
  <artifactId>builder</artifactId>
  <version>{{ v }}</version>
  <scope>provided</scope>
  <optional>true</optional>
</dependency>
```

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