---
title: 'Spring Boot Async Tasks'
date: '2025-02-20'
summary: 'Learn how to use @Async in Spring Boot to execute tasks asynchronously without blocking the main thread.'
thumbnail: '/images/spring-boot-async-thumbnail.webp'
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
  - id: 'async-tasks'
    name: 'Async Tasks'
    color: 'blue'
  - id: 'programming'
    name: 'Programming'
    color: 'brown'
---

Spring Boot provides an easy way to run asynchronous tasks using the `@Async` annotation. This is useful for executing tasks in the background, improving performance, and avoiding blocking the main thread.

---

## 🌟 Why Use @Async in Spring Boot?

- **Non-Blocking Execution**: Runs tasks asynchronously without blocking the main thread.
- **Improved Performance**: Executes independent tasks in parallel.
- **Better Scalability**: Frees up resources for other processes.
- **Seamless Integration**: Works with Spring Boot’s dependency injection and lifecycle management.

---

## 📋 Prerequisites

Ensure you have the following:

- ☕ **Java Development Kit (JDK)** 17+
- 📦 **Maven or Gradle** installed
- 🔤 A **Java IDE** (e.g., IntelliJ IDEA, Eclipse)

---

## 🛠️ Step 1: Add Dependencies

To enable async processing, include **spring-boot-starter-web** in your `pom.xml` or `build.gradle` file.

**Maven:**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

**Gradle:**

```groovy
implementation 'org.springframework.boot:spring-boot-starter-web'
```

---

## 🛠️ Step 2: Enable Async in Your Application

Annotate your main application class with `@EnableAsync` to enable asynchronous execution.

:::tabs
@tab Java [icon=java]

```java
package com.example.async;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class AsyncApplication {
    public static void main(String[] args) {
        SpringApplication.run(AsyncApplication.class, args);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.async

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableAsync

@SpringBootApplication
@EnableAsync
class AsyncApplication

fun main(args: Array<String>) {
    runApplication<AsyncApplication>(*args)
}
```

:::

---

## 🛠️ Step 3: Create an Async Task

Define an asynchronous method using `@Async`.

:::tabs
@tab Java [icon=java]

```java
package com.example.async;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.time.LocalTime;

@Service
public class AsyncTask {

    @Async
    public void runTask() {
        System.out.println("Async task executed at: " + LocalTime.now());
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.async

import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import java.time.LocalTime

@Service
class AsyncTask {

    @Async
    fun runTask() {
        println("Async task executed at: ${LocalTime.now()}")
    }
}
```

:::

---

## 🛠️ Step 4: Create a Controller to Trigger Async Tasks

Create a REST controller to trigger the asynchronous task.

:::tabs
@tab Java [icon=java]

```java
package com.example.async;

import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/async")
@RequiredArgsConstructor
public class AsyncController {

    private final AsyncTask asyncTask;

    @GetMapping("/run")
    public String triggerAsyncTask() {
        asyncTask.runTask();
        return "Async task triggered!";
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.async

import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/async")
class AsyncController(
    private val asyncTask: AsyncTask
) {

    @GetMapping("/run")
    fun triggerAsyncTask(): String {
        asyncTask.runTask()
        return "Async task triggered!"
    }
}
```

:::

---

## ▶️ Running the Application

Run the Spring Boot application:

```bash
./mvnw spring-boot:run
```

Or using Gradle:

```bash
gradle bootRun
```

---

## 🧪 Testing the Async Task

### Trigger Async Task:

```bash
curl -X GET http://localhost:8080/async/run
```

### Expected Console Output:

```plaintext
Async task executed at: 12:00:01
```

---

Spring Boot’s `@Async` annotation makes it easy to execute background tasks asynchronously. Whether you need to run long-running jobs, improve response times, or optimize resource usage, Spring’s async support provides a flexible and powerful solution.
