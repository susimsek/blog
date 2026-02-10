---
title: 'Spring Boot Scheduled Tasks'
date: '2025-02-20'
summary: 'Learn how to use @Scheduled in Spring Boot to run background tasks at fixed intervals or cron expressions.'
thumbnail: '/images/spring-boot-scheduled-thumbnail.webp'
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
  - id: 'scheduled-tasks'
    name: 'Scheduled Tasks'
    color: 'blue'
  - id: 'programming'
    name: 'Programming'
    color: 'brown'
---

Spring Boot allows developers to easily schedule and execute background tasks using the `@Scheduled` annotation. This is useful for running periodic jobs, automation tasks, and batch processing without manual intervention.

---

## 🌟 Why Use @Scheduled in Spring Boot?

- Automate Tasks: Run jobs periodically without human interaction.
- Efficient Resource Usage: Schedule tasks without blocking main threads.
- Supports Fixed Rate, Fixed Delay, and Cron Expressions.
- Seamless Integration: Works with Spring Boot’s dependency injection and lifecycle management.

---

## 📋 Prerequisites

Ensure you have the following:

- ☕ Java Development Kit (JDK) 17+
- 📦 Maven or Gradle installed
- 🔤 A Java IDE (e.g., IntelliJ IDEA, Eclipse)

---

## 🛠️ Step 1: Add Dependencies

To enable scheduling, you need to include spring-boot-starter-web in your `pom.xml` or `build.gradle` file.

Maven:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

Gradle:

```groovy
implementation 'org.springframework.boot:spring-boot-starter-web'
```

> Why `spring-boot-starter-web`?
> Spring Boot applications using `@Scheduled` need a running Spring Context. Including `spring-boot-starter-web` ensures that the application lifecycle is properly managed.

---

## 🛠️ Step 2: Enable Scheduling in Your Application

To enable scheduling, annotate your main application class with `@EnableScheduling`.

:::tabs
@tab Java [icon=java]

```java
package com.example.scheduled;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ScheduledApplication {
    public static void main(String[] args) {
        SpringApplication.run(ScheduledApplication.class, args);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.scheduled

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
class ScheduledApplication

fun main(args: Array<String>) {
    runApplication<ScheduledApplication>(*args)
}
```

:::

---

## 🛠️ Step 3: Create a Scheduled Task

Define a scheduled task using `@Scheduled`.

:::tabs
@tab Java [icon=java]

```java
package com.example.scheduled;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalTime;

@Service
public class ScheduledTask {

    @Scheduled(fixedRate = 5000)
    public void runTask() {
        System.out.println("Scheduled task executed at: " + LocalTime.now());
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.scheduled

import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.LocalTime

@Service
class ScheduledTask {

    @Scheduled(fixedRate = 5000)
    fun runTask() {
        println("Scheduled task executed at: ${LocalTime.now()}")
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

The scheduled task will execute every 5 seconds and print a timestamp.

---

## 🧪 Testing the Scheduled Task

### Expected Console Output:

```plaintext
Scheduled task executed at: 12:00:01
Scheduled task executed at: 12:00:06
Scheduled task executed at: 12:00:11
```

---

## 🏁 Conclusion

This setup delivers a robust, production-ready Spring Boot Scheduled Tasks solution in Spring Boot, combining best practices, clear structure, and practical examples you can adapt to your own project.
