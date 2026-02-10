---
title: 'Spring GraphQL ile API Oluşturma'
date: '2024-12-15'
summary: 'Java ve Kotlin kullanarak Spring for GraphQL ile GraphQL API\u201leri nasıl oluşturacağınızı öğrenin. Şema oluşturma, sorgu işleme ve entegrasyonu içerir.'
thumbnail: '/images/spring-boot-graphql-thumbnail.webp'
readingTime: '3 dk okuma'
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
  - id: 'graphql'
    name: 'GraphQL'
    color: 'pink'
  - id: 'programming'
    name: 'Programlama'
    color: 'blue'
---

Spring for GraphQL, Spring Boot ile entegre çalışan GraphQL API'lerinin geliştirilmesini kolaylaştırır. Bu rehber, Java ve Kotlin kullanarak bir GraphQL API'si oluşturmanızı, şema tanımlamayı, sorgu işleme ve bağlımlıkların enjekte edilmesini adım adım açıklıyor.

---

## 🌟 Neden GraphQL Kullanılmalı?

GraphQL, istemcilerin sadece gerekli olan verileri talep etmesine izin vererek, REST'e göre fazla veya eksik veri alma problemini azaltır. Ayrıca, güçlü tip desteği sunar ve verimli veri alma sağlar, modern API'ler için popüler bir seçenek haline gelir.

---

## 📋 Gereksinimler

📋 Aşağıdaki bileşenlerin kurulu olduğundan emin olun:

- ☕ Java Development Kit (JDK) 17+
- 📦 Maven veya Gradle kurulu
- 🔤 Bir Java IDE (IntelliJ IDEA, Eclipse vb.)

---

## 🛠️ Adım 1: Bağlımlıkları Ekleme

Spring for GraphQL'i etkinleştirmek için aşağıdaki bağlımlıkları projenize ekleyin.

### Maven:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-graphql</artifactId>
</dependency>
```

### Gradle:

```groovy
implementation 'org.springframework.boot:spring-boot-starter-graphql'
```

---

## 🛠️ Adım 2: GraphQL Şemasını Tanımlama

`src/main/resources/graphql` dizini altında `schema.graphqls` adlı bir dosya oluşturun.

```graphql
type Query {
  getUser(id: ID!): User
  getUsers: [User]
}

type User {
  id: ID!
  name: String!
  email: String!
}
```

---

## 🛠️ Adım 3: Veri Modeli ve Servislerin Tanımlanması

Sorguları işlemek için veri modelinizi ve servis katmanını tanımlayın.

:::tabs
@tab Java [icon=java]

### Entity

```java
package com.example.demo.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private String id;
    private String name;
    private String email;
}
```

### Servis

```java
package com.example.demo.service;

import com.example.demo.model.User;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class UserService {

    private final Map<String, User> userData = Stream.of(
        new User("1", "Alice", "alice@example.com"),
        new User("2", "Bob", "bob@example.com")
    ).collect(Collectors.toMap(User::getId, user -> user));

    public User getUser(String id) {
        return userData.get(id);
    }

    public List<User> getUsers() {
        return List.copyOf(userData.values());
    }
}
```

---

@tab Kotlin [icon=kotlin]

### Entity

```kotlin
package com.example.demo.model

data class User(
    val id: String,
    val name: String,
    val email: String
)
```

### Servis

```kotlin
package com.example.demo.service

import com.example.demo.model.User
import org.springframework.stereotype.Service

@Service
class UserService {

    private val userData = mapOf(
        "1" to User("1", "Alice", "alice@example.com"),
        "2" to User("2", "Bob", "bob@example.com")
    )

    fun getUser(id: String): User? = userData[id]

    fun getUsers(): List<User> = userData.values.toList()
}
```

:::

---

## 🛠️ Adım 4: GraphQL Controllerı Uygulama

GraphQL sorgularını ve mutasyonlarını işlemek için `@Controller` anotasyonunu kullanın.

:::tabs
@tab Java [icon=java]

```java
package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @QueryMapping
    public User getUser(String id) {
        return userService.getUser(id);
    }

    @QueryMapping
    public List<User> getUsers() {
        return userService.getUsers();
    }
}
```

---

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.demo.controller

import com.example.demo.model.User
import com.example.demo.service.UserService
import org.springframework.graphql.data.method.annotation.QueryMapping
import org.springframework.stereotype.Controller

@Controller
class UserController(
    private val userService: UserService
) {

    @QueryMapping
    fun getUser(id: String): User? = userService.getUser(id)

    @QueryMapping
    fun getUsers(): List<User> = userService.getUsers()
}
```

:::

---

## ▶️ Uygulamayı Çalıştırma

Uygulamayı aşağıdaki komutlarla çalıştırın:

- Spring Boot (Java/Kotlin):

  ```bash
  ./mvnw spring-boot:run
  ```

GraphQL Playground'a erişim sağlamak için `http://localhost:8080/graphiql` adresine gidin.

---

## 🧪 GraphQL API'sini Test Etme

API'nizi test etmek için aşağıdaki sorguları kullanabilirsiniz:

- Bir kullanıcıyı ID'ye göre getir:

```graphql
query {
  getUser(id: "1") {
    id
    name
    email
  }
}
```

- Tüm kullanıcıları getir:

```graphql
query {
  getUsers {
    id
    name
    email
  }
}
```

---

## 🏁 Sonuç

Bu kurulum, Spring Boot ile Spring GraphQL ile API Oluşturma için sağlam ve üretim‑hazır bir yaklaşım sunar; en iyi pratikleri, net bir yapı ve kendi projenize uyarlayabileceğiniz örneklerle birleştirir.
