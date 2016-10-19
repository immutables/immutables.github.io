---
title: 'Encoding custom types'
layout: page
---

{% capture v %}2.3.7{% endcapture %}
{% capture depUri %}http://search.maven.org/#artifactdetails|org.immutables{% endcapture %}

Introduction
------------
The _Immutables_ annotation processor supports not only plain [attribute](immutable.html#attributes) accessors but also provides addition conveniences when using special types like collections, maps, optional types. For instance, generated builders contain methods to add collection elements one by one or add optional element without having to wrap it explicitly (See [collection](immutable.html#array-collection-and-map-attributes), [optional](http://immutables.github.io/immutable.html#optional-attributes) etc). But this built-in support is limited only to a handful of predefined classes and interfaces, such as `List`, `Map`, `Optional`, `Multimap`, `ImmutableSet`...

Obviously, it would desirable to have support for a variety of popular immutable collection libraries or custom made wrapper types in a way similar to those supported out of the box. Or, for example, the way optional types are handled may be not the way how you would encode it. Luckily, we have this covered!

Brand new, experimental functionality allows you to create encoding classes: annotated java classes which serve as examples, snippets of code to be generated. Yes, don't need to dive into annotation processing API, nor craft code-generation templates! Just use plain java code with some reasonable limitations and rules to describe how to embed attributes of particular type into generated immutable class. Encoding classes are compiled to metadata annotations which can be packed as reusable jar libraries of annotation processor extensions.

Tutorial
--------

We'll dive straight into practical example which will demonstrate typical use case as well as the most important pieces of the functionality. You can skip to the [How to](#howto) if looking for specific recipes.

__Let's create encoding for the `com.google.common.collect.ImmutableTable`__

We'll start by creating modules for our encoding. We will use one module to create encoding itself, and another one to use apply it to generated objects.

Compile dependencies:

- [org.immutables:value:{{v}}]({{ depUri }}|value|{{ v }}|jar)
- [org.immutables:encode:{{v}}]({{ depUri }}|encoding|{{ v }}|jar)

Advanced customization


```xml
<dependency>
  <groupId>org.immutables</groupId>
  <artifactId>encode</artifactId>
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

Reference
---------
### How To...

### Limitations
Annotations are not supported yet
Parser/processor limitations

### Design
