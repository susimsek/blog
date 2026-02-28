---
title: 'Spring Boot Asenkron Görevler'
publishedDate: '2025-02-20'
category:
  id: programming
  name: Programlama
  color: blue
  icon: code
updatedDate: '2025-02-21'
summary: 'Spring Boot ile @Async kullanarak görevleri ana threadi engellemeden asenkron olarak nasıl çalıştıracağınızı öğrenin.'
thumbnail: '/images/spring-boot-async-thumbnail.webp'
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
---

Spring Boot, `@Async` anotasyonu ile arka planda asenkron görevler çalıştırmayı kolaylaştırır. Bu, ana threadi engellemeden görevleri çalıştırarak uygulamanın performansını artırmak ve yanıt süresini optimize etmek için kullanılır.

---

## 🌟 Neden Spring Boot'ta @Async Kullanmalıyız?

Bu bölümde Neden Spring Boot'ta @Async Kullanmalıyız? konusunu netleştirip uygulamada kullanacağınız temel noktaları özetliyoruz.

- Engellenmeyen Çalıştırma: Görevleri ana thread'i bekletmeden çalıştırır.
- Geliştirilmiş Performans: Bağımsız görevleri paralel olarak yürütür.
- Daha İyi Ölçeklenebilirlik: Diğer süreçler için kaynakları serbest bırakır.
- Kolay Entegrasyon: Spring Boot’un bağımlılık enjeksiyonu ve yaşam döngüsü yönetimiyle sorunsuz çalışır.

---

## 📋 Gereksinimler

Şu gereksinimlere sahip olduğunuzdan emin olun:

- ☕ Java Development Kit (JDK) 17+
- 📦 Maven veya Gradle kurulu
- 🔤 Bir Java IDE (IntelliJ IDEA, Eclipse vb.)

---

## 🛠️ Adım 1: Bağımlılıkları Ekleyin

Asenkron işlemleri etkinleştirmek için spring-boot-starter-web bağımlılığını `pom.xml` veya `build.gradle` dosyanıza ekleyin.

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

## 🛠️ Adım 2: Uygulamanızda Asenkron İşlemi Etkinleştirin

Ana uygulama sınıfınıza `@EnableAsync` anotasyonunu ekleyerek asenkron çalışmayı etkinleştirin.

:::tabs
@tab Java [icon=java]

```java filename="AsyncApplication.java"
package com.example.async;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class AsyncApplication {
    public static void main(String[] args) {
        SpringApplication.run(AsyncApplication.class, args);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="AsyncApplication.kt"
package com.example.async

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableAsync

@SpringBootApplication
@EnableAsync
class AsyncApplication

fun main(args: Array<String>) {
    runApplication<AsyncApplication>(*args)
}
```

:::

---

## 🛠️ Adım 3: Asenkron Bir Görev Tanımlayın

`@Async` anotasyonunu kullanarak bir asenkron metot tanımlayın.

:::tabs
@tab Java [icon=java]

```java filename="AsyncTask.java"
package com.example.async;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.time.LocalTime;

@Service
public class AsyncTask {

    @Async
    public void runTask() {
        System.out.println("Asenkron görev çalıştırıldı: " + LocalTime.now());
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="AsyncTask.kt"
package com.example.async

import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import java.time.LocalTime

@Service
class AsyncTask {

    @Async
    fun runTask() {
        println("Asenkron görev çalıştırıldı: ${LocalTime.now()}")
    }
}
```

:::

---

## 🛠️ Adım 4: Asenkron Görevleri Tetiklemek için Bir Controller Oluşturun

Bir REST controller oluşturarak asenkron işlemi tetikleyin.

:::tabs
@tab Java [icon=java]

```java filename="AsyncController.java"
package com.example.async;

import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/async")
@RequiredArgsConstructor
public class AsyncController {

    private final AsyncTask asyncTask;

    @GetMapping("/run")
    public String triggerAsyncTask() {
        asyncTask.runTask();
        return "Asenkron görev tetiklendi!";
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="AsyncController.kt"
package com.example.async

import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/async")
class AsyncController(
    private val asyncTask: AsyncTask
) {
    @GetMapping("/run")
    fun triggerAsyncTask(): String {
        asyncTask.runTask()
        return "Asenkron görev tetiklendi!"
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

## 🧪 Asenkron Görevi Test Etme

Bu bölümde Asenkron Görevi Test Etme konusunu netleştirip uygulamada kullanacağınız temel noktaları özetliyoruz.

### Asenkron Görevi Tetikleme:

Bu çağrı ile asenkron akışı tetikleyip görev yürütümünü loglar üzerinden takip edebilirsiniz.

```bash
curl -X GET http://localhost:8080/async/run
```

### Beklenen Konsol Çıktısı:

Kendi log çıktınızı bu örnekle karşılaştırarak davranışın doğru çalıştığını hızlıca teyit edin.

```plaintext filename="snippet.txt"
Asenkron görev çalıştırıldı: 12:00:01
```

---

## 🏁 Sonuç

Artık Spring Boot Asenkron Görevler için üretim odaklı bir Spring Boot temeliniz var. Sonraki adımda ayarları kendi domainine uyarlayıp test ve gözlemlenebilirlik katmanını ekleyerek gerçek trafik altında doğrulayın.
