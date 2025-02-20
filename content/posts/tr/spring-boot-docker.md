---
title: 'Spring Boot Docker Entegrasyonu'
date: '2025-02-21'
summary: 'Spring Boot uygulamalarını Docker kullanarak Buildpacks ve Jib ile nasıl oluşturup dağıtabileceğinizi öğrenin.'
thumbnail: '/images/spring-boot-docker-thumbnail.jpg'
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
  - id: 'docker'
    name: 'Docker'
    color: 'blue'
  - id: 'containerization'
    name: 'Konteynerizasyon'
    color: 'orange'
  - id: 'jib'
    name: 'Jib'
    color: 'pink'
  - id: 'programming'
    name: 'Programlama'
    color: 'brown'
---

Spring Boot, **Docker**, **Buildpacks** ve **Jib** kullanarak uygulamaları verimli bir şekilde konteynerleştirmek için birden fazla yöntem sunar. Bu kılavuz, Spring Boot uygulamalarını Docker kullanarak oluşturma ve dağıtma süreçlerini ele almaktadır.

---

## 🌟 Neden Spring Boot İçin Docker Kullanmalıyız?

- **Taşınabilir Dağıtım**: Uygulamaları farklı ortamlar arasında tutarlı bir şekilde çalıştırın.
- **Ölçeklenebilirlik**: Konteynerleştirilmiş uygulamaları kolayca ölçeklendirin ve yönetin.
- **Hafif ve Verimli**: Kaynak kullanımını optimize ederek gereksiz yükü azaltın.
- **DevOps Uyumlu**: CI/CD pipeline hatlarına sorunsuz şekilde entegre edin.

---

## 🌟 Gereksinimler

Aşağıdaki bileşenlere sahip olduğunuzdan emin olun:

- ☕ **Java Geliştirme Kiti (JDK)** 17+
- 📦 **Maven veya Gradle**
- 🐳 **Docker** yüklü ve çalışır durumda

---

## 🛠️ Adım 1: Bağımlılıkları Ekleyin

Docker desteğini etkinleştirmek için **Spring Boot Maven Plugin**, **Jib Plugin** ve **Spring Boot Web Starter** eklentilerini yapılandırma dosyanıza ekleyin.

### Maven Yapılandırması:

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
        <plugin>
            <groupId>com.google.cloud.tools</groupId>
            <artifactId>jib-maven-plugin</artifactId>
            <version>3.3.2</version>
        </plugin>
    </plugins>
</build>
```

### Gradle Yapılandırması:

```groovy
plugins {
    id 'org.springframework.boot' version '3.2.0'
    id 'com.google.cloud.tools.jib' version '3.3.2'
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
}
```

---

## 📖 Adım 2: Basit Bir Spring Boot Uygulaması Oluşturun

Docker konteyneri içinde dağıtılacak bir REST uç noktası tanımlayın.

:::tabs
@tab Java [icon=java]

```java
package com.example.docker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class DockerApplication {

    public static void main(String[] args) {
        SpringApplication.run(DockerApplication.class, args);
    }

    @GetMapping("/hello")
    public String hello() {
        return "Docker üzerinde çalışan Spring Boot uygulamasından merhaba!";
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.docker

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@SpringBootApplication
@RestController
class DockerApplication {

    @GetMapping("/hello")
    fun hello(): String = "Docker üzerinde çalışan Spring Boot uygulamasından merhaba!"
}

fun main(args: Array<String>) {
    runApplication<DockerApplication>(*args)
}
```

:::

---

## 🐳 Adım 3: Docker İmajı Oluşturma ve Çalıştırma

### Seçenek 1: Buildpacks Kullanarak

Spring Boot, **Buildpacks** ile `Dockerfile` kullanmadan Docker imajları oluşturmayı destekler.

```bash
mvn spring-boot:build-image
```

```bash
gradle bootBuildImage
```

Konteyneri çalıştırın:

```bash
docker run --rm -p 8080:8080 myproject:0.0.1-SNAPSHOT
```

---

### Seçenek 2: Jib Kullanarak

Jib, Docker daemon olmadan optimize edilmiş konteyner imajları oluşturmayı sağlar.

```bash
mvn jib:dockerBuild
```

```bash
gradle jibDockerBuild
```

Jib ile oluşturulan konteyneri çalıştırın:

```bash
docker run --rm -p 8080:8080 myproject:0.0.1-SNAPSHOT
```

---

## ▶️ Uygulamayı Çalıştırma

Konteyner çalıştırıldıktan sonra, REST API'yi test edin:

```bash
curl -X GET http://localhost:8080/hello
```

Beklenen Çıktı:

```plaintext
Docker üzerinde çalışan Spring Boot uygulamasından merhaba!
```

---

Spring Boot, uygulamaları verimli bir şekilde konteynerleştirmek için birden fazla yöntem sunar. **Buildpacks** basit kullanım sağlarken, **Jib** optimize edilmiş imaj oluşturmayı destekler. Spring Boot uygulamalarını Docker ile kolayca paketleyip dağıtabilirsiniz.
