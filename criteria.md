---
title: 'Criteria'
layout: page
---

{% capture v %}2.7.4{% endcapture %}
{% capture depUri %}https://search.maven.org/artifact/org.immutables.criteria{% endcapture %}

Overview
--------

{% include important.html content="Criteria API is currently considered in preview phase. We encourage users to try it out and give feedback but reserve the right to modify its API." %}

The focus of Immutables Criteria is to provide database agnostic and efficient API for storing, querying and modifying documents expressed as immutable objects.

### Features

- **Expressive and type-safe API** Compile-type validation of the query.
- **Dynamic** Combine predicates at runtime based on some logic
- **Data-source agnostic** Define criteria once and apply to different data-sources (Map, JDBC, Mongo, Elastic etc.)
- **Blocking / asynchronous operations** Generated repositories allow querying data in blocking, non-blocking and [reactive](https://www.reactive-streams.org/) fashion

Quick Start
-----
1. Add criteria module dependency (on the top of existing immutables annotation processor)

    ```xml
    <!-- Maven dependency -->
    <dependency>
      <groupId>org.immutables</groupId>
      <artifactId>criteria-inmemory</artifactId>
      <version>2.7.4</version>
    </dependency>
    ```

2. Define a model with two annotations present `@Criteria` and `@Criteria.Repository`:

    ```java
    @Value.Immutable
    @Criteria // generate criteria
    @Criteria.Repository // means generate repository (different from @Criteria)
    interface Person {
        @Criteria.Id 
        String id();
        String fullName();
    }
    ```

3. Instantiate a backend (we'll use simple `InMemoryBackend`) and perform some CRUD operations:

    ```java
    // instantiate a backend
    final Backend backend = new InMemoryBackend();
    
    // attach repository to the backend
    final PersonRepository repository = new PersonRepository(backend);
    
    // insert some documents
    repository.insert(ImmutablePerson.builder().id("id1").fullName("John").build());
    repository.insert(ImmutablePerson.builder().id("id2").fullName("Marry").build());
    
    // query
    Person john = repository.find(PersonCriteria.person.fullName.is("John")).fetch().get(0);
    Person marry = repository.find(PersonCriteria.person.fullName.isNot("John")).fetch().get(0);
    ```

Introduction
----
Criteria module uses several abstractions which are useful to understand. Below are the most important ones:

- [Criteria](#criteria) code-generated DSL to query a model. 
- [Repository](#repository)  Data Access API to perform queries, updates, pub/sub or other operations. Uses _Backend_ and _Criteria_. 
- [Backend](#backend) adapter to a data-source (database). Uses vendor specific API and transforms queries/operations into native calls.


Criteria
-----
In order to enable criteria generation add `@Criteria` annotation to any existing immutable interface or abstract class. Criteria will be generated as a class with a `Criteria` suffix in the same package.

```java
@Value.Immutable
@Criteria // generate criteria
@Criteria.Repository // means generate repository (different from @Criteria)
interface Person {
    @Criteria.Id 
    String id();
    String fullName();
    Optional<String> nickName();  
    int age();
    List<Pet> pets();
    Optional<Friend> bestFriend();
}

@Value.Immutable
@Criteria 
interface Pet {
  enum PetType {parrot, panda, iguana, gecko}
  PetType type();
  String name();
}

@Value.Immutable
@Criteria 
interface Friend {
   String hobby();
}

```

Generated `PersonCriteria` class closely follows `Person` model and allows type-safe queries. Criteria objects are immutable and can be stored as constants, serialized or otherwise safely passed around. They have methods corresponding to document attributes and relevant matchers (attribute predicates).

```java
// basic query by id
PersonCriteria.person.id.in("id1", "id2", "id3");
PersonCriteria.person.id.notIn("bad_id");

// query on Strings, Comparables, Optionals and other Criterias
person
    .fullName.is("John") // basic equal
    .fullName.isNot("Marry") // not equal
    .fullName.endsWith("Smith") // string condition
    .fullName.is(3.1415D) // ERROR! will not compile since fullName is String (not double)
    .nickName.isPresent() // for Optional attribute
    .nickName.value().startsWith("Adam") // For Optional<String> attribute
    .pets.notEmpty() // condition on an Iterable
    .active.isTrue() // boolean
    .or() // disjunction (equivalent to logical OR)
    .age.atLeast(21) // comparable attribute
    .or()
    .not(p -> p.nickName.value().hasLength(4)); // negation on a Optional<String> attribute
    .bestFriend.value().hobby.endsWith("ing") // chaining criterias on other entities like Optional<Friend> 

// apply specific predicate to elements of a collection
person
    .pets.none().type.is(Pet.PetType.iguana)  // no Iguanas
    .or()
    .pets.any().name.contains("fluffy"); // person has a pet which sounds like fluffy
```

You will notice that there are no `and` statements (conjunctions) that is because criteria uses 
[Disjunctive Normal Form](https://en.wikipedia.org/wiki/Disjunctive_normal_form) (in short DNF) by default. Statements are
combined using logical `and` unless disjunction `or()` is explicitly used.

For more complex expressions, one can still combine criterias arbitrarily using `and`s / `or`s / `not`s. 
Statement like `A and (B or C)` can be written as follows:

```java
person.fullName.is("John").and(person.age.greaterThan(22).or().nickName.isPresent())
```

You need to add `@Criteria` to all classes to be queried. For example, to filter on `Person.pets.name`,
 `Pet` class needs to have `@Criteria` annotation (otherwise generic ObjectMatcher is used).

----
Repository
----

Repository is a User facing API to perform queries, updates, pub/sub or other CRUD operations (think data-access abstraction).
Similarly to criteria, repositories are auto-generated when `@Criteria.Repository` annotation is added to immutables class.
User has the option to customize repository generation by using facets. 

Repositories delegate all operations to the Backend (more on that later).

```java
// add insert / find / delete / watch operations which return rxjava types
@Criteria.Repository(facets = {RxJavaReadable.class, RxJavaWritable.class, RxJavaWatchable.class})
interface Person {
}

// query datasource and return reactive type: Flowable
Flowable<Person> persons = repository
         .find(PersonCriteria.person.age.atLeast(33))
         .orderBy(PersonCriteria.person.fullName.asc())
         .offset(20)
         .limit(10)
         .fetch(); // return rxjava flowable because of RxJavaReadable facet


// unbounded stream of events using watch API (if backend supports it)
Flowable<Person> persons = repository.watcher(PersonCriteria.person.active.isFalse()).watch();
```

### Facet

Facets allow fine-tuning of repository behaviour. They (mostly) serve two purposes: define a set of operations supported by repository (like
read, write, watch) and control execution model of the repository (sync / async / reactive).

Several implementatins for execution model are available out of the box:

- Synchronous. Returning List / Optional / void / etc.
- Asyncronous. Returning [CompletionStage](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletionStage.html)
- Reactive streams. Returning [Publisher](https://www.reactive-streams.org/reactive-streams-1.0.2-javadoc/org/reactivestreams/Publisher.html)
- [RxJava](https://github.com/ReactiveX/RxJava). Returning [Flowable](http://reactivex.io/RxJava/2.x/javadoc/io/reactivex/Flowable.html) / Single / Completable

### Querying
Add one of the `*Readable` facets for query operations to become available. 

Currently `Readable` allows filter / order / limit / offset operations. 

Projections and Aggregations are planned in future. 

### Inserting / Deleting

`*Writable` facet is required to enable write operations. Examples of write / delete operations:

```java
// one of RxJavaWritable / SyncWritable / AsyncWritable etc.
@Criteria.Repository(facets=RxJavaWritable.class)
interface Person {}

WriteResult result = repository.insert(person1, person2); // for sync
Single<WriteResult> result = repository.insert(person1); // for rxjava2
CompletionStage<WriteResult> result = repository.insert(person1); // for async
Publisher<WriteResult> result = repository.insert(person1); // for reactive 
repository.delete(PersonCriteria.person.active.isTrue()); // delete by query
```

### Pub/Sub (aka Watching)
Watching allows to continuously observe events on the backend in real-time. When available, it is built on the top of existing oferring like 
[change streams](https://docs.mongodb.com/manual/changeStreams) in mongo or 
[continuous querying](https://geode.apache.org/docs/guide/19/developing/continuous_querying/how_continuous_querying_works.html) in Geode.

Use `*Watchable` facet to enable this functionality on a repository.

```java
@Criteria.Repository(facets=RxJavaWatchable.class)
interface Person {}

// if remote database allows filtering in real-time
Flowable<Person> flow = repository.watcher(PersonCriteria.person.active.isFalse()).watch();
```

----
Backend
----
Backend is responsible for interpreting expressions and operations into native queries and API calls using vendor drivers. It is the adapter 
between criteria abstraction and native API.

Usually it is instantiated using vendor API (eg. MongoDatabase)

```java
Backend backend = ... // can be Mongo / Elasticsearch or any other backend

// instantiate repository using existing backend
PersonRepository repository = new PersonRepository(backend);

```

### InMemory
`InMemoryBackend` is the simplest form of backend which doesn't have any external dependencies. Internally it uses [ConcurrentMap](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ConcurrentMap.html) and reflections
to evaluate expressions and perform CRUD operations.

```java
// instantiate InMemoryBackend
Backend backend = new InMemoryBackend();
```

### Mongo
Mongo backend uses [reactive streams](https://mongodb.github.io/mongo-java-driver-reactivestreams/) driver. There is always an
option for repository to expose synchronous (or other) API by using facets.

To instantiate mongo backend use `CollectionResolver`. The later is responsible for mapping an entity class eg. `Person` to `MongoCollection<Person>`.

```java
MongoDatabase database = ... // get database
Backend backend = new MongoBackend(CollectionResolver.defaultResolver(database));
PersonRepository repository = new PersonRepository(backend);
```

#### Jackson/Bson integration
Out of box, criteria provides integration with [jackson](https://github.com/FasterXML/jackson) library. This allows
use of standard jackson binding infrastructure but still serializing documents in [BSON format](http://bsonspec.org/) (including non-JSON types like Decimal128, 
timestamp or date). Jackson (BSON) adapter will delegate calls to native [BsonReader and BsonWriter](http://mongodb.github.io/mongo-java-driver/3.9/bson/readers-and-writers/) without intermediate object transformation (eg. `BSON -> String -> POJO`) thus avoiding 
extra parsing and memory allocation.


```java
ObjectMapper mapper = new ObjectMapper()
       .registerModule(JacksonCodecs.module(new Jsr310CodecProvider())) // persist java.time. classes in native BSON type (date/timestamp)
       .registerModule(new Jdk8Module()) // used for Optional / OptionalDouble etc.
       .registerModule(new IdAnnotationModule()); // used for Criteria.Id to '_id' attribute mapping


MongoDatabase database = ... // instantiate mongo database

CodecRegistry registry = JacksonCodecs.registryFromMapper(mapper); // create registry adapter based on existing ObjectMapper
MongoBackend backend = new MongoBackend(CollectionResolver.defaultResolver(database, registry));
```

Don't forget to add `@JsonSerialize` and `@JsonDeserialize` to your model. Admittedly, number of annotations is becoming noticeable.

```java
@Value.Immutable
@Criteria
@Criteria.Repository
@JsonSerialize(as = ImmutablePerson.class)
@JsonDeserialize(as = ImmutablePerson.class)
public interface Person {}
```

### Elastic Search
`ElasticsearchBackend` leverages [low-level rest client](https://www.elastic.co/guide/en/elasticsearch/client/java-rest/current/java-rest-low.html) 
to communicate with elastic search cluster. Because of object binding and JSON parsing [Jackson](https://github.com/FasterXML/jackson) 
is currently a hard dependency of this module.

```java
RestClient client = ... // provided
ObjectMapper mapper = ... // provided

// use default resolver which maps entity (class) to index name
ElasticsearchBackend backend = new ElasticsearchBackend(client, mapper, IndexResolver.defaultResolver());
```

By default, [scrolling](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-body.html#request-body-search-scroll) is 
used for all queries unless it is an aggregation or [offset/from](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-body.html#request-body-search-from-size) request.

[Mapping types](https://www.elastic.co/guide/en/elasticsearch/reference/master/removal-of-types.html) are not supported (to be removed by vendor in 7.x).

At least version 6.2 of Elastic is recommended for criteria API. Generally we follow [EoL schedule](https://www.elastic.co/support/eol)

### Geode
`GeodeBackend` is using standard API. User needs to provide mapping between entity class and geode region (see `RegionResolver`) 

```java
GemFireCache cache = ... // provided
GeodeBackend backend = new GeodeBackend(RegionResolver.defaultResolver(cache));
```

