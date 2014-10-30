
```java
import org.immutables.value.Value.Immutable;

// Define abstract value type
@Value.Immutable
public interface ValueObject {
  String name();
  List<Integer> counts();
  Optional<String> description();
}
```

```java
// And use generated immutable implementation

ValueObject valueObject =
    ImmutableValueObject.builder()
        .name("Nameless")
        .description("present")
        .addCounts(1)
        .addCounts(2)
        .build();
```
