---
title: 'Spring Boot Configuration Properties'
publishedDate: '2026-02-04'
category:
  id: programming
  name: Programlama
  color: blue
  icon: code
updatedDate: '2026-02-17'
summary: '@ConfigurationProperties ile tip-güvenli yapılandırma tanımlamayı, @Validated ile ayarları doğrulamayı ve profile-specific application-{profile}.yml dosyalarıyla ortama göre değer yönetimini öğrenin.'
thumbnail: '/images/spring-boot-configuration-properties-thumbnail.webp'
readingTime: '3 dk okuma'
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
  - id: 'configuration'
    name: 'Yapılandırma'
    color: 'blue'
---

Çok sayıda `@Value` ve dağınık ayarlarla uğraşıyorsan, `@ConfigurationProperties` Spring Boot’ta yapılandırmayı tip-güvenli, düzenli ve doğrulanabilir hale getirmenin en iyi yoludur.

Bu yazıda şunları öğreneceksin:

- Yapılandırmayı sınıf olarak modelleme (Java/Kotlin)
- Uygulama açılışında ayar doğrulama (fail fast)
- `application-{profile}.yml` ile ortama göre override mantığı

---

## 🌟 Neden `@ConfigurationProperties`?

Bu bölümde Neden `@ConfigurationProperties`? konusunu netleştirip uygulamada kullanacağınız temel noktaları özetliyoruz.

- ✅ Tip-güvenli config erişimi (IDE autocomplete, refactor dostu)
- ✅ İlgili ayarları tek bir prefix altında toplama
- ✅ Hatalı config’i erken yakalama (uygulama açılışında)

---

## 📋 Gereksinimler

Bu bölümde Gereksinimler konusunu netleştirip uygulamada kullanacağınız temel noktaları özetliyoruz.

- Java 17+
- Spring Boot 3.x
- Maven veya Gradle

---

## 🛠️ Adım 1: `application.yml` içinde config tanımla

Uygulamaya özel bir prefix belirle (ör. `app`):

```yaml filename="application.yml"
app:
  security:
    enabled: true
    token-expiry-seconds: 3600
  allowed-origins:
    - 'https://example.com'
    - 'http://localhost:3000'
```

---

## 🛠️ Adım 2: `@ConfigurationProperties` sınıfını oluştur

:::tabs
@tab Java [icon=java]

```java filename="AppProperties.java"
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {

  private Security security = new Security();
  private List<String> allowedOrigins = List.of();

  public Security getSecurity() {
    return security;
  }

  public void setSecurity(Security security) {
    this.security = security;
  }

  public List<String> getAllowedOrigins() {
    return allowedOrigins;
  }

  public void setAllowedOrigins(List<String> allowedOrigins) {
    this.allowedOrigins = allowedOrigins;
  }

  public static class Security {
    private boolean enabled = true;
    private int tokenExpirySeconds = 3600;

    public boolean isEnabled() {
      return enabled;
    }

    public void setEnabled(boolean enabled) {
      this.enabled = enabled;
    }

    public int getTokenExpirySeconds() {
      return tokenExpirySeconds;
    }

    public void setTokenExpirySeconds(int tokenExpirySeconds) {
      this.tokenExpirySeconds = tokenExpirySeconds;
    }
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="AppProperties.kt"
import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app")
data class AppProperties(
  val security: Security = Security(),
  val allowedOrigins: List<String> = emptyList(),
) {
  data class Security(
    val enabled: Boolean = true,
    val tokenExpirySeconds: Int = 3600,
  )
}
```

:::

---

## 🛠️ Adım 3: Properties sınıflarını etkinleştir

İki yaygın yöntem var:

1. `@ConfigurationProperties` sınıflarını tara:

```java filename="DemoApplication.java"
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class DemoApplication {}
```

2. Sadece belirli sınıfları enable et:

```java filename="DemoApplication.java"
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class DemoApplication {}
```

---

## 🧪 Adım 4: Açılışta doğrula (fail fast)

Constraint ekleyip sınıfı `@Validated` ile işaretle.

:::tabs
@tab Java [icon=java]

```java filename="AppProperties.java"
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "app")
@Validated
public class AppProperties {

  @Valid
  private Security security = new Security();

  @NotEmpty
  private List<String> allowedOrigins = List.of();

  public Security getSecurity() { return security; }
  public void setSecurity(Security security) { this.security = security; }

  public List<String> getAllowedOrigins() { return allowedOrigins; }
  public void setAllowedOrigins(List<String> allowedOrigins) { this.allowedOrigins = allowedOrigins; }

  public static class Security {
    private boolean enabled = true;

    @Min(60)
    private int tokenExpirySeconds = 3600;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public int getTokenExpirySeconds() { return tokenExpirySeconds; }
    public void setTokenExpirySeconds(int tokenExpirySeconds) { this.tokenExpirySeconds = tokenExpirySeconds; }
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="AppProperties.kt"
import jakarta.validation.Valid
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotEmpty
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.validation.annotation.Validated

@ConfigurationProperties(prefix = "app")
@Validated
data class AppProperties(
  @field:Valid
  val security: Security = Security(),

  @field:NotEmpty
  val allowedOrigins: List<String> = emptyList(),
) {
  data class Security(
    val enabled: Boolean = true,

    @field:Min(60)
    val tokenExpirySeconds: Int = 3600,
  )
}
```

:::

Not: Bu doğrulamanın çalışması için classpath’te bir Bean Validation implementasyonu olmalı (örn. `spring-boot-starter-validation`).

---

## 🛠️ Adım 5: Profile-specific dosyaları kullan (`application-{profile}.yml`)

Spring Boot önce `application.yml`’ı okur, sonra aktif profile’a göre override dosyalarını uygular.

Örnek:

- `application.yml` (varsayılanlar)
- `application-prod.yml` (prod override)

```yaml filename="config.yml"
# application-prod.yml
app:
  security:
    enabled: true
  allowed-origins:
    - 'https://mycompany.com'
```

Birden fazla profile aktifse “son yazan kazanır” mantığı geçerlidir (son aktif profile, önceki profillerin değerlerini override edebilir).

---

## 🌟 İpuçları

Bu bölümde İpuçları konusunu netleştirip uygulamada kullanacağınız temel noktaları özetliyoruz.

- Non-trivial ayarlarda `@Value` yerine `@ConfigurationProperties` kullan.
- `security`, `mail`, `storage` gibi alanlara göre ayrı root’lar tanımla.
- Boş olmaması gereken veya aralık kısıtı olan değerlerde doğrulama constraint’leri ekle.

---

## 🏁 Sonuç

Artık tip-güvenli, açılışta doğrulanan ve profile göre override edilebilen bir Spring Boot yapılandırma katmanın var. Sonraki adımda ortam bazlı gizli değerleri dışsallaştırıp regresyonları erken yakalamak için yapılandırma testleri ekleyin.
