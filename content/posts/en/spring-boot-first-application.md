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

## **Step 1: Prerequisites**

Before we begin, ensure you have the following:

- **Java Development Kit (JDK)** 17+ installed
- **Maven or Gradle** installed
- An **IDE** like IntelliJ IDEA, Eclipse, or Visual Studio Code

## **Step 2: Create a New Project**

You can create a Spring Boot project in two ways:

### **Option 1: Using Spring Initializr**

1. Visit [Spring Initializr](https://start.spring.io/).
2. Choose the following:
   - **Project:** Maven
   - **Language:** Java
   - **Spring Boot Version:** 3.0.0 (or latest)
   - **Dependencies:** Spring Web
3. Click **Generate** to download the project as a `.zip` file.

### **Option 2: Using Your IDE**

Most modern IDEs have built-in support for creating Spring Boot projects.

## **Step 3: Writing Your First Endpoint**

Let’s create a simple REST endpoint.

### **`DemoApplication.java`**

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

## **Step 4: Running the Application**

Run the following command in your terminal:

```
./mvnw spring-boot:run
```

Visit the following URL in your browser:

```
http://localhost:8080/hello
```

Output: **"Hello, Spring Boot!"**
