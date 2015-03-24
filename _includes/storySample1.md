```java
// Or you can configure different @Value.Style
@Value.Immutable
abstract class AbstractItem {
  abstract String getName();
  abstract Set<String> getTags();
  abstract Optional<String> getDescription();
}
```

```java
// Use generated value object
Item namelessItem = Item.builder()
    .setName("Nameless")
    .addTags("important", "relevant")
    .setDescription("Description provided")
    .build();

Item namedValue = namelessItem.withName("Named");
```
