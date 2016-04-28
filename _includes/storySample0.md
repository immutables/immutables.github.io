
```java
import org.immutables.value.Value;
// Define abstract value type
@Value.Immutable
public interface ValueObject {
  String name();
  List<Integer> counts();
  Optional<String> description();
}
```

```java
// Use generated immutable implementation
ValueObject valueObject =
    ImmutableValueObject.builder()
        .name("My value")
        .addCounts(1)
        .addCounts(2)
        .build();
```
