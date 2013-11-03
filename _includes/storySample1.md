
```java
// Add annotation to generate marshaler
@GenerateImmutable
@GenerateMarshaler
public abstract class ValueObject {
  ...
}
```

```java
String json = Marshaling.toJson(valueObject);
...
```
```js
{
  "name" : "Nameless",
  "numbers" : [ 1, 2 ],
  "optional" : "present"
}
```

```java
ValueObject object =
    Marshaling.fromJson(json, ValueObject.class);
```
