---
title: 'Spring Boot ile GraalVM Native Uygulama'
date: '2024-12-28'
summary: 'Spring Boot uygulamalarınızı GraalVM native imajı olarak derleyerek daha hızlı başlatma süreleri ve azaltılmış kaynak kullanımı elde etmeyi öğrenin.'
thumbnail: '/images/spring-boot-graalvm-thumbnail.jpeg'
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
  - id: 'graalvm'
    name: 'GraalVM'
    color: 'pink'
  - id: 'native-image'
    name: 'Native İmaj'
    color: 'orange'
  - id: 'programming'
    name: 'Programlama'
    color: 'blue'
---

Spring Boot ile GraalVM Native, geliştiricilere daha hızlı başlatma süreleri, azaltılmış bellek tüketimi ve artırılmış güvenlik sunan uygulamalar oluşturma imkânı tanır. Native imaj desteği sayesinde, Spring Boot uygulamalarınız kaynak kısıtlı ortamlarda etkin bir şekilde çalışabilir ve modern bulut tabanlı mimariler için ideal bir seçenek haline gelir.

---

## 🌟 Neden GraalVM ile Native Uygulama Oluşturalım?

- **Daha Hızlı Başlatma Süreleri**: Native imajlar, JVM tabanlı uygulamalara kıyasla çok daha hızlı başlatılır.
- **Azaltılmış Kaynak Kullanımı**: Native imajlar daha az bellek kullanır, bu da bulut ve konteynerize ortamlar için idealdir.
- **Artırılmış Güvenlik**: Daha küçük bir runtime ve sınırlı bir yüzey alanı sunar.

---

## 🌟 Gereksinimler

Aşağıdakilere sahip olduğunuzdan emin olun:

- ☕ **Java Development Kit (JDK)** 17+
- 🛠 **GraalVM** native-image desteği ile yüklenmiş
- 🕝 **Maven** veya **Gradle**
- 🐳 **Docker** (opsiyonel, konteyner imajları oluşturmak için)

---

## 🛠️ Adım 1: Bağımlılıkları Ekleyin

`pom.xml` veya `build.gradle` dosyanıza GraalVM Native Build Tools eklentisini ekleyin.

**Maven:**

```xml
<plugin>
    <groupId>org.graalvm.buildtools</groupId>
    <artifactId>native-maven-plugin</artifactId>
    <version>0.9.20</version>
</plugin>
```

**Gradle:**

```groovy
plugins {
    id 'org.graalvm.buildtools.native' version '0.9.20'
}
```

---

## 📋 Adım 2: Bir REST Controller Yazın

Native imaj fonksiyonelliğini test etmek için basit bir REST endpoint oluşturun.

:::tabs
@tab Java [icon=java]

```java
package com.example.graalvmnative;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class MyApplication {

    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }

    @GetMapping("/greeting")
    public String greeting() {
        return "Hello from GraalVM Native!";
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.graalvmnative

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@SpringBootApplication
@RestController
class MyApplication {

    @GetMapping("/greeting")
    fun greeting(): String = "Hello from GraalVM Native!"
}

fun main(args: Array<String>) {
    runApplication<MyApplication>(*args)
}
```

:::

---

## 📖 Adım 3: Native İmaj Oluşturun

### Maven Kullanarak

Native imaj oluşturmak için aşağıdaki komutu çalıştırın:

```bash
mvn -Pnative package
```

### Gradle Kullanarak

Aşağıdaki komutu çalıştırın:

```bash
gradle nativeCompile
```

---

## 🐳 Adım 4: Docker İmajı Oluşturun

Spring Boot, native yürütülebilir dosyalarla Docker imajları oluşturmayı destekler.

### Maven Komutu:

```bash
mvn -Pnative spring-boot:build-image
```

### Gradle Komutu:

```bash
gradle bootBuildImage
```

Docker imajı local olarak hazır olacak ve aşağıdaki komutla çalıştırılabilir:

```bash
docker run --rm -p 8080:8080 myproject:0.0.1-SNAPSHOT
```

---

## ▶️ Uygulamayı Çalıştırma

### Yerel Olarak Çalıştırma

Native imajı doğrudan çalıştırabilirsiniz:

```bash
./target/myproject
```

### Docker'da Çalıştırma

Eğer Docker imajı oluşturduysanız, aşağıdaki komutu kullanarak çalıştırabilirsiniz:

```bash
docker run --rm -p 8080:8080 myproject:0.0.1-SNAPSHOT
```

---

## 🧪 API'yı Test Etme

REST endpoint'i cURL veya Postman kullanarak test edin:

```bash
curl -X GET http://localhost:8080/greeting
```

Beklenen çıktı:

```plaintext
Hello from GraalVM Native!
```

---

Spring Boot ile GraalVM Native, bulut tabanlı ve konteynerleştirilmiş uygulamalar için mükemmel bir seçenek sunarak, performans iyileştirmeleri ve kaynak tasarrufları sağlar.
