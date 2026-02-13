---
title: 'Spring Boot ile GraalVM Native Uygulama'
date: '2024-12-28'
summary: 'Spring Boot uygulamalarınızı GraalVM native imajı olarak derleyerek daha hızlı başlatma süreleri ve azaltılmış kaynak kullanımı elde etmeyi öğrenin.'
thumbnail: '/images/spring-boot-graalvm-thumbnail.webp'
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

Bu bölümde Neden GraalVM ile Native Uygulama Oluşturalım? konusunu netleştirip uygulamada kullanacağınız temel noktaları özetliyoruz.

- Daha Hızlı Başlatma Süreleri: Native imajlar, JVM tabanlı uygulamalara kıyasla çok daha hızlı başlatılır.
- Azaltılmış Kaynak Kullanımı: Native imajlar daha az bellek kullanır, bu da bulut ve konteynerize ortamlar için idealdir.
- Artırılmış Güvenlik: Daha küçük bir runtime ve sınırlı bir yüzey alanı sunar.

---

## 📋 Gereksinimler

Aşağıdakilere sahip olduğunuzdan emin olun:

- ☕ Java Development Kit (JDK) 17+
- 🛠 GraalVM native-image desteği ile yüklenmiş
- 🕝 Maven veya Gradle
- 🐳 Docker (opsiyonel, konteyner imajları oluşturmak için)

---

## 🛠️ Adım 1: Bağımlılıkları Ekleyin

`pom.xml` veya `build.gradle` dosyanıza GraalVM Native Build Tools eklentisini ekleyin.

Maven:

```xml filename="pom.xml"
<plugin>
    <groupId>org.graalvm.buildtools</groupId>
    <artifactId>native-maven-plugin</artifactId>
    <version>0.9.20</version>
</plugin>
```

Gradle:

```groovy filename="build.gradle"
plugins {
    id 'org.graalvm.buildtools.native' version '0.9.20'
}
```

---

## 🛠️ Adım 2: Bir REST Controller Yazın

Native imaj fonksiyonelliğini test etmek için basit bir REST endpoint oluşturun.

:::tabs
@tab Java [icon=java]

```java filename="MyApplication.java"
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

```kotlin filename="MyApplication.kt"
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

## 🛠️ Adım 3: Native İmaj Oluşturun

Bu bölümde Adım 3: Native İmaj Oluşturun konusunu netleştirip uygulamada kullanacağınız temel noktaları özetliyoruz.

Maven:
Native imaj oluşturmak için aşağıdaki komutu çalıştırın:

```bash
mvn -Pnative package
```

Gradle:
Aşağıdaki komutu çalıştırın:

```bash
gradle nativeCompile
```

---

## 🛠️ Adım 4: Docker İmajı Oluşturun

Spring Boot, native yürütülebilir dosyalarla Docker imajları oluşturmayı destekler.

Maven:

```bash
mvn -Pnative spring-boot:build-image
```

Gradle:

```bash
gradle bootBuildImage
```

Docker imajı local olarak hazır olacak ve aşağıdaki komutla çalıştırılabilir:

```bash
docker run --rm -p 8080:8080 myproject:0.0.1-SNAPSHOT
```

---

## ▶️ Uygulamayı Çalıştırma

Bu bölümde Uygulamayı Çalıştırma konusunu netleştirip uygulamada kullanacağınız temel noktaları özetliyoruz.

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

```plaintext filename="snippet.txt"
Hello from GraalVM Native!
```

---

## 🏁 Sonuç

Artık GraalVM Native Uygulama için üretim odaklı bir Spring Boot temeliniz var. Sonraki adımda ayarları kendi domainine uyarlayıp test ve gözlemlenebilirlik katmanını ekleyerek gerçek trafik altında doğrulayın.
