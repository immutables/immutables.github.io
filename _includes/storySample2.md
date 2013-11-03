
```java
// Define repository for collection "items"
@GenerateImmutable
@GenerateRepository("items")
public abstract class Item {
  @GenerateMarshaled("_id")
  public abstract long id();
  public abstract String name();
  public abstract Set<Integer> numbers();
  public abstract Optional<String> optional();
}
```
```java
// Instantiate generated repository
ItemRepository items = ItemRepository.create(
    RepositorySetup.forUri("mongodb://localhost/test"));

// Insert async
items.insert(ImmutableItem.builder()
    .id(1)
    .name("one")
    .addNumbers(2)
    .build());
```
```java
// Find and modify!
Optional<Item> modifiedItem = items.findById(1)
    .andModifyFirst()
    .addNumbers(1)
    .setOptional("present")
    .returnNew()
    .update()
    .getUnchecked();

```
```java
// Update all matching documents
items.update(
    ItemRepository.where()
        .idIn(1, 2, 3)
        .nameNot("Nameless")
        .numbersNonEmpty())
    .clearOptional()
    .updateAll();

```
