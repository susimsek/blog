---
title: 'Spring Boot - First Application'
publishedDate: '2024-12-10'
category:
  id: programming
  name: Programming
  color: blue
  icon: code
updatedDate: '2024-12-11'
summary: 'A beginner-friendly guide to creating your first Spring Boot application from scratch. Learn the basics and start your journey with Spring Boot.'
thumbnail: '/images/spring-boot-first-app-thumbnail.webp'
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
  - id: 'beginner-guide'
    name: 'Beginner Guide'
    color: 'orange'
---

Spring Boot simplifies the process of building production-ready applications with the Spring Framework. In this guide, we’ll walk through creating your first Spring Boot application step by step.

---

## 🌟 What you'll learn

In this section, we clarify What you'll learn and summarize the key points you will apply in implementation.

- How to bootstrap a Spring Boot project with Java or Kotlin.
- How to expose your first HTTP endpoint and verify it quickly.
- How to run the app locally and prepare a clean base for the next features.

---

## 📋 Prerequisites

📋 Before starting, ensure you have the following:

- ☕ Java Development Kit (JDK) 17+ installed
- 📦 Maven or Gradle installed
- 🖥️ A Java IDE (e.g., IntelliJ IDEA, Eclipse, or Visual Studio Code)

---

## 🛠️ Step 1: Create a Spring Boot Project

You can create your first Spring Boot project in two ways:

1. Using Spring Initializr 🖱️

- Visit [Spring Initializr](https://start.spring.io/).
- Configure the following:
  - 📂 Project: `Maven`
  - 👨‍💻 Language: `Java` or `Kotlin`
  - 🔄 Spring Boot Version: `3.0.0` (or the latest version).
  - 📜 Add dependencies: `Spring Web`
- Click Generate to download the project files.

2. Using IntelliJ IDEA 💻

- Open IntelliJ IDEA.
- Go to `New Project > Spring Initializr`.
- Configure similar parameters as mentioned above.

---

## 🛠️ Step 2: Writing Your First Endpoint

Let’s write a simple endpoint to say hello:

:::tabs  
@tab Java [icon=java]

```java filename="DemoApplication.java"
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    @GetMapping("/hello")
    public String sayHello() {
        return "Hello, Spring Boot!";
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="DemoApplication.kt"
package com.example.demo

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@SpringBootApplication
@RestController
class DemoApplication

fun main(args: Array<String>) {
    runApplication<DemoApplication>(*args)
}

@GetMapping("/hello")
fun sayHello(): String {
    return "Hello, Spring Boot!"
}
```

:::

---

## ▶️ Step 3: Run the Application

In this section, we clarify Step 3: Run the Application and summarize the key points you will apply in implementation.

1. Open a terminal in the project folder.
2. Execute the command to run your application:

```bash
./mvnw spring-boot:run
```

3. Access the endpoint at:
   ```filename="snippet.txt"
   http://localhost:8080/hello
   ```

Response:

```filename="snippet.txt"
Hello, Spring Boot!
```

---

## 🏁 Conclusion

You now have a practical Spring Boot - First Application implementation with a clear, production-friendly Spring Boot structure. As a next step, adapt configuration and tests to your own domain, then validate behavior under realistic traffic and failure scenarios.
