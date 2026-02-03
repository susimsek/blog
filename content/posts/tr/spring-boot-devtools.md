---
title: 'Spring Boot DevTools'
date: '2024-12-19'
summary: 'Spring Boot DevTools ile hızlı geliştirme sürecinizi nasıl hızlandırabileceğinizi keşfedin. Canlı yeniden yükleme, önbellekleme ve hata ayıklama ipuçları içerir.'
thumbnail: '/images/spring-boot-devtools-thumbnail.webp'
readingTime: '2 dk okuma'
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
  - id: 'devtools'
    name: 'Geliştirme Araçları'
    color: 'orange'
  - id: 'programming'
    name: 'Programlama'
    color: 'blue'
---

Spring Boot DevTools, geliştirme sürecinizi hızlandırmak isteyen geliştiriciler için olmazsa olmaz bir aracıdır. Bu kılavuz, canlı yeniden yükleme, önbellekleme ve hata ayıklama iyileştirmeleri dahil olmak üzere DevTools'ın özelliklerini ve kurulumunu anlatmaktadır.

---

## 🌟 Neden Spring Boot DevTools Kullanılmalı?

Spring Boot DevTools geliştiricilere şunları sunar:

- **Canlı Yeniden Yükleme**: Kod değişikliklerinde uygulamayı otomatik olarak yeniden yükler.
- **Önbellekleme İyileştirmeleri**: Daha hızlı yineleme için şablon önbelleklemesini devre dışı bırakır.
- **Hata Ayıklama Araçları**: Geliştirme sürecinde hata ayıklama deneyimini iyileştirir.

---

## 🌟 Gereksinimler

📋 Şunlara sahip olduğunuzdan emin olun:

- ☕ **Java Geliştirme Kiti (JDK)** 17+
- 📦 **Maven veya Gradle** yüklenmiş
- 🔤 Bir **Java IDE** (IntelliJ IDEA, Eclipse gibi)

---

## 🛠️ Adım 1: Bağımlılıkları Ekleyin

DevTools'u etkinleştirmek için projenize aşağıdaki bağımlılıkları ekleyin:

- **Maven:**

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-devtools</artifactId>
  <scope>runtime</scope>
</dependency>
```

- **Gradle:**

```groovy
runtimeOnly 'org.springframework.boot:spring-boot-devtools'
```

---

## 🛠️ Adım 2: DevTools'u Yapılandırın

Spring Boot DevTools, minimal yapılandırma gerektirir ancak bazı özelleştirme seçenekleri sunar. İşte bazı yaygın yapılandırma örnekleri:

### Canlı Yeniden Yükleme

Canlı yeniden yükleme, IntelliJ IDEA veya Eclipse gibi desteklenen IDE'lerle DevTools kullanılırken varsayılan olarak etkindir.

### Önbellekleme

Şablonlar için önbellekleme devre dışı bırakılır:

```properties
spring.thymeleaf.cache=false
spring.freemarker.cache=false
```

### Yeniden Başlatma Hariç Tutmaları

Belirli dosyaları veya dizinleri yeniden başlatmadan hariç tutun:

```properties
spring.devtools.restart.exclude=static/**,public/**
```

---

## 🛠️ Adım 3: Hata Ayıklama İyileştirmeleri

Spring Boot DevTools, hata ayıklamayı şu şekilde iyileştirir:

- **Otomatik Yeniden Başlatma**: Kod değişiklikleri algılandığında uygulama bağlamını yeniden başlatır.
- **Uzaktan Hata Ayıklama**: Uzak sunucularda çalışan uygulamaları hata ayıklama yeteneği sunar.

Uzaktan hata ayıklamayı etkinleştirmek için:

```properties
spring.devtools.remote.secret=benimsifre
```

Bağlanmak için şu komutu kullanın:

```bash
java -jar myapp.jar -Dspring.devtools.remote.secret=benimsifre
```

---

## ▶️ Uygulamayı Çalıştırma

Uygulamayı aşağıdaki komutla çalıştırın:

```bash
./mvnw spring-boot:run
```

Kodunuzda değişiklik yapın ve canlı yeniden yükleme ile uygulama bağlamının yeniden başlatıldığını gözlemleyin.

---

## 🧪 DevTools'u Test Etme

Spring Boot DevTools özelliklerini aşağıdaki şekilde test edebilirsiniz:

- **Canlı Yeniden Yükleme**: Kontrolcünüzde veya şablonunuzda bir değişiklik yapın ve dosyayı kaydedin. Uygulama otomatik olarak yeniden yüklenmelidir.
- **Şablon Güncellemeleri**: Bir `.html` dosyasını güncelleyerek sunucuyu yeniden başlatmadan değişiklikleri kontrol edin.
- **Hata Ayıklama**: IDE'ńizde kesme noktaları ekleyin ve `DevTools` etkin olduğundan emin olarak uzaktan hata ayıklamayı test edin.

---

Spring Boot DevTools, geliştirme sürecinizi daha hızlı hale getirerek yineleme ve hata ayıklama işlemlerini kolaylaştırır. Canlı yeniden yükleme, şablon önbelleğini devre dışı bırakma ve hata ayıklama özelliklerini kullanarak geliştirme akışınızı optimize edebilirsiniz.
