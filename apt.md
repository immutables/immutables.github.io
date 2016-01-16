---
title: 'Using annotation processor in IDE'
layout: page
---

{% capture v %}2.1.8{% endcapture %}
{% capture depUri %}http://search.maven.org/#artifactdetails|org.immutables{% endcapture %}
--------
Overview
--------

As of Java 6, annotation processing became a part of the standard Java compiler.
Java 7 or higher is required to run the _Immutables_ annotation processor.
The _Immutables_ annotation processor runs under any Java build tool that uses `javac` as the compiler backend
(assuming that annotation processing is not disabled in the build tool configuration).
The _Eclipse JDT compiler_ (ECJ) also supports this annotation processor.

Nowadays, major IDEs support annotation processing almost out of the box.
However, something usually has to be configured or quirks may exist that prevent the processor from functioning correctly.

The annotation processor that is to be plugged into a given IDE is built as single jar without external dependencies.

- [org.immutables:value:{{v}}]({{ depUri }}|value|{{ v }}|jar)

-------
Eclipse
-------

If you are using Maven, then `m2e` should configure annotation processing for you. However, for this to work, the `m2e-apt` connector should be installed first. Install it from the Eclipse marketplace.

<img src="pix/eclipse-marketplace.png">

Enable JDT/APT autoconfiguration from Maven dependencies globally or per project.
<img src="https://developer.jboss.org/servlet/JiveServlet/downloadImage/38-4947-18599/620-226/m2e-apt-prefs.png"><br>
_(Picture linked from [developer.jboss.org](https://developer.jboss.org/en/tools/blog/2012/05/20/annotation-processing-support-in-m2e-or-m2e-apt-100-is-out))_

After this, on each `m2e` Maven project import/update, annotation processors will be configured from the classpath.

- [jbosstools/m2e-apt project page](https://github.com/jbosstools/m2e-apt)

###Manual configuration tutorial

* [Using Java 6 processors in Eclipse](http://kerebus.com/2011/02/using-java-6-processors-in-eclipse/)

Here's a dialog configuration example to manually configure the annotation processor (assuming that it is already installed in the local Maven repository).
One needs to enable annotation processing in the project settings, and then configure the factory path to point to the annotation processor jar.
In this example, this is achieved by extending the `M2_REPO` classpath variable (defined by `m2e`).

<img src="pix/eclipse-annotation-processing.png">

<img src="pix/eclipse-factory-path.png">

Use the correct jar from `M2_REPO`:

- [org.immutables:value:{{v}}]({{ depUri }}|value|{{ v }}|jar)

-------------
IntelliJ IDEA
-------------
To configure annotation processing in IntelliJ IDEA, use dialog
_Preferences_ > _Project Settings_ > _Compiler_ > _Annotation Processors_.

Obtain annotation processors from the project classpath and specify output directories.

<img src="http://restx.io/images/docs/idea-annotation-processor-preferences.png"><br>
_(Picture linked from [restx.io](http://restx.io) documentation)_

After you do this, classes will be generated on each project build. Generated sources will appear and will be visible to search, autocompletion, and so on.
