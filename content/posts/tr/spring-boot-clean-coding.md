---
title: 'Spring Boot Temiz Kodlama Pratikleri'
publishedDate: '2024-12-19'
updatedDate: '2024-12-20'
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

## 📋 Gereksinimler

🗌 Aşağıdakilere sahip olduğunuzdan emin olun:

- ☕ Java Development Kit (JDK) 17+
- 📦 Maven veya Gradle kurulu
- 🔤 Bir Java IDE (IntelliJ IDEA, Eclipse vb.)
- 🛠️ Spring Boot temel bilgilerine hakimiyet

---

## 🛠️ Adım 1: Projenizi Yapılandırın

Spring Boot projenizi daha net bir hale getirmek için aşağıdaki gibi organize edin:

- Controller Katmanı: Gelen HTTP isteklerini yönetir.
- Service Katmanı: İş mantığını içerir.
- Repository Katmanı: Veritabanı ile etkileşir.

### Örnek Klasör Yapısı:

Bu klasör yapısı, katmanlar arası sorumlulukları ayırarak bakım ve geliştirme hızını artırır.

```filename="snippet.txt"
src/main/java/com/example/cleanproject
├── controller
├── service
├── repository
├── entity
└── dto
```

---

## 🛠️ Adım 2: Java Kodlarında Lombok Kullanımı

Lombok, Java'daki gereksiz kodu azaltarak sınıflarınızı daha kısa ve okunabilir hale getirir. İşte Lombok'u etkili bir şekilde kullanmanın yöntemi:

### Lombok Bağlılığını Ekleyin

Önce Lombok bağımlılığını ekleyerek tekrar eden getter/setter ve constructor kodlarını otomatik üretime bırakın.

- Maven:

```xml filename="pom.xml"
<dependency>
  <groupId>org.projectlombok</groupId>
  <artifactId>lombok</artifactId>
  <scope>provided</scope>
</dependency>
```

- Gradle:

```groovy filename="build.gradle"
provided 'org.projectlombok:lombok'
annotationProcessor 'org.projectlombok:lombok'
```

### Örnek: Lombok ile Entity

Aşağıdaki örnek, Örnek: Lombok ile Entity için pratik bir bağlam sunar ve doğrudan uygulanabilir.

```java filename="User.java"
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

Faydalar:

- `@Data`, getter, setter, equals, hashCode ve toString metotlarını otomatik olarak oluşturur.
- `@NoArgsConstructor` ve `@AllArgsConstructor` yapıcı metotları oluşturur.

---

## 🛠️ Adım 3: Kotlin'de Kısa ve Okunabilir Kod Yazın

Kotlin, modern özellikleri ile doğal olarak daha temiz kod yazılmasını sağlar:

### Örnek: Kotlin ile Entity

Aşağıdaki örnek, Örnek: Kotlin ile Entity için pratik bir bağlam sunar ve doğrudan uygulanabilir.

```kotlin filename="User.kt"
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

Kotlin'in Avantajları:

- `data class`, `toString`, `equals` ve `hashCode` metotlarını otomatik olarak oluşturur.
- Değişmez özellikler (`val`) daha iyi stabilite sağlar.

---

## 🛠️ Adım 4: Dependency Injection Prensiplerini Takip Edin

Bileşenleri ayırmak ve test edilebilirliği arttırmak için dependency injectionu kullanın.

### Örnek: Service Katmanı ile DI

Aşağıdaki örnek, Örnek: Service Katmanı ile DI için pratik bir bağlam sunar ve doğrudan uygulanabilir.

:::tabs
@tab Java [icon=java]

```java filename="UserService.java"
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

```kotlin filename="UserService.kt"
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

## 🛠️ Adım 5: Veri Transferi İçin DTO'ları Kullananın

Data Transfer Object (DTO), domain ve API katmanlarını ayırarak daha iyi kapsülleme sağlar.

### Örnek: User İçin DTO

Aşağıdaki örnek, Örnek: User İçin DTO için pratik bir bağlam sunar ve doğrudan uygulanabilir.

:::tabs
@tab Java [icon=java]

```java filename="UserDTO.java"
package com.example.cleanproject.dto;

import lombok.Data;

@Data
public class UserDTO {
    private String name;
    private String email;
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="UserDTO.kt"
package com.example.cleanproject.dto

data class UserDTO(
    val name: String,
    val email: String
)
```

:::

---

### Controller Katmanı

HTTP isteklerini yönetmek ve service katmanıyla etkileşim sağlamak için bir controller uygulayın.

:::tabs
@tab Java [icon=java]

```java filename="UserController.java"
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

```kotlin filename="UserController.kt"
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

- Tüm kullanıcıları getir:

```bash
curl -X GET http://localhost:8080/api/users
```

---

## 🏁 Sonuç

Artık Spring Boot Temiz Kodlama Pratikleri için üretim odaklı bir Spring Boot temeliniz var. Sonraki adımda ayarları kendi domainine uyarlayıp test ve gözlemlenebilirlik katmanını ekleyerek gerçek trafik altında doğrulayın.
