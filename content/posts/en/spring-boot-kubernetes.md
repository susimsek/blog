---
title: 'Spring Boot Kubernetes Integration'
date: '2025-02-21'
summary: 'Learn how to deploy Spring Boot applications on Kubernetes for scalable, containerized microservices.'
thumbnail: '/images/spring-boot-kubernetes-thumbnail.jpg'
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
  - id: 'kubernetes'
    name: 'Kubernetes'
    color: 'blue'
  - id: 'microservice'
    name: 'Microservice'
    color: 'orange'
  - id: 'containerization'
    name: 'Containerization'
    color: 'pink'
  - id: 'programming'
    name: 'Programming'
    color: 'brown'
---

Spring Boot seamlessly integrates with **Kubernetes** to provide scalable, containerized applications. This guide explores how to deploy and manage Spring Boot applications in a Kubernetes cluster.

---

## ✨ Why Use Kubernetes for Spring Boot?

- **Scalability**: Automatically scale applications based on traffic.
- **Self-Healing**: Kubernetes restarts failed containers automatically.
- **Declarative Configuration**: Manage infrastructure with YAML configurations.
- **Load Balancing & Service Discovery**: Built-in support for routing requests efficiently.
- **Efficient Resource Utilization**: Optimize CPU and memory usage dynamically.

---

## ✨ Prerequisites

Ensure you have the following:

- ☕ **Java Development Kit (JDK)** 17+
- 📦 **Maven or Gradle** installed
- 🛠 **Docker** installed and running
- 🌐 **Kubernetes Cluster** (Minikube or a cloud provider like AWS EKS, GKE, or AKS)
- 🛠 **kubectl** installed for managing Kubernetes

---

## 🛠 Step 1: Add Dependencies

Add the necessary dependencies for **Spring Boot Web** and **Actuator** to expose health endpoints.

### Maven Configuration:

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
</dependencies>
```

### Gradle Configuration:

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
}
```

---

## 📖 Step 2: Create a Simple Spring Boot Application

Define a REST endpoint to deploy inside Kubernetes.

:::tabs
@tab Java [icon=java]

```java
package com.example.kubernetes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class KubernetesApplication {

    public static void main(String[] args) {
        SpringApplication.run(KubernetesApplication.class, args);
    }

    @GetMapping("/hello")
    public String hello() {
        return "Hello from Spring Boot running in Kubernetes!";
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package com.example.kubernetes

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@SpringBootApplication
@RestController
class KubernetesApplication {

    @GetMapping("/hello")
    fun hello(): String = "Hello from Spring Boot running in Kubernetes!"
}

fun main(args: Array<String>) {
    runApplication<KubernetesApplication>(*args)
}
```

:::

---

## 💪 Step 3: Create Kubernetes Deployment and Service

Create a **deployment.yaml** file:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spring-boot-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: spring-boot-app
  template:
    metadata:
      labels:
        app: spring-boot-app
    spec:
      containers:
        - name: spring-boot-app
          image: myproject:0.0.1-SNAPSHOT
          ports:
            - containerPort: 8080
```

Create a **service.yaml** file:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: spring-boot-service
spec:
  type: LoadBalancer
  selector:
    app: spring-boot-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
```

Apply the configurations:

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

---

## ▶️ Running the Application

Once deployed, retrieve the service URL:

```bash
kubectl get services
```

Test the endpoint:

```bash
curl -X GET http://your-service-ip/hello
```

Expected Output:

```plaintext
Hello from Spring Boot running in Kubernetes!
```

---

Spring Boot provides seamless integration with Kubernetes, enabling scalable and resilient applications. Whether for microservices, load balancing, or orchestration, Kubernetes is the go-to platform for deploying Spring Boot applications efficiently.
