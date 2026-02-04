---
title: 'Spring Boot GraalVM Native Application'
date: '2024-12-28'
summary: 'Learn how to build and deploy a Spring Boot application as a GraalVM native image for improved startup time and reduced resource usage.'
thumbnail: '/images/spring-boot-graalvm-thumbnail.webp'
readingTime: '2 min read'
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
  - id: 'graalvm'
    name: 'GraalVM'
    color: 'pink'
  - id: 'native-image'
    name: 'Native Image'
    color: 'orange'
  - id: 'programming'
    name: 'Programming'
    color: 'blue'
---

Spring Boot with GraalVM Native enables developers to create applications that offer lightning-fast startup times, reduced memory consumption, and enhanced security. With native image support, your Spring Boot applications can efficiently run in resource-constrained environments, making them ideal for modern cloud-native architectures.

---

## 🌟 Why Build a Native Application with GraalVM?

- **Faster Startup Times**: Native images start much faster compared to JVM-based applications.
- **Reduced Resource Usage**: Native images consume less memory, making them ideal for cloud and containerized environments.
- **Enhanced Security**: Smaller runtime and reduced attack surface.

---

## 📋 Prerequisites

Ensure you have the following:

- ☕ **Java Development Kit (JDK)** 17+
- 🛠 **GraalVM** installed with native-image support
- 🕝 **Maven** or **Gradle**
- 🐳 **Docker** for building container images (optional)

---

## 🛠️ Step 1: Add Dependencies

Add the GraalVM Native Build Tools plugin to your `pom.xml` or `build.gradle` file.

**Maven:**

```xml
<plugin>
    <groupId>org.graalvm.buildtools</groupId>
    <artifactId>native-maven-plugin</artifactId>
    <version>0.9.20</version>
</plugin>
```

**Gradle:**

```groovy
plugins {
    id 'org.graalvm.buildtools.native' version '0.9.20'
}
```

---

## 🛠️ Step 2: Write a REST Controller

Create a simple REST endpoint to test the native image functionality.

:::tabs
@tab Java [icon=java]

```java
package com.example.graalvmnative;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class MyApplication {

    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }

    @GetMapping("/greeting")
    public String greeting() {
        return "Hello from GraalVM Native!";
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.graalvmnative

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@SpringBootApplication
@RestController
class MyApplication {

    @GetMapping("/greeting")
    fun greeting(): String = "Hello from GraalVM Native!"
}

fun main(args: Array<String>) {
    runApplication<MyApplication>(*args)
}
```

:::

---

## 🛠️ Step 3: Build a Native Image

### Using Maven

Run the following command to create a native image:

```bash
mvn -Pnative package
```

### Using Gradle

Run the following command:

```bash
gradle nativeCompile
```

---

## 🛠️ Step 4: Build a Docker Image

Spring Boot provides built-in support for creating Docker images with native executables.

### Maven Command:

```bash
mvn -Pnative spring-boot:build-image
```

### Gradle Command:

```bash
gradle bootBuildImage
```

The Docker image will be available locally and can be run using:

```bash
docker run --rm -p 8080:8080 myproject:0.0.1-SNAPSHOT
```

---

## ▶️ Running the Application

### Running Locally

You can run the native image directly:

```bash
./target/myproject
```

### Running in Docker

If you built the Docker image, run it using:

```bash
docker run --rm -p 8080:8080 myproject:0.0.1-SNAPSHOT
```

---

## 🧪 Testing the API

Test the REST endpoint using cURL or Postman:

```bash
curl -X GET http://localhost:8080/greeting
```

Expected output:

```plaintext
Hello from GraalVM Native!
```

---

## 🏁 Conclusion

This setup delivers a robust, production-ready Spring Boot GraalVM Native Application solution in Spring Boot, combining best practices, clear structure, and practical examples you can adapt to your own project.
