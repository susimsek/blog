---
title: 'Spring Boot ile Aspect-Oriented Programming'
publishedDate: '2024-12-18'
category:
  id: programming
  name: Programlama
  color: blue
  icon: code
updatedDate: '2024-12-19'
summary: 'Spring Boot ile AOP uygulamasını nasıl yapacağınızı öğrenin. Java ve Kotlin örnekleri ile temel kavramlar ve uygulamalar.'
thumbnail: '/images/spring-boot-aop-thumbnail.webp'
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
  - id: 'aop'
    name: 'AOP'
    color: 'orange'
---

Aspect-Oriented Programming (AOP), logging, transaction management ve güvenlik gibi birçok alana yayılan kesme noktalarını modüler hale getiren bir yaklaşımdır. Bu kılavuzda, Spring Boot kullanarak AOP uygulaması yapmayı Java ve Kotlin ile göstereceğiz.

---

## 🌟 Neden AOP Kullanmalısınız?

AOP, bir uygulamanın birden fazla bölümünü etkileyen logging veya güvenlik gibi konuları tekrar kullanılabilir aspect'ler haline getirmek için kullanılır. Bu yöntem daha temiz kod, geliştirilmiş bakım kolaylığı ve azaltılmış kod tekrarı sağlar.

---

## 📋 Gereksinimler

📋 Aşağıdakilere sahip olduğunuzdan emin olun:

- ☕ Java Development Kit (JDK) 17+
- 📦 Maven veya Gradle kurulu
- 🔤 Java IDE (IntelliJ IDEA, Eclipse veya VS Code)

---

## 🛠️ Adım 1: Bağlılıkları Ekleyin

Projenize aşağıdaki bağlılıkları dahil edin:

Maven:

```xml filename="pom.xml"
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```

Gradle:

```groovy filename="build.gradle"
implementation 'org.springframework.boot:spring-boot-starter-aop'
```

---

## 🛠️ Adım 2: Bir Servis Tanımlayın

AOP'yi göstermek için basit bir servis oluşturun.

:::tabs
@tab Java [icon=java]

Servis

```java filename="UserService.java"
package com.example.demo.service;

import org.springframework.stereotype.Service;

@Service
public class UserService {

    public String getUserById(String id) {
        return "ID'ye sahip kullanıcı: " + id;
    }

    public String getAllUsers() {
        return "Tüm kullanıcılar alınıyor.";
    }
}
```

@tab Kotlin [icon=kotlin]

Servis

```kotlin filename="UserService.kt"
package com.example.demo.service

import org.springframework.stereotype.Service

@Service
class UserService {

    fun getUserById(id: String): String {
        return "ID'ye sahip kullanıcı: $id"
    }

    fun getAllUsers(): String {
        return "Tüm kullanıcılar alınıyor."
    }
}
```

:::

---

## 🛠️ Adım 3: Bir Aspect Oluşturun

Method çalışma detaylarını loglamak için bir aspect tanımlayın.

:::tabs
@tab Java [icon=java]

Aspect

```java filename="LoggingAspect.java"
package com.example.demo.aspect;

import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class LoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(LoggingAspect.class);

    @Before("execution(* com.example.demo.service.UserService.*(..))")
    public void logBefore() {
        logger.info("Method çalıştırılmaya başlandı.");
    }
}
```

@tab Kotlin [icon=kotlin]

Aspect

```kotlin filename="LoggingAspect.kt"
package com.example.demo.aspect

import org.aspectj.lang.annotation.Aspect
import org.aspectj.lang.annotation.Before
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Aspect
@Component
class LoggingAspect {

    private val logger = LoggerFactory.getLogger(LoggingAspect::class.java)

    @Before("execution(* com.example.demo.service.UserService.*(..))")
    fun logBefore() {
        logger.info("Yöntem çalıştırılmaya başlandı.")
    }
}
```

:::

---

## 🛠️ Adım 4: Bir Controller Oluşturun

Servis methodlarını bir REST controller üzerinden sunun.

:::tabs
@tab Java [icon=java]

Controller

```java filename="UserController.java"
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

Controller

```kotlin filename="UserController.kt"
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

## ▶️ Uygulamayı Çalıştırma

Aşağıdaki komutlarla uygulamayı çalıştırın:

Spring Boot (Java/Kotlin):
Kurulumun doğru çalıştığını doğrulamak için uygulamayı tercih ettiğiniz dil yığınıyla başlatın.

```bash
./mvnw spring-boot:run
```

API'ye şu adresten erişebilirsiniz: `http://localhost:8080/api/users`.

---

## 🧪 API'yi Test Edin

API'yi aşağıdaki cURL komutları ile test edebilirsiniz:

- Tüm kullanıcıları getir:

```bash
curl -X GET http://localhost:8080/api/users
```

- Bir ID'ye göre kullanıcı getir:

```bash
curl -X GET http://localhost:8080/api/users/1
```

---

## 🏁 Sonuç

Artık Aspect-Oriented Programming için üretim odaklı bir Spring Boot temeliniz var. Sonraki adımda ayarları kendi domainine uyarlayıp test ve gözlemlenebilirlik katmanını ekleyerek gerçek trafik altında doğrulayın.
