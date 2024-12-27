---
title: 'Spring Boot Actuator'
date: '2024-12-18'
summary: 'Spring Boot Actuator kullanarak uygulamalarınızı izleme ve yönetme. Endpointler, özelleştirme ve güvenlik örneklerini içerir.'
thumbnail: '/images/spring-boot-actuator-thumbnail.jpg'
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
  - id: 'actuator'
    name: 'Actuator'
    color: 'orange'
  - id: 'monitoring'
    name: 'İzleme'
    color: 'purple'
  - id: 'programming'
    name: 'Programlama'
    color: 'blue'
---

Spring Boot Actuator, uygulamalarınızı izlemek ve yönetmek için prodüksiyon seviyesinde hazır özellikler sunar. Bu rehber, Actuator'ın yeteneklerini, nasıl etkinleştirileceğini ve endpointlerin nasıl güvenlik altına alınacağını incelemektedir.

---

## 🌟 Neden Spring Boot Actuator Kullanılır?

Spring Boot Actuator geliştiricilere şunları sağlar:

- Uygulama sağlığını izleme
- Metrik ve bilgi toplama
- Operasyonel görevler için yönetim endpointlerini yayınlamış olma

---

## 🌟 Gereksinimler

📋 Aşağıdaki şartların karşılandığından emin olun:

- ☕ **Java Development Kit (JDK)** 17+
- 📦 **Maven veya Gradle** yüklenmiş olmalı
- 🔤 Bir **Java IDE** (IntelliJ IDEA, Eclipse vb.)

---

## 🛠️ Adım 1: Bağımlılıkları Ekleyin

Actuator'ı etkinleştirmek için, projenize aşağıdaki bağımlılıkları ekleyin:

- **Maven:**

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

- **Gradle:**

```groovy
implementation 'org.springframework.boot:spring-boot-starter-actuator'
```

---

## 📋 Adım 2: Actuator Endpointlerini Etkinleştirin

Varsayılan olarak, Actuator uygulama bilgilerinin sağlanması için çeşitli endpointler yayınlar. Bu endpointleri `application.properties` veya `application.yml` dosyasında etkinleştirebilirsiniz.

### Örnek Konfigürasyon:

```properties
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=always
```

---

## 📖 Adım 3: Actuator Endpointlerini Kullanmaya Başlayın

İşte sık kullanılan Actuator endpointleri:

- **`/actuator/health`**: Uygulama sağlık durumu sağlar.
- **`/actuator/info`**: Uygulama metadatasını gösterir.
- **`/actuator/metrics`**: Uygulama performans metriklerini sunar.

Bu endpointlere bir tarayıcı veya cURL gibi API araçları kullanarak erişebilirsiniz.

Örnek:

```bash
curl -X GET http://localhost:8080/actuator/health
```

---

## 📘 Adım 4: Actuator Endpointlerini Özelleştirin

Actuator endpointlerini ihtiyaçlarınıza göre özelleştirin. Örneğin, `/actuator/info` endpointi için ek metadata tanımlayabilirsiniz:

```properties
info.app.name=Benim Uygulamam
info.app.version=1.0.0
info.app.description=Spring Boot Actuator Örneği
```

---

## 🔒 Adım 5: Actuator Endpointlerini Güvenli Hale Getirin

Prodüksiyon ortamlarında, Actuator endpointlerinin güvenli hale getirilmesi önemlidir. Spring Security kullanarak erişimi sınırlayabilirsiniz.

:::tabs
@tab Java [icon=java]

```java
package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests()
                .requestMatchers("/actuator/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            .and()
            .httpBasic();
        return http.build();
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.demo.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.web.SecurityFilterChain

@Configuration
class SecurityConfig {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .authorizeHttpRequests()
                .requestMatchers("/actuator/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            .and()
            .httpBasic()
        return http.build()
    }
}
```

:::

---

## ▶️ Uygulamayı Çalıştırma

Uygulamayı aşağıdaki komutla çalıştırın:

```bash
./mvnw spring-boot:run
```

Actuator endpointlerine erişim sağlamak için:

```
http://localhost:8080/actuator/health
```

---

## 🧪 API'ı Test Edin

Actuator endpointlerini cURL veya tarayıcı kullanarak test edebilirsiniz:

- **Health Endpoint:**

```bash
curl -X GET http://localhost:8080/actuator/health
```

- **Info Endpoint:**

```bash
curl -X GET http://localhost:8080/actuator/info
```

---

Spring Boot Actuator, uygulamalarınızı izleme ve yönetmeyi basitleştirir. Bu rehberde, Actuator endpointlerini etkinleştirme, özelleştirme ve güvenlik altına alma adımlarını ele aldık.
