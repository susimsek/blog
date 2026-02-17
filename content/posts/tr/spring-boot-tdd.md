---
title: 'Spring Boot ile Test Odaklı Geliştirme'
publishedDate: '2025-04-09'
updatedDate: '2025-04-10'
summary: 'Spring Boot ile TDD yaklaşımını uygulamayı; önce test yazarak, iş mantığını geliştirerek ve testlerle kaliteyi garanti altına alarak öğrenin.'
thumbnail: '/images/spring-boot-tdd-thumbnail.webp'
readingTime: '1 dk okuma'
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
  - id: 'tdd'
    name: 'TDD'
    color: 'blue'
  - id: 'testing'
    name: 'Test'
    color: 'orange'
  - id: 'programming'
    name: 'Programlama'
    color: 'brown'
---

Test Odaklı Geliştirme (TDD), iş mantığını uygulamadan önce testler yazarak sağlam uygulamalar geliştirmeni sağlar. Spring Boot ile birim testler yazmak hızlı, temiz ve etkilidir.

---

## 🌟 Neden Spring Boot ile TDD?

Bu bölümde Neden Spring Boot ile TDD? konusunu netleştirip uygulamada kullanacağınız temel noktaları özetliyoruz.

- Hataları Erken Yakala: Geliştirme aşamasında problemleri fark et.
- Temiz Tasarım: Modüler ve test edilebilir kod yapısı zorunlu olur.
- Güvenle Refactor Et: Testler değişikliklerde güven sağlar.
- Dokümantasyon: Testler, beklenen davranışı anlatır.

---

## 📋 Gereksinimler

Şunlara sahip olduğundan emin ol:

- ☕ JDK 17+ kurulu
- 📦 Maven veya Gradle
- 🔤 Java IDE (IntelliJ IDEA, Eclipse vb.)

---

## 🧪 Adım 1: Test Bağımlılıklarını Ekle

Projene Spring Boot test starter'ını ekle.

Maven:

```xml filename="pom.xml"
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-test</artifactId>
  <scope>test</scope>
</dependency>
```

Gradle:

```groovy filename="build.gradle"
testImplementation 'org.springframework.boot:spring-boot-starter-test'
```

---

## 🛠️ Adım 2: İlk Testini Yaz

Servisi yazmadan önce basit birim test oluştur.

:::tabs
@tab Java [icon=java]

```java filename="GreetingServiceTest.java"
package com.example.tdd;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class GreetingServiceTest {

    @Test
    void shouldReturnGreetingMessage() {
        GreetingService service = new GreetingService();
        String result = service.greet("World");
        assertEquals("Hello, World!", result);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="GreetingServiceTest.kt"
package com.example.tdd

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class GreetingServiceTest {

    @Test
    fun shouldReturnGreetingMessage() {
        val service = GreetingService()
        val result = service.greet("World")
        assertEquals("Hello, World!", result)
    }
}
```

:::

---

## 🛠️ Adım 3: Servisi Oluşturun

Testi geçecek şekilde `GreetingService` sınıfını oluştur.

:::tabs
@tab Java [icon=java]

```java filename="GreetingService.java"
package com.example.tdd;

public class GreetingService {
    public String greet(String name) {
        return "Hello, " + name + "!";
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="GreetingService.kt"
package com.example.tdd

class GreetingService {
    fun greet(name: String): String {
        return "Hello, $name!"
    }
}
```

:::

---

## ▶️ Uygulamayı Test Et

Testleri çalıştırmak için aşağıdaki komutu kullan:

```bash
./mvnw test
```

veya

```bash
gradle test
```

Test başarıyla geçmeli ✅

---

### Refactor ve Tekrarla

Test geçtikten sonra kodu güvenle refactor edebilirsin. TDD döngüsü şöyledir:

1. Red – Başarısız test yaz
2. Green – Testi geçir
3. Refactor – Kodu temizle

---

## 🏁 Sonuç

Artık Test Odaklı Geliştirme için üretim odaklı bir Spring Boot temeliniz var. Sonraki adımda ayarları kendi domainine uyarlayıp test ve gözlemlenebilirlik katmanını ekleyerek gerçek trafik altında doğrulayın.
