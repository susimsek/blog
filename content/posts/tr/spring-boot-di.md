---
title: 'Spring Boot ile Dependency Injection'
date: '2024-12-18'
summary: 'Spring Boot ile Bağımlılık Enjeksiyonu (Dependency Injection - DI) nasıl çalışır? Java ve Kotlin örnekleriyle temel kavramlar, anotasyonlar ve pratik kullanım senaryolarını öğrenin.'
thumbnail: '/images/spring-boot-di-thumbnail.jpg'
readingTime: '2 dk okuma'
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
  - id: 'dependency-injection'
    name: 'Bağımlılık Enjeksiyonu'
    color: 'orange'
  - id: 'programming'
    name: 'Programlama'
    color: 'blue'
---

Bağımlılık Enjeksiyonu (Dependency Injection - DI), Spring Boot'un temel konseptlerinden biridir ve daha gevşek bağlılık ve artan test edilebilirlik sağlar. Bu kılavuz, Java ve Kotlin ile Spring Boot'ta DI kullanımını pratik örneklerle açıklar.

---

## 🌟 Neden Bağımlılık Enjeksiyonu Kullanmalıyız?

Bağımlılık Enjeksiyonu, sınıflara bağımlılıkları manuel olarak oluşturmadan enjekte etmeyi sağlar. Bu, şu avantajları sunar:

- Daha modüler kod
- Testlerin kolaylaştırılması
- Daha kolay bakım

---

## 🌟 Ön Koşullar

📋 Aşağıdakilere sahip olduğunuzdan emin olun:

- ☕ **Java Development Kit (JDK)** 17+
- 📦 **Maven veya Gradle** yüklü
- 🔤 Bir **Java IDE** (örneğin, IntelliJ IDEA, Eclipse)

---

## 🛠️ Adım 1: Bağımlılıkları Ekleyin

Gerekli Spring Boot bağımlılıklarını ekleyin:

- **Maven:**

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter</artifactId>
</dependency>
```

- **Gradle:**

```groovy
implementation 'org.springframework.boot:spring-boot-starter'
```

---

## 📋 Adım 2: Bir Servis Oluşturun

Bağımlılık Enjeksiyonu'nu göstermek için basit bir servis tanımlayın.

:::tabs
@tab Java [icon=java]

### Servis

```java
package com.example.demo.service;

import org.springframework.stereotype.Service;

@Service
public class UserService {

    public String getUserById(String id) {
        return "ID ile kullanıcı: " + id;
    }

    public String getAllUsers() {
        return "Tüm kullanıcılar alınıyor.";
    }
}
```

@tab Kotlin [icon=kotlin]

### Servis

```kotlin
package com.example.demo.service

import org.springframework.stereotype.Service

@Service
class UserService {

    fun getUserById(id: String): String {
        return "ID ile kullanıcı: $id"
    }

    fun getAllUsers(): String {
        return "Tüm kullanıcılar alınıyor."
    }
}
```

:::

---

## 📖 Adım 3: Bağımlılıkları Enjekte Edin

Servisi diğer bileşenlere enjekte etmek için anotasyonları kullanın.

:::tabs
@tab Java [icon=java]

### Controller

```java
package com.example.demo.controller;

import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public String getUserById(@PathVariable String id) {
        return userService.getUserById(id);
    }

    @GetMapping
    public String getAllUsers() {
        return userService.getAllUsers();
    }
}
```

@tab Kotlin [icon=kotlin]

### Controller

```kotlin
package com.example.demo.controller

import com.example.demo.service.UserService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/users")
class UserController(
    private val userService: UserService
) {

    @GetMapping("/{id}")
    fun getUserById(@PathVariable id: String): String = userService.getUserById(id)

    @GetMapping
    fun getAllUsers(): String = userService.getAllUsers()
}
```

:::

---

## ▶️ Uygulamayı Çalıştırın

Uygulamayı aşağıdaki komutlarla çalıştırın:

- **Spring Boot (Java/Kotlin):**

  ```bash
  ./mvnw spring-boot:run
  ```

API'ye şu adresten erişin: `http://localhost:8080/api/users`.

---

## 🧪 API'yi Test Edin

API'yi aşağıdaki cURL komutlarıyla test edebilirsiniz:

- **Tüm kullanıcıları alın:**

```bash
curl -X GET http://localhost:8080/api/users
```

- **Belirli bir kullanıcıyı alın:**

```bash
curl -X GET http://localhost:8080/api/users/1
```

---

Bu kılavuz, Java ve Kotlin ile Spring Boot'ta Bağımlılık Enjeksiyonu'nun nasıl uygulanacağını, servis enjeksiyonunu ve REST API entegrasyonunu göstermektedir.
