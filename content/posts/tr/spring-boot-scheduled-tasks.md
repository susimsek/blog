---
title: 'Spring Boot Planlanmış Görevler'
date: '2025-02-20'
summary: 'Spring Boot ile @Scheduled anotasyonunu kullanarak belirli aralıklarla veya cron ifadeleriyle arka plan görevlerini nasıl çalıştıracağınızı öğrenin.'
thumbnail: '/images/spring-boot-scheduled-thumbnail.jpg'
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
  - id: 'scheduled-tasks'
    name: 'Planlanmış Görevler'
    color: 'blue'
  - id: 'programming'
    name: 'Programlama'
    color: 'brown'
---

Spring Boot, `@Scheduled` anotasyonu ile arka planda çalışan görevleri kolayca planlamanızı sağlar. Bu yöntem, periyodik görevleri, otomasyon süreçlerini ve toplu işlemleri manuel müdahaleye gerek kalmadan yürütmek için idealdir.

---

## 🌟 Neden Spring Boot @Scheduled Kullanmalıyız?

- **Görevleri Otomatikleştirin**: İşlemleri belirli aralıklarla çalıştırın.
- **Kaynakları Verimli Kullanın**: Ana iş parçacıklarını bloklamadan görevleri planlayın.
- **Farklı Zamanlama Seçenekleri**: Sabit oranlı, sabit gecikmeli veya cron tabanlı zamanlamalar.
- **Spring Boot Entegrasyonu**: Uygulama yaşam döngüsüyle sorunsuz çalışır.

---

## 🌟 Gereksinimler

Şunlara sahip olduğunuzdan emin olun:

- ☕ **Java Development Kit (JDK)** 17+
- 📦 **Maven veya Gradle** kurulu
- 🔤 Bir **Java IDE** (IntelliJ IDEA, Eclipse vb.)

---

## 🛠️ Adım 1: Bağımlılıkları Ekleyin

Cron desteğini etkinleştirmek için `spring-boot-starter-web` bağımlılığını `pom.xml` veya `build.gradle` dosyanıza ekleyin.

**Maven:**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

**Gradle:**

```groovy
implementation 'org.springframework.boot:spring-boot-starter-web'
```

> **Neden `spring-boot-starter-web`?** > `@Scheduled` anotasyonu çalışırken **Spring Context** gerektirir. `spring-boot-starter-web` eklenerek uygulama yaşam döngüsünün doğru şekilde yönetilmesi sağlanır.

---

## 📋 Adım 2: Cron Etkinleştirme

Cron desteğini etkinleştirmek için ana uygulama sınıfınıza `@EnableScheduling` anotasyonunu ekleyin.

:::tabs
@tab Java [icon=java]

```java
package com.example.scheduled;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ScheduledApplication {
    public static void main(String[] args) {
        SpringApplication.run(ScheduledApplication.class, args);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.scheduled

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
class ScheduledApplication

fun main(args: Array<String>) {
    runApplication<ScheduledApplication>(*args)
}
```

:::

---

## 📖 Adım 3: Planlanmış Bir Görev Tanımlayın

`@Scheduled` kullanarak zamanlanmış bir görev oluşturun.

:::tabs
@tab Java [icon=java]

```java
package com.example.scheduled;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalTime;

@Service
public class ScheduledTask {

    @Scheduled(fixedRate = 5000)
    public void runTask() {
        System.out.println("Planlanmış görev çalıştırıldı: " + LocalTime.now());
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.scheduled

import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.LocalTime

@Service
class ScheduledTask {

    @Scheduled(fixedRate = 5000)
    fun runTask() {
        println("Planlanmış görev çalıştırıldı: ${LocalTime.now()}")
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

Planlanmış görev **her 5 saniyede bir** çalıştırılacaktır.

---

## 🧪 Planlanmış Görevi Test Etme

### Beklenen Konsol Çıktısı:

```plaintext
Planlanmış görev çalıştırıldı: 12:00:01
Planlanmış görev çalıştırıldı: 12:00:06
Planlanmış görev çalıştırıldı: 12:00:11
```

---

Spring Boot’un `@Scheduled` anotasyonu, arka plan görevlerini belirli aralıklarla çalıştırmayı kolaylaştırır. **Sabit aralıkta çalışan görevler, cron tabanlı zamanlama ve gecikmeli yürütme** gibi birçok esnek seçenekle, Spring Boot scheduling mekanizması güçlü ve kullanışlı bir çözümdür.
