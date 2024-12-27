---
title: 'Spring Boot ile OpenAPI'
date: '2024-12-20'
summary: 'SpringDoc kullanarak Spring Boot uygulamanızda OpenAPI entegrasyonu ile API dokümantasyonu ve test yöntemlerini öğrenin.'
thumbnail: '/images/spring-boot-openapi-thumbnail.jpg'
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
  - id: 'openapi'
    name: 'OpenAPI'
    color: 'orange'
  - id: 'documentation'
    name: 'Dokümantasyon'
    color: 'brown'
  - id: 'programming'
    name: 'Programlama'
    color: 'blue'
---

OpenAPI, API dokümantasyonu ve test işlemlerini kolaylaştıran etkileşimli bir arayüz ve makine tarafından okunabilir belgeler sağlar. Bu kılavuz, SpringDoc kullanarak OpenAPI'yi Spring Boot uygulamanıza entegre etmenin yollarını gösterecektir.

---

## 🌟 Neden OpenAPI Kullanmalıyız?

- **Etkileşimli Dokümantasyon**: API'leri keşfetmek için kullanıcı dostu bir arayüz sağlar.
- **Standartlaştırılmış Format**: Makine tarafından okunabilir API tanımları oluşturur.
- **Kolay Test**: Endpoint'leri test etmek için yerleşik araçlar sunar.
- **İstemci Kod Üretimi**: Çeşitli programlama dilleri için otomatik istemci kodu üretimi sağlar.

---

## 🌟 Gereksinimler

📋 Şunlara sahip olduğunuzdan emin olun:

- ☕ **Java Development Kit (JDK)** 17+
- 📦 **Maven veya Gradle** yüklü
- 🔤 Bir **Java IDE** (Örneğin IntelliJ IDEA, Eclipse)

---

## 🛠️ 1. Adım: Bağımlılıkları Ekleyin

SpringDoc kullanarak OpenAPI'yi entegre etmek için aşağıdaki bağımlılığı projenize ekleyin:

- **Maven:**

```xml
<dependency>
  <groupId>org.springdoc</groupId>
  <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
  <version>2.1.0</version>
</dependency>
```

- **Gradle:**

```groovy
implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.1.0'
```

---

## 📋 2. Adım: OpenAPI'yi Yapılandırın

SpringDoc minimal konfigürasyon gerektirir. `application.properties` veya `application.yml` dosyası üzerinden dokümantasyonu özelleştirebilirsiniz.

### Örnek Konfigürasyon:

```properties
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
```

---

## 📖 3. Adım: REST Kontrollerinizi Anotasyonlarla Belgeleyin

REST kontrollerinize ve modellerinize anotasyonlar ekleyerek OpenAPI dokümantasyonunu otomatik olarak oluşturabilirsiniz.

:::tabs
@tab Java [icon=java]

### Controller Örneği

```java
package com.example.openapi.controller;

import com.example.openapi.model.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

  @Operation(summary = "Tüm kullanıcıları getir", description = "Kullanıcı listesini alır")
  @ApiResponse(responseCode = "200", description = "Başarılı işlem",
    content = @Content(mediaType = "application/json"))
  @GetMapping
  public List<User> getAllUsers() {
    return List.of(new User(1L, "John Doe", "john@example.com"));
  }

  @Operation(summary = "Yeni bir kullanıcı oluştur", description = "Sisteme yeni bir kullanıcı ekler")
  @ApiResponse(responseCode = "201", description = "Kullanıcı başarıyla oluşturuldu",
    content = @Content(mediaType = "application/json"))
  @PostMapping
  public User createUser(@RequestBody User user) {
    return user;
  }
}
```

### User Model

```java
package com.example.openapi.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    private Long id;
    private String name;
    private String email;
}
```

@tab Kotlin [icon=kotlin]

### Controller Örneği

```kotlin
package com.example.openapi.controller

import com.example.openapi.model.User
import io.swagger.v3.oas.annotations.*
import io.swagger.v3.oas.annotations.responses.*
import io.swagger.v3.oas.annotations.media.*
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/users")
class UserController {

    @Operation(summary = "Tüm kullanıcıları getir", description = "Kullanıcı listesini alır")
    @ApiResponse(responseCode = "200", description = "Başarılı işlem",
                 content = [Content(mediaType = "application/json")])
    @GetMapping
    fun getAllUsers(): List<User> = listOf(User(1L, "John Doe", "john@example.com"))

    @Operation(summary = "Yeni bir kullanıcı oluştur", description = "Sisteme yeni bir kullanıcı ekler")
    @ApiResponse(responseCode = "201", description = "Kullanıcı başarıyla oluşturuldu",
                 content = [Content(mediaType = "application/json")])
    @PostMapping
    fun createUser(@RequestBody user: User): User = user
}
```

### User Model

```kotlin
package com.example.openapi.model

data class User(
  val id: Long,
  val name: String,
  val email: String
)
```

:::

---

## ▶️ Uygulamayı Çalıştırma

Uygulamayı aşağıdaki komutla çalıştırın:

```bash
./mvnw spring-boot:run
```

OpenAPI dokümantasyonuna erişmek için:

- **API Docs:** `http://localhost:8080/api-docs`
- **Swagger UI:** `http://localhost:8080/swagger-ui.html`

---

## 🧪 API'yi Test Etme

Swagger UI arayüzüne erişerek oluşturulan API dokümantasyonunu test edebilirsiniz:

1. Tarayıcınızda `http://localhost:8080/swagger-ui.html` adresine gidin.
2. Endpoint'leri etkileşimli olarak test etmek için girişler yapın ve yanıtları gözlemleyin.

---

Spring Boot ile OpenAPI entegrasyonu, API dokümantasyonu ve test süreçlerini kolaylaştırır. SpringDoc kullanarak etkileşimli dokümantasyon oluşturabilir ve API'lerinizi daha erişilebilir hale getirebilirsiniz.
