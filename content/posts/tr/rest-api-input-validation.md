---
title: 'REST API’lerde Girdi Doğrulama'
date: '2024-12-15'
summary: 'Spring Boot ve Gin gibi framework’leri kullanarak Java, Kotlin ve Go ile REST API’lerde girdi doğrulamasını nasıl uygulayacağnızı öğrenin. Anotasyonlar, özel doğrulama ve hata yönetimi örnekleri içerir.'
thumbnail: '/images/input-validation-thumbnail.webp'
readingTime: '4 dk okuma'
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
    name: 'Doğrulama'
    color: 'orange'
  - id: 'programming'
    name: 'Programlama'
    color: 'blue'
---

REST API’lerde girdi doğrulama, güvenli ve sağlam web servisleri oluşturmak için çok önemlidir. Bu makalede, Spring Boot kullanarak Java ve Kotlin’de, Gin framework’ü ile Go’da doğrulamanın nasıl yapılacağını adım adım inceleyeceğiz.

---

## 🌟 Girdi Doğrulama Neden Önemlidir?

Doğrulama, API’nıza gönderilen verilerin beklenen formatlara uygun olmasını sağlayarak SQL Enjeksiyonu, XSS ve hatalı veri girişi gibi potansiyel güvenlik açıklarını engeller.

---

## 🧪 Adım 1: Doğrulama Bağımlılıklarını Ekleyin

### Spring Boot Projeleri için:

- **Maven:**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

- **Gradle:**

```groovy
implementation 'org.springframework.boot:spring-boot-starter-validation'
```

### Gin Framework (Go) için:

```bash
# Gin frameworkünü yükleyin
go get -u github.com/gin-gonic/gin

# Doğrulama paketi ekleyin
go get -u github.com/go-playground/validator/v10
```

---

## 🧪 Adım 2: Doğrulama Kuralları ile Bir DTO Tanımlayın

Alanlara doğrulama kurallarını tanımlamak için anotasyonlar kullanın. Örnekler: `@NotNull`, `@Size`, `@Pattern`.

:::tabs
@tab Java [icon=java]

```java
package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TodoRequest {

    @NotNull(message = "Başlık zorunludur")
    @Size(min = 3, max = 50, message = "Başlık 3 ile 50 karakter arasında olmalıdır")
    private String title;

    private boolean completed;
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.demo.dto

import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

data class TodoRequest(
    @field:NotNull(message = "Başlık zorunludur")
    @field:Size(min = 3, max = 50, message = "Başlık 3 ile 50 karakter arasında olmalıdır")
    val title: String?,

    val completed: Boolean = false
)
```

@tab Go [icon=go]

```go
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

## 🧪 Adım 3: Doğrulama ile Bir Controller Oluşturun

Doğrulamayı REST endpoint’lerinize entegre edin.

:::tabs
@tab Java [icon=java]

```java
package com.example.demo.controller;

import com.example.demo.dto.TodoRequest;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/todos")
public class TodoController {

    @PostMapping
    public String createTodo(@Validated @RequestBody TodoRequest request) {
        return "Oluşturulan görev: " + request.getTitle();
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.demo.controller

import com.example.demo.dto.TodoRequest
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/todos")
class TodoController {

    @PostMapping
    fun createTodo(@Validated @RequestBody request: TodoRequest): String {
        return "Oluşturulan görev: ${request.title}"
    }
}
```

@tab Go [icon=go]

```go
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

    c.JSON(http.StatusOK, gin.H{"message": "Oluşturulan görev", "title": todo.Title})
}
```

:::

---

## 🛠️ Adım 4: Hata Mesajlarını Yönetin

Hata mesajlarını daha kullanıcı dostu olacak şekilde düzelleyin.

:::tabs
@tab Java [icon=java]

```java
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

```kotlin
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

```go
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

## main.go Örneği

Gin uygulaması için `main.go` dosyasının bir örneği:

```go
package main

import (
	"controller"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.POST("/api/todos", controller.CreateTodoHandler)

	r.Run() // Sunucu: http://localhost:8080
}
```

---

## ▶️ Adım 5: Uygulamayı Çalıştırın

### Spring Boot (Java/Kotlin)

Spring Boot uygulamasını terminal veya IDE’nizden çalıştırın:

```bash
./mvnw spring-boot:run # Maven projeleri için
./gradlew bootRun       # Gradle projeleri için
```

API adresi: `http://localhost:8080/api/todos`

### Gin (Go)

Go uygulamasını çalıştırın:

```bash
go run main.go
```

API adresi: `http://localhost:8080/api/todos`

---

## 🧪 cURL ile Test Etme

API’yı test etmek için cURL komutları:

- **Yeni Bir Görev Ekleme:**

```bash
curl -X POST http://localhost:8080/api/todos \
-H "Content-Type: application/json" \
-d '{"title": "Yeni Görev", "completed": false}'
```

- **Tüm Görevleri Getirme:**

```bash
curl -X GET http://localhost:8080/api/todos
```

- **Doğrulama Hatalarını Test Etme:**

Geçersiz bir istek gönderin:

```bash
curl -X POST http://localhost:8080/api/todos \
-H "Content-Type: application/json" \
-d '{"title": ""}'
```

---

## 🏁 Sonuç

Bu kurulum, Spring Boot ile REST API’lerde Girdi Doğrulama için sağlam ve üretim‑hazır bir yaklaşım sunar; en iyi pratikleri, net bir yapı ve kendi projenize uyarlayabileceğiniz örneklerle birleştirir.
