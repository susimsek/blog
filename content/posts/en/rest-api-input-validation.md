---
title: 'Input Validation in REST APIs'
publishedDate: '2024-12-15'
category:
  id: programming
  name: Programming
  color: blue
  icon: code
updatedDate: '2024-12-16'
summary: 'Learn how to implement input validation in REST APIs using Java, Kotlin, and Go with frameworks like Spring Boot and Gin. Covers annotations, custom validators, and error handling.'
thumbnail: '/images/input-validation-thumbnail.webp'
readingTime: '4 min read'
topics:
  - id: 'java'
    name: 'Java'
    color: 'red'
  - id: 'kotlin'
    name: 'Kotlin'
    color: 'purple'
  - id: 'go'
    name: 'Go'
    color: 'brown'
  - id: 'spring-boot'
    name: 'Spring Boot'
    color: 'green'
  - id: 'gin'
    name: 'Gin'
    color: 'green'
  - id: 'validation'
    name: 'Validation'
    color: 'orange'
---

Input validation is crucial for building secure and robust REST APIs. In this article, we will explore how to implement input validation in Spring Boot using Java, Kotlin, and Go (with Gin).

---

## 🌟 Why Validate Input?

Validation ensures the data sent to your API adheres to expected formats and prevents potential vulnerabilities like SQL Injection, XSS, and bad data entries.

---

## 📋 Prerequisites

Before implementing validation, make sure you have:

- Java 17+ for Spring Boot examples
- Go 1.21+ for Gin examples
- A running Spring Boot or Gin starter project
- Basic familiarity with DTOs, JSON payloads, and HTTP status codes

---

## 🧪 Step 1: Add Validation Dependencies

For Spring Boot projects, include the following dependencies:

- Maven:

```xml filename="pom.xml"
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

- Gradle:

```groovy filename="build.gradle"
implementation 'org.springframework.boot:spring-boot-starter-validation'
```

For Go projects with Gin, use the following:

```bash
# Install the Gin framework
go get -u github.com/gin-gonic/gin

# Install the validator package
go get -u github.com/go-playground/validator/v10
```

---

## 🧪 Step 2: Define a DTO with Validation Rules

Use annotations to define validation constraints on fields. Examples include `@NotNull`, `@Size`, and `@Pattern`.

:::tabs
@tab Java [icon=java]

```java filename="TodoRequest.java"
package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TodoRequest {

    @NotNull(message = "Title is required")
    @Size(min = 3, max = 50, message = "Title must be between 3 and 50 characters")
    private String title;

    private boolean completed;
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="TodoRequest.kt"
package com.example.demo.dto

import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

data class TodoRequest(
    @field:NotNull(message = "Title is required")
    @field:Size(min = 3, max = 50, message = "Title must be between 3 and 50 characters")
    val title: String?,

    val completed: Boolean = false
)
```

@tab Go [icon=go]

```go filename="app.go"
package dto

import (
    "github.com/go-playground/validator/v10"
)

type TodoRequest struct {
    Title     string `validate:"required,min=3,max=50"`
    Completed bool   `validate:""`
}

var validate = validator.New()

func ValidateTodoRequest(todo TodoRequest) error {
    return validate.Struct(todo)
}
```

:::

---

## 🧪 Step 3: Create a Controller with Validation

Integrate validation into your REST endpoints.

:::tabs
@tab Java [icon=java]

```java filename="TodoController.java"
package com.example.demo.controller;

import com.example.demo.dto.TodoRequest;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/todos")
public class TodoController {

    @PostMapping
    public String createTodo(@Validated @RequestBody TodoRequest request) {
        return "Todo created: " + request.getTitle();
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="TodoController.kt"
package com.example.demo.controller

import com.example.demo.dto.TodoRequest
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/todos")
class TodoController {

    @PostMapping
    fun createTodo(@Validated @RequestBody request: TodoRequest): String {
        return "Todo created: ${request.title}"
    }
}
```

@tab Go [icon=go]

```go filename="app.go"
package controller

import (
    "dto"
    "github.com/gin-gonic/gin"
    "net/http"
)

func CreateTodoHandler(c *gin.Context) {
    var todo dto.TodoRequest

    if err := c.ShouldBindJSON(&todo); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    if err := dto.ValidateTodoRequest(todo); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Todo created", "title": todo.Title})
}
```

:::

---

## 🧪 Step 4: Handle Validation Errors

Customize error handling to return user-friendly responses.

:::tabs
@tab Java [icon=java]

```java filename="GlobalExceptionHandler.java"
package com.example.demo.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Map<String, String> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
        return errors;
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="GlobalExceptionHandler.kt"
package com.example.demo.exception

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.bind.MethodArgumentNotValidException

@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationExceptions(ex: MethodArgumentNotValidException): Map<String, String> {
        return ex.bindingResult.fieldErrors.associate { it.field to it.defaultMessage.orEmpty() }
    }
}
```

@tab Go [icon=go]

```go filename="app.go"
package middleware

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

func ErrorHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()

        if len(c.Errors) > 0 {
            c.JSON(http.StatusBadRequest, gin.H{"errors": c.Errors.JSON()})
        }
    }
}
```

:::

---

main.go Example

Here is an example of the `main.go` file for setting up a Gin application:

```go filename="main.go"
package main

import (
	"controller"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.POST("/api/todos", controller.CreateTodoHandler)

	r.Run() // Start the server on http://localhost:8080
}
```

---

## ▶️ Step 5: Run the Application

To run the application:

Spring Boot (Java/Kotlin):
Run the Spring Boot application from your IDE or terminal:

```bash
./mvnw spring-boot:run # For Maven projects
./gradlew bootRun       # For Gradle projects
```

Access the API at `http://localhost:8080/api/todos`.

### Gin (Go)

Run the Go application:

```bash
go run main.go
```

Access the API at `http://localhost:8080/api/todos`.

## 🧪 Testing with cURL

Here are some example cURL commands to test the API:

- POST a new Todo:

```bash
curl -X POST http://localhost:8080/api/todos \
-H "Content-Type: application/json" \
-d '{"title": "New Task", "completed": false}'
```

- GET all Todos:

```bash
curl -X GET http://localhost:8080/api/todos
```

- Handle Validation Errors:

Send an invalid request:

```bash
curl -X POST http://localhost:8080/api/todos \
-H "Content-Type: application/json" \
-d '{"title": ""}'
```

---

## 🏁 Conclusion

You now have a practical Input Validation in REST APIs implementation with a clear, production-friendly Spring Boot structure. As a next step, adapt configuration and tests to your own domain, then validate behavior under realistic traffic and failure scenarios.
