---
title: 'Spring Boot HTTP Interface Client'
date: '2025-04-27'
summary: 'Deklaratif, tip güvenli HTTP çağrıları için Spring Boot 3.2+ HTTP Interface Client nasıl kullanılır öğrenin.'
thumbnail: '/images/spring-boot-http-interface-thumbnail.webp'
readingTime: '3 dk okuma'
topics:
  - id: 'java'
    name: 'Java'
    color: 'red'
  - id: 'kotlin'
    name: 'Kotlin'
    color: 'purple'
  - id: 'spring-boot'
    name: 'Spring Boot'
    color: 'green'
  - id: 'rest-api'
    name: 'REST API'
    color: 'blue'
  - id: 'rest-client'
    name: 'Rest Client'
    color: 'purple'
  - id: 'programming'
    name: 'Programlama'
    color: 'brown'
---

Spring Boot 3.2+ ile Java veya Kotlin arayüzleri üzerinden deklaratif ve tip güvenli HTTP istemcileri tanımlayabilirsiniz. Bu makalede JSONPlaceholder API örneği ile baştan sona nasıl yapılandıracağınızı öğreneceksiniz.

---

## 🌟 Neden HTTP Arayüz İstemcisi?

- Deklaratif: Bir arayüz tanımlayıp HTTP çağrılarını yöntem anotasyonlarıyla eşleyin.
- Tip güvenli: Yanlış imzalar veya hatalı yol konfigürasyonları derleme zamanında yakalanır.
- Azaltılmış tekrar eden kod: Tek bir bean tanımı, manuel proxy veya template koduna gerek yok.
- Spring Dostu: Spring Framework 6.2’nin `@HttpExchange`, `@GetExchange` ve `WebClientAdapter` bileşenlerini kullanır.

---

## 📋 Gereksinimler

- ☕ Java Development Kit (JDK) 21 veya üstü
- 📦 Spring Boot 3.2+
- 🔤 IDE (IntelliJ IDEA, Eclipse vb.)

---

## 🛠️ Adım 1: Bağımlılıkları Ekle

Projenizin yapı dosyasına Web starter’ı ekleyin:

Maven:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

Gradle:

```groovy
implementation 'org.springframework.boot:spring-boot-starter-web'
```

---

## 🛠️ Adım 2: Temel URL Ayarı

`application.yml` veya `application.properties` dosyanıza ekleyin:

```yaml
jsonplaceholder:
  base-url: https://jsonplaceholder.typicode.com
```

```properties
jsonplaceholder.base-url=https://jsonplaceholder.typicode.com
```

---

## 🛠️ Adım 3: DTO ve İstemci Arayüzü Tanımla

:::tabs
@tab Java [icon=java]

```java
// src/main/java/com/example/client/dto/PostDTO.java
package com.example.client.dto;

public record PostDTO(
    Integer userId,
    Integer id,
    String title,
    String body
) {}

// src/main/java/com/example/client/JsonPlaceholderClient.java
package com.example.client;

import com.example.client.dto.PostDTO;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.List;

@HttpExchange(url = "${jsonplaceholder.base-url}", accept = "application/json")
public interface JsonPlaceholderClient {

    @GetExchange("/posts")
    List<PostDTO> getPosts();

    @GetExchange("/posts/{id}")
    PostDTO getPost(@PathVariable("id") Integer id);
}
```

@tab Kotlin [icon=kotlin]

```kotlin
// src/main/kotlin/com/example/client/dto/PostDTO.kt
package com.example.client.dto

data class PostDTO(
    val userId: Int,
    val id: Int,
    val title: String,
    val body: String
)

// src/main/kotlin/com/example/client/JsonPlaceholderClient.kt
package com.example.client

import com.example.client.dto.PostDTO
import org.springframework.web.service.annotation.GetExchange
import org.springframework.web.service.annotation.HttpExchange
import org.springframework.web.bind.annotation.PathVariable

@HttpExchange(url = "${jsonplaceholder.base-url}", accept = "application/json")
interface JsonPlaceholderClient {

    @GetExchange("/posts")
    fun getPosts(): List<PostDTO>

    @GetExchange("/posts/{id}")
    fun getPost(@PathVariable("id") id: Int): PostDTO
}
```

:::

---

## 🛠️ Adım 4: İstemci Bean’ini Yapılandır

:::tabs
@tab Java [icon=java]

```java
// src/main/java/com/example/config/HttpClientConfig.java
package com.example.config;

import com.example.client.JsonPlaceholderClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;
import org.springframework.web.service.invoker.RestClient;

@Configuration
public class HttpClientConfig {

    @Bean
    public JsonPlaceholderClient jsonPlaceholderClient(RestClient.Builder restClientBuilder) {
        RestClient restClient = restClientBuilder
            .baseUrl("https://jsonplaceholder.typicode.com")
            .build();

        var factory = HttpServiceProxyFactory
            .builderFor(RestClientAdapter.create(restClient))
            .build();

        return factory.createClient(JsonPlaceholderClient.class);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
// src/main/kotlin/com/example/config/HttpClientConfig.kt
package com.example.config

import com.example.client.JsonPlaceholderClient
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.client.support.RestClientAdapter
import org.springframework.web.service.invoker.HttpServiceProxyFactory
import org.springframework.web.service.invoker.RestClient

@Configuration
class HttpClientConfig {

    @Bean
    fun jsonPlaceholderClient(restClientBuilder: RestClient.Builder): JsonPlaceholderClient {
        val restClient = restClientBuilder
            .baseUrl("https://jsonplaceholder.typicode.com")
            .build()

        val factory = HttpServiceProxyFactory
            .builderFor(RestClientAdapter.create(restClient))
            .build()

        return factory.createClient(JsonPlaceholderClient::class.java)
    }
}
```

:::

---

## 🛠️ Adım 5: Servis ve Controller Oluşturun

:::tabs
@tab Java [icon=java]

```java
// src/main/java/com/example/service/PostService.java
package com.example.service;

import com.example.client.JsonPlaceholderClient;
import com.example.client.dto.PostDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {
    private final JsonPlaceholderClient client;

    public List<PostDTO> getAllPosts() {
        return client.getPosts();
    }

    public PostDTO getPostById(Integer id) {
        return client.getPost(id);
    }
}

// src/main/java/com/example/controller/PostController.java
package com.example.controller;

import com.example.client.dto.PostDTO;
import com.example.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {
    private final PostService postService;

    @GetMapping
    public List<PostDTO> getAllPosts() {
        return postService.getAllPosts();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostDTO> getPostById(@PathVariable Integer id) {
        PostDTO post = postService.getPostById(id);
        return post != null ? ResponseEntity.ok(post) : ResponseEntity.notFound().build();
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
// src/main/kotlin/com/example/service/PostService.kt
package com.example.service

import com.example.client.JsonPlaceholderClient
import com.example.client.dto.PostDTO
import org.springframework.stereotype.Service

@Service
class PostService(private val client: JsonPlaceholderClient) {
    fun getAllPosts(): List<PostDTO> = client.getPosts()
    fun getPostById(id: Int): PostDTO = client.getPost(id)
}

// src/main/kotlin/com/example/controller/PostController.kt
package com.example.controller

import com.example.client.dto.PostDTO
import com.example.service.PostService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/posts")
class PostController(private val postService: PostService) {
    @GetMapping
    fun getAllPosts(): List<PostDTO> = postService.getAllPosts()

    @GetMapping("/{id}")
    fun getPostById(@PathVariable id: Int): ResponseEntity<PostDTO> =
        ResponseEntity.ok(postService.getPostById(id))
}
```

:::

---

## ▶️ Uygulamayı Çalıştır

```bash
./mvnw spring-boot:run
# veya
gradle bootRun
```

---

## 🧪 Endpointleri Test Et

```bash
curl http://localhost:8080/posts
curl http://localhost:8080/posts/1
```

---

## 🏁 Sonuç

Bu kurulum, Spring Boot ile Spring Boot HTTP Interface Client için sağlam ve üretim‑hazır bir yaklaşım sunar; en iyi pratikleri, net bir yapı ve kendi projenize uyarlayabileceğiniz örneklerle birleştirir.
