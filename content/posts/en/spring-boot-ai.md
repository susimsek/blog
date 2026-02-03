---
title: 'Spring Boot AI Integration'
date: '2025-04-23'
summary: 'Learn how to integrate AI models into Spring Boot applications using Spring AI for modular, portable, and observable AI workflows.'
thumbnail: '/images/spring-boot-ai-thumbnail.webp'
readingTime: '3 min read'
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
    name: 'Artificial Intelligence'
    color: 'pink'
  - id: 'programming'
    name: 'Programming'
    color: 'brown'
---

Spring AI is a framework for AI engineering that applies Spring’s portability and modular design principles to AI workloads. It lets you build AI-driven applications using familiar Spring idioms and POJOs.

---

## 🌟 Why Use Spring AI?

- **Provider-agnostic portability**: Write code once and switch between AI providers (OpenAI, Anthropic, Azure, etc.) without changes.
- **POJO-based design**: Model AI inputs and outputs as plain Java/Kotlin objects for type safety and easy integration.
- **Structured outputs**: Automatically map model responses to your domain objects.
- **Vector store integration**: Seamless support for major vector databases (Chroma, Pinecone, Redis, etc.) via a unified API.
- **Tool/function calling**: Enable LLMs to invoke custom functions or services for real-time data.
- **Observability & evaluation**: Built-in metrics and evaluation utilities to monitor AI operations and detect hallucinations.
- **Chat abstractions**: Fluent ChatClient API, similar to Spring’s WebClient, for building conversational agents.
- **Retrieval-augmented generation (RAG)**: Simplify document-based QA and memory-backed chat with advisors and memory APIs.

---

## 📋 Prerequisites

Ensure you have the following:

- ☕ **Java Development Kit (JDK)** 17+
- 📦 **Maven or Gradle** installed
- 🐳 **Spring Boot** 3+
- 🔑 **OpenAI API Key** (set as environment variable `OPENAI_API_KEY`)

---

## 🛠️ Step 1: Add Dependencies

Include Spring AI starter for OpenAI, Spring Web, and Lombok.

:::tabs
@tab Maven [icon=maven]

```xml
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

```groovy
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

## 🛠️ Step 2: Configuration

In `application.yml`, configure your OpenAI key and set the ChatClient model:

```yaml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}
      chat:
        options:
          model: gpt-4.1-mini
```

---

## 🛠️ Step 3: Implement the Service Layer

Create an `AIService` to wrap your ChatClient. Inject `ChatClient.Builder` and build the client.

:::tabs
@tab Java [icon=java]

```java
package com.example.ai.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

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

```kotlin
package com.example.ai.service

import org.springframework.ai.chat.client.ChatClient
import org.springframework.stereotype.Service

@Service
class AIService(builder: ChatClient.Builder) {
    private val chatClient: ChatClient = builder.build()

    fun getJoke(topic: String): String {
        return chatClient.prompt()
            .user { it.text("Tell me a joke about {topic}").param("topic", topic) }
            .call()
            .content()
    }
}
```

:::

---

## 🛠️ Step 4: Expose a REST Controller

Create a `ChatController` to expose your AIService over HTTP.

:::tabs
@tab Java [icon=java]

```java
package com.example.ai.controller;

import com.example.ai.service.AIService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final AIService aiService;

    @GetMapping("/joke")
    public String getJoke(@RequestParam(defaultValue = "dogs") String topic) {
        return aiService.getJoke(topic);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.ai.controller

import com.example.ai.service.AIService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
class ChatController(private val aiService: AIService) {

    @GetMapping("/joke")
    fun getJoke(@RequestParam(defaultValue = "dogs") topic: String): String {
        return aiService.getJoke(topic)
    }
}
```

:::

---

## ▶️ Running the Application

Start your Spring Boot app:

```bash
./mvnw spring-boot:run
# or
gradle bootRun
```

---

## 🧪 Testing the Integration

Call your service via HTTP:

```bash
curl -X GET "http://localhost:8080/joke?topic=dogs"
# Returns a dog joke generated by the AI model.
```

---

Spring AI’s `ChatClient` API makes it trivial to integrate conversational AI into your Spring Boot services, leveraging familiar paradigms with powerful LLM capabilities.
