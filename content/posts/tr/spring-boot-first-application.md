---
title: 'Spring Boot - İlk Uygulamanız'
date: '2024-12-10'
summary: 'Spring Boot ile ilk uygulamanızı sıfırdan oluşturmak için başlangıç seviyesinde bir rehber. Temel bilgileri öğrenin ve Spring Boot ile yolculuğunuza başlayın.'
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

Spring Boot, Spring Framework ile üretim için hazır uygulamalar oluşturmayı kolaylaştırır. Bu rehberde, adım adım ilk Spring Boot uygulamanızı oluşturmayı öğreneceksiniz.

---

### **Gereksinimler**

Başlamadan önce aşağıdaki öğelerin yüklü olduğundan emin olun:

- **Java Development Kit (JDK)** 17+ yüklü
- **Maven veya Gradle** yüklü
- Bir **Java IDE** (ör. IntelliJ IDEA, Eclipse veya Visual Studio Code)

---

### **Adım 1: Bir Spring Boot Projesi Oluşturun**

İlk Spring Boot projenizi iki şekilde oluşturabilirsiniz:

1. **Spring Initializr Kullanarak:**

- [Spring Initializr](https://start.spring.io/) adresini ziyaret edin.
- Şu şekilde yapılandırın:
  - Proje: `Maven`
  - Dil: `Java`
  - Spring Boot Sürümü: `3.0.0` (veya en son sürüm).
  - Bağımlılık ekleyin: `Spring Web`
- Proje dosyalarını indirmek için **Generate** düğmesine tıklayın.

2. **IntelliJ IDEA Kullanarak:**

- IntelliJ IDEA'yı açın.
- `Yeni Proje > Spring Initializr` bölümüne gidin.
- Yukarıda belirtilenlere benzer parametreleri yapılandırın.

---

### **Adım 2: İlk Endpoint'inizi Yazın**

Merhaba diyecek basit bir endpoint yazalım.

:::tabs
@tab Java

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

@tab Kotlin

```kotlin
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

### **Adım 3: Uygulamayı Çalıştırın**

1. Proje klasöründe bir terminal açın.
2. Aşağıdaki komutu çalıştırarak uygulamanızı başlatın:

```bash
./mvnw spring-boot:run
```

3. Şu adrese erişin:
   ```
   http://localhost:8080/hello
   ```

**Cevap:**

```
Merhaba, Spring Boot!
```

---

Bu yazı, bir Spring Boot projesi oluşturmanın, bir endpoint yazmanın ve başarıyla çalıştırmanın temel bilgilerini kapsar.
