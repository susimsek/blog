---
title: 'Spring Boot Redis Caching'
date: '2024-12-22'
summary: 'Learn how to implement Redis caching in your Spring Boot application to improve performance and efficiency.'
thumbnail: '/images/spring-boot-redis-thumbnail.jpg'
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
  - id: 'redis'
    name: 'Redis'
    color: 'orange'
  - id: 'caching'
    name: 'Caching'
    color: 'brown'
  - id: 'programming'
    name: 'Programming'
    color: 'blue'
---

Redis is a powerful in-memory data store often used for caching, messaging, and real-time data management. This guide explains how to integrate Redis into a Spring Boot application using both Java and Kotlin.

---

## 🌟 Why Use Redis?

- **High Performance**: Redis provides extremely low latency for read and write operations.
- **Versatile Data Structures**: Supports strings, hashes, lists, sets, and more.
- **Scalability**: Ideal for distributed caching and real-time analytics.
- **Integration**: Easily integrates with Spring Boot for seamless development.

---

## 🌟 Prerequisites

🗈 Ensure you have the following:

- ☕ **Java Development Kit (JDK)** 17+
- 📦 **Maven or Gradle** installed
- 🔤 A **Java IDE** (e.g., IntelliJ IDEA, Eclipse)
- 💠 **Redis Server** installed and running locally or accessible via a network

---

## 🛠️ Step 1: Add Dependencies

To integrate Redis into your Spring Boot project, add the following dependencies:

- **Maven:**

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

- **Gradle:**

```groovy
implementation 'org.springframework.boot:spring-boot-starter-data-redis'
```

---

## 📋 Step 2: Configure Redis

Set up the Redis connection in your `application.properties` or `application.yml` file.

### Example Configuration:

```properties
spring.redis.host=localhost
spring.redis.port=6379
```

For advanced setups, such as password authentication or SSL, add these properties:

```properties
spring.redis.password=yourpassword
spring.redis.ssl=true
```

---

## 🔒 Step 3: Enable Caching

Add the `@EnableCaching` annotation to your main application class to enable Spring's caching abstraction.

:::tabs
@tab Java [icon=java]

```java
package com.example.redis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class RedisApplication {
  public static void main(String[] args) {
    SpringApplication.run(RedisApplication.class, args);
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.redis

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cache.annotation.EnableCaching

@SpringBootApplication
@EnableCaching
class RedisApplication

fun main(args: Array<String>) {
  runApplication<RedisApplication>(*args)
}
```

:::

---

## 🔖 Step 4: Service Layer Example with Caching

:::tabs
@tab Java [icon=java]

```java
package com.example.redis.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class UserService {

  @Cacheable("users")
  public String getUserById(String id) {
    simulateSlowService();
    return "User with ID: " + id;
  }

  private void simulateSlowService() {
    try {
      Thread.sleep(3000L);
    } catch (InterruptedException e) {
      throw new IllegalStateException(e);
    }
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.redis.service

import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service

@Service
class UserService {

  @Cacheable("users")
  fun getUserById(id: String): String {
    simulateSlowService()
    return "User with ID: $id"
  }

  private fun simulateSlowService() {
    Thread.sleep(3000L)
  }
}
```

:::

---

## 🔢 Configuring TTL (Time-To-Live)

Set the cache expiration time in your `application.properties` file:

```properties
spring.cache.redis.time-to-live=600000
```

This sets the TTL to 10 minutes (600,000 milliseconds).

---

## 🔢 Controller Example

Create a REST controller to expose the caching functionality.

:::tabs
@tab Java [icon=java]

```java
package com.example.redis.controller;

import com.example.redis.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  @GetMapping("/{id}")
  public String getUser(@PathVariable String id) {
    return userService.getUserById(id);
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.redis.controller

import com.example.redis.service.UserService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/users")
class UserController(
  private val userService: UserService
) {
  @GetMapping("/{id}")
  fun getUser(@PathVariable id: String): String = userService.getUserById(id)
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

You can test the API using cURL or Postman:

- **Fetch a User (cached):**

```bash
curl -X GET http://localhost:8080/users/1
```

Make subsequent requests to observe faster responses due to caching.

---

Integrating Redis with Spring Boot enables high-performance caching and efficient resource management. By using Spring’s caching abstraction and configuring TTL, you can optimize your application’s performance effectively.
