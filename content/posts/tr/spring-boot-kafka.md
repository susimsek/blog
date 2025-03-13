---
title: 'Spring Boot ile Kafka Entegrasyonu'
date: '2024-12-25'
summary: 'Spring Boot uygulamanızın Kafka topicleri aracılığıyla JSON mesajları göndermesini ve tüketmesini nasıl entegre edeceğinizi öğrenin.'
thumbnail: '/images/spring-boot-kafka-thumbnail.webp'
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
  - id: 'kafka'
    name: 'Kafka'
    color: 'orange'
  - id: 'messaging'
    name: 'Mesajlaşma'
    color: 'brown'
  - id: 'programming'
    name: 'Programlama'
    color: 'blue'
---

Apache Kafka, gerçek zamanlı veri işleme olanağı sağlayan dağıtık bir olay akışı platformudur. Bu kılavuz, Spring Boot uygulamasında Kafka kullanarak JSON mesajlarının nasıl gönderilip tüketileceğini göstermektedir.

---

## 🌟 Neden Kafka Kullanılmalı?

- **Ölçeklenebilir Mesajlaşma:** Büyük veri hacimlerini sorunsuz bir şekilde işleyin.
- **Hata Toleransı:** Veri dayanıklılığı ve yüksek erişilebilirlik sağlar.
- **Gerçek Zamanlı Veri İşleme:** Verileri anında işleyin ve analiz edin.
- **Kolay Entegrasyon:** Kafka, Spring Boot ile etkin bir geliştirme için kolayca entegre edilebilir.

---

## 🌟 Gereksinimler

📋 Aşağıdakilere sahip olduğunuzdan emin olun:

- ☕ **Java Development Kit (JDK)** 17+
- 📦 **Maven veya Gradle** yüklenmiş
- 🔠 Bir **Java IDE** (IntelliJ IDEA, Eclipse gibi)
- 🔠 **Apache Kafka**, yüklenmiş ve çalışır durumda

---

## 🛠️ Adım 1: Bağımlılıkları Ekleyin

Kafka'yı Spring Boot projenize entegre etmek için aşağıdaki bağımlıkları ekleyin:

- **Maven:**

```xml
<dependency>
  <groupId>org.springframework.kafka</groupId>
  <artifactId>spring-kafka</artifactId>
</dependency>
```

- **Gradle:**

```groovy
implementation 'org.springframework.kafka:spring-kafka'
```

---

## 📋 Adım 2: Kafka'yı Yapılandırın

Kafka bağlantısını `application.properties` veya `application.yml` dosyasında yapılandırın:

```properties
spring.kafka.bootstrap-servers=localhost:9092
spring.kafka.consumer.group-id=my-group
spring.kafka.consumer.auto-offset-reset=earliest
spring.kafka.producer.key-serializer=org.apache.kafka.common.serialization.StringSerializer
spring.kafka.producer.value-serializer=org.springframework.kafka.support.serializer.JsonSerializer
spring.kafka.consumer.value-deserializer=org.springframework.kafka.support.serializer.JsonDeserializer
spring.kafka.consumer.properties.spring.json.trusted.packages=*
```

---

## 📖 Adım 3: JSON Mesajlar için Bir Model Oluşturun

### Model Sınıfı

:::tabs
@tab Java [icon=java]

```java
package com.example.kafka.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    private String id;
    private String content;
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.kafka.model

data class Message(
    val id: String,
    val content: String
)
```

:::

---

## 📘 Adım 4: Kafka Producer ve Consumer Uygulamaları

### Producer Örneği

:::tabs
@tab Java [icon=java]

```java
package com.example.kafka.producer;

import com.example.kafka.model.Message;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class KafkaProducer {

    private final KafkaTemplate<String, Message> kafkaTemplate;

    public void sendMessage(String topic, Message message) {
        kafkaTemplate.send(topic, message);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.kafka.producer

import com.example.kafka.model.Message
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Service

@Service
class KafkaProducer(private val kafkaTemplate: KafkaTemplate<String, Message>) {

    fun sendMessage(topic: String, message: Message) {
        kafkaTemplate.send(topic, message)
    }
}
```

:::

### Consumer Örneği

:::tabs
@tab Java [icon=java]

```java
package com.example.kafka.consumer;

import com.example.kafka.model.Message;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class KafkaConsumer {

    @KafkaListener(topics = "my-topic", groupId = "my-group")
    public void consumeMessage(Message message) {
        System.out.println("Received message: " + message);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.kafka.consumer

import com.example.kafka.model.Message
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.stereotype.Service

@Service
class KafkaConsumer {

    @KafkaListener(topics = ["my-topic"], groupId = "my-group")
    fun consumeMessage(message: Message) {
        println("Received message: $message")
    }
}
```

:::

---

## 🔄 Controller Örneği

:::tabs
@tab Java [icon=java]

```java
package com.example.kafka.controller;

import com.example.kafka.model.Message;
import com.example.kafka.producer.KafkaProducer;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/kafka")
@RequiredArgsConstructor
public class KafkaController {

    private final KafkaProducer kafkaProducer;

    @PostMapping("/publish")
    public String publishMessage(@RequestParam String topic, @RequestBody Message message) {
        kafkaProducer.sendMessage(topic, message);
        return "Message sent to topic: " + topic;
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.kafka.controller

import com.example.kafka.model.Message
import com.example.kafka.producer.KafkaProducer
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/kafka")
class KafkaController(private val kafkaProducer: KafkaProducer) {

    @PostMapping("/publish")
    fun publishMessage(@RequestParam topic: String, @RequestBody message: Message): String {
        kafkaProducer.sendMessage(topic, message)
        return "Message sent to topic: $topic"
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

---

## 🧪 API'yi Test Etme

Kafka Producer apisini cURL veya Postman kullanarak test edebilirsiniz:

```bash
curl -X POST "http://localhost:8080/kafka/publish" \
-H "Content-Type: application/json" \
-d '{"id": "123", "content": "Hello Kafka!"}'
```

Kafka Consumer loglarını kontrol ederek mesajın alındığını ve işlendiğini doğrulayın.

---

Kafka'yı Spring Boot ile entegre etmek, olay tabanlı ve mesajlaşma sistemlerinin geliştirilmesini basitleştirir. Kafka'nın sağladığı güçlü özelliklerle, Spring Boot'un kolay kullanımı bir araya gelerek ölçeklenebilir, gerçek zamanlı uygulamalar oluşturmayı kolaylaştırır.
