
```java
import org.immutables.annotation.GenerateImmutable;

// Define abstract value class

@GenerateImmutable
public abstract class ValueObject {
  public abstract String name();
  public abstract List<Integer> numbers();
  public abstract Optional<String> optional();
}
```

```java
// And use generated immutable implementation

ValueObject valueObject =
    ImmutableValueObject.builder()
        .name("Nameless")
        .optional("present")
        .addNumbers(1)
        .addNumbers(2)
        .build();
```
