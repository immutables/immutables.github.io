---
title: 'Encoding custom types'
layout: page
---

{% capture v %}2.7.1{% endcapture %}
{% capture depUri %}https://search.maven.org/artifact/org.immutables{% endcapture %}

Introduction
------------
The _Immutables_ annotation processor supports not only plain [attribute](immutable.html#attributes) accessors but also provides additional conveniences when using special types like collections, maps, optional types. For instance, generated builders contain methods to add collection elements one by one or add optional element without having to wrap it explicitly (See [collection](immutable.html#array-collection-and-map-attributes), [optional](http://immutables.github.io/immutable.html#optional-attributes) etc). But this built-in support is limited only to a handful of predefined classes and interfaces, such as `List`, `Map`, `Optional`, `Multimap`, `ImmutableSet`...

Obviously, it would desirable to have support for a variety of popular immutable collection libraries or custom made wrapper types in a way similar to those supported out of the box. Or, for example, the way optional types are handled may be not the way how you would encode it. Luckily, we have this covered!

New experimental functionality allows you to create encoding classes: annotated java classes which serve as examples, snippets of code to be generated. Yes, don't need to dive into annotation processing API, nor to craft obscure code-generation templates! Just use plain java code (with some reasonable limitations and rules) to describe how to embed attributes of particular type into generated immutable class. Encoding classes are compiled to metadata annotations which can be packed as reusable jar libraries of annotation processor extensions.

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

- [org.immutables:value:{{v}}]({{ depUri }}/value/{{ v }}/jar)
  + the annotation processor used to compile encodings and value objects
- [org.immutables:encode:{{v}}]({{ depUri }}/encoding/{{ v }}/jar)
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
  <!-- annotation to encodings, need to be reexported transitively, so annotation can be read at compile time for using modules -->
  <groupId>org.immutables</groupId>
  <artifactId>encode</artifactId>
  <version>{{ v }}</version>
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
  <scope>provided</scope> <!-- encoding definitions and annotations are compile only -->
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

Let's create package and class for the `Table` encoding. It could be `public`, but there's no need for it to be visible outside, so package-private visibility is most appropriate. (Going forward, there will be lot of places where package-private visibility will be used, but when actual code is generated `public` or whatever appropriate will be used)

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

Ok, so the bare minimum to be declared is a so called implementation field. Indeed, the system need to know some minimum information about what we're actually encoding. We have to declare the type we trying to handle as well as how we would store its instances internally. Luckily, this is straightforward, here's how we will define implementation field:

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

Use `TableEncodingEnabled` annotation to activate encoding. It can be placed on the value type itself or on the package affecting all value types in the package. Placed parent package it will affect all nested packages in a current compilation module. The activation annotation can be used also as meta-annotation, see [enabling encoding via meta-annotations](#meta-annotations).

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

### Customizing builder

There's already some geeky stuff happening internally, but nothing interesting so far in terms of convenience and utility that our encoding is called to provide. That's because we haven't got to customizing builder code. And now we are going to describe builder with the encoding. An encoding describes with exemplary code how a single instance ("instantiation") of attribute will be embedded into immutable class. Similarly, a nested builder is used to describe how an attribute is built by providing illustrative fragments of code. When there are no builder declaration in the encoding, the code for the builder is trivially derived from implementation field (or `@Encoding.Of` conversion method) and requires that attributes would always be initialized using builder. Once encoding builder is defined, it's all up to encoding to control all the aspects of how to build values. Hopefully it's not very complicated to do that.

Start with defining static nested class for a builder part, annotate it with `@Encoding.Builder` and replicate any type parameters if any (they should be identical to the ones of encoding).

```java
@Encoding
class TableEncoding<R, C, V> {
  @Encoding.Impl
  private ImmutableTable<R, C, V> value;
  // ... methods skipped for brevity

  @Encoding.Builder  // <-- put annotation
  static class Builder<R, C, V> { // <-- copy type parameters from the encoding

  }
}
```

While a good start, we're getting the compilation error:

```
[ERROR] ../samples/encoding-def/src/encoding/TableEncoding.java:[28,10] @Encoding.Builder must have no arg method @Encoding.Build. It is used to describe how to get built instance
```

Here's how to add it:

```java
//... only nested builder is shown
@Encoding.Builder
static class Builder<R, C, V> {
  @Encoding.Build
  ImmutableTable<R, C, V> build() {
    return ImmutableTable.of(); // <-- maybe return empty table on each build?
  }
}
```

That is still not enough, though. The next compilation error still shows missing elements:

```
[ERROR] ../samples/encoding-def/src/encoding/TableEncoding.java:[28,10] One of builder init methods should be a copy method, i.e. it should be annotated @Encoding.Init @Encoding.Copy and be able to accept values of type which exposed accessor returns
```

This is similar to how we defined conversion (`@Encoding.Of`) method, but now we'll have to do initialization for the builder. Apparently, we are better off creating more complete, realistic builder encoding that would compile and work. Please, follow code comments for extra details.

```java
//... only nested builder is shown
@Encoding.Builder
static class Builder<R, C, V> {
  // we're introducing field to hold intermediate value field
  // And we're even initialize it with default value: empty table
  private ImmutableTable<R, C, V> buildValue = ImmutableTable.of();
  // This field is nothing special, because you can have as many
  // helper builder fields per attribute as you want and their names
  // just have to be unambiguous, no patterns special to follow.

  @Encoding.Init // <-- specify builder initializer method
  @Encoding.Copy // <-- marks it as "canonical" copy method
  // For copy init methods, the name of a method is irrelevant
  // as generated methods are following a name of a corresponding attribute
  // and naming styles applied elsewhere
  public void set(Table<? extends R, ? extends C, ? extends V> table) {
    // As in the case with conversion method, we accept more general type
    // and safely copy it to our field
    // if you would restrict null values it is better to do it here to fail
    // fast, but in our case `ImmutableTable.copyOf` takes care of everything.
    this.buildValue = ImmutableTable.copyOf(table);
    // please note, that we don't have to `return this;` like we usually do
    // in builder initializers. Here we have just a void method, but generated
    // initializers will actually return builder for chained invocation,
    // so this is covered.
  }

  @Encoding.Build // <-- marks build finalization method
  // the method name is irrelevant
  // the return value should match implementation field type
  ImmutableTable<R, C, V> build() {
    // We return whatever we have as of now.
    // buildValue field was initialized with empty table and
    // can be only reassigned to proper ImmutableTable value
    // so we don't check anything here. But if we would like to check for null
    // or other invariants, we would do this here and throw IllegalStateException
    // explaining why attribute value cannot be build.
    return buildValue;
  }
}
```

Such encoding will compile and work. The annotation processor will generate builder code which behave almost as the default code, but with one difference: as we've initialized builder field with empty table, build method will not complain if call to "set" initializer was omitted during construction, there attributes value will be empty table unless initialized to some other value. While another uninteresting example, I believe it was necessary to demonstrate very basic structure the builder might have and provide explaining comments.

Of course, a builder for our `TableEncoding` should have convenience methods to build `ImmutableTable` and with the next attempt we'll cover this by using `ImmutableTable.Builder` as a implementation helper. Please, follow code comments for extra details.

```java
//... only nested builder is shown
@Encoding.Builder
static class Builder<R, C, V> {
  // holding internal builder
  private ImmutableTable.Builder<R, C, V> builder = ImmutableTable.<R, C, V>builder();

  @Encoding.Init // defines additional initializer method
  // the method name matters here as it would became prefix of
  // the generated initializer method, for an attribute named 'foo',
  // a generated will be named 'putFoo'
  void put(R row, C column, V value) {
    // here, table builder handles checks for us
    builder.put(row, column, value);
  }

  @Encoding.Init // defines additional initializer method
  // for an attribute named 'bar', a generated initializer will be named 'putAllBar'
  void putAll(Table<? extends R, ? extends C, ? extends V> table) {
    // here, table builder handles all checks for us
    builder.putAll(table);
  }

  @Encoding.Init
  @Encoding.Copy // canonical copy-initializer, sets/overwrites table
  // for init-copy initializers, generated method name is derived
  // from attribute name and current style
  public void set(Table<? extends R, ? extends C, ? extends V> table) {
    // reassigning builder as set supposed to
    builder = ImmutableTable.<R, C, V>builder().putAll(table);
  }

  @Encoding.Build
  ImmutableTable<R, C, V> build() {
    // this is straightforward
    // just build table from whatever we have accumulated in builder
    return builder.build();
  }
}
```

How it works
------------
(Magic) ...TBD

How To...
---------

<a name="meta-annotations"></a>
### Enabling encoding via meta-annotations

The activation annotation can be used also as meta-annotation: imagine having special "stereotype" annotation which is itself annotated with `*Enabled` annotations as well as any relevant `Value.Style` annotation. All in all, placing encoding activation annotation follows the same rules as [applying styles](style.html#apply-style)

### Adding helper methods

You can add public (or package-private which will work the same here), private and static helper methods. Public methods will be exposed per attribute. Private methods will be used only internally.

```java
// isEmptyAttr would be generated for every table attribute
boolean isEmpty() {
  return value.isEmpty();
}
```

### Customize naming

For most elements, naming patterns will be derived automatically either assumed by their role or by using method name in encoding as a prefix. But you can override naming pattens and set depluralization hint where needed. Use `@Encoding.Naming` annotation for that. Errors/Warnings will be reported if misused. Use `StandardNaming` enum values where applicable, so downstream encoding users can use usual `@Value.Style` customization attributes which will be applicable to naming.

Here's example of putting annotations on table builder methods. Fields and method implementations are left out for brevity.

```java
...
@Encoding.Builder
static class Builder<R, C, V> {
  @Encoding.Init
  @Encoding.Naming(standard = StandardNaming.PUT) // standard "putAttr"
  void put(R row, C column, V value) {...}

  @Encoding.Init
  @Encoding.Naming(standard = StandardNaming.PUT_ALL) // standard "putAllAttr"
  void putAll(Table<? extends R, ? extends C, ? extends V> table) {...}

  @Encoding.Init
  @Encoding.Copy
  @Encoding.Naming("reset*") // will result in "resetAttr", not customizable with styles
  public void set(Table<? extends R, ? extends C, ? extends V> table) {...}
}
```

### Customize with methods

Encodings provide the way to "encode" `with*` methods with custom signatures. There's Javadoc on `@Encoding.Copy` and error messages if misused.

Here is example of custom with methods for hypothetical `Option` encoding. Builder encoding is left out for brevity.

```java
@Encoding
class OptionEncoding<T> {
  @Encoding.Impl
  private Option<T> field = Option.none();
  // if you specify one of the copy methods, the default one is not longer generated
  // so you need to declare both alternative methods
  @Encoding.Copy
  public Option<T> withOption(Option<T> value) {
    return Objects.requireNonNull(value); // insert any checks necessary
  }

  @Encoding.Copy
  public Option<T> with(T value) {
    return Option.some(value); // insert any checks necessary
  }
}
```

### Getting attribute name

If you need attribute name as a string value inside encoding use asterisk in angle brackets inside string literal: `"<*>"`. This placeholder will be replaced in compile time with current attribute name. This can be used to generate exception messages and creating attribute related constant values.

### Virtual fields

Implementation fields can be marked as virtual to allow alternative internal storage of the value by using one or more other fields. But, what is important is that value should be still converted to (if conversion method defined) and smuggled in constructor as a single `@Encoding.Impl` value.

```java
// This encoding is rudimentary/incomplete and serves only as example.
@Encoding
class CompactOptionalDouble {
  @Encoding.Impl(virtual = true)
  private OptionalDouble opt; // will not be stored as a field

  // but these derived values will be stored as object fields.
  private final double value = opt.orElse(0);
  private final boolean present = opt.isPresent();

  @Encoding.Expose
  OptionalDouble get() {
    return present
        ? OptionalDouble.of(value)
        : OptionalDouble.empty();
  }

  // Custom helper accessors can bypass OptionalDouble creation
  @Encoding.Naming("is*Present")
  boolean isPresent() {
    return present;
  }

  @Encoding.Naming("*OrElse")
  double orElse(double defaultValue) {
    return present ? value : defaultValue;
  }
}
```

Limitations
-----------
### Annotations are not supported yet as encoding qualifiers
### Parser/processor limitations (method references)
