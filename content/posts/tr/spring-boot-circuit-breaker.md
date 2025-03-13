---
title: 'Spring Boot Circuit Breaker'
date: '2025-03-13'
summary: 'Spring Boot uygulamalarında dayanıklı mikro hizmetler için Circuit Breaker nasıl uygulanır öğrenin.'
thumbnail: '/images/spring-boot-circuit-breaker-thumbnail.webp'
readingTime: '3 dakika okuma'
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
  - id: 'spring-cloud'
    name: 'Spring Cloud'
    color: 'pink'
  - id: 'circuit-breaker'
    name: 'Circuit Breaker'
    color: 'blue'
  - id: 'microservice'
    name: 'Mikroservis'
    color: 'orange'
  - id: 'programming'
    name: 'Programlama'
    color: 'brown'
---

Spring Boot **Circuit Breaker**, mikro hizmetler mimarisinde ardışık hataların önlenmesi için kullanılan bir hata toleransı mekanizmasıdır. Hataları algılayarak ve sağlıksız hizmetlere aşırı istekleri durdurarak uygulamaların hataları zarif bir şekilde yönetmesine yardımcı olur. Bu kılavuz, Spring Boot'ta **Resilience4j** kullanarak Circuit Breaker uygulamasını adım adım açıklamaktadır.

---

## 🌟 Neden Circuit Breaker Kullanmalıyız?

- **Mikro hizmetlerde zincirleme hataları önler**.
- **Uygulama dayanıklılığını artırır**, aşırı hatalı istekleri durdurur.
- **Hizmet sağlığı geri kazandığında otomatik olarak iyileşir**.
- **Gereksiz bekleme sürelerini önleyerek gecikmeyi azaltır**.
- **Hataları yönetmek için yapılandırılabilir yeniden deneme stratejileri sunar**.

---

## 🌟 Ön Koşullar

Aşağıdakilere sahip olduğunuzdan emin olun:

- ☕ **Java Development Kit (JDK) 17+**
- 📞 **Maven veya Gradle** kurulu
- 🌐 **Spring Boot & Spring Cloud**
- 🧐 **Circuit Breaker davranışını göstermek için bir REST API**

---

## 🛠️ Adım 1: Bağımlılıkları Ekleyin

### Maven Yapılandırması:

```xml
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-starter-circuitbreaker-resilience4j</artifactId>
</dependency>
```

### Gradle Yapılandırması:

```groovy
implementation 'org.springframework.cloud:spring-cloud-starter-circuitbreaker-resilience4j'
```

---

## 🛠️ Adım 2: Circuit Breaker Özelliklerini Yapılandırma

`application.yml` dosyanızda Circuit Breaker ayarlarını tanımlayın.

```yaml
resilience4j:
  circuitbreaker:
    instances:
      externalService:
        failure-rate-threshold: 50
        slow-call-rate-threshold: 50
        slow-call-duration-threshold: 2000ms
        permitted-number-of-calls-in-half-open-state: 3
        sliding-window-size: 10
        minimum-number-of-calls: 5
        wait-duration-in-open-state: 5s
```

---

## 🛠️ Adım 3: Circuit Breaker Kullanarak Bir REST Servisi Uygulama

:::tabs
@tab Java [icon=java]

```java
package com.example.circuitbreaker.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ExternalService {

    private final RestTemplate restTemplate = new RestTemplate();

    @CircuitBreaker(name = "externalService", fallbackMethod = "fallbackResponse")
    public String callExternalAPI() {
        return restTemplate.getForObject("http://unreliable-service/api/data", String.class);
    }

    public String fallbackResponse(Exception e) {
        return "Fallback response: Service is unavailable!";
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.circuitbreaker.service

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate

@Service
class ExternalService {
    private val restTemplate = RestTemplate()

    @CircuitBreaker(name = "externalService", fallbackMethod = "fallbackResponse")
    fun callExternalAPI(): String {
        return restTemplate.getForObject("http://unreliable-service/api/data", String::class.java) ?: ""
    }

    fun fallbackResponse(e: Exception): String {
        return "Fallback response: Service is unavailable!"
    }
}
```

:::

---

## 🛠️ Adım 4: Bir REST Controller Oluşturun

:::tabs
@tab Java [icon=java]

```java
package com.example.circuitbreaker.controller;

import com.example.circuitbreaker.service.ExternalService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class CircuitBreakerController {

    private final ExternalService externalService;

    public CircuitBreakerController(ExternalService externalService) {
        this.externalService = externalService;
    }

    @GetMapping("/data")
    public String fetchData() {
        return externalService.callExternalAPI();
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.circuitbreaker.controller

import com.example.circuitbreaker.service.ExternalService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
class CircuitBreakerController(private val externalService: ExternalService) {

    @GetMapping("/data")
    fun fetchData(): String {
        return externalService.callExternalAPI()
    }
}
```

:::

---

## ▶️ Uygulamayı Çalıştırma

Uygulamayı başlatın:

```bash
./mvnw spring-boot:run
```

veya Gradle kullanarak:

```bash
gradle bootRun
```

---

## 🧪 Circuit Breaker'ı Test Etme

Circuit Breaker’ı test etmek için:

```bash
curl -X GET http://localhost:8080/api/data
```

---

Spring Boot Circuit Breaker ile **Resilience4j**, mikro hizmetlerdeki zincirleme hataları önlemeye yardımcı olur. Hataları izleyerek ve başarısız hizmetlere gereksiz çağrıları durdurarak sistem kararlılığını ve genel uygulama dayanıklılığını artırır. 🚀
