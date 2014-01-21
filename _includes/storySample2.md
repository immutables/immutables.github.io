
```java
// Define repository for collection "items"
@GenerateImmutable
@GenerateRepository("items")
public abstract class Item {
  @GenerateMarshaled("_id")
  public abstract long id();
  public abstract String name();
  public abstract Set<Integer> values();
  public abstract Optional<String> comment();
}
```
```java
// Instantiate generated repository
ItemRepository items = new ItemRepository(
    RepositorySetup.forUri("mongodb://localhost/test"));

// Insert async
items.insert(ImmutableItem.builder()
    .id(1)
    .name("one")
    .addValues(2)
    .build());
```
```java
Optional<Item> modifiedItem = items.findById(1)
    .andModifyFirst() // findAndModify
    .addValues(1) // $addToSet
    .setComment("present") // $set
    .returningNew()
    .update() // returns future
    .getUnchecked();

```
```java
// Update all matching documents
items.update(
    ItemRepository.where()
        .idIn(1, 2, 3)
        .nameNot("Nameless")
        .valuesNonEmpty())
    .clearComment()
    .updateAll();

```
