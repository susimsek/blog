---
title: 'Spring Boot - Your First Application'
date: '2024-12-10'
summary: 'A beginner-friendly guide to creating your first Spring Boot application from scratch. Learn the basics and start your journey with Spring Boot.'
thumbnail: '/images/spring-boot-first-app-thumbnail.jpg'
topics:
  - id: 'spring-boot'
    name: 'Spring Boot'
    color: 'green'
  - id: 'beginner-guide'
    name: 'Beginner Guide'
    color: 'orange'
  - id: 'programming'
    name: 'Programming'
    color: 'blue'
---

Spring Boot simplifies the process of building production-ready applications with the Spring Framework. In this guide, we’ll walk through creating your first Spring Boot application step by step.

---

### **Prerequisites**

Before starting, ensure you have the following:

- **Java Development Kit (JDK)** 17+ installed
- **Maven or Gradle** installed
- A **Java IDE** (e.g., IntelliJ IDEA, Eclipse, or Visual Studio Code)

---

### **Step 1: Create a Spring Boot Project**

You can create your first Spring Boot project in two ways:

1. **Using Spring Initializr:**

- Visit [Spring Initializr](https://start.spring.io/).
- Configure the following:
  - Project: `Maven`
  - Language: `Java`
  - Spring Boot Version: `3.0.0` (or the latest version).
  - Add dependencies: `Spring Web`
- Click **Generate** to download the project files.

2. **Using IntelliJ IDEA:**

- Open IntelliJ IDEA.
- Go to `New Project > Spring Initializr`.
- Configure similar parameters as mentioned above.

---

### **Step 2: Writing Your First Endpoint**

Let’s write a simple endpoint to say hello.

Create a `DemoApplication.java` file with the following content:

```java
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

---

### **Step 3: Run the Application**

1. Open a terminal in the project folder.
2. Execute the command to run your application:

```bash
./mvnw spring-boot:run
```

3. Access the endpoint at:
   ```
   http://localhost:8080/hello
   ```

**Response:**

```
Hello, Spring Boot!
```

---

This post covers the basics of creating a Spring Boot project, writing an endpoint, and running it successfully.
