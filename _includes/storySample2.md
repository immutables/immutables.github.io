
```java
// Define repository for collection "items".
@Value.Immutable
@Mongo.Repository("items")
public abstract class Item {
  @Mongo.Id
  public abstract long id();
  public abstract String name();
  public abstract Set<Integer> values();
  public abstract Optional<String> comment();
}
```

```java
// Create item
Item item = ImmutableItem.builder()
    .id(1)
    .name("one")
    .addValues(1, 2)
    .build();

// marshal to textual JSON
String json = Marshaling.toJson(item);
```

```js
{
  "_id" : 1,
  "name" : "one",
  "values" : [ 1, 2 ]
}
```

```java
// Instantiate generated repository
ItemRepository items = new ItemRepository(
    RepositorySetup.forUri("mongodb://localhost/test"));

// Insert async
items.insert(item); // returns future
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
