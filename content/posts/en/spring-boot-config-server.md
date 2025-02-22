---
title: 'Spring Boot Config Server'
date: '2025-02-22'
summary: 'Learn how to use Spring Boot Config Server to centralize and manage application configurations efficiently.'
thumbnail: '/images/spring-boot-config-server-thumbnail.jpg'
readingTime: '4 min read'
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
  - id: 'config-server'
    name: 'Config Server'
    color: 'blue'
  - id: 'microservice'
    name: 'Microservice'
    color: 'orange'
  - id: 'programming'
    name: 'Programming'
    color: 'brown'
---

Spring Boot **Config Server** enables centralized configuration management for distributed applications, allowing dynamic configuration updates without requiring service restarts. This guide covers how to set up and use Spring Boot Config Server efficiently.

---

## 🌟 Why Use Config Server?

- **Centralized Configuration**: Manage application settings in a single place.
- **Dynamic Updates**: Update configurations without restarting services.
- **Environment Profiles**: Support different configurations for dev, test, and production environments.
- **Security & Access Control**: Store sensitive configurations securely.
- **Integration with Git**: Keep configuration versions managed and trackable.

---

## 🌟 Prerequisites

Ensure you have the following:

- ☕ **Java Development Kit (JDK)** 17+
- 📦 **Maven or Gradle** installed
- 📁 **Git Repository** (for storing configurations)

---

## 🛠 Step 1: Add Dependencies

Add the necessary dependencies for **Spring Cloud Config Server**.

### Maven Configuration:

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-config-server</artifactId>
</dependency>
```

### Gradle Configuration:

```groovy
implementation 'org.springframework.cloud:spring-cloud-config-server'
```

---

## 📖 Step 2: Create the Config Server Application

:::tabs
@tab Java [icon=java]

```java
package com.example.configserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;

@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.configserver

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cloud.config.server.EnableConfigServer

@SpringBootApplication
@EnableConfigServer
class ConfigServerApplication

fun main(args: Array<String>) {
    runApplication<ConfigServerApplication>(*args)
}
```

:::

---

## 🛠 Step 3: Configure the Config Server

Create an `application.yml` file to specify the Git repository for storing configurations.

```yaml
server:
  port: 8888
spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/example/config-repo
          default-label: main
```

> **Note:** Replace `https://github.com/example/config-repo` with your actual Git repository.

---

## 📂 Step 4: Create a Configuration Repository

In your Git repository (e.g., `config-repo`), create an `application.yml` file with the following content:

```yaml
config.key: 'Hello from Config Server!'
```

Commit and push the file to the repository:

```bash
git add application.yml
git commit -m "Add config properties"
git push origin main
```

---

## ▶️ Running the Config Server

Start the Config Server application:

```bash
./mvnw spring-boot:run
```

or using Gradle:

```bash
gradle bootRun
```

Verify it is running by accessing:

```bash
curl -X GET http://localhost:8888/application/default
```

Expected Output:

```json
{
  "name": "application",
  "profiles": ["default"],
  "propertySources": [
    {
      "name": "https://github.com/example/config-repo/application.yml",
      "source": {
        "config.key": "Hello from Config Server!"
      }
    }
  ]
}
```

---

## 📌 Step 5: Configure a Client Application

### Add Dependencies

#### Maven:

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-config</artifactId>
</dependency>
```

#### Gradle:

```groovy
implementation 'org.springframework.cloud:spring-cloud-starter-config'
```

### Client Application Configuration

In the client's `bootstrap.yml`, add the following:

```yaml
spring:
  application:
    name: config-client
  cloud:
    config:
      uri: http://localhost:8888
```

### Client Application Code

:::tabs
@tab Java [icon=java]

```java
package com.example.configclient;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;

@SpringBootApplication
@RestController
@RequestMapping("/config")
public class ConfigClientApplication {

  @Value("${config.key:not found}")
  private String configValue;

  @GetMapping
  public String getConfigValue() {
    return "Config Value: " + configValue;
  }

  public static void main(String[] args) {
    SpringApplication.run(ConfigClientApplication.class, args);
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.configclient

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.beans.factory.annotation.Value

@SpringBootApplication
@RestController
@RequestMapping("/config")
class ConfigClientApplication {

    @Value("\${config.key:not found}")
    lateinit var configValue: String

    @GetMapping
    fun getConfigValue(): String {
        return "Config Value: \$configValue"
    }
}

fun main(args: Array<String>) {
    runApplication<ConfigClientApplication>(*args)
}
```

:::

---

## 🏃 Running the Client Application

Run the Config Client application:

```bash
./mvnw spring-boot:run
```

or using Gradle:

```bash
gradle bootRun
```

Retrieve the configuration from Config Server:

```bash
curl -X GET http://localhost:8080/config
```

Expected Output:

```plaintext
Config Value: Hello from Config Server!
```

---

Spring Boot Config Server simplifies configuration management for distributed applications. By centralizing configuration storage, applications can dynamically adapt to changes without restarts, improving maintainability and scalability.
