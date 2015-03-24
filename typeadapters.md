---
title: 'Gson TypeAdapter code'
layout: page
---

Example generated code for _Gson_ type adapters

### Document types

```java
import com.google.common.collect.Multiset;
import com.google.common.collect.SetMultimap;
import com.google.common.collect.ListMultimap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.immutables.gson.Gson;
import org.immutables.value.Value;

@Value.Immutable(builder = false)
@Value.Enclosing
@Gson.TypeAdapters
public interface Adapt {

  @Value.Parameter
  Set<Inr> set();

  @Value.Parameter
  Multiset<Nst> bag();

  @Value.Immutable
  public interface Inr {
    String[] arr();

    List<Integer> list();

    Map<String, Nst> map();

    ListMultimap<String, Nst> listMultimap();

    SetMultimap<Integer, Nst> setMultimap();
  }

  @Value.Immutable
  public interface Nst {
    int value();

    String string();
  }
}
```

Below is a source code of generated `TypeAdapterFactory`

```java
import com.google.common.collect.ImmutableMultiset;
import com.google.common.collect.ImmutableSet;
import com.google.common.collect.ListMultimap;
import com.google.common.collect.SetMultimap;
import com.google.gson.*;
import com.google.gson.reflect.*;
import com.google.gson.stream.*;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import javax.annotation.Generated;
import javax.annotation.ParametersAreNonnullByDefault;

/**
 * {@code TypeAdapterFactory} that handle all the immutable types generated under {@code Adapt}.
 * @see ImmutableAdapt.Inr
 * @see ImmutableAdapt
 * @see ImmutableAdapt.Nst
 */
@SuppressWarnings("all")
@Generated({"Gsons.generator", "org.immutables.gson.adapter.Adapt"})
@ParametersAreNonnullByDefault
public final class GsonAdaptersAdapt implements TypeAdapterFactory {
  @SuppressWarnings("unchecked") // safe unchecked, type is verified by type token equality
  @Override
  public <T> TypeAdapter<T> create(Gson gson, TypeToken<T> type) {
    if (InrTypeAdapter.adapts(type)) {
      return (TypeAdapter<T>) new InrTypeAdapter(gson);
    }
    if (AdaptTypeAdapter.adapts(type)) {
      return (TypeAdapter<T>) new AdaptTypeAdapter(gson);
    }
    if (NstTypeAdapter.adapts(type)) {
      return (TypeAdapter<T>) new NstTypeAdapter(gson);
    }
    return null;
  }

  @Override
  public String toString() {
    return "GsonAdaptersAdapt(Inr, Adapt, Nst)";
  }
  
  private static class InrTypeAdapter extends TypeAdapter<Adapt.Inr> {
    private static final TypeToken<Adapt.Inr> INR_ABSTRACT = TypeToken.get(Adapt.Inr.class);
    private static final TypeToken<ImmutableAdapt.Inr> INR_IMMUTABLE = TypeToken.get(ImmutableAdapt.Inr.class);
    private static final TypeToken<Adapt.Nst> MAP_SECONDARY_TYPE_TOKEN = new TypeToken<Adapt.Nst>() {};
    private static final TypeToken<Adapt.Nst> LIST_MULTIMAP_SECONDARY_TYPE_TOKEN = new TypeToken<Adapt.Nst>() {};
    private static final TypeToken<Adapt.Nst> SET_MULTIMAP_SECONDARY_TYPE_TOKEN = new TypeToken<Adapt.Nst>() {};
    private final TypeAdapter<Adapt.Nst> mapSecondaryTypeAdapter;
    private final TypeAdapter<Adapt.Nst> listMultimapSecondaryTypeAdapter;
    private final TypeAdapter<Adapt.Nst> setMultimapSecondaryTypeAdapter;
  
    InrTypeAdapter(Gson gson) {
      this.mapSecondaryTypeAdapter = gson.getAdapter(MAP_SECONDARY_TYPE_TOKEN);
      this.listMultimapSecondaryTypeAdapter = gson.getAdapter(LIST_MULTIMAP_SECONDARY_TYPE_TOKEN);
      this.setMultimapSecondaryTypeAdapter = gson.getAdapter(SET_MULTIMAP_SECONDARY_TYPE_TOKEN);
    } 
  
    static boolean adapts(TypeToken<?> type) {
      return INR_ABSTRACT.equals(type)
          || INR_IMMUTABLE.equals(type);
    }
  
    @Override
    public void write(JsonWriter out, Adapt.Inr value) throws IOException {
      writeInr(out, value);
    }
  
    @Override
    public Adapt.Inr read(JsonReader in) throws IOException {
      return readInr(in);
    }
    
    private void writeInr(JsonWriter out, Adapt.Inr instance)
        throws IOException {
      out.beginObject();
      String[] arrElements = instance.arr();
      if (arrElements.length != 0) {
        out.name("arr");
        out.beginArray();
        for (String e : arrElements) {
          out.value(e);
        }
        out.endArray();
      } else {
        out.name("arr");
        out.beginArray();
        out.endArray();
      }
      List<Integer> listElements = instance.list();
      if (!listElements.isEmpty()) {
        out.name("list");
        out.beginArray();
        for (int e : listElements) {
          out.value(e);
        }
        out.endArray();
      } else {
        out.name("list");
        out.beginArray();
        out.endArray();
      }
      Map<String,Adapt.Nst> mapMapping = instance.map();
      if (!mapMapping.isEmpty()) {
        out.name("map");
        out.beginObject();
        for (Map.Entry<String, Adapt.Nst> e : mapMapping.entrySet()) {
          String key = e.getKey();
          out.name(key);
          Adapt.Nst value = e.getValue();
          mapSecondaryTypeAdapter.write(out, value);
        }
        out.endObject();
      } else {
        out.name("map");
        out.beginObject();
        out.endObject();
      }
      ListMultimap<String,Adapt.Nst> listMultimapMapping = instance.listMultimap();
      if (!listMultimapMapping.isEmpty()) {
        out.name("listMultimap");
        out.beginObject();
        for (Map.Entry<String, Collection<Adapt.Nst>> e : listMultimapMapping.asMap().entrySet()) {
          String key = e.getKey();
          out.name(key);
          out.beginArray();
          for (Adapt.Nst value : e.getValue()) {
            listMultimapSecondaryTypeAdapter.write(out, value);
          }
          out.endArray();
        }
        out.endObject();
      } else {
        out.name("listMultimap");
        out.beginObject();
        out.endObject();
      }
      SetMultimap<Integer,Adapt.Nst> setMultimapMapping = instance.setMultimap();
      if (!setMultimapMapping.isEmpty()) {
        out.name("setMultimap");
        out.beginObject();
        for (Map.Entry<Integer, Collection<Adapt.Nst>> e : setMultimapMapping.asMap().entrySet()) {
          String key = String.valueOf(e.getKey());
          out.name(key);
          out.beginArray();
          for (Adapt.Nst value : e.getValue()) {
            setMultimapSecondaryTypeAdapter.write(out, value);
          }
          out.endArray();
        }
        out.endObject();
      } else {
        out.name("setMultimap");
        out.beginObject();
        out.endObject();
      }
      out.endObject();
    }
    
    private Adapt.Inr readInr(JsonReader in)
        throws IOException {
      ImmutableAdapt.Inr.Builder builder = ImmutableAdapt.Inr.builder();
      in.beginObject();
      while (in.hasNext()) {
        eachAttribute(in, builder);
      }
      in.endObject();
      return builder.build();
    }
    
    private void eachAttribute(JsonReader in, ImmutableAdapt.Inr.Builder builder)
        throws IOException {
      String attributeName = in.nextName();
      switch (attributeName.charAt(0)) {
      case 'a':
        if ("arr".equals(attributeName)) {
          readInArr(in, builder);
          return;
        }
        break;
      case 'l':
        if ("list".equals(attributeName)) {
          readInList(in, builder);
          return;
        }
        if ("listMultimap".equals(attributeName)) {
          readInListMultimap(in, builder);
          return;
        }
        break;
      case 'm':
        if ("map".equals(attributeName)) {
          readInMap(in, builder);
          return;
        }
        break;
      case 's':
        if ("setMultimap".equals(attributeName)) {
          readInSetMultimap(in, builder);
          return;
        }
        break;
      default:
      }
      in.skipValue();
    }
    
    private void readInArr(JsonReader in, ImmutableAdapt.Inr.Builder builder)
        throws IOException {
      List<String> elements = new ArrayList<String>();
      JsonToken t = in.peek();
      if (t == JsonToken.BEGIN_ARRAY) {
        in.beginArray();
        while(in.hasNext()) {
          elements.add(in.nextString());
        }
        in.endArray();
      } else if (t == JsonToken.NULL) {
        in.nextNull();
      } else {
        elements.add(in.nextString());
      }
      builder.arr(elements.toArray(new String[elements.size()]));
    }
    
    private void readInList(JsonReader in, ImmutableAdapt.Inr.Builder builder)
        throws IOException {
      JsonToken t = in.peek();
      if (t == JsonToken.BEGIN_ARRAY) {
        in.beginArray();
        while(in.hasNext()) {
          builder.addList(in.nextInt());
        }
        in.endArray();
      } else if (t == JsonToken.NULL) {
        in.nextNull();
      } else {
        builder.addList(in.nextInt());
      }
    }
    
    private void readInMap(JsonReader in, ImmutableAdapt.Inr.Builder builder)
        throws IOException {
      if (in.peek() == JsonToken.NULL) {
        in.nextNull();
      } else {
        in.beginObject();
        while(in.hasNext()) {
          String rawKey = in.nextName();
          String key = rawKey;
          Adapt.Nst value = mapSecondaryTypeAdapter.read(in);
          builder.putMap(key, value);
        }
        in.endObject();
      }
    }
    
    private void readInListMultimap(JsonReader in, ImmutableAdapt.Inr.Builder builder)
        throws IOException {
      if (in.peek() == JsonToken.NULL) {
        in.nextNull();
      } else {
        in.beginObject();
        while(in.hasNext()) {
          String rawKey = in.nextName();
          String key = rawKey;
          if (in.peek() == JsonToken.BEGIN_ARRAY) {
            in.beginArray();
            while(in.hasNext()) {
              Adapt.Nst value = listMultimapSecondaryTypeAdapter.read(in);
              builder.putListMultimap(key, value);
            }
            in.endArray();
          } else {
            Adapt.Nst value = listMultimapSecondaryTypeAdapter.read(in);
            builder.putListMultimap(key, value);
          }
        }
        in.endObject();
      }
    }
    
    private void readInSetMultimap(JsonReader in, ImmutableAdapt.Inr.Builder builder)
        throws IOException {
      if (in.peek() == JsonToken.NULL) {
        in.nextNull();
      } else {
        in.beginObject();
        while(in.hasNext()) {
          String rawKey = in.nextName();
          int key = Integer.parseInt(rawKey);
          if (in.peek() == JsonToken.BEGIN_ARRAY) {
            in.beginArray();
            while(in.hasNext()) {
              Adapt.Nst value = setMultimapSecondaryTypeAdapter.read(in);
              builder.putSetMultimap(key, value);
            }
            in.endArray();
          } else {
            Adapt.Nst value = setMultimapSecondaryTypeAdapter.read(in);
            builder.putSetMultimap(key, value);
          }
        }
        in.endObject();
      }
    }
  }
  
  private static class AdaptTypeAdapter extends TypeAdapter<Adapt> {
    private static final TypeToken<Adapt> ADAPT_ABSTRACT = TypeToken.get(Adapt.class);
    private static final TypeToken<ImmutableAdapt> ADAPT_IMMUTABLE = TypeToken.get(ImmutableAdapt.class);
    private static final TypeToken<Adapt.Inr> SET_TYPE_TOKEN = TypeToken.get(Adapt.Inr.class);
    private static final TypeToken<Adapt.Nst> BAG_TYPE_TOKEN = TypeToken.get(Adapt.Nst.class);
    private final TypeAdapter<Adapt.Inr> setTypeAdapter;
    private final TypeAdapter<Adapt.Nst> bagTypeAdapter;
  
    AdaptTypeAdapter(Gson gson) {
      this.setTypeAdapter = gson.getAdapter(SET_TYPE_TOKEN);
      this.bagTypeAdapter = gson.getAdapter(BAG_TYPE_TOKEN);
    } 
  
    static boolean adapts(TypeToken<?> type) {
      return ADAPT_ABSTRACT.equals(type)
          || ADAPT_IMMUTABLE.equals(type);
    }
  
    @Override
    public void write(JsonWriter out, Adapt value) throws IOException {
      writeAdapt(out, value);
    }
  
    @Override
    public Adapt read(JsonReader in) throws IOException {
      return readAdapt(in);
    }
    
    private void writeAdapt(JsonWriter out, Adapt instance)
        throws IOException {
      out.beginArray();
      out.beginArray();
      for (Adapt.Inr e : instance.set()) {
        setTypeAdapter.write(out, e);
      }
      out.endArray();
      out.beginArray();
      for (Adapt.Nst e : instance.bag()) {
        bagTypeAdapter.write(out, e);
      }
      out.endArray();
      out.endArray();
    }
    
    private Adapt readAdapt(JsonReader in)
        throws IOException {
      in.beginArray();
      Adapt instance = ImmutableAdapt.of(
        readParameterSet(in),
        readParameterBag(in));
      in.endArray();
      return instance;
    }
    
    private Iterable<Adapt.Inr> readParameterSet(JsonReader in)
        throws IOException {
      ImmutableSet.Builder<Adapt.Inr> elements = ImmutableSet.builder();
      JsonToken t = in.peek();
      if (t == JsonToken.BEGIN_ARRAY) {
        in.beginArray();
        while(in.hasNext()) {
          Adapt.Inr value = setTypeAdapter.read(in);
          elements.add(value);
        }
        in.endArray();
      } else if (t == JsonToken.NULL) {
        in.nextNull();
      } else {
        Adapt.Inr value = setTypeAdapter.read(in);
        elements.add(value);
      }
      return elements.build();
    }
    
    private Iterable<Adapt.Nst> readParameterBag(JsonReader in)
        throws IOException {
      ImmutableMultiset.Builder<Adapt.Nst> elements = ImmutableMultiset.builder();
      JsonToken t = in.peek();
      if (t == JsonToken.BEGIN_ARRAY) {
        in.beginArray();
        while(in.hasNext()) {
          Adapt.Nst value = bagTypeAdapter.read(in);
          elements.add(value);
        }
        in.endArray();
      } else if (t == JsonToken.NULL) {
        in.nextNull();
      } else {
        Adapt.Nst value = bagTypeAdapter.read(in);
        elements.add(value);
      }
      return elements.build();
    }
  }
  
  private static class NstTypeAdapter extends TypeAdapter<Adapt.Nst> {
    private static final TypeToken<Adapt.Nst> NST_ABSTRACT = TypeToken.get(Adapt.Nst.class);
    private static final TypeToken<ImmutableAdapt.Nst> NST_IMMUTABLE = TypeToken.get(ImmutableAdapt.Nst.class);
  
    NstTypeAdapter(Gson gson) {
    } 
  
    static boolean adapts(TypeToken<?> type) {
      return NST_ABSTRACT.equals(type)
          || NST_IMMUTABLE.equals(type);
    }
  
    @Override
    public void write(JsonWriter out, Adapt.Nst value) throws IOException {
      writeNst(out, value);
    }
  
    @Override
    public Adapt.Nst read(JsonReader in) throws IOException {
      return readNst(in);
    }
    
    private void writeNst(JsonWriter out, Adapt.Nst instance)
        throws IOException {
      out.beginObject();
      out.name("value");
      out.value(instance.value());
      out.name("string");
      out.value(instance.string());
      out.endObject();
    }
    
    private Adapt.Nst readNst(JsonReader in)
        throws IOException {
      ImmutableAdapt.Nst.Builder builder = ImmutableAdapt.Nst.builder();
      in.beginObject();
      while (in.hasNext()) {
        eachAttribute(in, builder);
      }
      in.endObject();
      return builder.build();
    }
    
    private void eachAttribute(JsonReader in, ImmutableAdapt.Nst.Builder builder)
        throws IOException {
      String attributeName = in.nextName();
      switch (attributeName.charAt(0)) {
      case 'v':
        if ("value".equals(attributeName)) {
          readInValue(in, builder);
          return;
        }
        break;
      case 's':
        if ("string".equals(attributeName)) {
          readInString(in, builder);
          return;
        }
        break;
      default:
      }
      in.skipValue();
    }
    
    private void readInValue(JsonReader in, ImmutableAdapt.Nst.Builder builder)
        throws IOException {
      builder.value(in.nextInt());
    }
    
    private void readInString(JsonReader in, ImmutableAdapt.Nst.Builder builder)
        throws IOException {
        builder.string(in.nextString());
    }
  }
}
```
