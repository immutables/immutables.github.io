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

We'll dive straight into practical example which will demonstrate typical use case as well as the most important pieces of the functionality in a step-by-step fashion. You can skip to the [How to](#howto) if looking for specific recipes.

__Let's create encoding for the `com.google.common.collect.ImmutableTable`__

### Setting up projects

Start by creating modules for our encoding. One module to create encoding itself, and another one to use apply it to generated objects. ([See why need for separate modules](#why-separate))

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

### First encoding

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

And it compiles now successfully! But wait, what do we have achieved? Before answering this, let's actually use our encoding. Create `uses/UseTable.java` in `encoding-use` module like shown below:

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
public @interface TableEncodingEnabled {}
```

Use `TableEncodingEnabled` annotation to activate encoding. It can be placed on the value type itself or on the package affecting all value types in the package. Placed parent package it will affect all nested packages in a current compilation module. The activation annotation can be used also as meta-annotation: imagine having special "stereotype" annotation which is itself annotated with `*Enabled` annotations as well as any relevant `Value.Style` annotation. All in all, placing encoding activation annotation follows the same rules as [applying styles](style.html#apply-style)

As placing encoding annotation on the type directly is pretty lame (in the sense of cluttering value objects with configuration), we'll place it on the `uses` package affecting all value types in the package.

```java
// create encoding-use/src/uses/package-info.java
@encoding.TableEncodingEnabled // <-- this will activate the encoding
package uses;
```

After successful re-compilation of `encoding-use` module we are ready to see we achieved to apply our minimal encoding of `ImmutableTable<String,String,String>`. Indeed, generated code of `ImmutableUseTable.java` is a little bit different internally from what was generated before we've applied the encoding. The great thing is that we've able to properly setup projects and apply encoding, but, otherwise, we are yet to see anything useful about an encodings: there are no externally observable changes. We have to start creating useful definitions on top of the minimal encoding to unleash the power.

### Type parameters

The first thing that should bother us is that the encoding only applies to `ImmutableTable<String,String,String>`, i.e. exactly to the specified type arguments. If we add another accessor which will use `Integer` type arguments, the encoding will not be applied.

```java
@Value.Immutable
interface UseTable {
  ImmutableTable<String, String, String> values(); // <-- encoding applied
  ImmutableTable<Integer, Integer, Integer> intValues(); // <-- default code is generated
}
```

To make encoding flexible about type arguments we'll use generic parameters on encoding.

```java
package encoding;

import org.immutables.encode.Encoding;
import com.google.common.collect.ImmutableTable;

@Encoding
class TableEncoding<R, C, V> {  // <-- introduce type parameters
  @Encoding.Impl
  private ImmutableTable<R, C, V> field; // <-- use them anywhere we reference the type
}
```

After recompiling both `encoding-def` and `encoding-use` modules, both accessors of the `ImmutableUseTable` class will be also implemented by our encoding. And so `TableEncoding` will be applied to any type arguments of `ImmutableTable` in a scope where it's applied. You can also safely assume that encoding will also capture any `ImmutableTable` arguments which themselves are type variables. If we parametrize `UseTable`, our encoding will still apply:

```java
@Value.Immutable
interface UseTable<V> { // <-- introduce type variable
  ImmutableTable<String, String, V> values(); // <-- encoding applied
  ImmutableTable<Integer, Integer, V> intValues(); // <-- encoding applied
}
```

### Exposed type and accessors

It's not uncommon to see value interfaces (or abstract classes) implemented by both immutable and mutable classes. While we'll leave mutable implementations out of this discussion, but, at minimum, we'll want to apply `ImmutableTable` encoding as implementation to attributes exposed as `com.google.common.collect.Table` interface. The encoding we've created contains only the implementation field. The type, to which the encoding applies to, is derived directly from the field. Fortunately, we're able to specify more general types for encoding as long as they are compatible.

The recipe is following: create no-arg accessors with target return types and use `@Encoding.Expose` annotation to mark these accessors. The names of the accessors are irrelevant as long as they are unambiguous. And in our case, it should be obvious that they would return the value of the `value` fields. Here's how our encoding would look like after adding `Expose` accessors:

```java
package encoding;

import com.google.common.collect.ImmutableTable;
import com.google.common.collect.Table;
import org.immutables.encode.Encoding;

@Encoding
class TableEncoding<R, C, V> {
  @Encoding.Impl
  private ImmutableTable<R, C, V> field;

  @Encoding.Expose
  ImmutableTable<R, C, V> getImmutableTable() {
    return field; // <-- this is how our accessor would be implemented
  }

  @Encoding.Expose
  Table<R, C, V> getTable() {
    return field; // <-- this is how our accessor would be implemented
  }
}
```

Important point about this is that as we define at least one such _expose_ accessor, no type would be derived from the field. In our case we created two accessors: for `Table` and `ImmutableTable`. There's no handling of inheritance during matching encoding to types, so if we want an encoding to apply both an interface and an immutable implementation (like `Table` and `ImmutableTable`), we have to declare all such accessors. The actual names of fields and accessors will follow attribute names in the using class, it's only required that encoding have them unambiguous. The annotation processor then can, more or less safely, extrapolate implementation code like `return field;` to generate Java source code for accessors in an immutable class.

```java
// Changing UseTable to use "Table" interface for one of the accessors
// The encoding will be applied to both.
@Value.Immutable
interface UseTable<V> {
  ImmutableTable<String, String, V> values(); // <-- use immutable class
  Table<Integer, Integer, V> intValues(); // <-- use interface
}
```

However, that is not yet fully working solution, there's a compilation error in generated code:

```
[ERROR] ../sample/encoding-use/target/generated-sources/annotations/uses/ImmutableUseTable.java:[156,35] incompatible types: com.google.common.collect.Table<java.lang.Integer,java.lang.Integer,V> cannot be converted to com.google.common.collect.ImmutableTable<java.lang.Integer,java.lang.Integer,V>
```

The missing piece is the special routine that initializes `ImmutableTable field` with the value of `Table`. This requirement comes from the code that copies object in builder. Having received an instance of `UseTable` and invoking `Table intValues()` to get the value, which is then used to initialize in builder `ImmutableTable field`. While it's possible to craft object to avoid this code to be generated (setting `Value.Immutable(copy=false)`), we've yet to solve the underlying problem: the need to initialize immutable field from the instance of more general type having unknown implementation. Notice how you would use regular `List<T>` with _Immutables_ processor: you can to initialize attribute values with `Iterable<? extends T>`. We need similar capability to describe the most general type we can convert to `ImmutableTable`. And we have such!

The annotation `@Encoding.Of` is used to mark static conversion method. Method is bound to the following restrictions:

* It must be static and therefore should have the same type parameters as encoding (if there are such).
* The return type should match the type of implementation field.
* It should have single parameter to accept value. What is important, any _exposed_ accessor type should be assignable to that parameter type, and the processor can generate code which can get from value from a getter and pass to an initializer.

For our case `Table<? extends R, ? extends C, ? extends V>` is most general type to accept as initializing value.

```java
@Encoding
class TableEncoding<R, C, V> {
  @Encoding.Impl
  private ImmutableTable<R, C, V> value;

  @Encoding.Expose
  ImmutableTable<R, C, V> getImmutableTable() {
    return value;
  }

  @Encoding.Expose
  Table<R, C, V> getTable() {
    return value;
  }

  @Encoding.Of
  static <R, C, V> ImmutableTable<R, C, V> init(Table<? extends R, ? extends C, ? extends V> table) {
    return ImmutableTable.copyOf(table); // <-- We rely on `copyOf` to cast or defensively copy
  }
}
```

Recompile both modules and watch how the code from our encoding is being "implanted" into the generated code in `ImmutableUseTable.java`. You can play with adding trivial changes to the way accessors or conversion method are implemented in the encoding and see how implementation code of `ImmutableTable` changes accordingly.

### Customizing builder implementation

There's already some geeky stuff happening internally, but nothing interesting so far in terms of convenience and utility that our encoding is called to provide. That's because we haven't got to customizing builder code. Default implementation of....

How it works
------------

Reference
---------

### How To...

### Limitations
Annotations are not supported yet
Parser/processor limitations
