---
title: 'Object-Relational Mapping'
publishedDate: '2024-12-16'
category:
  id: programming
  name: Programlama
  color: blue
  icon: code
updatedDate: '2024-12-17'
summary: 'Spring Boot kullanarak Java, Kotlin ve Go (Gin) ile PostgreSQL entegrasyonu ve temel CRUD işlemlerini içeren bir ORM tabanlı uygulamanın nasıl kurulacağını öğrenin.'
thumbnail: '/images/orm-thumbnail.webp'
readingTime: '3 dk okuma'
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
---

Object-Relational Mapping (ORM), modern uygulamalarda veritabanı işlemlerini basitleştirir. Bu kılavuzda, Spring Boot ve Gin çerçevesini kullanarak PostgreSQL ile ORM nasıl kurulacağını öğreneceksiniz.

---

## 🌟 Neden ORM Kullanmalıyız?

ORM, nesne yönelimli programlama ile ilişkisel veritabanları arasındaki boşluğu kapatarak nesneleri doğrudan veritabanı tablolarına eşler. Bu, manuel SQL sorgularına olan ihtiyacı ortadan kaldırır, hataları azaltır ve geliştiricilerin verimliliğini artırır.

---

## 📋 Gereksinimler

📜 Şunlara sahip olduğunuzdan emin olun:

- ☕ Java Geliştirme Kiti (JDK) 17+
- 📦 Maven veya Gradle kurulu
- 🔤 Bir Java IDE
- 🐘 PostgreSQL kurulu ve çalışır durumda

Go için:

- 🔧 Golang 1.17+ kurulu
- 🔄 Projenizde go.mod başlatılmış

---

## 🛠️ Adım 1: Bağımlılıkları Ekleme

Spring Boot projesi kurmak ve ORM entegrasyonu sağlamak için şu adımları izleyin:

### Bağımlılıkları Ekleme

Spring Boot projeleri için aşağıdaki bağımlılıkları projenize ekleyin:

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

### Veritabanını Yapılandırma

PostgreSQL bağlantınızı `application.properties` veya `application.yml` dosyasına şu şekilde ayarlayın:

```properties filename="application.properties"
spring.datasource.url=jdbc:postgresql://localhost:5432/demo
spring.datasource.username=kullanici_adiniz
spring.datasource.password=sifreniz
spring.jpa.hibernate.ddl-auto=update
```

### Projeyi Başlatma

Henüz yapmadıysanız, [Spring Initializr](https://start.spring.io/) kullanarak projenizi oluşturun:

1. Spring Web, Spring Data JPA ve PostgreSQL Driver bağımlılıklarını seçin.
2. Projeyi indirin ve tercih ettiğiniz IDE'ye aktarın.

Go projeleri için:

- Gin Çerçevesini ve GORM'u Kurun:

```bash
# Gin çerçevesini kurun
go get -u github.com/gin-gonic/gin

# GORM PostgreSQL sürücüsünü kurun
go get -u gorm.io/driver/postgres

# GORM ORM kütüphanesini kurun
go get -u gorm.io/gorm
```

---

## 🛠️ Adım 2: Modeli Tanımlayın ve REST Controller Uygulayın

Bu adım, entity/model, repository ve REST controller oluşturulmasını birleştirir.

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

Model ve Veritabanı Bağlantısı

```go filename="app.go"
package main

import (
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func connectDatabase() {
	dsn := "host=localhost user=kullanici_adiniz password=sifreniz dbname=demo port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Veritabanına bağlanılamadı!")
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

Handlerlar

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

	r.Run() // 0.0.0.0:8080 üzerinde dinle ve hizmet et
}
```

:::

---

## ▶️ Uygulamaları Çalıştırma

Bu bölümde Uygulamaları Çalıştırma konusunu netleştirip uygulamada kullanacağınız temel noktaları özetliyoruz.

- Spring Boot:

  ```bash
  ./mvnw spring-boot:run
  ```

- Gin:

  ```bash
  go run main.go
  ```

---

## 🧪 cURL ile Test Etme

API'yi aşağıdaki cURL komutları ile test edebilirsiniz:

Tüm Kullanıcıları Getir:

```bash
curl -X GET http://localhost:8080/api/users
```

Yeni Bir Kullanıcı Oluştur:

```bash
curl -X POST http://localhost:8080/api/users \
-H "Content-Type: application/json" \
-d '{"name": "John Doe", "email": "johndoe@example.com"}'
```

---

## 🏁 Sonuç

Artık Object-Relational Mapping için üretim odaklı bir Spring Boot temeliniz var. Sonraki adımda ayarları kendi domainine uyarlayıp test ve gözlemlenebilirlik katmanını ekleyerek gerçek trafik altında doğrulayın.
