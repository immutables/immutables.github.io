---
title: 'When not to use org.immutables?'
layout: page
---
## Just for fun!
####  One should not use _org.immutables_ if one of the following is true

- Convinced that mutability is conceptually simpler than immutability. By implication, it is
  easier to create mutable object and try to not modify it later, than create properly constructed immutable object once
- JavaBeans (often called POJO out of habit) are greatest thing since sliced bread and should be used for everything
- Code generation in any form is a pure evil
- Boolean values were designed to have following possible values: true, false and unknown
- "get" is a paramount for the accessor methods. Prefix "get" should appear no less than 64 times
  per any _Java_ compilation unit for better readability.
- Overriding getter and setters with complex logic is a powerful thing that any programmer will appreciate
- _Java_ should match execution speed of the _Ruby_
- _Guava_ library is a waporware 'cos _Apache Commons_ were first and rules forever!
- `NullPointerException` is natural, unavoidable and endlessly compelling thing, since it helps keep
  programmers busy for hunting _NPE_s down, inserting blind `null` check
  and closing a bug ticket at the end of a day
- _org.immutables_ is not as convenient as anything that _Spring_ does, and, moreover,
  it is totally compromised by the fact that _SpringFramework's_ XML is not compatible with builders
