## Posts
{% for post in site.posts limit: 10 %}
- [{{ post.title }}]({{ post.url }}){% endfor %}
