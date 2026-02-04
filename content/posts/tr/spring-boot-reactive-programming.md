---
title: 'Spring Boot Reaktif Programlama'
date: '2025-02-19'
summary: 'Spring Boot ile Project Reactor ve WebFlux kullanarak yüksek performanslı, eşzamanlı işleme sahip reaktif uygulamalar oluşturmayı öğrenin.'
thumbnail: '/images/spring-boot-reactive-thumbnail.webp'
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
  - id: 'reactive-programming'
    name: 'Reaktif Programlama'
    color: 'blue'
  - id: 'webflux'
    name: 'Spring WebFlux'
    color: 'orange'
  - id: 'programming'
    name: 'Programlama'
    color: 'brown'
---

Spring Boot ile **Reaktif Programlama**, geliştiricilere **bloklamayan, olay güdümlü** ve **yüksek ölçeklenebilir** uygulamalar oluşturma imkanı sunar. **Spring WebFlux** ve **Project Reactor** kullanarak eşzamanlı istekleri düşük kaynak kullanımıyla yönetebilir, mikro hizmetler ve gerçek zamanlı uygulamalar geliştirebilirsiniz.

---

## 🌟 Neden Reaktif Programlama Kullanmalıyız?

- **Eşzamansız & Bloklamayan İşleme**: Birden fazla isteği iş parçacıklarını bloklamadan verimli bir şekilde yönetin.
- **Daha İyi Ölçeklenebilirlik**: Daha az kaynak kullanarak daha fazla eşzamanlı kullanıcıyı destekleyin.
- **Olay Güdümlü Model**: Mikro hizmetler, gerçek zamanlı uygulamalar ve veri akışı işleme için idealdir.
- **Dahili Geri Basınç (Backpressure)**: Sistemin aşırı yüklenmesini önler.

---

## 📋 Gereksinimler

Şunlara sahip olduğunuzdan emin olun:

- ☕ **Java Development Kit (JDK)** 17+
- 📦 **Maven veya Gradle** kurulu
- 🔤 Bir **Java IDE** (IntelliJ IDEA, Eclipse vb.)

---

## 🛠️ Adım 1: Bağımlılıkları Ekleyin

**Spring WebFlux** bağımlılığını `pom.xml` veya `build.gradle` dosyanıza ekleyin.

**Maven:**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
```

**Gradle:**

```groovy
implementation 'org.springframework.boot:spring-boot-starter-webflux'
```

---

## 🛠️ Adım 2: Reaktif REST Controller Oluşturun

**Mono** ve **Flux** kullanarak **bloklamayan** bir REST endpoint'i tanımlayın.

:::tabs
@tab Java [icon=java]

```java
package com.example.reaktif;

import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/reaktif")
public class ReaktifController {

    @GetMapping("/mono")
    public Mono<String> getMono() {
        return Mono.just("Reaktif Mono'dan Merhaba!");
    }

    @GetMapping("/flux")
    public Flux<String> getFlux() {
        return Flux.fromIterable(List.of("Merhaba", "Reaktif", "Dünya"))
                   .delayElements(Duration.ofSeconds(1));
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.reaktif

import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.Duration

@RestController
@RequestMapping("/reaktif")
class ReaktifController {

    @GetMapping("/mono")
    fun getMono(): Mono<String> {
        return Mono.just("Reaktif Mono'dan Merhaba!")
    }

    @GetMapping("/flux")
    fun getFlux(): Flux<String> {
        return Flux.just("Merhaba", "Reaktif", "Dünya")
            .delayElements(Duration.ofSeconds(1))
    }
}
```

:::

---

## ▶️ Uygulamayı Çalıştırma

Spring Boot uygulamasını çalıştırın:

```bash
./mvnw spring-boot:run
```

Veya Gradle kullanarak:

```bash
gradle bootRun
```

---

## 🧪 API'yi Test Etme

### Mono Endpoint Testi:

```bash
curl -X GET http://localhost:8080/reaktif/mono
```

**Beklenen çıktı:**

```plaintext
Reaktif Mono'dan Merhaba!
```

### Flux Endpoint Testi:

```bash
curl -X GET http://localhost:8080/reaktif/flux
```

**Beklenen çıktı (her kelime için 1 saniyelik gecikme ile):**

```plaintext
Merhaba
Reaktif
Dünya
```

---

## 🏁 Sonuç

Bu kurulum, Spring Boot ile Spring Boot Reaktif Programlama için sağlam ve üretim‑hazır bir yaklaşım sunar; en iyi pratikleri, net bir yapı ve kendi projenize uyarlayabileceğiniz örneklerle birleştirir.
