# Notable Features & Improvements: Version 2.10 → 2.12

A summary of the most interesting features and fixes added to Immutables
from version 2.10.0 through 2.11.x and upcoming 2.12.0.

═══════════════════════════════════════════════════════════════════════════
                  
## MAJOR FEATURES

### Java Records Support (2.11.0)
- Full builder generation for Java records via @Value.Builder annotation
- Generated "wither" interfaces for records (WithA, WithB, etc.)
- @Value.Default.* annotations for constant default values on records
- Staged builders support for records and top-level builders (2.11.5)
- Extended builder support - nested static builders extending record builders (2.11.1)

### JSpecify & Nullability (2.11.0)
- JSpecify @Nullable support in @NullMarked mode
- Improved TYPE_USE annotation handling throughout codebase
- Better support for various nullable annotation flavors
- TYPE_USE nullable annotations for arrays and elements (2.11.7)

### Lambda Builders (2.11.0)
- Style flag: attributeBuilderDetection=true
- Enables: builder.value(b -> b.a(1).c(""))
- Cleaner fluent API for nested builders

### Jackson 3 Support (2.12.0 - upcoming)

- Full Jackson 3.x serialization/deserialization support
- Maintains backward compatibility with Jackson 2.x
- Builder initializer annotations with Jackson 3

### JakartaEE Support (2.10.0)

- Style flag: jakarta=true
- Package change for annotations (javax → jakarta)
- Support for Jakarta Validator

═══════════════════════════════════════════════════════════════════════════

## PERFORMANCE & OPTIMIZATION

### Collection Optimizations (2.10.0, 2.11.2)
- JDK9 unmodifiable collections (style flag: jdk9Collections=true)
- Better initial capacity calculation for List/Set/Map/ImmutableList.Builder
- Optimized 'from' method for merging multiple supertypes
- Static mode for 'from' via Style.mergeFromSupertypesDynamically=false

### Lazy Hash Computation (2.8.1)
- Style flag: lazyhash=true
- Computes hashCode on first access (vs prehash which computes eagerly)
- Useful for memory-sensitive scenarios

═══════════════════════════════════════════════════════════════════════════

## STYLE & CUSTOMIZATION

### New Style Options
 - withUnaryOperator naming template (2.9.3)
- additionalStrictContainerConstructor=false to suppress redundant overloads (2.11.5)
- Non-strict modifiables: strictModifiables=false (2.10.0)
- Suppress 'from' method: from="" (2.10.0)
- Configure visibility as string (in addition to enum, enums might cause compilation warning if compiled classes using Style annotations are used without compile-only) (2.10.0)
 - Global jakarta/javax and guava flags (2.12.0)

### Constructor Improvements
- @Check methods working with plain public constructors @Style(of="new") (2.11.5)
- Parameterless constructor with allParameters=true when no attributes (2.11.6)
- Fixed edge cases with privateNoArgConstructor and protectedNoArgConstructor (2.11.7)

═══════════════════════════════════════════════════════════════════════════

## NEW MODULES & ANNOTATIONS

### org.immutables:datatype (2.11.1)
 - Modernized version of org.immutables:data (now deprecated)
- No Guava dependency
- Full support for records with generated builders
- Can be used as meta-annotation (2.11.4)

### Custom Immutable Annotations (2.11.4)
 - Register via annotation processor option: -Aimmutables.annotation=<fqcn>
- Supports meta-styles and custom patterns

### Builder Exposure Options (2.11.1)
- Can expose *IsSet methods on builders
- Better introspection of builder state

═══════════════════════════════════════════════════════════════════════════

## CRITERIA API ENHANCEMENTS

### Query & Repository Improvements
- Better nested element matching in MongoDB queries (2.12.0)
- Sub-collection queries for InMemory and MongoDB (2.11.0)
- Partial updates support
- Count operations at top level
- Improved type safety and DSL generation

═══════════════════════════════════════════════════════════════════════════

## NOTABLE FIXES

### Nullability & Annotations (2.11.x series)
- Fixed JSpecify Nullable with generics (2.11.7)
- Fixed fallbackNullableAnnotation on Map types (2.11.3)
- Array annotation mirrors for TYPE_USE (2.11.7)
- Custom nullable annotations no longer use qualified notation

### Jackson & Serialization
- Fixed Jackson JSON deserialization for optional types (2.11.2)
- Jackson required=false now generated for all non-mandatory attributes
- Fixed constant defaults always being applied (2.11.4)
- Pass annotation filtering fixed for multiple parent annotations (2.11.4)
- Encoding method parameter annotations forwarded (2.9.1)

### Builder & Modifiable Issues
- Fixed .unset*() for modifiable with primitive field and default value (2.11.7)
- Fixed staged builders with complex generics (2.11.6)
- Fixed toBuilder with generics (2.10.0)
- Set optBits correctly for Modifiable Default maps (2.8.1)

### Code Generation
- Fixed missing imports for classes in packages with _ (2.11.4)
- Fixed missing header/package declaration in files with no imports (2.11.3)
- Removed redundant casts in optional record wither methods (2.11.7)
- @Serial.AllStructural works as meta-annotation (2.11.4)

═══════════════════════════════════════════════════════════════════════════

## COMPATIBILITY

### JDK Support (2.9.1+)
- Full JDK 8, 11, 17, and beyond support
- Eclipse compiler support for JDK 17+
- Improved handling of sealed classes and pattern matching

### Build Tool Workarounds
- Gradle incremental compilation guidance

- Sourcepath configuration for not-yet-generated types

- Better Eclipse compiler detection

═══════════════════════════════════════════════════════════════════════════

## DEPENDENCY UPDATES (selected highlights)

- Jackson 2.8.11.3 → 2.8.11.6
- MongoDB Java Driver 3.10.1 → 3.12.3
- RxJava2 2.2.10 → 2.2.19
- Guava 30.0-jre (2.10.0)
- Project Reactor 3.2.12 → 3.3.5

═══════════════════════════════════════════════════════════════════════════

## QUALITY OF LIFE

- Bill of Materials (BoM) artifact for easier dependency management (2.9.1)
- Auto-module-name generation for JPMS (2.9.1)
- String truncation in toString for long values (2.9.1)
- Better error messages for null values in JDK Maps (2.9.1)
- Lazy hashCode field properly marked as transient when serializable (2.9.1)

 - Static start method generation (2.12.0)

═══════════════════════════════════════════════════════════════════════════

For complete details, see:
- Release notes: https://github.com/immutables/immutables/releases
- Documentation: https://immutables.github.io/
