---
title: 'Spring Boot Docker Integration'
date: '2025-02-21'
summary: 'Learn how to build and deploy Spring Boot applications using Docker with Buildpacks and Jib for efficient containerization.'
thumbnail: '/images/spring-boot-docker-thumbnail.jpeg'
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
  - id: 'docker'
    name: 'Docker'
    color: 'blue'
  - id: 'containerization'
    name: 'Containerization'
    color: 'orange'
  - id: 'jib'
    name: 'Jib'
    color: 'pink'
  - id: 'programming'
    name: 'Programming'
    color: 'brown'
---

Spring Boot provides multiple ways to containerize applications efficiently using **Docker**, **Buildpacks**, and **Jib**. This guide explores different approaches to building and deploying Spring Boot applications with Docker.

---

## 🌟 Why Use Docker for Spring Boot?

- **Portable Deployment**: Run applications consistently across environments.
- **Scalability**: Easily scale and manage containerized applications.
- **Lightweight and Efficient**: Optimize resource utilization with minimal overhead.
- **DevOps Friendly**: Seamlessly integrate with CI/CD pipelines.

---

## 🌟 Prerequisites

Ensure you have the following:

- ☕ **Java Development Kit (JDK)** 17+
- 📦 **Maven or Gradle** installed
- 🐳 **Docker** installed and running

---

## 🛠️ Step 1: Add Dependencies

To enable Docker support, add the **Spring Boot Maven Plugin**, **Jib Plugin**, and **Spring Boot Web Starter** to your build tool.

### Maven Configuration:

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
        <plugin>
            <groupId>com.google.cloud.tools</groupId>
            <artifactId>jib-maven-plugin</artifactId>
            <version>3.3.2</version>
        </plugin>
    </plugins>
</build>
```

### Gradle Configuration:

```groovy
plugins {
    id 'org.springframework.boot' version '3.2.0'
    id 'com.google.cloud.tools.jib' version '3.3.2'
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
}
```

To enable Docker support, add the **Spring Boot Maven Plugin** and **Jib Plugin** to your build tool.

### Maven Configuration:

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
        <plugin>
            <groupId>com.google.cloud.tools</groupId>
            <artifactId>jib-maven-plugin</artifactId>
            <version>3.3.2</version>
        </plugin>
    </plugins>
</build>
```

### Gradle Configuration:

```groovy
plugins {
    id 'org.springframework.boot' version '3.2.0'
    id 'com.google.cloud.tools.jib' version '3.3.2'
}
```

---

## 📖 Step 2: Create a Simple Spring Boot Application

Define a REST endpoint to deploy inside a Docker container.

:::tabs
@tab Java [icon=java]

```java
package com.example.docker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class DockerApplication {

    public static void main(String[] args) {
        SpringApplication.run(DockerApplication.class, args);
    }

    @GetMapping("/hello")
    public String hello() {
        return "Hello from Spring Boot running in Docker!";
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.docker

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@SpringBootApplication
@RestController
class DockerApplication {

    @GetMapping("/hello")
    fun hello(): String = "Hello from Spring Boot running in Docker!"
}

fun main(args: Array<String>) {
    runApplication<DockerApplication>(*args)
}
```

:::

---

## 🐳 Step 3: Build and Run a Docker Image

### Option 1: Using Buildpacks

Spring Boot provides built-in support for creating Docker images without a `Dockerfile` using **Buildpacks**.

```bash
mvn spring-boot:build-image
```

```bash
gradle bootBuildImage
```

Run the container:

```bash
docker run --rm -p 8080:8080 myproject:0.0.1-SNAPSHOT
```

---

### Option 2: Using Jib

Jib allows building optimized container images without a Docker daemon.

```bash
mvn jib:dockerBuild
```

```bash
gradle jibDockerBuild
```

Run the Jib-built container:

```bash
docker run --rm -p 8080:8080 myproject:0.0.1-SNAPSHOT
```

---

## ▶️ Running the Application

Once the container is running, test the REST API:

```bash
curl -X GET http://localhost:8080/hello
```

Expected Output:

```plaintext
Hello from Spring Boot running in Docker!
```

---

Spring Boot provides multiple approaches to containerizing applications efficiently. Whether you use **Buildpacks** for simplicity or **Jib** for optimized image builds, Dockerizing Spring Boot applications is seamless and production-ready.
