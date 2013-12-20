
```java
import org.immutables.annotation.GenerateImmutable;

// Define abstract value class

@GenerateImmutable
public abstract class ValueObject {
  public abstract String name();
  public abstract List<Integer> counts();
  public abstract Optional<String> description();
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
