---
title: 'Building APIs with Spring for GraphQL'
publishedDate: '2024-12-15'
category:
  id: programming
  name: Programming
updatedDate: '2024-12-16'
summary: 'Learn how to build GraphQL APIs using Spring for GraphQL with Java and Kotlin. Includes schema creation, query handling, and integration.'
thumbnail: '/images/spring-boot-graphql-thumbnail.webp'
readingTime: '3 min read'
topics:
  - id: 'java'
    name: 'Java'
    color: 'red'
  - id: 'kotlin'
    name: 'Kotlin'
    color: 'purple'
  - id: 'graphql'
    name: 'GraphQL'
    color: 'pink'
  - id: 'spring-boot'
    name: 'Spring Boot'
    color: 'green'
  - id: 'programming'
    name: 'Programming'
    color: 'blue'
---

Spring for GraphQL simplifies the development of GraphQL APIs by integrating with Spring Boot. This guide demonstrates how to create a GraphQL API using Java and Kotlin, with examples for schema definition, query handling, and dependency injection.

---

## 🌟 Why Use GraphQL?

GraphQL allows clients to request specific data, reducing over-fetching and under-fetching compared to REST. It also supports strong typing and facilitates efficient data fetching, making it a popular choice for modern APIs.

---

## 📋 Prerequisites

📋 Ensure you have the following:

- ☕ Java Development Kit (JDK) 17+
- 📦 Maven or Gradle installed
- 🔤 A Java IDE (e.g., IntelliJ IDEA, Eclipse)

---

## 🛠️ Step 1: Add Dependencies

Include the following dependencies in your project to enable Spring for GraphQL.

Maven:

```xml filename="pom.xml"
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-graphql</artifactId>
</dependency>
```

Gradle:

```groovy filename="build.gradle"
implementation 'org.springframework.boot:spring-boot-starter-graphql'
```

---

## 🛠️ Step 2: Define the GraphQL Schema

Create a schema file named `schema.graphqls` under the `src/main/resources/graphql` directory.

```graphql filename="schema.graphqls"
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

## 🛠️ Step 3: Implement the Data Model and Services

Define the data model and service layer for handling queries.

:::tabs
@tab Java [icon=java]

Entity

```java filename="User.java"
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

Service

```java filename="UserService.java"
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

Entity

```kotlin filename="User.kt"
package com.example.demo.model

data class User(
    val id: String,
    val name: String,
    val email: String
)
```

Service

```kotlin filename="UserService.kt"
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

## 🛠️ Step 4: Implement GraphQL Controllers

Controllers handle GraphQL queries and mutations. Use the `@Controller` annotation in Spring for GraphQL.

:::tabs
@tab Java [icon=java]

```java filename="UserController.java"
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

```kotlin filename="UserController.kt"
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

## ▶️ Running the Application

Run the application using the following commands:

Spring Boot (Java/Kotlin):
Run the application with either stack to confirm the baseline setup is working before deeper tests.

```bash
./mvnw spring-boot:run
```

Access the GraphQL Playground at `http://localhost:8080/graphiql` to test your API.

---

## 🧪 Testing the GraphQL API

Here are some example queries to test your API:

- Fetch a user by ID:

```graphql filename="query.graphql"
query {
  getUser(id: "1") {
    id
    name
    email
  }
}
```

- Fetch all users:

```graphql filename="query.graphql"
query {
  getUsers {
    id
    name
    email
  }
}
```

---

## 🏁 Conclusion

You now have a practical Building APIs with Spring for GraphQL implementation with a clear, production-friendly Spring Boot structure. As a next step, adapt configuration and tests to your own domain, then validate behavior under realistic traffic and failure scenarios.
