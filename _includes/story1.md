JSON marshaling
---------------
Immutable objects serve well to transfer data. Generate marshalers that flexibly map immutable object graphs to a clean JSON representation.
Underlying [Jackson](http://wiki.fasterxml.com/JacksonHome)
parsers and generators makes it possible to use textual JSON,
as well as [Smile](http://wiki.fasterxml.com/SmileFormatSpec)
or [BSON](http://www.michel-kraemer.com/binary-json-with-bson4jackson) binary formats
