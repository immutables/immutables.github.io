---
title: 'Style customization'
layout: page
---

## Overview

In addition to feature annotations (which are used for specific features), you can customize what
and how code will be generated for immutable values. The "what" is defined by using attributes
of the `@org.immutables.value.Value.Immutable` annotation. The "how" is defined by using styles
defined by the `@org.immutables.value.Value.Style` annotation. Custom styles are definitely
more advanced functionality and the annotation processor cannot guarantee that all possible
combinations of customizations will work correctly.

## Define style

`@Value.Style` annotation has a number of attributes to
customize generated the APIs and implementations. See the JavaDoc for
[Value.Style](https://github.com/immutables/immutables/blob/master/value/src/org/immutables/value/Value.java#L308)

In nutshell, using styles you can:

+ Customize prefixes or suffixes of how names of types and attributes are detected.
+ Customize prefixes or suffixes of generated types and methods.
+ Force builders to be constructed using a constructor rather than a factory method (by setting the naming template to "new").
+ Make an implementation hidden or visible: public, package private or the same as the abstract value type.
+ Make construction methods return abstract value types instead of the implementation class.
+ Make immutable implementations hidden as private inside a top-level builder.
+ Make immutable implementations hidden as private inside a top-level [enclosing](#nesting) class.
+ Generate [strict builders](/immutable.html#strict-builder).
+ Force the generation of JDK-only implementation code, even if Guava is available in classpath.
+ Set template "defaults" setting for `@Value.Immutable` which will then be used for every immutable class.

<a name="apply"></a>
## Apply style

A `Style` can be attached to:

+ A package, where it will affect all classes in the package
  * It will also affect nested packages unless overridden
+ A top-level type, where it will affect this and nested value types
+ A nested value type, if this does not contradict top-level style in case of [enclosing](#nesting) class.
+ Annotation, which in turn will serve as style meta-annotation to annotate types and packages.

A `@Value.Style` as inline style will win over meta-annotation style.

It is recommended to create one or more style meta-annotations for your projects. Doing this will result in a lot less clutter, and easier maintenance and upgrades.

```java
import org.immutables.value.Value;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Retention;
import java.lang.annotation.ElementType;
import java.lang.annotation.Target;

@Target({ElementType.PACKAGE, ElementType.TYPE})
@Retention(RetentionPolicy.CLASS) // Make it class retention for incremental compilation
@Value.Style(
    get = {"is*", "get*"}, // Detect 'get' and 'is' prefixes in accessor methods
    init = "set*", // Builder initialization methods will have 'set' prefix
    typeAbstract = {"Abstract*"}, // 'Abstract' prefix will be detected and trimmed
    typeImmutable = "*", // No prefix or suffix for generated immutable type
    builder = "new", // construct builder using 'new' instead of factory method
    build = "create", // rename 'build' method on builder to 'create'
    visibility = ImplementationVisibility.PUBLIC, // Generated class will be always public
    defaults = @Value.Immutable(copy = false)) // Disable copy methods by default
public @interface MyStyle {}
...


@Value.Immutable // if no attributes are specified, then defaults will be used
@MyStyle // This annotation could be also placed on package
interface AbstractItem {
  int getId();
  boolean isEnabled();
}
...

Item item = new Item.Builder()
  .setId(1)
  .setEnabled(true)
  .create();
```

This way you can match the generated code style to your conventions and preferences!

The simplest way to apply styles in manner as close to globally as possible is to annotate the top-level package of your project or module.

```java
// com/mycompany/project/package-info.java
@MyStyle
public com.mycompany.project;
```

**Things to be aware of**

- When there are couple of conflicting styles mixed on the same level using meta annotations, then either may be selected arbitrarily. You should not rely on any particular selection order here.
- Styles are not merged in any way.
- Styles are applied at package level, top-level class level, or on a value type itself if it's nested. Styles will not work if applied at attribute level or declared on intermediate nested types.
- Styles are a sharp tool, expect compilation errors in generated code if style definitions are inaccurate and names overlap, contain inappropriate symbols or Java keywords etc.
- Styles are aggressively cached. If you change some meta-style or parent-package style sometimes you may not see thing correctly compiling until a full clean rebuild or even IDE restart.

<a name="depluralization"></a>
### Depluralization

`Style.depluralize` style attribute enables automatic depluralization of attribute names for collection and map attributes used for generating derived method names, such as `add*` and `put*`. In order to enable depluralization specify depluralize = true: this will trim trailing "s" suffixes if present to create singular form ("ies" to "y" suffix conversion is also supported).

Exceptions are provided using `Style.depluralizeDictionary` array of `"singular:plural"` pairs as alternative to mechanical `"*s"` depluralization.

```java
@Value.Style(
  depluralize = true, // enable feature
  depluralizeDictionary = {"person:people", "foot:feet"}) // specifying dictionary of exceptions
```

When given the dictionary defined as `{"person:people", "foot:feet"}` then examples for `add*` method in builder would be:

* boats → addBoat
* people → addPerson
* feet → addFoot
* feetPeople → addFeetPerson
* peopleRepublics → addPeopleRepublic

Dictionary-based depluralization is based on the assumption that simple `s` trimming will cover most cases, while exceptions, if provided, are likely to be ubiquitous in a problem domain being modelled by value objects. As a reminder, you don't have to annotate every single value class with bulky style definitions, rather annotate some top-level package or use style as meta annotation (See [Apply style](#apply))

## Other customizations

### Simpler imports

This example can barely be called a customization. Let it just be a reminder that you can use
annotations with simple names rather than qualified with umbrella annotations like `@Value`:

```java
import org.immutables.value.Value.Immutable;
import org.immutables.value.Value.Parameter;

@Immutable interface Value {
  @Parameter int getFirst();
  @Parameter String getSecond();
}
```

### "is" prefix and custom getters

As "strange" as it sounds, but out-of-the-box only `get`-prefixed or no-prefix accessors are supported. The `isEmpty()` accessor will be considered as `isEmpty` attribute, not as one called `empty`. Yep, Immutables is not a JavaBean-compliant toolkit and don't expect it to be. However, styles allows you to specify arbitrary prefixes (or even suffixes) to be recognized as part of attribute accessors. Most folks that want to use familiar `get` and `is` prefixes simply use `@Value.Style(get = {"get*", "is*"})` configured for a parent-package or as a meta-annotation.

```java
@Value.Immutable
@Value.Style(get = {"get*", "is*", "*Whatever"}, init = "set*")
interface Val {
  int getProp();
  boolean isEmpty();
  String fooWhatever();

  static void demo() {
    Val v = ImmutableVal.builder()
      .setProp(1)
      .setEmpty(true)
      .setFoo("whatever")
      .build();

    v.toString();// Val{prop=1, empty=true, foo=whatever}
  }
}
```

<a name="nesting"></a>
### Enclosing type

When modelling messages and documents, we usually want to have a lot of small value classes in one
file. In Java this naturally accomplished by nesting those classes under an umbrella top-level
class. Of course, it is possible to generate immutable subclasses for nested static inner
classes or interfaces.

`@Value.Enclosing` annotation can be used on a top-level class to provide namespacing for implementation
classes generated out of nested abstract value types. This can be used as a matter of
preference or to avoid name clashes of immutable implementation classes which would otherwise
be generated as top-level classes in the same package.

By default, namespaced implementation classes have simple names without prefixes, an can be
star-imported for clutter-free usage.

```java
@Value.Enclosing
class GraphPrimitives {
  @Value.Immutable
  interface Vertex {}
  @Value.Immutable
  static class Edge {}
}
...
import ...ImmutableGraphPrimitives.*;
...
Edge.builder().build();
Vertex.builder().build();
```

There are number of styling options available to customize naming of generated top-level and nested classes.
It worth to note that style annotation should be placed on a top-level enclosing class or on a package,
because style of the enclosing class and nested value objects should be the same.

_Note: prior to 2.0, `@Value.Enclosing` was named `@Value.Nested`_

_Note: as of 2.1 we would not advertise the use of `@Value.Enclosing`. It is not deprecated and may be useful as namespacing tool, but still this should be considered as a niche solution, not the one that you should use "by default". Just nesting value types and generating top-level immutable classes in the same package works fine in  many cases._

### Custom immutable annotation

What if you want nice single annotation to express immutable object along with certain style? Or better set of annotation with predefined styles? Let's define two such annotations as a contrived example.

```java
package org.example.annotation;

import org.immutables.value.Value;
import java.lang.annotation.ElementType;
import java.lang.annotation.Target;

/**
 * Tupled annotation will be used to generate simple tuples in reverse-style,
 * having construction methods of all annotations.
 */
@Value.Style( // Tupled annotation will serve as both immutable and meta-annotated style annotation
    typeAbstract = "*Def",
    typeImmutable = "*",
    allParameters = true, // all attributes will become constructor parameters
                          // as if they are annotated with @Value.Parameter
    visibility = Value.Style.ImplementationVisibility.PUBLIC, // Generated class will be always public
    defaults = @Value.Immutable(builder = false)) // Disable copy methods and builder
public @interface Tupled {}
...

/**
 * Builded annotation will generate builder which produces private implementations
 * of abstract value type.
 */
@Target(ElementType.TYPE)
@Value.Style(
    typeBuilder = "BuilderFor_*",
    defaultAsDefault = true, // java 8 default methods will be automatically turned into @Value.Default
    visibility = Value.Style.ImplementationVisibility.PRIVATE,
    builderVisibility = Value.Style.BuilderVisibility.PACKAGE) // We will extend builder to make it public
public @interface Builded {}
```

But those definitions along is not enough. Create text file as classpath resource having path
`/META-INF/annotations/org.immutables.value.immutable` and put one or more lines with fully qualified names
of extension annotations:

```
org.example.annotation.Tupled
org.example.annotation.Builded
```

Ok, now compile annotations and put the above file as a separate jar and then put it on the same classpath/scope as the annotation processor during build along with regular compilation(only) classpath. The annotation jar is not needed at runtime.

Then we can use this annotation module as compile/annotation-processing dependency. Using Maven just put it in `provided` scope.


```java
package org.example.models;

import org.example.annotation.Tupled;
import org.example.annotation.Builded;

// Look, custom annotation instead of @Value.Immutable
// and the style is also attached!
@Tupled interface RgbDef {
  double red();
  double green();
  double blue();
}
// ...
Rgb color = Rgb.of(0.4, 0.3, 1.0);

// Custom annotation for builder with private immutable implementation.
@Builded public interface Record {
  long id();
  String name();

  default String notes() { // Works as default attribute!
    return "";
  }

  // Then we extend package-private builder with public nested builder and expose all
  // public methods as methods of Record.Builder.
  class Builder extends BuilderFor_Record {}
}
// ...
Record record = new Record.Builder()
    .id(123L)
    .name("Named Record")
    .notes("Oh, nothing interesting, surely!")
    .build();
```
