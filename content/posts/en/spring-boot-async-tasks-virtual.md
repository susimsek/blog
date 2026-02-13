---
title: 'Spring Boot Async Tasks with Virtual Thread'
date: '2025-04-26'
summary: 'Learn how to run asynchronous tasks with `@Async` on JDK 21 virtual threads in Spring Boot.'
thumbnail: '/images/spring-boot-async-virtual-thumbnail.webp'
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
  - id: 'virtual-thread'
    name: 'Virtual Thread'
    color: 'orange'
  - id: 'programming'
    name: 'Programming'
    color: 'brown'
---

Spring Boot 3.2+ lets you combine the simplicity of `@Async` with JDK 21 virtual threads for ultra-lightweight concurrency. Offload work to isolated virtual threads without complex pool configs.

---

## 🌟 Why Use Virtual Thread in Spring Boot?

In this section, we clarify Why Use Virtual Thread in Spring Boot? and summarize the key points you will apply in implementation.

- Ultra-Lightweight: Virtual threads are thousands of times cheaper than platform threads.
- Non-Blocking: `@Async` methods run off the main thread, improving responsiveness.
- Scalable: Handle high concurrency with minimal resource overhead.
- Simple Config: Enable with a single property, no custom executors needed.

---

## 📋 Prerequisites

In this section, we clarify Prerequisites and summarize the key points you will apply in implementation.

- ☕ Java Development Kit (JDK) 21 or higher
- 📦 Spring Boot 3.2+
- 🔤 IDE (IntelliJ IDEA, Eclipse)

---

## 🛠️ Step 1: Add Dependencies

To enable async processing, include spring-boot-starter-web in your `pom.xml` or `build.gradle` file.

Maven:

```xml filename="pom.xml"
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

Gradle:

```groovy filename="build.gradle"
implementation 'org.springframework.boot:spring-boot-starter-web'
```

---

## 🛠️ Step 2: Enable Virtual Threads

Add to `application.yml` or `application.properties`:

```yaml filename="application.yml"
spring:
  threads:
    virtual:
      enabled: true
```

```properties filename="application.properties"
spring.threads.virtual.enabled=true
```

This setting auto-configures the following:

- `applicationTaskExecutor` for `@Async` support
- Task scheduler for `@Scheduled` methods
- Servlet container thread pools (Tomcat/Jetty) to use virtual threads

---

## 🛠️ Step 3: Enable Async Support

Annotate your main application class in Java or Kotlin:

:::tabs
@tab Java [icon=java]

```java filename="AsyncVirtualApplication.java"
package com.example.async;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class AsyncVirtualApplication {
    public static void main(String[] args) {
        SpringApplication.run(AsyncVirtualApplication.class, args);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="AsyncVirtualApplication.kt"
package com.example.async

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableAsync

@SpringBootApplication
@EnableAsync
class AsyncVirtualApplication

fun main(args: Array<String>) {
    runApplication<AsyncVirtualApplication>(*args)
}
```

:::

---

## 🛠️ Step 4: Define an Async Service

Create a service with `@Async`. It will run each call on a new virtual thread.

:::tabs
@tab Java [icon=java]

```java filename="AsyncVirtualService.java"
package com.example.async;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
public class AsyncVirtualService {

  @Async
  public void runTask() {
    log.info("[{}] Async start on {}", LocalTime.now(), Thread.currentThread());
    try {
      Thread.sleep(1000);
    } catch (InterruptedException ignored) {}
    log.info("[{}] Async end on {}", LocalTime.now(), Thread.currentThread());
  }

  @Async
  public CompletableFuture<String> runAndReturn() throws InterruptedException {
    Thread.sleep(500);
    return CompletableFuture.completedFuture("Completed");
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="AsyncVirtualService.kt"
package com.example.async

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service

import java.time.LocalTime
import java.util.concurrent.CompletableFuture

@Service
class AsyncVirtualService {
  private val log = LoggerFactory.getLogger(AsyncVirtualService::class.java)

  @Async
  fun runTask() {
    log.info("[{}] Async start on {}", LocalTime.now(), Thread.currentThread())
    try {
      Thread.sleep(1000)
    } catch (_: InterruptedException) {}
    log.info("[{}] Async end on {}", LocalTime.now(), Thread.currentThread())
  }

  @Async
  fun runAndReturn(): CompletableFuture<String> {
    Thread.sleep(500)
    return CompletableFuture.completedFuture("Completed")
  }
}
```

:::

---

## 🛠️ Step 5: Trigger via REST Controller

Expose endpoints to invoke your async methods:

:::tabs
@tab Java [icon=java]

```java filename="AsyncVirtualController.java"
package com.example.async;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/async")
@RequiredArgsConstructor
public class AsyncVirtualController {

  private final AsyncVirtualService service;

  @GetMapping("/run")
  public String triggerRun() {
    service.runTask();
    return "Async virtual thread task triggered";
  }

  @GetMapping("/run-return")
  public String triggerRunAndReturn() throws Exception {
    var future = service.runAndReturn();
    return future.get();
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="AsyncVirtualController.kt"
package com.example.async

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

import lombok.RequiredArgsConstructor

@RestController
@RequestMapping("/async")
@RequiredArgsConstructor
class AsyncVirtualController(private val service: AsyncVirtualService) {

  @GetMapping("/run")
  fun triggerRun(): String {
    service.runTask()
    return "Async virtual thread task triggered"
  }

  @GetMapping("/run-return")
  @Throws(Exception::class)
  fun triggerRunAndReturn(): String {
    val future = service.runAndReturn()
    return future.get()
  }
}
```

:::

---

## ▶️ Run the App

```bash
./mvnw spring-boot:run
# or
gradle bootRun
```

---

## 🧪 Test Endpoints

Trigger void task

```bash
curl http://localhost:8080/async/run
```

Check logs for virtual thread start/end.

Trigger task with return

```bash
curl http://localhost:8080/async/run-return
# returns "Completed"
```

---

## 🏁 Conclusion

You now have a practical Spring Boot Async Tasks with Virtual Thread implementation with a clear, production-friendly Spring Boot structure. As a next step, adapt configuration and tests to your own domain, then validate behavior under realistic traffic and failure scenarios.
