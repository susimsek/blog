---
title: 'Object-Relational Mapping'
publishedDate: '2024-12-16'
category:
  id: programming
  name: Programming
updatedDate: '2024-12-17'
summary: 'Learn how to set up an ORM-based application with Spring Boot using Java, Kotlin, and Go (Gin). Includes PostgreSQL integration and basic CRUD operations.'
thumbnail: '/images/orm-thumbnail.webp'
readingTime: '3 min read'
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
  - id: 'orm'
    name: 'ORM'
    color: 'orange'
  - id: 'programming'
    name: 'Programming'
    color: 'blue'
---

Object-Relational Mapping (ORM) simplifies database operations in modern applications. This guide will show you how to set up ORM with PostgreSQL using Spring Boot and the Gin framework.

---

## 🌟 Why Use ORM?

ORM bridges the gap between object-oriented programming and relational databases by mapping objects directly to database tables. This eliminates the need for manual SQL queries, reducing errors and increasing productivity for developers.

---

## 📋 Prerequisites

📋 Ensure you have the following:

- ☕ Java Development Kit (JDK) 17+
- 📦 Maven or Gradle installed
- 🖥️ A Java IDE
- 🐘 PostgreSQL installed and running

For Go:

- 🔧 Golang 1.17+ installed
- 🔄 go.mod initialized in your project

---

## 🛠️ Step 1: Add Dependencies

To set up a Spring Boot project and integrate ORM, follow these steps:

### Add Dependencies

For Spring Boot projects, include the following dependencies in your project:

- Maven:

```xml filename="pom.xml"
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
  <groupId>org.postgresql</groupId>
  <artifactId>postgresql</artifactId>
</dependency>
```

- Gradle:

```groovy filename="build.gradle"
implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
implementation 'org.postgresql:postgresql'
```

### Configure the Database

Set up your PostgreSQL connection in the `application.properties` or `application.yml` file:

```properties filename="application.properties"
spring.datasource.url=jdbc:postgresql://localhost:5432/demo
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
```

### Initialize the Project

If you haven't already, create your Spring Boot project using [Spring Initializr](https://start.spring.io/):

1. Choose Spring Web, Spring Data JPA, and PostgreSQL Driver as dependencies.
2. Download the project and import it into your preferred IDE.

For Go projects:

- Install Gin Framework and GORM:

```bash
# Install the Gin framework
go get -u github.com/gin-gonic/gin

# Install the GORM PostgreSQL driver
go get -u gorm.io/driver/postgres

# Install the GORM ORM library
go get -u gorm.io/gorm
```

---

## 🛠️ Step 2: Define the Model and Implement the REST Controller

This step combines creating the entity/model, repository, and REST controllers.

:::tabs
@tab Java [icon=java]

Entity

```java filename="User.java"
package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String email;
}
```

Repository

```java filename="UserRepository.java"
package com.example.demo.repository;

import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
}
```

REST Controller

```java filename="UserController.java"
package com.example.demo.controller;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class UserController {

  private final UserRepository userRepository;

  @GetMapping
  public List<User> getAllUsers() {
    return userRepository.findAll();
  }

  @PostMapping
  public User createUser(@RequestBody User user) {
    return userRepository.save(user);
  }
}
```

@tab Kotlin [icon=kotlin]

Entity

```kotlin filename="User.kt"
package com.example.demo.entity

import jakarta.persistence.*

@Entity
class User(
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  val id: Long = 0,

  var name: String,

  var email: String
)
```

Repository

```kotlin filename="UserRepository.kt"
package com.example.demo.repository

import com.example.demo.entity.User
import org.springframework.data.jpa.repository.JpaRepository

interface UserRepository : JpaRepository<User, Long>
```

REST Controller

```kotlin filename="UserController.kt"
package com.example.demo.controller

import com.example.demo.entity.User
import com.example.demo.repository.UserRepository
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/users")
class UserController(
  private val userRepository: UserRepository
) {

  @GetMapping
  fun getAllUsers(): List<User> = userRepository.findAll()

  @PostMapping
  fun createUser(@RequestBody user: User): User = userRepository.save(user)
}
```

@tab Go [icon=go]

Model and Database Connection

```go filename="app.go"
package main

import (
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func connectDatabase() {
	dsn := "host=localhost user=your_username password=your_password dbname=demo port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Failed to connect to database!")
	}

	DB = db
	DB.AutoMigrate(&User{})
}

type User struct {
	ID    uint   `json:"id" gorm:"primaryKey"`
	Name  string `json:"name"`
	Email string `json:"email"`
}
```

Handlers

```go filename="main.go"
package main

import (
	"github.com/gin-gonic/gin"
)

func getUsers(c *gin.Context) {
	var users []User
	DB.Find(&users)
	c.JSON(200, users)
}

func createUser(c *gin.Context) {
	var user User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	DB.Create(&user)
	c.JSON(201, user)
}

func main() {
	r := gin.Default()
	connectDatabase()

	r.GET("/api/users", getUsers)
	r.POST("/api/users", createUser)

	r.Run() // Listen and serve on 0.0.0.0:8080
}
```

:::

---

## ▶️ Running the Applications

In this section, we clarify Running the Applications and summarize the key points you will apply in implementation.

- Spring Boot:

  ```bash
  ./mvnw spring-boot:run
  ```

- Gin:

  ```bash
  go run main.go
  ```

---

## 🧪 Testing with cURL

You can test the API using the following cURL commands:

Fetch All Users:

```bash
curl -X GET http://localhost:8080/api/users
```

Create a New User:

```bash
curl -X POST http://localhost:8080/api/users \
-H "Content-Type: application/json" \
-d '{"name": "John Doe", "email": "johndoe@example.com"}'
```

---

## 🏁 Conclusion

You now have a practical Object-Relational Mapping implementation with a clear, production-friendly Spring Boot structure. As a next step, adapt configuration and tests to your own domain, then validate behavior under realistic traffic and failure scenarios.
