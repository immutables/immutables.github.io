---
title: 'DynamoDB V1 SDK integration'
layout: page
---

Overview
--------

[`DynamoDBMapper`][dynamodb-mapper-docs] provides an easy way to map POJOs to data in [`DynamoDB`][dynamodb-docs].
Most of the code POJOs are verbose and it makes a perfect sense to use _Immutables_ to reduce boilerplate.

How to use
----------

**NOTE**: provided snippets show the idea that could be improved and / or modified to address specific needs.

In the project with more than one entity it makes sense to create custom [`Style`](/style.html) that would allow
to enable _Immutables_ for POJO.

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.CLASS)
@Value.Style(
        create = "new",
        isInitialized = "wasInitialized",
        allParameters = true,
        beanFriendlyModifiables = true,
        passAnnotations = {
                DynamoDBTable.class,
                DynamoDBHashKey.class,
                DynamoDBRangeKey.class,
                DynamoDBAttribute.class,
                DynamoDBTyped.class,
                DynamoDBTypeConvertedEnum.class
                // more DynamoDB annotations to be added
        }
)
public @interface DynamoDBStyle {}
```

Application of the newly created style could look like:

```java
@DynamoDBStyle
@Value.Immutable
@Value.Modifiable
@DynamoDBTable(tableName = "people")
public interface Person {
    @DynamoDBHashKey(attributeName = "name")
    String getName();

    @DynamoDBAttribute(attributeName = "age")
    int getAge();
}
```

We apply both `@Value.Immutable` and `@Value.Modifiable`. The former is bread and butter
of _Immutables_ as it provides all nice features while the latter enables usage
of generated classes with [`DynamoDBMapper`][dynamodb-mapper-docs]. [`DynamoDBMapper`][dynamodb-mapper-docs]
expects the POJO to have no-arg ctor with setters and newly created `DynamoDBStyle`
annotation configures _Immutables_ to generated the required structure.

The usage is pretty straightforward with only one caveat: `Modifiable...` implementation
should be used any time data is loaded from the [`DynamoDB`][dynamodb-docs].

```java
// assuming mapper is an instance of `DynamoDBMapper`

Person john = ImmutablePerson.of("John", 42);

mapper.save(john);
john = mapper.load(ModifiablePerson.class, "John");

System.out.println(john);  // prints ModifiablePerson{name=John, age=42}
```


[dynamodb-mapper-docs]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBMapper.html
[dynamodb-docs]: https://docs.aws.amazon.com/dynamodb/index.html
