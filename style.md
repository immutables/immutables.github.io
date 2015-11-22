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

## Other customizations

### Simple annotations

This example can barely be called customization. Let's just say that it is a reminder that you can use
annotations with simple names rather than qualified with umbrella annotations like `@Value`:

```java
import org.immutables.value.Value.Immutable;
import org.immutables.value.Value.Parameter;

@Immutable interface Value {
  @Parameter int getFirst();
  @Parameter String getSecond();
}
```

Qualifying annotations is still considered the default style. More over we can see that
_Immutables_ really inspired some other libraries to use this approach to organize annotation APIs.

<a name="nesting"></a>
### Enclosing type

When modelling messages and documents, we usually want to have a lot of small value classes in one
file. In Java this naturally accomplished by nesting those classes under an umbrella top-level
class. Of course, it is possible to generate immutable subclasses for nested static inner
classes or interfaces.

Use a `@Value.Enclosing` annotation on a top-level class to provide namespacing for implementation
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

_Note: prior to 2.0, `@Value.Enclosing` was named `@Value.Nested`_
