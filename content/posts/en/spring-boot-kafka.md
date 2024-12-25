---
title: 'Spring Boot Kafka Integration'
date: '2024-12-25'
summary: 'Learn how to integrate Apache Kafka with Spring Boot to send and consume JSON messages through Kafka topics.'
thumbnail: '/images/spring-boot-kafka-thumbnail.jpg'
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
    name: 'Messaging'
    color: 'brown'
  - id: 'programming'
    name: 'Programming'
    color: 'blue'
---

Apache Kafka is a distributed event streaming platform that facilitates real-time data processing. This guide demonstrates how to send and consume JSON messages in a Spring Boot application using Kafka.

---

## 🌟 Why Use Kafka?

- **Scalable Messaging:** Handle large volumes of data seamlessly.
- **Fault Tolerance:** Ensure data durability and high availability.
- **Real-Time Processing:** Process and analyze data in real time.
- **Integration:** Easily integrate Kafka with Spring Boot for efficient development.

---

## 🌟 Prerequisites

🕊 Ensure you have the following:

- ☕ **Java Development Kit (JDK)** 17+
- 📦 **Maven or Gradle** installed
- 🔠 A **Java IDE** (e.g., IntelliJ IDEA, Eclipse)
- 🔠 **Apache Kafka** installed and running

---

## 🛠️ Step 1: Add Dependencies

To integrate Kafka into your Spring Boot project, add the following dependencies:

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

## 📋 Step 2: Configure Kafka

Set up Kafka connection in your `application.properties` or `application.yml` file:

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

## 📖 Step 3: Create a Model for JSON Messages

### Model Class

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

## 📘 Step 4: Implement Kafka Producer and Consumer

### Producer Example

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

### Consumer Example

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

## 🔄 Controller Example

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

## ▶️ Running the Application

Run the application using the following command:

```bash
./mvnw spring-boot:run
```

---

## 🧪 Testing the API

You can test the Kafka Producer endpoint using cURL or Postman:

```bash
curl -X POST "http://localhost:8080/kafka/publish" \
-H "Content-Type: application/json" \
-d '{"id": "123", "content": "Hello Kafka!"}'
```

Check the Kafka Consumer logs to verify that the message was received and processed.

---

Integrating Kafka with Spring Boot simplifies the development of event-driven and messaging systems. With Kafka's robust features and Spring Boot's ease of use, you can build scalable, real-time applications efficiently.
