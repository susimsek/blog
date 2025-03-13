---
title: 'Spring Boot Temiz Kodlama Pratikleri'
date: '2024-12-19'
summary: "Spring Boot projelerinde temiz kodlama ilkelerini uygulamayı öğrenin. En iyi uygulamalar, örnekler ve Java'da Lombok ile Kotlin temiz kodlama tekniklerinin faydaları."
thumbnail: '/images/spring-boot-clean-coding-thumbnail.webp'
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
  - id: 'clean-coding'
    name: 'Temiz Kodlama'
    color: 'orange'
  - id: 'programming'
    name: 'Programlama'
    color: 'blue'
---

Temiz kodlama pratikleri, Spring Boot uygulamalarınızın bakımını kolaylaştırır, okunabilirliğini artırır ve geliştirilebilirliğini sağlar. Bu rehber, hem Java hem de Kotlin'de daha temiz ve verimli kod yazmanıza yardımcı olacak temel ipuçları ve kod örneklerini sunar.

---

## 🌟 Neden Temiz Kodlama?

Temiz kodlama ilkelerini benimsemek şu faydaları sağlar:

- Kodun okunabilirliğini ve bakımını iyileştirir.
- Teknik borcu azaltır.
- Yeni geliştiricilerin projeye alışmasını kolaylaştırır.
- Genişletilebilirlik ve hata ayıklama süreçlerini geliştirir.

---

## 🌟 Ön Koşullar

🗌 Aşağıdakilere sahip olduğunuzdan emin olun:

- ☕ **Java Development Kit (JDK)** 17+
- 📦 **Maven veya Gradle** kurulu
- 🔤 Bir **Java IDE** (IntelliJ IDEA, Eclipse vb.)
- 🛠️ Spring Boot temel bilgilerine hakimiyet

---

## 🛠️ Adım 1: Projenizi Yapılandırın

Spring Boot projenizi daha net bir hale getirmek için aşağıdaki gibi organize edin:

- **Controller Katmanı:** Gelen HTTP isteklerini yönetir.
- **Service Katmanı:** İş mantığını içerir.
- **Repository Katmanı:** Veritabanı ile etkileşir.

### Örnek Klasör Yapısı:

```
src/main/java/com/example/cleanproject
├── controller
├── service
├── repository
├── entity
└── dto
```

---

## 📋 Adım 2: Java Kodlarında Lombok Kullanımı

Lombok, Java'daki gereksiz kodu azaltarak sınıflarınızı daha kısa ve okunabilir hale getirir. İşte Lombok'u etkili bir şekilde kullanmanın yöntemi:

### Lombok Bağlılığını Ekleyin

- **Maven:**

```xml
<dependency>
  <groupId>org.projectlombok</groupId>
  <artifactId>lombok</artifactId>
  <scope>provided</scope>
</dependency>
```

- **Gradle:**

```groovy
provided 'org.projectlombok:lombok'
annotationProcessor 'org.projectlombok:lombok'
```

### Örnek: Lombok ile Entity

```java
package com.example.cleanproject.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String email;
}
```

**Faydalar:**

- `@Data`, getter, setter, equals, hashCode ve toString metotlarını otomatik olarak oluşturur.
- `@NoArgsConstructor` ve `@AllArgsConstructor` yapıcı metotları oluşturur.

---

## 📖 Adım 3: Kotlin'de Kısa ve Okunabilir Kod Yazın

Kotlin, modern özellikleri ile doğal olarak daha temiz kod yazılmasını sağlar:

### Örnek: Kotlin ile Entity

```kotlin
package com.example.cleanproject.entity

import jakarta.persistence.*

@Entity
data class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    var name: String,
    var email: String
)
```

**Kotlin'in Avantajları:**

- `data class`, `toString`, `equals` ve `hashCode` metotlarını otomatik olarak oluşturur.
- Değişmez özellikler (`val`) daha iyi stabilite sağlar.

---

## 📘 Adım 4: Dependency Injection Prensiplerini Takip Edin

Bileşenleri ayırmak ve test edilebilirliği arttırmak için dependency injectionu kullanın.

### Örnek: Service Katmanı ile DI

:::tabs
@tab Java [icon=java]

```java
package com.example.cleanproject.service;

import com.example.cleanproject.entity.User;
import com.example.cleanproject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.cleanproject.service

import com.example.cleanproject.entity.User
import com.example.cleanproject.repository.UserRepository
import org.springframework.stereotype.Service

@Service
class UserService(
    private val userRepository: UserRepository
) {
    fun getAllUsers(): List<User> = userRepository.findAll()
}
```

:::

---

## 🔒 Adım 5: Veri Transferi İçin DTO'ları Kullananın

Data Transfer Object (DTO), domain ve API katmanlarını ayırarak daha iyi kapsülleme sağlar.

### Örnek: User İçin DTO

:::tabs
@tab Java [icon=java]

```java
package com.example.cleanproject.dto;

import lombok.Data;

@Data
public class UserDTO {
    private String name;
    private String email;
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.cleanproject.dto

data class UserDTO(
    val name: String,
    val email: String
)
```

:::

---

## 📖 Controller Katmanı

HTTP isteklerini yönetmek ve service katmanıyla etkileşim sağlamak için bir controller uygulayın.

:::tabs
@tab Java [icon=java]

```java
package com.example.cleanproject.controller;

import com.example.cleanproject.dto.UserDTO;
import com.example.cleanproject.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserDTO> getAllUsers() {
        return userService.getAllUsers();
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.cleanproject.controller

import com.example.cleanproject.dto.UserDTO
import com.example.cleanproject.service.UserService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/users")
class UserController(
    private val userService: UserService
) {

    @GetMapping
    fun getAllUsers(): List<UserDTO> = userService.getAllUsers()
}
```

:::

---

## ▶️ Uygulamayı Çalıştırma

Uygulamayı aşağıdaki komutla çalıştırın:

```bash
./mvnw spring-boot:run
```

Postman veya cURL gibi bir aracı kullanarak endpoint'leri test edin.

---

## 🧪 API'yi Test Edin

API'yi aşağıdaki cURL komutu ile test edebilirsiniz:

- **Tüm kullanıcıları getir:**

```bash
curl -X GET http://localhost:8080/api/users
```

---

Temiz kodlama pratikleri, bakımı kolay ve geliştirilebilir Spring Boot uygulamaları oluşturmak için önemlidir. Lombok ve Kotlin'in araçlarından yararlanarak, modern geliştirme standartlarına uygun kısa ve okunabilir kod yazabilirsiniz.
