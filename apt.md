---
title: 'Using annotation processor in IDE'
layout: page
---

{% capture v %}2.0.1{% endcapture %}
{% capture depUri %}http://search.maven.org/#artifactdetails|org.immutables{% endcapture %}
--------
Overview
--------

As of Java 6 annotation processing became part of standard java compiler.
Java 7 or higher is required to run _Immutables_ annotation processor.
_Immutables_ annotation processor runs under any Java build tool that uses `javac` as compiler backend.
(given annotation processing is not disabled in build tool configuration).
_Eclipse JDT compiler_ (ECJ) also supports this annotation processor.

Nowadays major IDE supports annotation processing almost out of the box.
Usually something have to be configured or there are some quirks that may prevent this functionality to function properly.

Annotation processor that is to be plugged into IDE was built as single jar without external dependencies.

- [org.immutables:value:{{v}}]({{ depUri }}|value|{{ v }}|jar)

-------
Eclipse
-------

If you are using Maven, then m2e could configure annotation processing for you. However for this to work m2e-apt connector should be installed first. Install it from Eclipse marketplace

<img src="pix/eclipse-marketplace.png">

Enable JDT/APT autoconfiguration from Maven dependencies globally or per project.
<img src="https://developer.jboss.org/servlet/JiveServlet/downloadImage/38-4947-18599/620-226/m2e-apt-prefs.png"><br>
_(Picture linked from [developer.jboss.org](https://developer.jboss.org/en/tools/blog/2012/05/20/annotation-processing-support-in-m2e-or-m2e-apt-100-is-out))_

After this on each m2e Maven project import/update, annotation processors will be configured from classpath.

- [jbosstools/m2e-apt project page](https://github.com/jbosstools/m2e-apt)

###Manual configuration tutorial

If it will not work for some reason, you could configure it manually. 

* [Using Java 6 processors in Eclipse](http://kerebus.com/2011/02/using-java-6-processors-in-eclipse/)

Here's and dialog configuration example to manually configure annotation processor that is already in local maven repository. One need to enable annotation processing in the project settings, then configure factory path to point to annotation processor jar, in this example, by extending M2_REPO classpath variable (defined by m2e).

<img src="pix/eclipse-annotation-processing.png">

<img src="pix/eclipse-factory-path.png">

Be sure to pick correct version of annotation processor jar.

- [org.immutables:value-standalone:{{v}}]({{ depUri }}|value-standalone|{{ v }}|jar)

-------------
IntelliJ IDEA
-------------
To configure annotation processing in IntelliJ IDEA use dialog
_Preferences_ > _Project Settings_ > _Compiler_ > _Annotation Processors_.

Obtain annotation processors from project classpath and specify output directories.

<img src="http://restx.io/images/docs/idea-annotation-processor-preferences.png"><br>
_(Picture linked from [restx.io](http://restx.io) documentation)_

After you do this, classes will be generated on each project build, sources will appear and will be visible to search, autocompletion and so on.
