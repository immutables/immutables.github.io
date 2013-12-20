
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
  "counts" : [ 1, 2 ],
  "description" : "present"
}
```

```java
ValueObject object =
    Marshaling.fromJson(json, ValueObject.class);
```
