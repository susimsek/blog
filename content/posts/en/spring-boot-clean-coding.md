---
title: 'Clean Coding Practices in Spring Boot'
date: '2024-12-19'
summary: 'Learn how to apply clean coding principles in Spring Boot projects. Includes best practices, examples, and benefits of using Lombok in Java and Kotlin clean code techniques.'
thumbnail: '/images/spring-boot-clean-coding-thumbnail.webp'
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
  - id: 'clean-coding'
    name: 'Clean Coding'
    color: 'orange'
  - id: 'programming'
    name: 'Programming'
    color: 'blue'
---

Clean coding practices ensure that your Spring Boot applications are maintainable, readable, and scalable. This guide provides essential tips and code examples to help you write cleaner and more efficient code in both Java and Kotlin.

---

## 🌟 Why Focus on Clean Coding?

Adopting clean coding principles helps to:

- Improve code readability and maintainability.
- Reduce technical debt.
- Make onboarding new developers easier.
- Enhance scalability and debugging processes.

---

## 📋 Prerequisites

📋 Ensure you have the following:

- ☕ Java Development Kit (JDK) 17+
- 📦 Maven or Gradle installed
- 🔤 A Java IDE (e.g., IntelliJ IDEA, Eclipse)
- 🛠️ Familiarity with Spring Boot basics

---

## 🛠️ Step 1: Structure Your Project

Organize your Spring Boot project for better clarity:

- Controller Layer: Handles incoming HTTP requests.
- Service Layer: Contains business logic.
- Repository Layer: Interacts with the database.

### Example Folder Structure:

```
src/main/java/com/example/cleanproject
├── controller
├── service
├── repository
├── entity
└── dto
```

---

## 🛠️ Step 2: Use Lombok for Cleaner Java Code

Lombok reduces boilerplate code in Java, making your classes more concise and readable. Here's how to use Lombok effectively:

### Add Lombok Dependency

- Maven:

```xml
<dependency>
  <groupId>org.projectlombok</groupId>
  <artifactId>lombok</artifactId>
  <scope>provided</scope>
</dependency>
```

- Gradle:

```groovy
provided 'org.projectlombok:lombok'
annotationProcessor 'org.projectlombok:lombok'
```

### Example: Entity with Lombok

```java
package com.example.cleanproject.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String email;
}
```

Benefits:

- `@Data` generates getters, setters, equals, hashCode, and toString methods.
- `@NoArgsConstructor` and `@AllArgsConstructor` create constructors.

---

## 🛠️ Step 3: Write Concise and Readable Code in Kotlin

Kotlin offers modern features that naturally lead to cleaner code:

### Example: Entity in Kotlin

```kotlin
package com.example.cleanproject.entity

import jakarta.persistence.*

@Entity
data class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    var name: String,
    var email: String
)
```

Advantages of Kotlin:

- `data class` automatically generates `toString`, `equals`, and `hashCode` methods.
- Immutable properties (`val`) ensure better stability.

---

## 🛠️ Step 4: Follow Dependency Injection Principles

Use dependency injection to decouple components and improve testability.

### Example: Service Layer with DI

:::tabs
@tab Java [icon=java]

```java
package com.example.cleanproject.service;

import com.example.cleanproject.entity.User;
import com.example.cleanproject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.cleanproject.service

import com.example.cleanproject.entity.User
import com.example.cleanproject.repository.UserRepository
import org.springframework.stereotype.Service

@Service
class UserService(
    private val userRepository: UserRepository
) {
    fun getAllUsers(): List<User> = userRepository.findAll()
}
```

:::

---

## 🛠️ Step 5: Use DTOs for Data Transfer

Data Transfer Objects (DTOs) separate your domain and API layers, promoting better encapsulation.

### Example: DTO for User

:::tabs
@tab Java [icon=java]

```java
package com.example.cleanproject.dto;

import lombok.Data;

@Data
public class UserDTO {
    private String name;
    private String email;
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.cleanproject.dto

data class UserDTO(
    val name: String,
    val email: String
)
```

:::

---

### Controller Layer

Implement a controller to handle HTTP requests and interact with the service layer.

:::tabs
@tab Java [icon=java]

```java
package com.example.cleanproject.controller;

import com.example.cleanproject.dto.UserDTO;
import com.example.cleanproject.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserDTO> getAllUsers() {
        return userService.getAllUsers();
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.cleanproject.controller

import com.example.cleanproject.dto.UserDTO
import com.example.cleanproject.service.UserService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/users")
class UserController(
    private val userService: UserService
) {

    @GetMapping
    fun getAllUsers(): List<UserDTO> = userService.getAllUsers()
}
```

:::

---

## ▶️ Running the Application

Run the application using the following command:

```bash
./mvnw spring-boot:run
```

Test endpoints using a tool like Postman or cURL.

---

## 🧪 Testing the API

You can test the API using the following cURL command:

- Fetch all users:

```bash
curl -X GET http://localhost:8080/api/users
```

---

## 🏁 Conclusion

This setup delivers a robust, production-ready Clean Coding Practices in Spring Boot solution in Spring Boot, combining best practices, clear structure, and practical examples you can adapt to your own project.
