---
title: 'Spring Boot Eureka Server'
date: '2025-02-23'
summary: 'Learn how to set up and configure a Spring Boot Eureka Server for service discovery in microservices architecture.'
thumbnail: '/images/spring-boot-eureka-server-thumbnail.jpg'
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
  - id: 'spring-cloud'
    name: 'Spring Cloud'
    color: 'pink'
  - id: 'eureka-server'
    name: 'Eureka Server'
    color: 'blue'
  - id: 'microservice'
    name: 'Microservice'
    color: 'orange'
  - id: 'programming'
    name: 'Programming'
    color: 'brown'
---

Spring Boot **Eureka Server** is a service registry that enables service discovery in a microservices architecture. It allows microservices to register themselves and discover other services dynamically. This guide will walk you through setting up and configuring a Spring Boot Eureka Server.

---

## 🌟 Why Use Eureka Server?

- **Service Discovery**: Automatically register and discover microservices.
- **Load Balancing**: Enables client-side load balancing with Ribbon.
- **Failover Support**: Services can find alternative instances if one fails.
- **Scalability**: Easily scale microservices without manual configuration.
- **Spring Cloud Integration**: Works seamlessly with Spring Boot applications.

---

## 🌟 Prerequisites

Ensure you have the following:

- ☕ **Java Development Kit (JDK)** 17+
- 📦 **Maven or Gradle** installed

---

## 🛠 Step 1: Add Dependencies

### Maven Configuration:

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
</dependency>
```

### Gradle Configuration:

```groovy
implementation 'org.springframework.cloud:spring-cloud-starter-netflix-eureka-server'
```

---

## 📖 Step 2: Create the Eureka Server Application

:::tabs
@tab Java [icon=java]

```java
package com.example.eurekaserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.eurekaserver

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer

@SpringBootApplication
@EnableEurekaServer
class EurekaServerApplication

fun main(args: Array<String>) {
    runApplication<EurekaServerApplication>(*args)
}
```

:::

---

## 🛠 Step 3: Configure the Eureka Server

Create an `application.yml` file for Eureka Server configuration.

```yaml
server:
  port: 8761
spring:
  application:
    name: eureka-server
eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
  server:
    wait-time-in-ms-when-sync-empty: 5
```

> **Note:** The Eureka Server does not register itself.

---

## ▶️ Running the Eureka Server

Start the Eureka Server application:

```bash
./mvnw spring-boot:run
```

or using Gradle:

```bash
gradle bootRun
```

Access the Eureka Server dashboard:

```bash
http://localhost:8761/
```

---

## 📌 Step 4: Register a Client Application

### Add Dependencies

#### Maven:

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

#### Gradle:

```groovy
implementation 'org.springframework.cloud:spring-cloud-starter-netflix-eureka-client'
```

### Client Application Configuration

In the client's `application.yml`, add the following:

```yaml
spring:
  application:
    name: eureka-client
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

### Client Application Code

:::tabs
@tab Java [icon=java]

```java
package com.example.eurekaclient;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
@RequestMapping("/client")
public class EurekaClientApplication {

    @GetMapping
    public String getClientMessage() {
        return "Hello from Eureka Client!";
    }

    public static void main(String[] args) {
        SpringApplication.run(EurekaClientApplication.class, args);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.eurekaclient

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@SpringBootApplication
@RestController
@RequestMapping("/client")
class EurekaClientApplication {

    @GetMapping
    fun getClientMessage(): String {
        return "Hello from Eureka Client!"
    }
}

fun main(args: Array<String>) {
    runApplication<EurekaClientApplication>(*args)
}
```

:::

---

## 🏃 Running the Client Application

Run the Eureka Client application:

```bash
./mvnw spring-boot:run
```

or using Gradle:

```bash
gradle bootRun
```

Check if the client has registered with Eureka Server by visiting:

```bash
http://localhost:8761/
```

---

Spring Boot Eureka Server provides a robust service discovery mechanism, enabling microservices to dynamically register and locate each other. This enhances scalability, fault tolerance, and efficient communication between microservices.
