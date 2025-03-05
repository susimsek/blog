---
title: 'Spring Boot Kubernetes Entegrasyonu'
date: '2025-02-21'
summary: 'Spring Boot uygulamalarını Kubernetes üzerinde nasıl ölçeklenebilir ve konteyner tabanlı olarak dağıtabileceğinizi öğrenin.'
thumbnail: '/images/spring-boot-kubernetes-thumbnail.jpeg'
readingTime: '3 dakika okuma'
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
    name: 'Mikroservis'
    color: 'orange'
  - id: 'containerization'
    name: 'Konteynerizasyon'
    color: 'pink'
  - id: 'programming'
    name: 'Programlama'
    color: 'brown'
---

Spring Boot, **Kubernetes** ile sorunsuz bir şekilde bütünleşerek konteynerleştirilmiş, ölçeklenebilir uygulamalar oluşturmanıza olanak tanır. Bu rehberde, Spring Boot uygulamalarının Kubernetes kümesi içinde nasıl dağıtılacağını ve yönetileceğini öğreneceksiniz.

---

## ✨ Neden Spring Boot İçin Kubernetes Kullanmalıyız?

- **Ölçeklenebilirlik**: Trafiğe göre uygulamaları otomatik olarak ölçekleyin.
- **Kendi Kendine İyileşme**: Kubernetes, başarısız olan konteynerleri otomatik olarak yeniden başlatır.
- **Deklaratif Yapılandırma**: YAML dosyalarıyla altyapınızı kolayca yönetin.
- **Yük Dengeleme & Servis Keşfi**: Gelen trafiği etkin bir şekilde yönlendirin.
- **Verimli Kaynak Kullanımı**: CPU ve bellek tüketimini dinamik olarak optimize edin.

---

## ✨ Gereksinimler

Aşağıdaki araçların sisteminizde kurulu olduğundan emin olun:

- ☕ **Java Geliştirme Kiti (JDK)** 17+
- 📦 **Maven veya Gradle**
- 🛠 **Docker** yüklü ve çalışır durumda
- 🌐 **Kubernetes Kümesi** (Minikube veya AWS EKS, GKE, AKS gibi bulut servis sağlayıcıları)
- 🛠 **kubectl** komut satırı aracı

---

## 🛠 Adım 1: Bağımlılıkları Ekleyin

Spring Boot Web ve Actuator bağımlılıklarını ekleyerek uygulamanın sağlık durumu apilerini aktif edin.

### Maven Yapılandırması:

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

### Gradle Yapılandırması:

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
}
```

---

## 📖 Adım 2: Basit Bir Spring Boot Uygulaması Oluşturun

Kubernetes üzerinde çalıştırılacak bir REST endpoint oluşturun.

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
        return "Merhaba! Spring Boot Kubernetes üzerinde çalışıyor.";
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
    fun hello(): String = "Merhaba! Spring Boot Kubernetes üzerinde çalışıyor."
}

fun main(args: Array<String>) {
    runApplication<KubernetesApplication>(*args)
}
```

:::

---

## 💪 Adım 3: Kubernetes Dağıtımı ve Servisi Tanımlayın

**deployment.yaml** dosyasını oluşturun:

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

**service.yaml** dosyasını oluşturun:

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

YAML dosyalarını Kubernetes kümesine uygulayın:

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

---

## ▶️ Uygulamayı Çalıştırma

Dağıtım tamamlandıktan sonra servis IP adresini alın:

```bash
kubectl get services
```

Uç noktayı test edin:

```bash
curl -X GET http://servis-adresi/hello
```

Beklenen Çıktı:

```plaintext
Merhaba! Spring Boot Kubernetes üzerinde çalışıyor.
```

---

Spring Boot, Kubernetes ile sorunsuz entegrasyon sağlayarak ölçeklenebilir ve dayanıklı uygulamalar oluşturmanıza olanak tanır. Mikroservisler, yük dengeleme veya orkestrasyon için Kubernetes, Spring Boot uygulamalarınızı verimli bir şekilde yönetmenin en iyi yollarından biridir.
