---
title: 'MongoDB repositories'
layout: page
---

{% capture v %}2.7.0{% endcapture %}
{% capture depUri %}http://search.maven.org/artifact/org.immutables{% endcapture %}

Overview
--------
There are already a lot of tools to access MongoDB collections [using Java](http://docs.mongodb.org/ecosystem/drivers/java/).
Each driver or wrapper has it's own distinct features and advantages. The focus of _Immutables_ repository generation
is to provide the best possible API that matches well for storing documents expressed as immutable objects.

* Expressive type safe API
  + Document field names are expressed as method names, not strings. Works nicely with auto-completion in IDE.
  + Operations and types should match.
* Asynchronous operations returning `Future`
  + Compose async operations.
  - IO is still synchronous underneath with dedicated thread pool.

One of the side goals of this module was to demonstrate that Java DSLs and APIs could be actually a lot less ugly than they usually are.

Generated repositories wrap the infrastructure of the official Java driver, but there are couple of places where operations are handled more efficiently in _Immutables_.
Repositories employ BSON marshaling which uses the same infrastructure for [JSON marshaling](/json.html) using the excellent [bson4jackson](https://github.com/michel-kraemer/bson4jackson) data-format adapter.

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

// Instantiate generated repository
ItemRepository items = new ItemRepository(
    RepositorySetup.forUri("mongodb://localhost/test"));

// Create item
Item item = ImmutableItem.builder()
    .id(1)
    .name("one")
    .addValues(1, 2)
    .build();

// Insert async
items.insert(item); // returns future

Optional<Item> modifiedItem = items.findById(1)
    .andModifyFirst() // findAndModify
    .addValues(1) // $addToSet
    .setComment("present") // $set
    .returningNew()
    .update() // returns future
    .getUnchecked();

// Update all matching documents
items.update(
    ItemRepository.criteria()
        .idIn(1, 2, 3)
        .nameNot("Nameless")
        .valuesNonEmpty())
    .clearComment()
    .updateAll();

```

Usage
-----

### Dependencies

In addition to code annotation-processor, it's necessary to add the `mongo` annotation module and runtime library, including some required transitive dependencies.

<a name="dependencies"></a>

- [org.immutables:mongo:{{v}}]({{ depUri }}/mongo/{{ v }}/jar)
  + Compile and runtime utilities used during marshaling

_Mongo_ artifact required to be used for compilation as well be available at runtime.
_Mongo_ module works closely with [Gson](/json.html#gson) module, which is also included as transitive dependency.


Snippet of Maven dependencies:

```xml
<dependency>
  <groupId>org.immutables</groupId>
  <artifactId>value</artifactId>
  <version>{{ v }}</version>
  <scope>provided</scope>
</dependency>
<dependency>
  <groupId>org.immutables</groupId>
  <artifactId>mongo</artifactId>
  <version>{{ v }}</version>
</dependency>
```

### Enable repository generation

In order to enable repository generation, put an `org.immutables.mongo.Mongo.Repository`
annotation on a abstract value class alongside an `org.immutables.value.Value.Immutable` annotation.
A repository which accesses a collection of documents will be generated
as a class with a `Repository` suffix in the same package.

By default, the mapped collection name is derived from abstract value class name: For a
`UserDocument` class, the collection name will be `userDocument`. However, the name is customizable
using a `value` annotation attribute:

```java
import org.immutables.mongo.Mongo;
import org.immutables.value.Value;

@Value.Immutable
@Gson.TypeAdapters // you can put TypeAdapters on a package instead
@Mongo.Repository("user")
public abstract class UserDocument {
  ...
}
```

### Creating repositories

Once the repository class is generated, it's possible to instantiate this class using the `new`
operator. You need to supply a `org.immutables.common.repository.RepositorySetup` as a
constructor argument. Setup can be shared by all repositories for a single MongoDB
database. `RepositorySetup` combines the definition of a thread pool, MongoDB database,
and a configured `com.google.gson.Gson` instance.

Luckily, to get started (and for simpler applications), there's an easy way to create a setup
using `RepositorySetup.forUri` factory method. Pass a MongoDB connection string and a setup
will be created with default settings.

```java
RepositorySetup setup = RepositorySetup.forUri("mongodb://localhost/test");
```

To get a test database running on the default port on a local machine, just launch `mongod`.

To fully customize setting use `RepositorySetup` builder:

```java
MongoClient mongoClient = ...
ListeningExecutorService executor = ...
GsonBuilder gsonBuilder = new GsonBuilder();
...

RepositorySetup setup = RepositorySetup.builder()
  .database(mongoClient.getDB("test"))
  .executor(executor)
  .gson(gsonBuilder.create())
  .build();
```

See [getting started with java driver](http://docs.mongodb.org/ecosystem/tutorial/getting-started-with-java-driver/) for an explanation how to create a `MongoClient`.

### Id attribute

It is highly recommended to have explicit `_id` field for MongoDB documents. Use the `@Mongo.Id`
annotation to declare an `id` attribute. The `@Mongo.Id` annotation acts as an alias to
`@Gson.Named("_id")`, which can also be used.

```java
@Value.Immutable
@Gson.TypeAdapters
@Mongo.Repository("user")
public abstract class UserDocument {
  @Mongo.Id
  public abstract int id();
  ...
}
```

An identifier attribute can be of any type that is marshaled to a valid BSON type that can
be used as `_id` field in MongoDB. The Java attribute name is irrelevant as long as it will be
generated marshaled as `_id` (annotated with `@Gson.Named("_id")` or `@Mongo.Id`).

In some cases you may need to use special type `ObjectID` for `_id` or other fields. In order to
do this, _Immutables_ provides the wrapper type `org.immutables.mongo.types.Id`. Use the static
factory methods of `org.immutables.mongo.types.Id` class to construct instances that correspond
to MongoDB' `ObjectID`. Here's example of an auto-generated identifier:

```java
import org.immutables.value.Value;
import org.immutables.gson.Gson;
import org.immutables.mongo.Mongo;
import org.immutables.mongo.types.Id;

@Value.Immutable
@Gson.TypeAdapters
@Mongo.Repository("events")
public abstract class EventRecord {
  @Mongo.Id
  @Value.Default
  public Id id() {
    return Id.generate();
  }
  ...
}
```

----
BSON/JSON documents
----

All values used to model documents should have GSON type adapters registered. Use
`@Gson.TypeAdapters` on types or packages to generate type adapters for enclosed value types. When
using `RepositorySetup.forUri`, all type adapters will be auto-registered from the classpath. When
using custom `RepositorySetup`, register type adapters on a `Gson` instance using `GsonBuilder`
as shown in [GSON guide](json.html#adapter-registration).

A large portion of the things you need to know to create MongoDB mapped documents is described in
[GSON guide](json.html#gson)

----------
Operations
----------

#### Sample document repository

```java
@Value.Immutable
@Gson.TypeAdapters
@Mongo.Repository("posts")
public abstract class PostDocument {
  @Mongo.Id
  public abstract long id();
  public abstract String content();
  public abstract List<Integer> ratings();
  @Value.Default
  public int version() {
    return 0;
  }
}

// Instantiate generated repository
PostDocumentRepository posts = new PostDocumentRepository(
    RepositorySetup.forUri("mongodb://localhost/test"));

```

### Insert documents
Insert single or iterable of documents using `insert` methods.

``` java
posts.insert(
    ImmutablePostDocument.builder()
        .id(1)
        .content("a")
        .build());

posts.insert(
    ImmutableList.of(
        ImmutablePostDocument.builder()
            .id(2)
            .content("b")
            .build(),
        ImmutablePostDocument.builder()
            .id(3)
            .content("c")
            .build(),
        ImmutablePostDocument.builder()
            .id(4)
            .content("d")
            .build()));
```

### Upsert document

Update or insert full document content by `_id` using the `upsert` method:

```java
posts.upsert(
    ImmutablePostDocument.builder()
        .id(1)
        .content("a1")
        .build());

posts.upsert(
    ImmutablePostDocument.builder()
        .id(10)
        .content("!!!")
        .addRatings(2)
        .build());

```

If document with `_id` 10 is not found, then it will be created, otherwise updated.

### Find documents

To find a document, you need to provide criteria object. Search criteria objects are generated to reflect fields of
the document. Empty criteria objects are obtained by using the `criteria()` static factory method on a generated repository.
Criteria objects are immutable and can be stored as constants or otherwise safely passed around.
Criteria objects have methods corresponding to document attributes and relevant constraints.

```java
Criteria where = posts.criteria();

List<PostDocument> documents =
    posts.find(where.contentStartsWith("a"))
        .fetchAll()
        .getUnchecked();

Optional<PostDocument> document =
    posts.find(
        where.content("!!!")
            .ratingsNonEmpty())
        .fetchFirst()
        .getUnchecked();

List<PostDocument> limited =
    posts.find(
        where.contentStartsWith("a")
            .or()
            .contentStartsWith("b"))
        .orderById()
        .skip(5)
        .fetchWithLimit(10)
        .getUnchecked();
```

With each constraint, a new immutable criteria is returned which composes constraints with the _and_ logic. Constraints
can be composed with _or_ logic by explicitly delimiting with `.or()` method,
effectively forming [DNF](http://en.wikipedia.org/wiki/Disjunctive_normal_form) consisting of constraints.

The `find` method returns an uncompleted operation, which is subject to configuration via `Finder` object methods,
discover these configuration methods, use them as needed, then invoke finalizing operation which returns _future_
of result.

#### Simple find methods

For convenience, there are methods to lookup by `_id` and to find all documents. These methods do not need criteria objects.

```java
posts.findById(10).fetchFirst();

// Fetch all? Ok
posts.findAll().fetchAll();
```

Note that `findById` method might be named differently if your document has its attribute with a name other than `id`
in Java.

### Excluding output fields

MongoDB has a feature to return a subset of fields in results. In order to preserve the consistency of immutable
document objects created during unmarshaling, a repository only allows the exclusion of optional fields such
as [collection attributes](immutable.html#collection) and [optional attributes](immutable.html#optional).
Use `exclude*` methods on `Finder` objects to configure attribute exclusion.

```java
boolean isTrue =
    posts.findById(10)
        .excludeRatings()
        .fetchFirst()
        .getUnchecked()
        .ratings()
        .isEmpty();
```

### Sorting result

Use `Finder` to specify ordering by attributes and direction. Ordering is used for fetching results as well
as finding the first matching object to modify.

```java
posts.find(where.contentNot("b"))
    .orderByContent()
    .orderByIdDesceding()
    .deleteFirst();

posts.findAll()
    .orderByContent()
    .fetchWithLimit(10);
```

### Delete documents

Looking for delete operations? Well, we found good place for them, but probably not a very obvious one!

Delete operations are defined on the same `Finder` object:

```java
posts.findById(1).deleteFirst();

int deletedDocumentsCount = posts.find(where.content(""))
    .deleteAll()
    .getUnchecked();

// Delete all? Ok
posts.findAll().deleteAll();
```

### Update and FindAndModify

Update, find, and modify operations support incremental updates of the documents matching a criteria.
Incremental update operations are used to update particular fields. Some fields may need to be initialized
if a document is to be created via upsert operation.

```java
Optional<PostDocument> updatedDocument =
    posts.findById(2)
        .andModifyFirst()
        .addRatings(5)
        .setContent("bbb")
        .returningNew()
        .update()
        .getUnchecked();

posts.update(where.ratingsEmpty())
    .addRatings(3)
    .updateAll();

posts.findById(111)
    .andModifyFirst()
    .incrementVersion(1)
    .initContent("2")
    .addRatings(5)
    .upsert();
```

### Read-only repositories
For usecases when only read operations are required one can customize repository generation with `readonly` annotation parameter.
When set to `true` (it is `false` by default) write, delete and update methods will not be available:

```java
@Value.Immutable
@Mongo.Repository(readonly = true) // don't generate any write / delete / update methods
public abstract class Item {
  // ...
}
```

To omit indexing operations use `index = false` parameter (indexing is enabled by default).

### Ensure Index

If you want to ensure indices using code rather than the administrative tools,
you can use an `Indexer` object, which ensures indexing with particular fields.
See the methods of `Indexer` object.

```java

// Compound index on content and ratings
posts.index()
    .withContent()
    .withRatings()
    .ensure();

// Reversed index on content
posts.index()
    .withContentDesceding()
    .ensure();
```
