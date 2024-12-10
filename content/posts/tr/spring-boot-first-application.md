---
title: 'Spring Boot ile İlk Uygulama'
date: '2024-12-10'
summary: 'Spring Boot kullanarak sıfırdan ilk uygulamanızı nasıl oluşturacağınızı öğrenin. Bu yazı, başlangıç seviyesindeki kullanıcılar için rehber niteliğindedir.'
thumbnail: '/images/spring-boot-first-app-thumbnail.jpg'
topics:
  - id: 'spring-boot'
    name: 'Spring Boot'
    color: 'green'
  - id: 'beginner-guide'
    name: 'Başlangıç Rehberi'
    color: 'orange'
  - id: 'programming'
    name: 'Programlama'
    color: 'blue'
---

Spring Boot, Spring Framework ile üretime hazır uygulamaların geliştirilmesini kolaylaştırır. Bu rehberde, ilk Spring Boot uygulamanızı adım adım oluşturacağız.

## **Adım 1: Gereksinimler**

Başlamadan önce şu araçlara sahip olduğunuzdan emin olun:

- **Java Geliştirme Kiti (JDK)** 17+
- **Maven veya Gradle**
- Bir **IDE** (IntelliJ IDEA, Eclipse veya Visual Studio Code)

## **Adım 2: Yeni Proje Oluşturma**

Spring Initializr veya IDE kullanarak bir Spring Boot projesi oluşturabilirsiniz.

### **Seçenek 1: Spring Initializr ile**

1. [Spring Initializr](https://start.spring.io/) sitesine gidin.
2. Şunları seçin:
   - **Project:** Maven
   - **Language:** Java
   - **Spring Boot Version:** 3.0.0 (veya son sürüm)
   - **Dependencies:** Spring Web
3. **Generate** butonuna tıklayarak projeyi indirin.

### **Seçenek 2: IDE Kullanarak**

IntelliJ IDEA gibi modern IDE'lerde doğrudan Spring Initializr desteği bulunmaktadır.

## **Adım 3: İlk Endpoint'inizi Yazma**

Bir REST endpoint'i ekleyelim.

### **`DemoApplication.java`**

```java
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

## **Adım 4: Uygulamayı Çalıştırma**

Terminalde şu komutu çalıştırın:

```
./mvnw spring-boot:run
```

Tarayıcınızda şu adrese gidin:

```
http://localhost:8080/hello
```

Sonuç: **"Merhaba, Spring Boot!"**
