
```java
// Add annotation to generate marshaler
@GenerateImmutable
@GenerateMarshaler
public interface ValueObject {
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
