---
title: 'Spring Boot Sanal Thread’li Asenkron Görevler'
publishedDate: '2025-04-26'
category:
  id: programming
  name: Programlama
  color: blue
  icon: code
updatedDate: '2025-04-27'
summary: 'Spring Boot’ta JDK 21 sanal thread’leri ve `@Async` anotasyonunu kullanarak hafif ve ölçeklenebilir asenkron görevleri nasıl oluşturacağınızı öğrenin.'
thumbnail: '/images/spring-boot-async-virtual-thumbnail.webp'
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
  - id: 'async-tasks'
    name: 'Asenkron Görevler'
    color: 'blue'
  - id: 'virtual-thread'
    name: 'Sanal Thread'
    color: 'orange'
---

Spring Boot 3.2 ve üzeri sürümler, JDK 21’in sanal thread desteğini otomatik olarak yapılandırarak `@Async` anotasyonuyla basit ve yüksek performanslı asenkron işlemler yapmanıza imkan tanır.

---

## 🌟 Neden Spring Boot'ta Sanal Thread Kullanmalıyız?

Bu bölümde Neden Spring Boot'ta Sanal Thread Kullanmalıyız? konusunu netleştirip uygulamada kullanacağınız temel noktaları özetliyoruz.

- Hafif Maliyet: Sanal thread’ler, geleneksel platform thread’lere kıyasla çok daha az kaynak kullanır.
- Bloklamasız: `@Async` ile işaretlenen metodlar ana thread’i meşgul etmeden çalışır.
- Yüksek Ölçeklenebilirlik: Binlerce concurrent iş yükünü düşük bellek ayak iziyle yönetir.
- Basit Konfigürasyon: Tek bir özellik (property) ekleyerek tüm executor ve scheduler’ları sanal thread’li yapar.

---

## 📋 Gereksinimler

Bu bölümde Gereksinimler konusunu netleştirip uygulamada kullanacağınız temel noktaları özetliyoruz.

- ☕ Java Development Kit (JDK) 21 veya üzeri
- 📦 Spring Boot 3.2+
- 🔤 IDE (IntelliJ IDEA, Eclipse vb.)

---

## 🛠️ Adım 1: Bağımlılıkları Ekle

Asenkron işleme olanak tanıyan `spring-boot-starter-web` paketini projenize ekleyin.

Maven:

```xml filename="pom.xml"
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

Gradle:

```groovy filename="build.gradle"
implementation 'org.springframework.boot:spring-boot-starter-web'
```

---

## 🛠️ Adım 2: Sanal Thread’leri Aktifleştir

`application.yml` veya `application.properties` dosyanıza şu satırı ekleyin:

```yaml filename="application.yml"
spring:
  threads:
    virtual:
      enabled: true
```

```properties filename="application.properties"
spring.threads.virtual.enabled=true
```

Bu ayar, aşağıdakileri otomatik yapılandırır:

- `applicationTaskExecutor` (Async)
- Task scheduler (`@Scheduled`)
- HTTP sunucu thread havuzları (Tomcat/Jetty)

---

## 🛠️ Adım 3: Asenkron Desteği Aktif Etme

Ana uygulama sınıfınıza `@EnableAsync` ekleyin:

:::tabs
@tab Java [icon=java]

```java filename="AsyncVirtualApplication.java"
package com.example.async;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class AsyncVirtualApplication {
    public static void main(String[] args) {
        SpringApplication.run(AsyncVirtualApplication.class, args);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="AsyncVirtualApplication.kt"
package com.example.async

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableAsync

@SpringBootApplication
@EnableAsync
class AsyncVirtualApplication

fun main(args: Array<String>) {
    runApplication<AsyncVirtualApplication>(*args)
}
```

:::

---

## 🛠️ Adım 4: Asenkron Servis Tanımla

`@Async` anotasyonlu metodlar sanal thread üzerinde çalışır:

:::tabs
@tab Java [icon=java]

```java filename="AsyncVirtualService.java"
package com.example.async;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
public class AsyncVirtualService {

    @Async
    public void runTask() {
        log.info("[{}] Asenkron başlatıldı: {}", LocalTime.now(), Thread.currentThread());
        try { Thread.sleep(1000); } catch (InterruptedException ignored) {}
        log.info("[{}] Asenkron tamamlandı: {}", LocalTime.now(), Thread.currentThread());
    }

    @Async
    public CompletableFuture<String> runAndReturn() throws InterruptedException {
        Thread.sleep(500);
        return CompletableFuture.completedFuture("Tamamlandı");
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="AsyncVirtualService.kt"
package com.example.async

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service

import java.time.LocalTime
import java.util.concurrent.CompletableFuture

@Service
class AsyncVirtualService {
    private val log = LoggerFactory.getLogger(AsyncVirtualService::class.java)

    @Async
    fun runTask() {
        log.info("[{}] Asenkron başlatıldı: {}", LocalTime.now(), Thread.currentThread())
        try { Thread.sleep(1000) } catch (_: InterruptedException) {}
        log.info("[{}] Asenkron tamamlandı: {}", LocalTime.now(), Thread.currentThread())
    }

    @Async
    fun runAndReturn(): CompletableFuture<String> {
        Thread.sleep(500)
        return CompletableFuture.completedFuture("Tamamlandı")
    }
}
```

:::

---

## 🛠️ Adım 5: REST Controller ile Tetikle

Aşağıdaki endpoint’leri kullanarak servis metodlarını tetikleyin:

:::tabs
@tab Java [icon=java]

```java filename="AsyncVirtualController.java"
package com.example.async;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/async")
@RequiredArgsConstructor
public class AsyncVirtualController {

    private final AsyncVirtualService service;

    @GetMapping("/run")
    public String triggerRun() {
        service.runTask();
        return "Asenkron sanal thread görevi tetiklendi";
    }

    @GetMapping("/run-return")
    public String triggerRunAndReturn() throws Exception {
        var future = service.runAndReturn();
        return future.get();
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="AsyncVirtualController.kt"
package com.example.async

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

import lombok.RequiredArgsConstructor

@RestController
@RequestMapping("/async")
@RequiredArgsConstructor
class AsyncVirtualController(private val service: AsyncVirtualService) {

    @GetMapping("/run")
    fun triggerRun(): String {
        service.runTask()
        return "Asenkron sanal thread görevi tetiklendi"
    }

    @GetMapping("/run-return")
    @Throws(Exception::class)
    fun triggerRunAndReturn(): String {
        val future = service.runAndReturn()
        return future.get()
    }
}
```

:::

---

## ▶️ Uygulamayı Çalıştır

```bash
./mvnw spring-boot:run
# veya
gradle bootRun
```

---

## 🧪 Endpointleri Test Et

Void görevi tetikle

```bash
curl http://localhost:8080/async/run
```

Sanal thread başlangıç/bitiş log’larını kontrol edin.

Sonuç döndüren görevi tetikle

```bash
curl http://localhost:8080/async/run-return
# dönen: "Tamamlandı"
```

---

## 🏁 Sonuç

Artık Spring Boot Sanal Thread’li Asenkron Görevler için üretim odaklı bir Spring Boot temeliniz var. Sonraki adımda ayarları kendi domainine uyarlayıp test ve gözlemlenebilirlik katmanını ekleyerek gerçek trafik altında doğrulayın.
