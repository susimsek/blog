---
title: 'Spring Boot Config Server'
date: '2025-02-22'
summary: 'Spring Boot Config Server kullanarak merkezi yapılandırma yönetimini nasıl gerçekleştireceğinizi öğrenin.'
thumbnail: '/images/spring-boot-config-server-thumbnail.jpeg'
readingTime: '4 dakika okuma'
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
  - id: 'config-server'
    name: 'Config Server'
    color: 'blue'
  - id: 'microservice'
    name: 'Mikroservis'
    color: 'orange'
  - id: 'programming'
    name: 'Programlama'
    color: 'brown'
---

Spring Boot **Config Server**, dağıtılmış uygulamalar için merkezi yapılandırma yönetimi sağlar ve hizmetlerin yeniden başlatılmasına gerek kalmadan dinamik yapılandırma güncellemelerine olanak tanır. Bu kılavuz, Spring Boot Config Server'ı nasıl kuracağınızı ve etkin bir şekilde kullanacağınızı açıklar.

---

## 🌟 Neden Config Server Kullanmalıyız?

- **Merkezi Yapılandırma:** Uygulama ayarlarını tek bir yerde yönetin.
- **Dinamik Güncellemeler:** Yapılandırmaları hizmetleri yeniden başlatmadan güncelleyin.
- **Environment Profilleri:** Geliştirme, test ve üretim ortamları için farklı yapılandırmaları destekler.
- **Güvenlik ve Erişim Kontrolü:** Hassas yapılandırmaları güvenli bir şekilde saklayın.
- **Git Entegrasyonu:** Yapılandırma sürümlerini yönetmek ve izlemek için Git kullanın.

---

## 🌟 Gereksinimler

Aşağıdaki bileşenlerin sisteminizde yüklü olduğundan emin olun:

- ☕ **Java Development Kit (JDK)** 17+
- 📦 **Maven veya Gradle** yüklü
- 📁 **Git Deposu** (Yapılandırmaları saklamak için)

---

## 🛠 Adım 1: Bağımlılıkları Ekleyin

Spring Cloud Config Server için gerekli bağımlılıkları ekleyin.

### Maven Yapılandırması:

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-config-server</artifactId>
</dependency>
```

### Gradle Yapılandırması:

```groovy
implementation 'org.springframework.cloud:spring-cloud-config-server'
```

---

## 📖 Adım 2: Config Server Uygulamasını Oluşturma

:::tabs
@tab Java [icon=java]

```java
package com.example.configserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;

@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.configserver

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cloud.config.server.EnableConfigServer

@SpringBootApplication
@EnableConfigServer
class ConfigServerApplication

fun main(args: Array<String>) {
    runApplication<ConfigServerApplication>(*args)
}
```

:::

---

## 🛠 Adım 3: Config Server'ı Yapılandırma

Config ayarlarını saklamak için Git deposunu belirten bir `application.yml` dosyası oluşturun.

```yaml
server:
  port: 8888
spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/example/config-repo
          default-label: main
```

> **Not:** `https://github.com/example/config-repo` adresini kendi Git deponuzla değiştirin.

---

## 📂 Adım 4: Konfigürasyon Deposu Oluşturma

Git deposunda (`config-repo`) bir `application.yml` dosyası oluşturun:

```yaml
config.key: 'Merhaba, Config Server!'
```

Dosyayı ekleyip gönderin:

```bash
git add application.yml
git commit -m "Konfigürasyon dosyası eklendi"
git push origin main
```

---

## ▶️ Config Server'ı Çalıştırma

Config Server uygulamasını başlatın:

```bash
./mvnw spring-boot:run
```

veya Gradle kullanarak:

```bash
gradle bootRun
```

Config Server'ın çalıştığını doğrulamak için şu komutu çalıştırın:

```bash
curl -X GET http://localhost:8888/application/default
```

Beklenen Çıktı:

```json
{
  "name": "application",
  "profiles": ["default"],
  "propertySources": [
    {
      "name": "https://github.com/example/config-repo/application.yml",
      "source": {
        "config.key": "Merhaba, Config Server!"
      }
    }
  ]
}
```

---

## 📌 Adım 5: İstemci Uygulamayı Yapılandırma

### Bağımlılıkları Ekleme

#### Maven:

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-config</artifactId>
</dependency>
```

#### Gradle:

```groovy
implementation 'org.springframework.cloud:spring-cloud-starter-config'
```

### 🔧 İstemci Uygulama Yapılandırması

İstemci uygulamanın `bootstrap.yml` dosyasına aşağıdaki ayarları ekleyin:

```yaml
spring:
  application:
    name: config-client
  cloud:
    config:
      uri: http://localhost:8888
```

### 🔧 İstemci Uygulama Kodu

:::tabs
@tab Java [icon=java]

```java
package com.example.configclient;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;

@SpringBootApplication
@RestController
@RequestMapping("/config")
public class ConfigClientApplication {

  @Value("${config.key:not found}")
  private String configValue;

  @GetMapping
  public String getConfigValue() {
    return "Konfigürasyon Değeri: " + configValue;
  }

  public static void main(String[] args) {
    SpringApplication.run(ConfigClientApplication.class, args);
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.configclient

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.beans.factory.annotation.Value

@SpringBootApplication
@RestController
@RequestMapping("/config")
class ConfigClientApplication {

    @Value("\${config.key:not found}")
    private lateinit var configValue: String

    @GetMapping
    fun getConfigValue(): String {
        return "Konfigürasyon Değeri: $configValue"
    }
}

fun main(args: Array<String>) {
    runApplication<ConfigClientApplication>(*args)
}
```

:::

---

## 🏃 İstemci Uygulamayı Çalıştırma

İstemci uygulamasını başlatmak için:

```bash
./mvnw spring-boot:run
```

veya Gradle kullanarak:

```bash
gradle bootRun
```

Config Server'dan konfigürasyonu almak için:

```bash
curl -X GET http://localhost:8080/config
```

Beklenen Çıktı:

```plaintext
Konfigürasyon Değeri: Merhaba, Config Server!
```

---

Spring Boot Config Server, dağıtılmış uygulamalar için konfigürasyon yönetimini basitleştirir. Merkezi bir konfigürasyon depolama ile uygulamalar yeniden başlatılmadan değişikliklere dinamik olarak adapte olabilir, bu da bakım ve ölçeklenebilirliği arttırır.
