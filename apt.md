---
title: 'Using annotation processor in IDE'
layout: page
---

{% capture v %}0.14{% endcapture %}
{% capture depUri %}http://search.maven.org/#artifactdetails|org.immutables{% endcapture %}
--------
Overview
--------

As of Java 6 annotation processing became part of standard java compiler.
Java 7 or higher is required to run _Immutables_ annotation processor.
_Immutables_ annotation processor runs under any Java build tool that uses `javac` as compiler backend.
(given annotation processing is not disabled in build tool configuration).
_Eclipse JDT compiler_ (ECJ) also supports this annotation processor.

Nowadays major IDE supports annotation processing out of the box while importing projects. That
said there are some quirks that may prevent this functionality to function properly.

Annotation processor that is to be plugged into IDE was built as single jar without external dependencies.

- [org.immutables:generate-tool:{{v}}]({{ depUri }}|generate-tool|{{ v }}|jar)

-------
Eclipse
-------

If you are using Maven, then m2e could configure annotation processing for you. However for this to work
m2e-apt connector should be installed first. Install it from Eclipse marketplace, for example:

<img src="pix/eclipse-marketplace.png">

If it will not work for some reason, you could configure it manually. 

Manual configuration tutorial

* [Using Java 6 processors in Eclipse](http://kerebus.com/2011/02/using-java-6-processors-in-eclipse/)


Here's and dialog configuration example to manually configure annotation processor that is already in local
maven repository. One need to enable annotation processing in the project settings, then configure factory path
to point to annotation processor jar, in this example, by extending M2_REPO classpath variable (defined by m2e).

<img src="pix/eclipse-annotation-processing.png">

<img src="pix/eclipse-factory-path.png">


_This section to be expanded_

-------------
IntelliJ IDEA
-------------
IntelliJ IDEA should configure annotation processing automatically


<img src="http://blog.jetbrains.com/idea/files/2009/11/settings.png">

_This section to be expanded_
