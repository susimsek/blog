---
title: 'Spring Boot Actuator'
publishedDate: '2024-12-18'
category:
  id: programming
  name: Programming
  color: blue
  icon: code
updatedDate: '2024-12-19'
summary: 'Learn how to use Spring Boot Actuator to monitor and manage your applications with ease. Includes endpoints, customization, and security examples.'
thumbnail: '/images/spring-boot-actuator-thumbnail.webp'
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
  - id: 'actuator'
    name: 'Actuator'
    color: 'orange'
  - id: 'monitoring'
    name: 'Monitoring'
    color: 'purple'
---

Spring Boot Actuator provides production-ready features to monitor and manage your applications. This guide explores Actuator's capabilities, how to enable it, and secure its endpoints.

---

## 🌟 Why Use Spring Boot Actuator?

Spring Boot Actuator allows developers to:

- Monitor application health
- Gather metrics and information
- Expose management endpoints for operational tasks

---

## 📋 Prerequisites

📋 Ensure you have the following:

- ☕ Java Development Kit (JDK) 17+
- 💼 Maven or Gradle installed
- 🄄 A Java IDE (e.g., IntelliJ IDEA, Eclipse)

---

## 🛠️ Step 1: Add Dependencies

To enable Actuator, add the following dependency to your Spring Boot project:

- Maven:

```xml filename="pom.xml"
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

- Gradle:

```groovy filename="build.gradle"
implementation 'org.springframework.boot:spring-boot-starter-actuator'
```

---

## 🛠️ Step 2: Enable Actuator Endpoints

By default, Actuator exposes several endpoints to provide application insights. You can enable these endpoints in your `application.properties` or `application.yml` file.

### Configuration Example:

Use this configuration as a baseline and adjust values for your local or production environment.

```properties filename="config.properties"
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=always
```

---

## 🛠️ Step 3: Using Actuator Endpoints

Here are some commonly used Actuator endpoints:

- `/actuator/health`: Provides application health status.
- `/actuator/info`: Displays application metadata.
- `/actuator/metrics`: Offers application performance metrics.

You can access these endpoints via a browser or API tools like cURL.

Example:

```bash
curl -X GET http://localhost:8080/actuator/health
```

---

## 🛠️ Step 4: Customize Actuator Endpoints

You can customize Actuator endpoints to suit your needs. For example, you can define additional metadata in the `application.properties` file for the `/actuator/info` endpoint:

```properties filename="config.properties"
info.app.name=My Application
info.app.version=1.0.0
info.app.description=Spring Boot Actuator Example
```

---

## 🛠️ Step 5: Secure Actuator Endpoints

For production environments, it's essential to secure Actuator endpoints. Use Spring Security to restrict access.

:::tabs
@tab Java [icon=java]

Example Security Configuration

```java filename="SecurityConfig.java"
package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests()
                .requestMatchers("/actuator/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            .and()
            .httpBasic();
        return http.build();
    }
}
```

@tab Kotlin [icon=kotlin]

Example Security Configuration

```kotlin filename="SecurityConfig.kt"
package com.example.demo.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.web.SecurityFilterChain

@Configuration
class SecurityConfig {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .authorizeHttpRequests()
                .requestMatchers("/actuator/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            .and()
            .httpBasic()
        return http.build()
    }
}
```

:::

---

## ▶️ Running the Application

Run the application using the following command:

```bash
./mvnw spring-boot:run
```

Access the Actuator endpoints at:

```filename="snippet.txt"
http://localhost:8080/actuator/health
```

---

## 🧪 Test the API

You can test the Actuator endpoints using cURL or browser:

- Health Endpoint:

```bash
curl -X GET http://localhost:8080/actuator/health
```

- Info Endpoint:

```bash
curl -X GET http://localhost:8080/actuator/info
```

---

## 🏁 Conclusion

You now have a practical Spring Boot Actuator implementation with a clear, production-friendly Spring Boot structure. As a next step, adapt configuration and tests to your own domain, then validate behavior under realistic traffic and failure scenarios.
