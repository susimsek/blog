---
title: 'Dependency Injection in Spring Boot'
date: '2024-12-18'
summary: 'Learn how Dependency Injection (DI) works in Spring Boot, including examples in Java and Kotlin. Covers key concepts, annotations, and practical use cases.'
thumbnail: '/images/spring-boot-di-thumbnail.webp'
readingTime: '2 min read'
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
  - id: 'dependency-injection'
    name: 'Dependency Injection'
    color: 'orange'
  - id: 'programming'
    name: 'Programming'
    color: 'blue'
---

Dependency Injection (DI) is a fundamental concept in Spring Boot that helps achieve loose coupling and increased testability. This guide demonstrates how to use DI in Spring Boot with practical examples in Java and Kotlin.

---

## 🌟 Why Use Dependency Injection?

Dependency Injection allows developers to manage and inject dependencies into classes without manually instantiating them. This leads to:

- Better code modularity
- Simplified testing
- Easier maintenance

---

## 📋 Prerequisites

📋 Ensure you have the following:

- ☕ Java Development Kit (JDK) 17+
- 📦 Maven or Gradle installed
- 🔤 A Java IDE (e.g., IntelliJ IDEA, Eclipse)

---

## 🛠️ Step 1: Add Dependencies

Include the necessary Spring Boot dependencies:

- Maven:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter</artifactId>
</dependency>
```

- Gradle:

```groovy
implementation 'org.springframework.boot:spring-boot-starter'
```

---

## 🛠️ Step 2: Create a Service

Define a simple service to demonstrate DI.

:::tabs
@tab Java [icon=java]

### Service

```java
package com.example.demo.service;

import org.springframework.stereotype.Service;

@Service
public class UserService {

    public String getUserById(String id) {
        return "User with ID: " + id;
    }

    public String getAllUsers() {
        return "Fetching all users.";
    }
}
```

@tab Kotlin [icon=kotlin]

### Service

```kotlin
package com.example.demo.service

import org.springframework.stereotype.Service

@Service
class UserService {

    fun getUserById(id: String): String {
        return "User with ID: $id"
    }

    fun getAllUsers(): String {
        return "Fetching all users."
    }
}
```

:::

---

## 🛠️ Step 3: Inject Dependencies

Use annotations to inject the service into other components.

:::tabs
@tab Java [icon=java]

### Controller

```java
package com.example.demo.controller;

import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public String getUserById(@PathVariable String id) {
        return userService.getUserById(id);
    }

    @GetMapping
    public String getAllUsers() {
        return userService.getAllUsers();
    }
}
```

@tab Kotlin [icon=kotlin]

### Controller

```kotlin
package com.example.demo.controller

import com.example.demo.service.UserService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/users")
class UserController(
    private val userService: UserService
) {

    @GetMapping("/{id}")
    fun getUserById(@PathVariable id: String): String = userService.getUserById(id)

    @GetMapping
    fun getAllUsers(): String = userService.getAllUsers()
}
```

:::

---

## ▶️ Running the Application

Run the application using the following commands:

- Spring Boot (Java/Kotlin):

  ```bash
  ./mvnw spring-boot:run
  ```

Access the API at `http://localhost:8080/api/users`.

---

## 🧪 Test the API

You can test the API using the following cURL commands:

- Fetch all users:

```bash
curl -X GET http://localhost:8080/api/users
```

- Fetch a user by ID:

```bash
curl -X GET http://localhost:8080/api/users/1
```

---

## 🏁 Conclusion

This setup delivers a robust, production-ready Dependency Injection in Spring Boot solution in Spring Boot, combining best practices, clear structure, and practical examples you can adapt to your own project.
