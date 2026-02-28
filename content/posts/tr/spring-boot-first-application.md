---
title: 'Spring Boot - İlk Uygulama'
publishedDate: '2024-12-10'
category:
  id: programming
  name: Programlama
  color: blue
  icon: code
updatedDate: '2024-12-11'
summary: 'Spring Boot ile ilk uygulamanızı sıfırdan oluşturmak için başlangıç seviyesinde bir rehber. Temel bilgileri öğrenin ve Spring Boot ile yolculuğunuza başlayın.'
thumbnail: '/images/spring-boot-first-app-thumbnail.webp'
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
  - id: 'beginner-guide'
    name: 'Başlangıç Rehberi'
    color: 'orange'
---

Spring Boot, Spring Framework ile üretim için hazır uygulamalar oluşturmayı kolaylaştırır. Bu rehberde, adım adım ilk Spring Boot uygulamanızı oluşturmayı öğreneceksiniz.

---

## 🌟 Bu yazıda ne öğreneceksin?

Bu bölümde Bu yazıda ne öğreneceksin? konusunu netleştirip uygulamada kullanacağınız temel noktaları özetliyoruz.

- Java veya Kotlin ile temel bir Spring Boot projesi başlatmayı.
- İlk HTTP endpoint’ini yazıp hızlıca doğrulamayı.
- Uygulamayı lokalde çalıştırıp sonraki özellikler için temiz bir temel kurmayı.

---

## 📋 Gereksinimler

📋 Başlamadan önce aşağıdaki araçların kurulu olduğundan emin olun:

- ☕ Java Geliştirme Kiti (JDK) 17+
- 📦 Maven veya Gradle
- 🖥️ Bir Java IDE'si (Örneğin IntelliJ IDEA, Eclipse veya Visual Studio Code)

---

## 🛠️ Adım 1: Spring Boot Projesi Oluşturma

İlk Spring Boot projenizi iki şekilde oluşturabilirsiniz:

1. Spring Initializr Kullanarak 🖱️

- [Spring Initializr](https://start.spring.io/) adresini ziyaret edin.
- Aşağıdaki gibi yapılandırın:
  - 📂 Proje: `Maven`
  - 👨‍💻 Dil: `Java` veya `Kotlin`
  - 🔄 Spring Boot Sürümü: `3.0.0` (veya en güncel sürüm).
  - 📜 Bağımlılıklar: `Spring Web`
- Generate düğmesine tıklayarak proje dosyalarını indirin.

2. IntelliJ IDEA Kullanarak 💻

- IntelliJ IDEA’yı açın.
- `New Project > Spring Initializr` bölümüne gidin.
- Yukarıda belirtilen parametrelerle benzer şekilde yapılandırın.

---

## 🛠️ Adım 2: İlk Endpoint’inizi Yazma

Bir "hello" mesajı dönen basit bir endpoint yazalım:

:::tabs  
@tab Java [icon=java]

```java filename="DemoApplication.java"
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    @GetMapping("/hello")
    public String sayHello() {
        return "Merhaba, Spring Boot!";
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="DemoApplication.kt"
package com.example.demo

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@SpringBootApplication
@RestController
class DemoApplication

fun main(args: Array<String>) {
    runApplication<DemoApplication>(*args)
}

@GetMapping("/hello")
fun sayHello(): String {
    return "Merhaba, Spring Boot!"
}
```

:::

---

## ▶️ Adım 3: Uygulamayı Çalıştırma

Bu bölümde Adım 3: Uygulamayı Çalıştırma konusunu netleştirip uygulamada kullanacağınız temel noktaları özetliyoruz.

1. Proje klasöründe bir terminal açın.
2. Uygulamanızı çalıştırmak için şu komutu yürütün:

```bash
./mvnw spring-boot:run
```

3. Endpoint’e şu adresten erişebilirsiniz:
   ```filename="snippet.txt"
   http://localhost:8080/hello
   ```

Yanıt:

```filename="snippet.txt"
Merhaba, Spring Boot!
```

---

## 🏁 Sonuç

Artık Spring Boot - İlk Uygulama için üretim odaklı bir Spring Boot temeliniz var. Sonraki adımda ayarları kendi domainine uyarlayıp test ve gözlemlenebilirlik katmanını ekleyerek gerçek trafik altında doğrulayın.
