---
title: 'Spring Boot with OpenAPI'
publishedDate: '2024-12-20'
updatedDate: '2024-12-21'
summary: 'Learn how to integrate OpenAPI into your Spring Boot application for API documentation and testing using SpringDoc.'
thumbnail: '/images/spring-boot-openapi-thumbnail.webp'
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
  - id: 'openapi'
    name: 'OpenAPI'
    color: 'orange'
  - id: 'documentation'
    name: 'Documentation'
    color: 'brown'
  - id: 'programming'
    name: 'Programming'
    color: 'blue'
---

OpenAPI simplifies API documentation and testing by providing an interactive interface and machine-readable documentation. This guide will show you how to integrate OpenAPI into your Spring Boot application using SpringDoc.

---

## 🌟 Why Use OpenAPI?

In this section, we clarify Why Use OpenAPI? and summarize the key points you will apply in implementation.

- Interactive Documentation: Offers a user-friendly interface for exploring APIs.
- Standardized Format: Generates machine-readable API definitions.
- Ease of Testing: Provides built-in tools for testing endpoints.
- Client Code Generation: Allows automatic generation of client code for various programming languages.

---

## 📋 Prerequisites

📋 Ensure you have the following:

- ☕ Java Development Kit (JDK) 17+
- 📦 Maven or Gradle installed
- 🔤 A Java IDE (e.g., IntelliJ IDEA, Eclipse)

---

## 🛠️ Step 1: Add Dependencies

To integrate OpenAPI using SpringDoc, add the following dependency to your Spring Boot project:

- Maven:

```xml filename="pom.xml"
<dependency>
  <groupId>org.springdoc</groupId>
  <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
  <version>2.1.0</version>
</dependency>
```

- Gradle:

```groovy filename="build.gradle"
implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.1.0'
```

---

## 🛠️ Step 2: Configure OpenAPI

SpringDoc requires minimal configuration. You can customize your OpenAPI documentation using the `application.properties` or `application.yml` file.

### Example Configuration:

Use this configuration as a baseline and adjust values for your local or production environment.

```properties filename="config.properties"
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
```

---

## 🛠️ Step 3: Annotate Your REST Controllers

Add annotations to your REST controllers and models to generate OpenAPI documentation automatically.

:::tabs
@tab Java [icon=java]

Controller Example

```java filename="UserController.java"
package com.example.openapi.controller;

import com.example.openapi.model.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

  @Operation(summary = "Get all users", description = "Retrieve a list of users")
  @ApiResponse(responseCode = "200", description = "Successful operation",
    content = @Content(mediaType = "application/json"))
  @GetMapping
  public List<User> getAllUsers() {
    return List.of(new User(1L, "John Doe", "john@example.com"));
  }

  @Operation(summary = "Create a new user", description = "Add a new user to the system")
  @ApiResponse(responseCode = "201", description = "User created successfully",
    content = @Content(mediaType = "application/json"))
  @PostMapping
  public User createUser(@RequestBody User user) {
    return user;
  }
}
```

User Model

```java filename="User.java"
package com.example.openapi.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    private Long id;
    private String name;
    private String email;
}
```

@tab Kotlin [icon=kotlin]

Controller Example

```kotlin filename="UserController.kt"
package com.example.openapi.controller

import com.example.openapi.model.User
import io.swagger.v3.oas.annotations.*
import io.swagger.v3.oas.annotations.responses.*
import io.swagger.v3.oas.annotations.media.*
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/users")
class UserController {

    @Operation(summary = "Get all users", description = "Retrieve a list of users")
    @ApiResponse(responseCode = "200", description = "Successful operation",
                 content = [Content(mediaType = "application/json")])
    @GetMapping
    fun getAllUsers(): List<User> = listOf(User(1L, "John Doe", "john@example.com"))

    @Operation(summary = "Create a new user", description = "Add a new user to the system")
    @ApiResponse(responseCode = "201", description = "User created successfully",
                 content = [Content(mediaType = "application/json")])
    @PostMapping
    fun createUser(@RequestBody user: User): User = user
}
```

User Model

```kotlin filename="User.kt"
package com.example.openapi.model

data class User(
  val id: Long,
  val name: String,
  val email: String
)
```

:::

---

## ▶️ Running the Application

Run the application using the following command:

```bash
./mvnw spring-boot:run
```

Access the OpenAPI documentation at:

- API Docs: `http://localhost:8080/api-docs`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

---

## 🧪 Testing the API

You can test the generated API documentation by exploring the Swagger UI interface:

1. Navigate to `http://localhost:8080/swagger-ui.html` in your browser.
2. Test endpoints interactively by providing inputs and observing responses.

---

## 🏁 Conclusion

You now have a practical Spring Boot with OpenAPI implementation with a clear, production-friendly Spring Boot structure. As a next step, adapt configuration and tests to your own domain, then validate behavior under realistic traffic and failure scenarios.
