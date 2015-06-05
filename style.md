---
title: 'Style customization'
layout: page
---

## Overview
In addition to feature annotations, which are used for specific features, you can customize what and how need to be generated for immutable value. The "what" is defined by using attributes of `@org.immutables.value.Value.Immutable` annotation. The "how" is defined using styles defined by `@org.immutables.value.Value.Style` annotation. Custom styles is definitely more advanced functionality and the annotation processor cannot verify all consequences of defining.

## Define style

`@Value.Style` annotation has a number of attributes to customize generated APIs and implementation. See javadoc for [Value.Style](https://github.com/immutables/immutables/blob/master/value/src/org/immutables/value/Value.java#L308)

In nutshell, using styles you can:

+ Customize prefixes or suffixes of how names of types and attributes are detected
+ Customize prefixes or suffixes of generated types and methods
+ Force builders to be constructed using constructor rather that factory method (set naming template to "new")
+ Make implementation hidden or visible: public, package private or same
+ Make construction methods return abstract value type instead of implementation class.
+ Make immutable implementation hide as private inside top-level builder.
+ Make immutable implementations hide as private inside top-level [enclosing](#nesting) class
+ Generate [strict builders](/immutable.html#strict-builder)
+ Force to generate JDK only implementation code even if Guava is available in classpath.
+ Set template "defaults" setting for `@Value.Immutable` which will be used for every immutable class

## Apply style

Style could be attached to:

+ Package, where it will affect all classes in the package
  * It will also affect nested packages unless overridden
+ Top level type, where it will affect this and nested value types
+ Nested value type if this does not contradict top-level style in case of [enclosing](#nesting) class.
+ Annotation, which in turn will serve as style meta-annotation to annotate types and packages.

`@Value.Style` as inline style will win over meta-annotation style.

It is recommended to create one or more style meta-annotations for your projects. It will result in a lot less clutter and easier maintenance and upgrades.

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

This way you can match style to your conventions and preferences!

The simplest way to apply styles in manner similar to global is to annotate top level package of your project or module.

```java
// com/mycompany/project/package-info.java
@MyStyle
public com.mycompany.project;
```

**Things to be aware of**

- When there are couple of conflicting styles mixed on the same level using meta annotation,
then just one of them will be picked. Should not rely on any order here.
- Styles are not merged in any way.
- Styles are applied at package, top level class level, or value type itself if it's nested. Styles will not work on attribute level or declared on intermediate nested types.
- Styles are a sharp tool, expect compilation errors in generated code if style definitions are inaccurate and names overlap, contains inappropriate symbols or java keywords etc.

## Other customizations

### Simple annotations
That could barely be called customization. Let's say it is just a reminder that you can use annotation with simple names rather that qualified with umbrella annotations like `@Value`.

```java
import org.immutables.value.Value.Immutable;
import org.immutables.value.Value.Parameter;

@Immutable interface Value {
  @Parameter int getFirst();
  @Parameter String getSecond();
}
```

Qualifying annotation is still considered default style. More over we could see that Immutables really inspired some other libraries to use this approach to organize annotation APIs.

<a name="nesting"></a>
### Enclosing type
When model messages and documents, we usually want to have a lot of small value classes in one file. In Java this naturally accomplished by nesting those classes under umbrella top level class. Of course, it is possible to generate immutable subclasses for nested static inner classes or interfaces.

Use `@Value.Enclosing` annotation on top level class to provide namespacing for implementation classes, generated out of nested abstract value types. This could be used as a matter of preference or to avoid name clashes of immutable implementation classes which otherwise would be generated as top level classes in the same package.

By default, namespaced implementation classes have simple names without prefixes, could be star-imported for clutter-free usage.

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
