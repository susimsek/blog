---
title: 'Spring Boot Eureka Server'
publishedDate: '2025-02-23'
category:
  id: programming
  name: Programlama
updatedDate: '2025-02-24'
summary: 'Mikro hizmet mimarisinde servis keşfi için Spring Boot Eureka serverın nasıl kurulacağını ve yapılandırılacağını öğrenin.'
thumbnail: '/images/spring-boot-eureka-server-thumbnail.webp'
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
  - id: 'spring-cloud'
    name: 'Spring Cloud'
    color: 'pink'
  - id: 'eureka-server'
    name: 'Eureka Server'
    color: 'blue'
  - id: 'microservice'
    name: 'Mikroservis'
    color: 'orange'
  - id: 'programming'
    name: 'Programlama'
    color: 'brown'
---

Spring Boot Eureka Server, mikroservis mimarisinde servis kaydı ve keşfi sağlayan bir servis kayıt merkezi olarak çalışır. Mikroservislerin kendilerini otomatik olarak kaydetmelerine ve diğer servisleri dinamik olarak keşfetmelerine olanak tanır. Bu kılavuzda, Spring Boot ile Eureka serverın nasıl kurulacağını ve yapılandırılacağını öğreneceksiniz.

---

## 🌟 Neden Eureka Server Kullanmalıyız?

Bu bölümde Neden Eureka Server Kullanmalıyız? konusunu netleştirip uygulamada kullanacağınız temel noktaları özetliyoruz.

- Servis Keşfi: Mikro servislerin otomatik olarak kaydolmasını ve keşfedilmesini sağlar.
- Yük Dengeleme: Ribbon ile istemci taraflı yük dengeleme sağlar.
- Hata Toleransı: Bir servis başarısız olursa alternatif örnekleri bulmaya yardımcı olur.
- Ölçeklenebilirlik: Mikroserivslerin kolayca ölçeklenmesini sağlar.
- Spring Cloud Entegrasyonu: Spring Boot uygulamalarıyla sorunsuz çalışır.

---

## 📋 Gereksinimler

Aşağıdakilerin kurulu olduğundan emin olun:

- ☕ Java Development Kit (JDK) 17+
- 📦 Maven veya Gradle yüklü

---

## 🛠️ Adım 1: Bağımlılıkları Ekleyin

Bu bölümde Adım 1: Bağımlılıkları Ekleyin konusunu netleştirip uygulamada kullanacağınız temel noktaları özetliyoruz.

Maven:

```xml filename="pom.xml"
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
</dependency>
```

Gradle:

```groovy filename="build.gradle"
implementation 'org.springframework.cloud:spring-cloud-starter-netflix-eureka-server'
```

---

## 🛠️ Adım 2: Eureka Sunucu Uygulamasını Oluşturun

:::tabs
@tab Java [icon=java]

```java filename="EurekaServerApplication.java"
package com.example.eurekaserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="EurekaServerApplication.kt"
package com.example.eurekaserver

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer

@SpringBootApplication
@EnableEurekaServer
class EurekaServerApplication

fun main(args: Array<String>) {
    runApplication<EurekaServerApplication>(*args)
}
```

:::

---

## 🛠️ Adım 3: Eureka Server'ı Yapılandırma

Bir `application.yml` dosyası oluşturun ve aşağıdaki yapılandırmayı ekleyin:

```yaml filename="application.yml"
server:
  port: 8761
spring:
  application:
    name: eureka-server
eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
  server:
    wait-time-in-ms-when-sync-empty: 5
```

> Not: Eureka Sunucusu kendisini kaydetmez.

---

## ▶️ Eureka Server'ı Çalıştırma

Eureka Server uygulamasını başlatın:

```bash
./mvnw spring-boot:run
```

veya Gradle kullanarak:

```bash
gradle bootRun
```

Eureka Server kontrol paneline erişmek için:

```bash
http://localhost:8761/
```

---

## 🛠️ Adım 4: Bir İstemci Uygulamasını Kaydetme

Bu bölümde Adım 4: Bir İstemci Uygulamasını Kaydetme konusunu netleştirip uygulamada kullanacağınız temel noktaları özetliyoruz.

### Bağımlılıkları Ekleyin

Bu bağımlılık, uygulamanın Eureka sunucusuna kayıt olması ve servis keşfi sürecine katılması için gereklidir.

Maven:

```xml filename="pom.xml"
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

Gradle:

```groovy filename="build.gradle"
implementation 'org.springframework.cloud:spring-cloud-starter-netflix-eureka-client'
```

### İstemci Uygulama Yapılandırması

İstemcinin `application.yml` dosyasına aşağıdaki yapılandırmayı ekleyin:

```yaml filename="application.yml"
spring:
  application:
    name: eureka-client
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

### İstemci Uygulama Kodu

Aşağıdaki örnek, İstemci Uygulama Kodu için pratik bir bağlam sunar ve doğrudan uygulanabilir.

:::tabs
@tab Java [icon=java]

```java filename="EurekaClientApplication.java"
package com.example.eurekaclient;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
@RequestMapping("/client")
public class EurekaClientApplication {

    @GetMapping
    public String getClientMessage() {
        return "Merhaba, Eureka İstemcisi!";
    }

    public static void main(String[] args) {
        SpringApplication.run(EurekaClientApplication.class, args);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="EurekaClientApplication.kt"
package com.example.eurekaclient

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@SpringBootApplication
@RestController
@RequestMapping("/client")
class EurekaClientApplication {

    @GetMapping
    fun getClientMessage(): String {
        return "Merhaba, Eureka İstemcisi!"
    }
}

fun main(args: Array<String>) {
    runApplication<EurekaClientApplication>(*args)
}
```

:::

---

## ▶️ İstemci Uygulamayı Çalıştırma

Eureka İstemci uygulamasını başlatın:

```bash
./mvnw spring-boot:run
```

veya Gradle kullanarak:

```bash
gradle bootRun
```

Eureka Server'a kayıtlı olup olmadığını kontrol etmek için şu adresi ziyaret edin:

```bash
http://localhost:8761/
```

---

## 🏁 Sonuç

Artık Spring Boot Eureka Server için üretim odaklı bir Spring Boot temeliniz var. Sonraki adımda ayarları kendi domainine uyarlayıp test ve gözlemlenebilirlik katmanını ekleyerek gerçek trafik altında doğrulayın.
