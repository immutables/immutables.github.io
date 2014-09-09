---
title: 'MongoDB repositories'
layout: page
---

{% capture v %}0.18{% endcapture %}
{% capture depUri %}http://search.maven.org/#artifactdetails|org.immutables{% endcapture %}

Overview
--------

There already lot of tools to access MongoDB collections [using Java](http://docs.mongodb.org/ecosystem/drivers/java/).
Each driver or wrapper has it's own distinct features and advantages. Focus of _Immutables_ repository generation
is to provide best possible API that matches well for storing documents expressed as immutable objects.

* Expressive type safe API
  + Document field names are expressed as method names, not strings. Works nice with auto-completion in IDE.
  + Operations and types should match.
* Asynchronous operations returning `Future`
  + Easily compose async operations.
  - IO is still synchronous underneath with dedicated thread pool.

One of the side goals of this project was to demonstrate that Java DSLs and APIs could be actually a lot less ugly.

Generated repositories wrap infrastructure of the official java driver, but there are couple of places where
operation handled more efficiently in _Immutables_.
Repositories employ BSON marshaling which use the same infrastructure for [JSON marshaling](/json.html) using
very good [bson4jackson](https://github.com/michel-kraemer/bson4jackson) data-format adapter.

-----
Usage
-----

### Dependencies
In addition to annotation-processor dependencies, you need to add runtime libraries.

<a name="dependencies"></a>

- [org.immutables:common:{{v}}]({{ depUri }}|common|{{ v }}|jar)
  + Compile and runtime utilities used during marshaling

_Common_ artifact specifically excludes any external dependencies (Jackson and MongoDB etc) to be picked manually.
For quick start you should rather use our _service_ artifact that combines all needed dependencies.

- [org.immutables:service:{{v}}]({{ depUri }}|service|{{ v }}|jar)
  + All needed transitive runtime dependencies 

Snippet of maven dependencies:

```xml
<dependency>
  <groupId>org.immutables</groupId>
  <artifactId>service</artifactId>
  <version>{{ v }}</version>
</dependency>
<dependency>
  <groupId>org.immutables</groupId>
  <artifactId>generate-tool</artifactId>
  <version>{{ v }}</version>
  <scope>provided</scope>
</dependency>
```

### Enable repository generation

In order to enable repository generation, put `org.immutables.annotation.GenerateRepository`
annotation on a abstract value class alongside with `org.immutables.annotation.GenerateImmutable` annotation.
Annotation `org.immutables.annotation.GenerateMarshaled` is implied and is optional in presence of `GenerateRepository`.
Repository which accesses collection of documents will be generated 
as a class with `Repository` suffix in the same package.

By default mapped collection name is derived from abstract value class name: for `UserDocument` class collection
name will be `userDocument`. However, name is customizable using `value` annotation attribute.

```java
@GenerateImmutable
@GenerateRepository("user")
public abstract class UserDocument {
  ...
}
```

### Creating repositories

Once repository class is generated, it's possible to instantiate this class using `new` operator. You need
to supply `org.immutables.common.repository.RepositorySetup` as a constructor argument. Setup could be shared by all
repositories for a single MongoDB database. `RepositorySetup` combines definition of a thread pool
and MongoDB database.

```java
MongoClient mongoClient = ...
ListeningExecutorService executor = ...

RepositorySetup setup = RepositorySetup.builder()
  .database(mongoClient.getDB("test"))
  .executor(executor)
  .build();
```

See [getting started with java driver](http://docs.mongodb.org/ecosystem/tutorial/getting-started-with-java-driver/)
for an explanation how to create `MongoClient`.

Luckily, for getting started and for simpler applications, there's an easy way to create
a setup using `RepositorySetup.forUri` factory method. Pass mongodb connection string and setup will be created
with default internal executor service.

```java
RepositorySetup setup = RepositorySetup.forUri("mongodb://localhost/test");
```

Test database on a default port on a local machine: just launch `mongod` and get up and running.

### Id attribute

Important thing is that it is **highy** recommended to have explicit `_id` field declared as attribute.

```java
@GenerateImmutable
@GenerateRepository("user")
public abstract class UserDocument {
  @GenerateMarshaled("_id")
  public abstract int id();
  ...
}
```

Identifier attribute can be of any type that is marshaled to a valid BSON type that could be used as `_id` field in MongoDB.
Java attribute name is irrelevant as long as it will be generated marshaled as `_id` (`@GenerateMarshaled("_id")`).

In some cases you may need to use special type `ObjectID` for `_id` fields. In order to do this,
_Immutables_ provides wrapper type `org.immutables.common.repository.Id`. Use static factory methods of `Id` class
to construct instances that corresponds to MongoDB' `ObjectID`.
Here's example of auto-generated identifier:

```java
@GenerateImmutable
@GenerateRepository("events")
public abstract class EventRecord {
  @GenerateMarshaled("_id")
  @GenerateDefault
  public Id id() {
    return Id.generate();
  }
  ...
}
```

----
BSON/JSON documents
----

Large portion of things needed to know to create MongoDB documents described in [JSON guide](json.html)
  
----------
Operations
----------

#### Sample document repository

```java
@GenerateImmutable
@GenerateRepository("posts")
public abstract class PostDocument {
  @GenerateMarshaled("_id")
  public abstract long id();
  public abstract String content();
  public abstract List<Integer> ratings();
  @GenerateDefault
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
Update or insert full document content by `_id` using `upsert` method 

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

If document with `_id` 10 is not found, then it will be created, otherwise updated

### Find documents

To find document you need to provide criteria object. Search criteria objects are generated to reflect fields of 
the document, empty criteria objects are obtained by using `where()` static factory method on generated repository.
Criteria objects are immutable and can be stored as constants or otherwise safely passed around.
Criteria objects has methods corresponding to document attributes and relevant constraints.

```java
Criteria where = PostDocumentRepository.where();

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

With each constraint, new immutable criteria is returned which composes constraints with the _and_ logic. Constraints
can be composed with _or_ logic by explicitly delimiting with `.or()` method,
effectively forming [DNF](http://en.wikipedia.org/wiki/Disjunctive_normal_form) consisting of constraints.

Find method returns an uncompleted operation, which is subject to configuration via `Finder` object methods,
discover these configuration methods, use them as needed, then invoke finalizing operation which returns _future_
of result.

#### Simple find methods
For convenience, there are methods to lookup by `_id` and to find all documents, these methods do not need
criteria objects.

```java
posts.findById(10).fetchFirst();

// Fetch all? Ok
posts.find().fetchAll();
```

Note that `findById` method might be named differently if your document has it attribute with name different than `id`
in Java.

### Excluding output fields
MongoDB has a feature to return a subset of fields in results. In order to preserve consistency of immutable
document objects created during unmarshaling, repository only allows to exclude optional fields such
as [collection attributes](immutable.html#collection) and [optional attributes](immutable.html#optional).
Use `exclude*` methods on `Finder` object to configure attribute exclusion.

```java
boolean isTrue =
    posts.findById(10)
        .excludeRatings()
        .fetchFirst()
        .getUnchecked()
        .ratings()
        .isEmtpy();
```

### Sorting result
Use `Finder` to specify ordering by attributes and direction. Ordering used for fetching results as well
as finding first matching object to modify.

```java
posts.find(where.contentNot("b"))
    .orderByContent()
    .orderByIdDesceding()
    .deleteFirst();

posts.find()
    .orderByContent()
    .fetchWithLimit(10);
```

### Delete documents
Looking for delete operations? Well, we found good place for them, but probably not very obvious to begin with )).
Delete operations are tailing on the same `Finder` object:

```java
posts.findById(1).deleteFirst();

int deletedDocumentsCount = posts.find(where.content(""))
    .deleteAll()
    .getUnchecked();

// Delete all? Ok
posts.find().deleteAll();
``` 

### Update and FindAndModify

Update, find and modify operations support incremental update of the documents matching a criteria.
Incremental update operations used to update particular fields. Also some fields may need to be initialized
if document is to be created via upsert operation.

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

### Ensure Index
If you want to ensure indexes using code rather than administrative tools,
you can use `Indexer` object, which ensures index with particular fields. See the methods of `Indexer` object.

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