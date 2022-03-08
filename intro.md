---
title: 'Inception'
layout: page
---

Inception
---------
Here's some background:

* Read "Item 15: Minimize mutability" [Effective Java, Second Edition](http://www.amazon.com/Effective-Java-Edition-Joshua-Bloch/dp/0321356683)
  book for a classic summary on immutability.
* See Google's attempt on this with [AutoValue](https://docs.google.com/presentation/d/14u_h-lMn7f1rXE1nDiLX0azS3IkgjGl5uxp5jGJ75RE).
* Watch ["Power Use of Value Objects" presentation](http://www.infoq.com/presentations/Value-Objects-Dan-Bergh-Johnsson) for examples of how useful value objects are.
* Watch ["Simple made easy" presentation](http://www.infoq.com/presentations/Simple-Made-Easy) about some insights on simplicity of immutability.

The _Immutables_ package has been in development since early 2012, counting from earliest prototypes.
Currently, the toolkit is being used successfully in production applications:
It is used for the development of airline inventory systems, travel deal aggregators, and other applications that take advantage of efficient in-memory storage and concurrent computations on the JVM.

[Guava](https://code.google.com/p/guava-libraries) is used as an optional utility library for the generated classes,
but in addition we employ an API style popularized by the "Effective Java, Second Edition" book and Guava Library.
Use of `null` as an attribute value is rigorously prohibited ([Using and avoiding null explained](https://github.com/google/guava/wiki/UsingAndAvoidingNullExplained)).

The _Immutables_ package does not use compiler hacks with AST transformations or companion languages: It uses annotation processing - a part of the standard Java compiler.
Classes are generated during the compilation process and are not stored in source control, but the generated sources are easily inspected if necessary.
Generated code can extend user written code, but the two are never mixed in one file!

It may seem that the use of _Immutables_ may result in some sort of [anemic domain model](http://www.martinfowler.com/bliki/AnemicDomainModel.html).
However, this impression is false - we see great benefits in the process of proper domain modelling. But we need solid building blocks — value objects,
[smart data](http://immutables.github.io/immutable.html#smart-data) objects,
and immutable values containing methods that compute other values and reduce the complexity of services and entities.

Another aspect of modelling is the representation of system state and domain entities as sequences of _events_ or _snapshots_.
Techniques such as [event sourcing](http://martinfowler.com/eaaDev/EventSourcing.html) reap the
benefits of immutable object graphs, such as allowing sub-graphs to be shared between snapshots, transformations of system states,
or even the full reconstruction of the state of a system at some point in time.
For that kind of system, we just made writing immutable objects a whole lot easier.

The _Immutables_ annotation processor is useful for increasing safety and consistency at application boundaries (as well as in internal data structures),
and creating expressive data objects for your Java API.
