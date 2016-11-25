---
title: 'Encoding custom types'
layout: page
---

{% capture v %}2.3.9{% endcapture %}
{% capture depUri %}http://search.maven.org/#artifactdetails|org.immutables{% endcapture %}

Introduction
------------
The _Immutables_ annotation processor supports not only plain [attribute](immutable.html#attributes) accessors but also provides additional conveniences when using special types like collections, maps, optional types. For instance, generated builders contain methods to add collection elements one by one or add optional element without having to wrap it explicitly (See [collection](immutable.html#array-collection-and-map-attributes), [optional](http://immutables.github.io/immutable.html#optional-attributes) etc). But this built-in support is limited only to a handful of predefined classes and interfaces, such as `List`, `Map`, `Optional`, `Multimap`, `ImmutableSet`...

Obviously, it would desirable to have support for a variety of popular immutable collection libraries or custom made wrapper types in a way similar to those supported out of the box. Or, for example, the way optional types are handled may be not the way how you would encode it. Luckily, we have this covered!

Brand new, experimental functionality allows you to create encoding classes: annotated java classes which serve as examples, snippets of code to be generated. Yes, don't need to dive into annotation processing API, nor craft obscure code-generation templates! Just use plain java code (with some reasonable limitations and rules) to describe how to embed attributes of particular type into generated immutable class. Encoding classes are compiled to metadata annotations which can be packed as reusable jar libraries of annotation processor extensions.

Tutorial
--------

### Setting up projects

We'll dive straight into practical example which will demonstrate typical use case as well as the most important pieces of the functionality. You can skip to the [How to](#howto) if looking for specific recipes.

__Let's create encoding for the `com.google.common.collect.ImmutableTable`__

We'll start by creating modules for our encoding. We will use one module to create encoding itself, and another one to use apply it to generated objects. ([See why need for separate modules](#why-separate))

```
encoding-defs/
+-src/ (think of it as as src/main/java, but simpler ;)
| +-encoding/ (simply a package)
|   +-TableEncoding.java (encoding file)
+-pom.xml

encoding-use/
+-src/
| +-uses/
|   +-UseTable.java (value object that is using the encoding)
+-pom.xml
```

We'll progress by gradually editing files and compiling projects.

Here's the Immutable modules we will use

- [org.immutables:value:{{v}}]({{ depUri }}|value|{{ v }}|jar)
  + the annotation processor used to compile encodings and value objects
- [org.immutables:encode:{{v}}]({{ depUri }}|encoding|{{ v }}|jar)
  + the annotation API to define encoding classes

Maven dependencies will look like following snippets:

```xml
<!-- dependencies for 'encoding-def' module -->
<dependency>
  <!-- the annotation processor, compile only -->
  <groupId>org.immutables</groupId>
  <artifactId>value</artifactId>
  <version>{{ v }}</version>
  <scope>provided</scope>
</dependency>
<dependency>
  <!-- annotation to encodings, compile only, don't need to reexport transitively -->
  <groupId>org.immutables</groupId>
  <artifactId>encode</artifactId>
  <version>{{ v }}</version>
  <scope>provided</scope>
</dependency>
<dependency>
  <!-- we'll encode ImmutableTable, so we need guava dependency, while user of the encoding will have to reference at least Table/ImmutableTable we can skip reexport,
      relying on the using module have it's own guava dependency -->
  <groupId>com.google.guava</groupId>
  <artifactId>guava</artifactId>
  <version>20.0</version>
  <scope>provided</scope>
</dependency>
```

```xml
<!-- dependencies for 'encoding-use' module -->
<dependency>
  <!-- the annotation processor, compile only -->
  <groupId>org.immutables</groupId>
  <artifactId>value</artifactId>
  <version>{{ v }}</version>
  <scope>provided</scope>
</dependency>
<dependency>
  <!-- Use encoding defined in 'encoding-def' -->
  <groupId>org.immutables.sample</groupId> <!-- or whatever group you choose for sibling sample projects -->
  <artifactId>encoding-def</artifactId>
  <version>1-SNAPSHOT</version> <!-- whatever version we use for sample modules -->
</dependency>
<dependency>
  <!-- compile and runtime dependency on Guava as we use Table/ImmutableTable classes -->
  <groupId>com.google.guava</groupId>
  <artifactId>guava</artifactId>
  <version>20.0</version>
</dependency>
```

I trust you can figure out corresponding configuration for Gradle or other build systems (but it would be great if people could contribute it to this tutorial!).

If you need more detailed setup examples on how to setup the build, please, [see complete sample projects encoding-*](https://github.com/immutables/samples).

### First steps

Let's create package and class for the `Table` encoding. It could be `public`, but there's no need for it to be visible outside, so package-private visibility is most appropriate.

```java
package encoding;

import org.immutables.encode.Encoding;

@Encoding
class TableEncoding {
}
```

Once compiled (by saying "compiled" we will usually mean something straightforward like `mvn clean install`), there will be an error reported:

```
[ERROR] ../samples/encoding-def/src/encoding/TableEncoding.java:[6,1] @Encoding.Impl field is bare minimum to be declared. Please add implementation field declaration
```

Ok, so the bare minimum to be declared is a so called implementation field. Indeed, the system need to know some minimum information about what we're actually encoding. We have to declare the type we trying to handle as well as how we would store it instances of it internally. Luckily, this is straightforward, here's how we will define implementation field:

```java
package encoding;

import org.immutables.encode.Encoding;
import com.google.common.collect.ImmutableTable;

@Encoding
class TableEncoding {
  @Encoding.Impl
  private ImmutableTable<String, String, String> field;
}
```

And it compiles now successfully! But wait, what do we have achieved? To answer this, let's actually use our encoding. Create `uses/UseTable.java` in `encoding-use` module like this.

```java
package uses;

import org.immutables.value.Value;
import com.google.common.collect.ImmutableTable;

@Value.Immutable
interface UseTable {
  ImmutableTable<String, String, String> values();
}
```

If we compile this, `ImmutableUseTable` type will be generated, but looking at the generated code you won't see anything changed, or anything that looks like specially encoded. We need to activate encoding in order for it to have any effect on the generated code.

The trick is that encoding we've created generates activation annotation which has all the encoding definition code "compiled" and attached to it as metadata. Looking at the generated sources for our `encoding-def` module, you'll see following annotation class:

```java
// this is the sample listing of the generated file
// target/generated-sources/annotations/encoding/TableEncodingEnabled.java
package encoding;

import org.immutables.encode.EncodingMetadata;

@EncodingMetadata(
  name = "encoding.TableEncoding",
  imports = {
  },
  typeParams = {},
  elements = {
    @EncodingMetadata.Element(
      name = "value",
      tags = {"IMPL", "PRIVATE", "FINAL", "FIELD"},
      naming = "*",
 // ... many lines skipped here
 // ...
public @interface TableEncodingEnabled {}
```

Use `TableEncodingEnabled` annotation to activate encoding. It can be placed on the value type itself or on the package affecting all value types in the package. Placed parent package it will affect all nested packages in a current compilation module. The activation annotation can be used also as meta-annotation: imaging having special "stereotype" annotation which is itself annotated with `*Enabled` annotations as well as any relevant `Value.Style` annotation. All in all, placing encoding activation annotation follows the same rules as [applying styles](style.html#apply-style)

As placing encoding annotation on the type directly is pretty lame (in the sense of cluttering value objects with configuration), we'll place it on the `uses` package affecting all value types in the package.

```java
// create encoding-use/src/uses/package-info.java
@encoding.TableEncodingEnabled // <-- this will activate the encoding
package uses;
```

If we re-compile `encoding-use` module at this point, I really hope ше it compile correctly and the encoding will be applied, so you'll see the generated `ImmutableUseTable.java` changed a bit, but not much, but  

How it works
------------

Reference
---------

### How To...

### Limitations
Annotations are not supported yet
Parser/processor limitations
