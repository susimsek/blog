---
title: 'Spring Boot AI Entegrasyonu'
publishedDate: '2025-04-23'
category:
  id: programming
  name: Programlama
  color: blue
  icon: code
updatedDate: '2025-04-24'
summary: 'Modüler, taşınabilir ve gözlemlenebilir AI iş akışları için Spring AI kullanarak Spring Boot uygulamalarına AI modellerini nasıl entegre edeceğinizi öğrenin.'
thumbnail: '/images/spring-boot-ai-thumbnail.webp'
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
  - id: 'spring-ai'
    name: 'Spring AI'
    color: 'orange'
  - id: 'ai'
    name: 'Yapay Zeka'
    color: 'pink'
---

Spring AI, AI mühendisliği için Spring’in taşınabilirlik ve modüler tasarım ilkelerini AI iş yüklerine uygulayan bir çerçevedir. Tanıdık Spring kalıpları ve POJO’ları kullanarak AI odaklı uygulamalar geliştirmenizi sağlar.

---

## 🌟 Neden Spring AI Kullanılmalı?

Bu bölümde Neden Spring AI Kullanılmalı? konusunu netleştirip uygulamada kullanacağınız temel noktaları özetliyoruz.

- Sağlayıcıdan bağımsız taşınabilirlik: Kodunuzu bir kez yazın, AI sağlayıcıları (OpenAI, Anthropic, Azure vb.) arasında değiştirmeler yapmadan geçiş yapın.
- POJO tabanlı tasarım: AI girdi ve çıktılarınızı düz Java/Kotlin nesneleri olarak modelleyerek tür güvenliği ve kolay entegrasyon sağlayın.
- Yapılandırılmış çıktılar: Model yanıtlarını alan nesnelerinize otomatik olarak eşleyin.
- Vektör veri deposu entegrasyonu: Chroma, Pinecone, Redis gibi önde gelen vektör veritabanları için birleşik API desteği.
- Araç/fonksiyon çağrısı: LLM’lerin gerçek zamanlı veri için özel fonksiyonları veya servisleri çağırmasına izin verin.
- Gözlemlenebilirlik ve değerlendirme: AI işlemlerini izlemeniz ve halüsinasyonları tespit etmeniz için yerleşik metrikler ve değerlendirme araçları.
- Sohbet soyutlamaları: WebClient benzeri akıcı bir ChatClient API’si ile chat agentlar oluşturun.
- Retrieval-augmented generation (RAG): Advisorler ve bellek API’leri ile belgelere dayalı QA ve geçmiş sohbete dayalı sohbeti basitleştirin.

---

## 📋 Gereksinimler

Aşağıdakilere sahip olduğunuzdan emin olun:

- ☕ Java Development Kit (JDK) 17+
- 📦 Maven veya Gradle kurulumu
- 🐳 Spring Boot 3+
- 🔑 OpenAI API Anahtarı (çevre değişkeni `OPENAI_API_KEY` olarak tanımlı)

---

## 🛠️ Adım 1: Bağımlılıkları Ekleyin

Spring AI OpenAI başlatıcısı, Spring Web ve Lombok’u projenize ekleyin.

:::tabs
@tab Maven [icon=maven]

```xml filename="pom.xml"
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-openai</artifactId>
  </dependency>
  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <scope>provided</scope>
  </dependency>
</dependencies>
```

@tab Gradle [icon=gradle]

```groovy filename="build.gradle"
plugins {
  id 'org.springframework.boot' version '3.2.0'
}

dependencies {
  implementation 'org.springframework.boot:spring-boot-starter-web'
  implementation 'org.springframework.ai:spring-ai-starter-model-openai'
  compileOnly 'org.projectlombok:lombok'
  annotationProcessor 'org.projectlombok:lombok'
}
```

:::

---

## 🛠️ Adım 2: Yapılandırma

`application.yml` dosyanıza OpenAI anahtarınızı ve ChatClient model ayarlarını ekleyin:

```yaml filename="application.yml"
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}
      chat:
        options:
          model: gpt-4.1-mini
```

---

## 🛠️ Adım 3: Servis Katmanını Uygulama

`ChatClient.Builder` ile ChatClient’i oluşturup sarmalayan bir `AIService` sınıfı yazın.

:::tabs
@tab Java [icon=java]

```java filename="AIService.java"
package com.example.ai.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class AIService {
    private final ChatClient chatClient;

    public AIService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public String getJoke(String topic) {
        return chatClient.prompt()
                .user(u -> u.text("Tell me a joke about {topic}").param("topic", topic))
                .call()
                .content();
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="AIService.kt"
package com.example.ai.service

import org.springframework.ai.chat.client.ChatClient
import org.springframework.stereotype.Service

@Service
class AIService(builder: ChatClient.Builder) {
    private val chatClient: ChatClient = builder.build()

    fun getJoke(topic: String): String =
        chatClient.prompt()
            .user { it.text("Tell me a joke about {topic}").param("topic", topic) }
            .call()
            .content()
```

:::

---

## 🛠️ Adım 4: REST Controller Oluşturma

`AIService`’i HTTP üzerinden sunmak için bir `ChatController` sınıfı oluşturun.

:::tabs
@tab Java [icon=java]

```java filename="ChatController.java"
package com.example.ai.controller;

import com.example.ai.service.AIService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ChatController {

    private final AIService aiService;

    public ChatController(AIService aiService) {
        this.aiService = aiService;
    }

    @GetMapping("/joke")
    public String getJoke(@RequestParam(defaultValue = "dogs") String topic) {
        return aiService.getJoke(topic);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="ChatController.kt"
package com.example.ai.controller

import com.example.ai.service.AIService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
class ChatController(private val aiService: AIService) {

    @GetMapping("/joke")
    fun getJoke(@RequestParam(defaultValue = "dogs") topic: String): String =
        aiService.getJoke(topic)
```

:::

---

## ▶️ Uygulamayı Çalıştırma

Spring Boot uygulamanızı başlatın:

```bash
./mvnw spring-boot:run
# veya
gradle bootRun
```

---

## 🧪 Entegrasyonu Test Etme

HTTP üzerinden servisinizi çağırın:

```bash
curl -X GET "http://localhost:8080/joke?topic=dogs"
# AI modelinin döndürdüğü köpek şakası
```

---

## 🏁 Sonuç

Artık Spring Boot AI Entegrasyonu için üretim odaklı bir Spring Boot temeliniz var. Sonraki adımda ayarları kendi domainine uyarlayıp test ve gözlemlenebilirlik katmanını ekleyerek gerçek trafik altında doğrulayın.
