---
title: 'Spring Boot Circuit Breaker'
date: '2025-03-13'
summary: 'Learn how to implement Circuit Breaker in Spring Boot applications for resilient microservices.'
thumbnail: '/images/spring-boot-circuit-breaker-thumbnail.webp'
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
  - id: 'spring-cloud'
    name: 'Spring Cloud'
    color: 'pink'
  - id: 'circuit-breaker'
    name: 'Circuit Breaker'
    color: 'blue'
  - id: 'microservice'
    name: 'Microservice'
    color: 'orange'
  - id: 'programming'
    name: 'Programming'
    color: 'brown'
---

Spring Boot **Circuit Breaker** is a fault-tolerance mechanism used to prevent cascading failures in a microservices architecture. It helps applications handle failures gracefully by detecting failures and stopping excessive requests to unhealthy services. This guide will walk you through implementing Circuit Breaker using **Resilience4j** in Spring Boot.

---

## 🌟 Why Use Circuit Breaker?

- **Prevents cascading failures** in microservices.
- **Improves application resilience** by stopping excessive failed requests.
- **Automatically recovers** when services become healthy again.
- **Reduces latency** by preventing unnecessary waits for failed services.
- **Configurable retry strategies** to manage failures efficiently.

---

## 📋 Prerequisites

Ensure you have the following:

- ☕ **Java Development Kit (JDK)** 17+
- 📦 **Maven or Gradle** installed
- 🌐 **Spring Boot & Spring Cloud**
- 🛠 **A REST API to demonstrate Circuit Breaker behavior**

---

## 🛠️ Step 1: Add Dependencies

### Maven Configuration:

```xml
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-starter-circuitbreaker-resilience4j</artifactId>
</dependency>
```

### Gradle Configuration:

```groovy
implementation 'org.springframework.cloud:spring-cloud-starter-circuitbreaker-resilience4j'
```

---

## 🛠️ Step 2: Configure Circuit Breaker Properties

Define Circuit Breaker settings in `application.yml`.

```yaml
resilience4j:
  circuitbreaker:
    instances:
      externalService:
        failure-rate-threshold: 50
        slow-call-rate-threshold: 50
        slow-call-duration-threshold: 2000ms
        permitted-number-of-calls-in-half-open-state: 3
        sliding-window-size: 10
        minimum-number-of-calls: 5
        wait-duration-in-open-state: 5s
```

---

## 🛠️ Step 3: Implement Circuit Breaker in a REST Service

### Create a Service to Call an External API

:::tabs
@tab Java [icon=java]

```java
package com.example.circuitbreaker.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ExternalService {

    private final RestTemplate restTemplate = new RestTemplate();

    @CircuitBreaker(name = "externalService", fallbackMethod = "fallbackResponse")
    public String callExternalAPI() {
        return restTemplate.getForObject("http://unreliable-service/api/data", String.class);
    }

    public String fallbackResponse(Exception e) {
        return "Fallback response: Service is unavailable!";
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.circuitbreaker.service

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate

@Service
class ExternalService {
    private val restTemplate = RestTemplate()

    @CircuitBreaker(name = "externalService", fallbackMethod = "fallbackResponse")
    fun callExternalAPI(): String {
        return restTemplate.getForObject("http://unreliable-service/api/data", String::class.java) ?: ""
    }

    fun fallbackResponse(e: Exception): String {
        return "Fallback response: Service is unavailable!"
    }
}
```

:::

---

## 🛠️ Step 4: Create a REST Controller

:::tabs
@tab Java [icon=java]

```java
package com.example.circuitbreaker.controller;

import com.example.circuitbreaker.service.ExternalService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class CircuitBreakerController {

    private final ExternalService externalService;

    public CircuitBreakerController(ExternalService externalService) {
        this.externalService = externalService;
    }

    @GetMapping("/data")
    public String fetchData() {
        return externalService.callExternalAPI();
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.circuitbreaker.controller

import com.example.circuitbreaker.service.ExternalService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
class CircuitBreakerController(private val externalService: ExternalService) {

    @GetMapping("/data")
    fun fetchData(): String {
        return externalService.callExternalAPI()
    }
}
```

:::

---

## ▶️ Running the Application

Start the application:

```bash
./mvnw spring-boot:run
```

or using Gradle:

```bash
gradle bootRun
```

## 🧪 Test the Circuit Breaker

Test the Circuit Breaker:

```bash
curl -X GET http://localhost:8080/api/data
```

---

## 🏁 Conclusion

This setup delivers a robust, production-ready Spring Boot Circuit Breaker solution in Spring Boot, combining best practices, clear structure, and practical examples you can adapt to your own project.
