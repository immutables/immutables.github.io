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
- **Blocking / asynchronous operations** Generated repositories allow you to query data in blocking, non-blocking and [reactive](https://www.reactive-streams.org/) fashion

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
}
```

Generated `PersonCriteria` class closely follows `Person` model and allows type-safe queries. Criteria objects are immutable and can be stored as constants, serialized or otherwise safely passed around. They have methods corresponding to document attributes and relevant matchers (attribute predicates).

```java
// basic query by id
PersonCriteria.person.id.isIn("id1", "id2", "id3");

// query on Strings, Comparables and Optionals
person
    .fullName.startsWith("John") // basic string conditions
    .fullName.isEqualTo(3.1415D) // ERROR! will not compile since fullName is String (not double)
    .nickName.isAbsent() // for Optional attribute
    .or() // disjunction
    .age.isGreaterThan(21)
    .nickName.value().startsWith("Adam")
    .or()
    .not(p -> p.nickName.value().hasLength(4)); // negation

// apply specific predicate to elements of a collection
person
    .pets.none().type.isEqualTo(Pet.PetType.iguana)  // no Iguanas
    .or()
    .pets.any().name.contains("fluffy"); // person has a pet which sounds like fluffy

```

You will notice that there are no `and` statements (conjunctions) that is because criteria uses 
[Disjunctive Normal Form](https://en.wikipedia.org/wiki/Disjunctive_normal_form) (in short DNF) by default. Statements are
combined using logical `and` unless disjunction `or()` is explicitly used.

For more complex expressions, one can still combine criterias arbitrarily using `and`s / `or`s / `not`s. 
Statement like `A and (B or C)` can be written as follows:

```java
person.fullName.isEqualTo("John").and(person.age.isGreaterThan(22).or().nickName.isPresent())
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
interface Persion {
}

// query datasource and return reactive type: Flowable
Flowable<Person> persons = repository
         .find(PersonCriteria.person.age.isGreaterThan(21))
         .orderBy(PersonCriteria.person.fullName.asc())
         .offset(20)
         .limit(10)
         .fetch(); // return rxjava flowable because of RxJavaReadable facet


// unbounded stream of events using watch API (if backend supports it)
Flowable<Person> persons = repository.watcher(PersonCriteria.person.isActive.isFalse()).watch();
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
Flowable<Persion> flow = repository.watcher(PersonCriteria.person.active.isFalse()).watch();
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
### Mongo
### ElasticSearch
### Geode

