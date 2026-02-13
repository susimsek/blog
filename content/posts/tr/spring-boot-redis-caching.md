---
title: 'Spring Boot ile Redis Önbellekleme'
date: '2024-12-22'
summary: 'Spring Boot uygulamanıza Redis önbellekleme uygulayarak performansını ve verimliliğini artırmayı öğrenin.'
thumbnail: '/images/spring-boot-redis-thumbnail.webp'
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
  - id: 'redis'
    name: 'Redis'
    color: 'orange'
  - id: 'caching'
    name: 'Önbellekleme'
    color: 'brown'
  - id: 'programming'
    name: 'Programlama'
    color: 'blue'
---

Redis, genellikle önbellekleme, mesajlaşma ve gerçek zamanlı veri yönetimi için kullanılan güçlü bir bellek içi veri deposudur. Bu kılavuz, Redis'i hem Java hem de Kotlin kullanarak bir Spring Boot uygulamasına nasıl entegre edeceğinizi açıklar.

---

## 🌟 Neden Redis Kullanmalıyız?

Bu bölümde Neden Redis Kullanmalıyız? konusunu netleştirip uygulamada kullanacağınız temel noktaları özetliyoruz.

- Yüksek Performans: Redis, okuma ve yazma işlemleri için son derece düşük gecikme süreleri sağlar.
- Esnek Veri Yapıları: String, hash, liste, set ve daha fazlasını destekler.
- Ölçüklenebilirlik: Dağıtık önbellekleme ve gerçek zamanlı analitik için idealdir.
- Kolay Entegrasyon: Spring Boot ile kolayca entegre edilebilir.

---

## 📋 Gereksinimler

👈 Aşağıdakilere sahip olduğunuzdan emin olun:

- ☕ Java Development Kit (JDK) 17+
- 📦 Maven veya Gradle yüklenmiş
- 🄤 Bir Java IDE (IntelliJ IDEA, Eclipse gibi)
- 🔠 Redis Sunucusu, lokal olarak yüklenmiş veya ağa erişilebilir

---

## 🛠️ Adım 1: Bağımlılıkları Ekleyin

Redis'i Spring Boot projenize entegre etmek için aşağıdaki bağımlıkları ekleyin:

- Maven:

```xml filename="pom.xml"
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

- Gradle:

```groovy filename="build.gradle"
implementation 'org.springframework.boot:spring-boot-starter-data-redis'
```

---

## 🛠️ Adım 2: Redis'i Yapılandırın

Redis bağlantısını `application.properties` veya `application.yml` dosyanızda yapılandırın.

### Örnek Yapılandırma:

Aşağıdaki örnek, Örnek Yapılandırma için pratik bir bağlam sunar ve doğrudan uygulanabilir.

```properties filename="application.properties"
spring.redis.host=localhost
spring.redis.port=6379
```

Parola doğrulama veya SSL gibi ileri düzey kurulumlar için şunları ekleyin:

```properties filename="application.properties"
spring.redis.password=sifre
spring.redis.ssl=true
```

---

## 🛠️ Adım 3: Önbelleği Etkinleştirin

Ana uygulama sınıfınıza `@EnableCaching` ekleyin:

:::tabs
@tab Java [icon=java]

```java filename="RedisApplication.java"
package com.example.redis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class RedisApplication {
  public static void main(String[] args) {
    SpringApplication.run(RedisApplication.class, args);
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="RedisApplication.kt"
package com.example.redis

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cache.annotation.EnableCaching

@SpringBootApplication
@EnableCaching
class RedisApplication

fun main(args: Array<String>) {
  runApplication<RedisApplication>(*args)
}
```

:::

---

### Servis Katmanında Önbellekleme Örneği

Aşağıdaki örnek, Servis Katmanında Önbellekleme Örneği için pratik bir bağlam sunar ve doğrudan uygulanabilir.

:::tabs
@tab Java [icon=java]

```java filename="UserService.java"
package com.example.redis.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class UserService {

  @Cacheable("users")
  public String getUserById(String id) {
    simulateSlowService();
    return "User with ID: " + id;
  }

  private void simulateSlowService() {
    try {
      Thread.sleep(3000L);
    } catch (InterruptedException e) {
      throw new IllegalStateException(e);
    }
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="UserService.kt"
package com.example.redis.service

import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service

@Service
class UserService {

  @Cacheable("users")
  fun getUserById(id: String): String {
    simulateSlowService()
    return "User with ID: $id"
  }

  private fun simulateSlowService() {
    Thread.sleep(3000L)
  }
}
```

:::

---

### Önbellek Zaman Aşımı (TTL) Yapılandırması

`application.properties` dosyasında önbellek sona erme sürelerini ayarlayın:

```properties filename="application.properties"
spring.cache.redis.time-to-live=600000
```

Bu, zaman aşımını 10 dakika (600.000 milisaniye) olarak ayarlar.

---

### Controller Örneği

Önbellekleme işlevini expose etmek için bir REST Controller oluşturun.

:::tabs
@tab Java [icon=java]

```java filename="UserController.java"
package com.example.redis.controller;

import com.example.redis.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  @GetMapping("/{id}")
  public String getUser(@PathVariable String id) {
    return userService.getUserById(id);
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="UserController.kt"
package com.example.redis.controller

import com.example.redis.service.UserService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/users")
class UserController(
  private val userService: UserService
) {
  @GetMapping("/{id}")
  fun getUser(@PathVariable id: String): String = userService.getUserById(id)
}
```

:::

---

## ▶️ Uygulamayı Çalıştırma

Uygulamayı aşağıdaki komutla çalıştırın:

```bash
./mvnw spring-boot:run
```

---

## 🧪 API’yı Test Etme

API’yı cURL veya Postman kullanarak test edebilirsiniz:

- Bir Kullanıcıyı Getir (önbellekli):

```bash
curl -X GET http://localhost:8080/users/1
```

---

## 🏁 Sonuç

Artık Redis Önbellekleme için üretim odaklı bir Spring Boot temeliniz var. Sonraki adımda ayarları kendi domainine uyarlayıp test ve gözlemlenebilirlik katmanını ekleyerek gerçek trafik altında doğrulayın.
