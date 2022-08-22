---
title: 'Criteria'
layout: page
---

Overview
--------

The focus of Immutables Criteria is to provide database agnostic and efficient API for storing, querying and modifying documents expressed as immutable objects.

### Features

- **Expressive and type-safe API** Compile-type validation of the query
- **Dynamic** Combine predicates at runtime based on some logic
- **Data-source agnostic** Define criteria once and apply to different data-sources (Map, JDBC, Mongo, Elastic etc.)
- **Blocking / asynchronous operations** Generated repositories allow querying data in blocking, non-blocking and [reactive](https://www.reactive-streams.org/) fashion

### Requirements
Criteria API requires JDK 8 (or later) plus backend specific dependencies (like mongo java driver).

Quick Start
-----
1) Add criteria module dependency (on the top of [existing](getstarted.html) immutables annotation processor)

```xml
<!-- Maven dependency -->
<dependency>
  <groupId>org.immutables</groupId>
  <artifactId>criteria-inmemory</artifactId>
  <version>{{site.v}}</version>
</dependency>
```

or gradle

```groovy
// Gradle dependecy
dependencies {
   implementation 'org.immutables:criteria-inmemory:{{site.v}}'
}
```

2) Define a model with two annotations present `@Criteria` and `@Criteria.Repository`:

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

3) Instantiate a backend (we'll use simple `InMemoryBackend`) and perform some CRUD operations:

```java
// instantiate a backend
Backend backend = new InMemoryBackend();

// attach repository to the backend
PersonRepository repository = new PersonRepository(backend);

// insert some documents
repository.insert(ImmutablePerson.builder().id("id1").fullName("John").build());
repository.insert(ImmutablePerson.builder().id("id2").fullName("Mary").build());

// query
Person john = repository.find(PersonCriteria.person.fullName.is("John")).fetch().get(0);
Person mary = repository.find(PersonCriteria.person.fullName.isNot("John")).fetch().get(0);
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
    .fullName.isNot("Mary") // not equal
    .fullName.endsWith("Smith") // string condition
    .fullName.is(3.1415D) // ERROR! will not compile since fullName is String (not double)
    .nickName.isPresent() // for Optional attribute
    .nickName.startsWith("Adam") // special matcher Optional<String> which is intersetion type between OptionalMatcher and StringMatcher
    .pets.notEmpty() // condition on an Iterable
    .active.isTrue() // boolean
    .or() // disjunction (equivalent to logical OR)
    .age.atLeast(21) // comparable attribute
    .or()
    .not(p -> p.nickName.hasLength(4)); // negation on a Optional<String> attribute
    .bestFriend.value().hobby.endsWith("ing") // chaining criterias on other entities like Optional<Friend>

// apply specific predicate to elements of a collection
person
    .pets.none().type.is(Pet.PetType.iguana)  // no Iguanas
    .or()
    .pets.any().name.contains("fluffy"); // person has a pet which sounds like fluffy
```

You will need to add `@Criteria` to all classes to be queried. For example, to filter on `Person.pets.name`,
 `Pet` class needs to have `@Criteria` annotation (otherwise generic `ObjectMatcher` is used).

### Query DSL Syntax

In the previous query example you will notice that there are no `and` statements (conjunctions) that is because criteria uses
[Disjunctive Normal Form](https://en.wikipedia.org/wiki/Disjunctive_normal_form) (in short DNF). By default, statements are
combined using logical `and` ([conjunction](https://en.wikipedia.org/wiki/Logical_conjunction)) unless `or` ([disjunction](https://en.wikipedia.org/wiki/Logical_disjunction)) is explicitly used.

```java
// Some examples of Query DSL
// left side (DSL) // right side SQL equivalent
.fullName.is("John") // fullName = 'John'
.fullName.is("John").age.greaterThan(21) // fullName = 'John' AND age > 21
.fullName.is("John").age.greaterThan(21).nickName.isPresent() // fullName = 'John' AND age > 21 AND nickName != null
.fullName.is("John").or().fullName.is("Mary") // fullName = 'John' OR fullName = 'Mary'
.fullName.is("John").age.greaterThan(21)
    .or()
    .fullName.is("Mary") // (fullName = 'John' AND age > 21) OR fullName = 'Mary'
.fullName.is("John").age.greaterThan(21)
   .or()
   .fullName.is("Mary").age.greaterThan(22) // (fullName = 'John' AND age > 21) OR (fullName = 'Mary' AND age > 22)
```

#### More complex logical expressions
For more complex expressions, one can still combine criterias using `and`s / `or`s / `not`s. Boolean algebra methods
allow composition of existing criterias with each other using `and` / `or`  / `not` logic.

```java
// fullName = 'John' AND (age > 22 OR nickName != null)
person.fullName.is("John").and(person.age.greaterThan(22).or().nickName.isPresent())
```

Since criteria objects are immutable one can safely pass them as variables, constants or function arguments.

```java
PersonCriteria crit = PersonCriteria.person;
drinkingAge = crit.age.atLeast(21);
hasNickname = crit.nickName.isPresent()
isActive = crit.isActive.isTrue();

// ...
// (age > 21 OR nickName != null) AND isActive = true
return drinkingAge.or(hasNickname).and(isActive);
```

### Repository

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

By default, table (collection, index etc.) name is derived from simple class name (`MyClass` resolves to `myClass` table). It is possible to override this behaviour using annotation (`@Criteria.Repository(name ="custom")`) as well as
 by registring custom name resolution strategy (see [ContainerNaming](https://github.com/immutables/immutables/blob/master/criteria/common/src/org/immutables/criteria/backend/ContainerNaming.java) interface). The later is done during backend instantiation.

### Facet

Facets allow fine-tuning of repository behaviour. They (mostly) serve two purposes: define a set of operations supported by repository (like
read, write, watch) and control execution model of the repository (sync / async / reactive).

Several implementatins for execution model are available out of the box:

- Reactive streams. Returning [Publisher](https://www.reactive-streams.org/reactive-streams-1.0.2-javadoc/org/reactivestreams/Publisher.html)
- Synchronous. Returning List / Optional / void / etc.
- Asyncronous. Returning [CompletionStage](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletionStage.html)
- [RxJava](https://github.com/ReactiveX/RxJava). Returning [Flowable](http://reactivex.io/RxJava/2.x/javadoc/io/reactivex/Flowable.html) / [Single](http://reactivex.io/RxJava/javadoc/io/reactivex/Single.html) / [Maybe](http://reactivex.io/RxJava/javadoc/io/reactivex/Maybe.html).
- [Project Reactor](https://projectreactor.io). Returning [Flux](https://projectreactor.io/docs/core/release/api/reactor/core/publisher/Flux.html) / [Mono](https://projectreactor.io/docs/core/release/api/reactor/core/publisher/Mono.html).


### Querying
Add one of the `*Readable` facets for query operations to become available.

Currently `Readable` allows filter / select / order / limit / offset operations.

#### Projections

Use `select` operation to reduce number of attributes returned by the backend. The concept is similar to [projection](https://en.wikipedia.org/wiki/Projection_(relational_algebra))
in relational algebra.

To preserve type-safety, basic projection requires a mapping function. Mapping function argument types match individual types of the projection(s) in `select` operation (eg. `Optional<String>`).
One can pass lambda function or method reference to transform incoming value(s). Currently mapping function can have up to 5 arguments. If projection on more than 5 fields is necessary use `Tuple` (see below).

```java
List<String> list = repository
   .find(person.age.atLeast(33))
   .select(person.nickName, person.age) // project two fields of person: nickName and age
   .map((nickName, age) -> nickName.orElse(null) + " " + (age - 10)) // map operator required after projection. Note that nickName is Optional<String> and age is of type Integer
   //.map((nickName, age) -> NickNameAndAge::new) // alternative with method reference
   .fetch();
```

When list of attributes is unknown at compile time or when default mapping function can't be used (eg. due to number of arguments threshold) use generic `Tuple` in projection. `select(Iterable)` method overload will return `Tuple`.

```java
List<Projection<?>> projections = ....; // build list of projections
List<String> list = repository
   .find(person.age.atLeast(33))
   .select(Arrays.asList(person.nickName, person.age)) // select(Iterable) method overload
   .map(tuple -> tuple.get(person.nickName).orElse(null) + (tuple.get(person.age) - 10)) // using single argument mapper with Tuple API
   .fetch();
```

When possible, prefer using basic `select` variant of projection (as opposed to `Tuple`) since it enforces type-safety.


#### Aggregations

Standard aggregations like `count` / `min` / `max` / `sum` / `avg` on specific attributes are also supported. Aggregation is a projection combined with `groupBy()` operator.

`count` operator is available on all types. For `min` / `max` attribute needs to be of type [Comparable](https://docs.oracle.com/javase/8/docs/api/java/lang/Comparable.html). For `sum` / `avg` attribute needs to be of type [Number](https://docs.oracle.com/javase/8/docs/api/java/lang/Number.html).

```java
List<String> list = repository.findAll()
  .orderBy(person.nickName.desc())
  .groupBy(person.nickName)
  .select(person.nickName, person.age.max(), person.age.min(), person.age.count(), person.age.sum())
  .map((nickName, max, min, count, sum) -> ("nick=" + nickName.orElse(null) + " max=" + max + " min=" + min + " count=" + count + " sum=" + sum)))
  .fetch();
```

#### Distinct / Limit / Offset
To reduce number of returned elements use `limit / offset` statements (eg. for pagination). When using projections you can also request result to be de-duplicated with `distinct` keyword (note: distinct is available
only after projection).

```java
repository.find(persion.active.isTrue())
    .orderBy(person.fullName.asc())
    .select(person.fullName)
    .distinct()
    .limit(10)
    .offset(10)
    .fetch();
```

#### Fetching Variations

Common way to return all results is to use `fetch()` function, however typical [Fetcher](https://github.com/immutables/immutables/blob/master/criteria/common/src/org/immutables/criteria/repository/sync/SyncFetcher.java) has a richer API.

Use `fetch()` when you want to return full result set (which can have zero, one or multiple elements):

```java
// get all results (size of the result can be 0, 1, 2 or more)
List<Person> result = repository.find(person.age.atLeast(33)).limit(10).fetch();
```

Use `one()` when you expect *exactly one* element in the result set. Conveniently, the method will return only that element. Exception is thrown (usually with query information) when there is zero, two
or more elements. Depending on the facet, method will return [Single](http://reactivex.io/RxJava/javadoc/io/reactivex/Single.html) or [CompletionStage<T>](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletionStage.html):

```java
// throw exception if there is no exactly one match
// may return Single / CompletionStage depending on the facet
Person person = repository.find(person.fullName.is("John Doe")).one();
```

Use `oneOrNone()` when you require *at most one* element in the result set. Depending on facet sync / rxjava / async etc. the return type will be [Optional](https://docs.oracle.com/javase/8/docs/api/java/util/Optional.html) / [Maybe](http://reactivex.io/RxJava/javadoc/io/reactivex/Maybe.html) or [CompletionStage<Optional>](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletionStage.html):

```java
// may return Maybe / CompletionStage<Optional> depending on facet
Optional<Person> maybeOne = repository.find(person.fullName.is("John Doe2")).oneOrNone();
```

Use `exists()` when you need to check if criteria filter matches any records.

```java
// may return Single<Boolean> / CompletionStage<Boolean> depending on the facet
boolean exists = repository.find(person.active.isTrue().fullName.is("John Doe3")).exists();
```

Simple result-set counting can be achieved using `count()` operator. This operator is considered a terminal operator similar to `fetch()` and will return `long` / `Mono<Long>` / `Single<Long>` / `Future<Long>` types depending on facet used.

```java
// count all records (assumes RxJava facet)
Single<Long> count = repository.findAll().count();
// or apply a filter before count
Single<Long> count = repository.find(person.age.greaterThan(33)).count();
```

### Inserting / Updating / Deleting

`*Writable` facet is required to enable write operations. Examples of write / delete operations:

```java
// one of RxJavaWritable / SyncWritable / AsyncWritable etc.
@Criteria.Repository(facets=RxJavaWritable.class)
interface Person {}

WriteResult result = repository.insertAll(Arrays.asList(person1, person2)); // for sync
Single<WriteResult> result = repository.insert(person1); // for rxjava2
CompletionStage<WriteResult> result = repository.insert(person1); // for async
Publisher<WriteResult> result = repository.insert(person1); // for reactive
repository.delete(PersonCriteria.person.active.isTrue()); // delete by query
```

#### In-place updates by query
If supported by back-end, one can also perform in-place updates by query:

```java
repository.update(person.id.is(123))
            .set(person.fullName, "Changed Name")
            .set(peson.age, 33)
            .execute();
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

### Custom Repositories
While `@Criteria.Repository` will auto-generate repository class based on facets, one can also write repository implementation manually. Facets are just
classes which can be leveraged to compose functionality.

```java
public class MyCustomRepository implements Repository<Person> {
   private final RxJavaReadable<Person> readable;

   public MyCustomRepository(Backend backend) {
     // open backend session for Person class
     Backend.Session session = backend.open(Person.class);
     this.readable = new RxJavaReadable(session);
   }

   public Flowable<Person> findPeopleOlderThan(Period period) {
     PersonCriteria criteria = PersonCriteria.person.dateOfBirth.atMost(LocalDate.now().minus(period));
     return readable.find(criteria).fetch();
   }
}
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
MongoDatabase database = ... // get database (with correct CodecRegistry)
MongoBackend backend = new MongoBackend(MongoSetup.of(database));
PersonRepository repository = new PersonRepository(backend);
```

#### Jackson/Bson integration
Out of box, criteria provides integration with [jackson](https://github.com/FasterXML/jackson) library. This allows
use of standard jackson binding infrastructure but still serializing documents in [BSON format](http://bsonspec.org/) (including non-JSON types like Decimal128,
timestamp or date). Jackson (BSON) adapter will delegate calls to native [BsonReader and BsonWriter](http://mongodb.github.io/mongo-java-driver/3.9/bson/readers-and-writers/) without intermediate object transformation (eg. `BSON -> String -> POJO`) thus avoiding
extra parsing and memory allocation.


```java
ObjectMapper mapper = new ObjectMapper()
       .registerModule(new BsonModule())  // register default codecs like Jsr310, BsonValueCodec, ValueCodecProvider etc.
       .registerModule(new GuavaModule()) // for Immutable* classes from Guava (eg. ImmutableList)
       .registerModule(new Jdk8Module()) // used for java 8 types like Optional / OptionalDouble etc.
       .registerModule(new IdAnnotationModule()); // used for Criteria.Id to '_id' attribute mapping

CodecRegistry registry = JacksonCodecs.registryFromMapper(mapper); // create CodecRegistry (adapter) from ObjectMapper

MongoClient client = ... // "connect" / get client
MongoDatabase database = client.getDatabase("myDB").withCodecRegistry(registry); // override with "jackson" CodecRegistry
MongoBackend backend = new MongoBackend(MongoSetup.of(database)); // create backend instance
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
RestClient restClient = ... // provided

// use default resolver which maps entity (class) to index name
ElasticsearchBackend backend = new ElasticsearchBackend(ElasticsearchSetup.of(restClient));
```

The only required depedency of `ElasticsearchSetup` is [RestClient](https://www.elastic.co/guide/en/elasticsearch/client/java-rest/master/java-rest-low.html) however you can also override default instances  
of `ObjectMapper`, `scrollSize`, `indexResolver` etc.

By default, [scrolling](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-body.html#request-body-search-scroll) is
used for all queries unless it is an aggregation or [offset/from](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-body.html#request-body-search-from-size) request.

[Mapping types](https://www.elastic.co/guide/en/elasticsearch/reference/master/removal-of-types.html) are not supported (to be removed by vendor in 7.x).

At least version 6.2 of Elastic is recommended for criteria API. Generally we follow official [EoL schedule](https://www.elastic.co/support/eol)

### Geode
The only required dependency of `GeodeBackend` is [GemFireCache](https://geode.apache.org/releases/latest/javadoc/org/apache/geode/cache/GemFireCache.html). Below is an example of how to instantiate `GeodeBackend`.

```java
GemFireCache cache = ... // provided
GeodeBackend backend = new GeodeBackend(GeodeSetup.of(cache));
```


----
JavaBeans
----

Limited support for [JavaBeans](https://en.wikipedia.org/wiki/JavaBeans) is provided.
It is intended for projects which may want to leverage criteria (runtime and DSL) as data access layer but are not yet fully migrated to immutables model.
You may be able to generate Criteria DSL assuming your class follows [JavaBeans spec](https://www.oracle.com/technetwork/articles/javaee/spec-136004.html).

Requirements for JavaBean classes:

1. Has to be non-abstract and not an enum.
2. Both getters (`get*` / `is*`) and setters (`set*`) should be present for the same attribute.
3. Class should have a (non-static) field derived from getter/setter. Example `name` for `getName/setName`, `URL` for `getURL/setURL`, `a` for `getA/setA`
For more details see _8.8 Capitalization of inferred names_ in JavaBeans spec

Just annotate your existing bean with `@Criteria` and immutables will generate Criteria DSL for it.

```java
// Example of a valid JavaBean
@Criteria
public class MyBean {
  private String name;

  public String getName() { return name; }

  public void setName(String name) { this.name = name; }

}
```

Note that all attributes are considered nullable by default in JavaBean model.
