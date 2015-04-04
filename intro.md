---
title: 'Inception'
layout: page
---

Inception
---------
Here's some background

* Read "Item 15: Minimize mutability" [Effective Java, Second Edition](http://www.amazon.com/Effective-Java-Edition-Joshua-Bloch/dp/0321356683)
  book for classic summary on immutability.
* See Google's attempt on this with [AutoValue](https://docs.google.com/presentation/d/14u_h-lMn7f1rXE1nDiLX0azS3IkgjGl5uxp5jGJ75RE).
* Watch ["Power Use of Value Objects" presentation](http://www.infoq.com/presentations/Value-Objects-Dan-Bergh-Johnsson) for examples of how useful value objects are.
* Watch ["Simple made easy" presentation](http://www.infoq.com/presentations/Simple-Made-Easy) about some insights on simplicity of immutability.

_Immutables_ have been in development since early 2012 counting from earliest prototypes.
Currently, toolkit is being successfully used in production applications:
it's used for development of airline inventory systems, travel deal aggregators and other application that take advantages of efficient in-memory storage and concurrent computations on JVM.

[Guava](https://code.google.com/p/guava-libraries) is used as utility library for generated classes,
but in addition we employ API style popularized by "Effective Java, Second Edition" book and Guava Library.
Usage of `null` as attribute values is rigorously prohibited ([Using and avoiding null explained](https://code.google.com/p/guava-libraries/wiki/UsingAndAvoidingNullExplained)).

The solution do not require compiler hacks with AST transformation or companion languages. Annotation processing is a part of standard Java compiler. Classes are being generated during compilation are not stored in source control, however, generated sources are easily inspectable if needed. Generated code extends user written code, but never mixed in one file!

It may seem that usage _Immutables_ may result in some sort of [anemic domain model](http://www.martinfowler.com/bliki/AnemicDomainModel.html),
however, this impression is false and we see great benefits of proper domain modelling. But we need solid building blocks — value objects,
a [smart data](http://immutables.github.com/immutable.html#smart-data) objects,
immutable values that have methods that compute other values and reduce complexity of services and entities.
Other aspect of modelling is representation of system state and domain entities as sequences of _events_ or _snapshots_.
The techniques like [event sourcing](http://martinfowler.com/eaaDev/EventSourcing.html) employs
benefits of immutable object graphs, allow sub-graphs to be shared between snapshots, transform system states,
or even reconstruct full system state at some point in time.
For that kind of systems we just made writing immutable objects a whole lot easier. 

Immutables annotation processor may be very useful if you wish to increase safety and consistency at application boundaries as well as in internal data structures,
create expressive data objects for your java API.
