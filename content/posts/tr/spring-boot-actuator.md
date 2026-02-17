---
title: 'Spring Boot Actuator'
publishedDate: '2024-12-18'
updatedDate: '2024-12-19'
summary: 'Spring Boot Actuator kullanarak uygulamalarınızı izleme ve yönetme. Endpointler, özelleştirme ve güvenlik örneklerini içerir.'
thumbnail: '/images/spring-boot-actuator-thumbnail.webp'
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

## 📋 Gereksinimler

📋 Aşağıdaki şartların karşılandığından emin olun:

- ☕ Java Development Kit (JDK) 17+
- 📦 Maven veya Gradle yüklenmiş olmalı
- 🔤 Bir Java IDE (IntelliJ IDEA, Eclipse vb.)

---

## 🛠️ Adım 1: Bağımlılıkları Ekleyin

Actuator'ı etkinleştirmek için, projenize aşağıdaki bağımlılıkları ekleyin:

- Maven:

```xml filename="pom.xml"
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

- Gradle:

```groovy filename="build.gradle"
implementation 'org.springframework.boot:spring-boot-starter-actuator'
```

---

## 🛠️ Adım 2: Actuator Endpointlerini Etkinleştirin

Varsayılan olarak, Actuator uygulama bilgilerinin sağlanması için çeşitli endpointler yayınlar. Bu endpointleri `application.properties` veya `application.yml` dosyasında etkinleştirebilirsiniz.

### Örnek Konfigürasyon:

Bu yapılandırmayı başlangıç noktası olarak alın, sonra ortamınıza göre değerleri uyarlayın.

```properties filename="config.properties"
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=always
```

---

## 🛠️ Adım 3: Actuator Endpointlerini Kullanmaya Başlayın

İşte sık kullanılan Actuator endpointleri:

- `/actuator/health`: Uygulama sağlık durumu sağlar.
- `/actuator/info`: Uygulama metadatasını gösterir.
- `/actuator/metrics`: Uygulama performans metriklerini sunar.

Bu endpointlere bir tarayıcı veya cURL gibi API araçları kullanarak erişebilirsiniz.

Örnek:

```bash
curl -X GET http://localhost:8080/actuator/health
```

---

## 🛠️ Adım 4: Actuator Endpointlerini Özelleştirin

Actuator endpointlerini ihtiyaçlarınıza göre özelleştirin. Örneğin, `/actuator/info` endpointi için ek metadata tanımlayabilirsiniz:

```properties filename="config.properties"
info.app.name=Benim Uygulamam
info.app.version=1.0.0
info.app.description=Spring Boot Actuator Örneği
```

---

## 🛠️ Adım 5: Actuator Endpointlerini Güvenli Hale Getirin

Prodüksiyon ortamlarında, Actuator endpointlerinin güvenli hale getirilmesi önemlidir. Spring Security kullanarak erişimi sınırlayabilirsiniz.

:::tabs
@tab Java [icon=java]

```java filename="SecurityConfig.java"
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

```kotlin filename="SecurityConfig.kt"
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

```filename="snippet.txt"
http://localhost:8080/actuator/health
```

---

## 🧪 API'ı Test Edin

Actuator endpointlerini cURL veya tarayıcı kullanarak test edebilirsiniz:

- Health Endpoint:

```bash
curl -X GET http://localhost:8080/actuator/health
```

- Info Endpoint:

```bash
curl -X GET http://localhost:8080/actuator/info
```

---

## 🏁 Sonuç

Artık Spring Boot Actuator için üretim odaklı bir Spring Boot temeliniz var. Sonraki adımda ayarları kendi domainine uyarlayıp test ve gözlemlenebilirlik katmanını ekleyerek gerçek trafik altında doğrulayın.
