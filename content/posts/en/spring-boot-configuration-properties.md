---
title: 'Spring Boot Configuration Properties'
date: '2026-02-04'
summary: 'Learn how to use @ConfigurationProperties for type-safe configuration, validate settings with @Validated, and manage environment-specific values with profile-specific application-{profile}.yml files.'
thumbnail: '/images/spring-boot-configuration-properties-thumbnail.webp'
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
  - id: 'configuration'
    name: 'Configuration'
    color: 'blue'
  - id: 'programming'
    name: 'Programming'
    color: 'brown'
---

If you’ve ever ended up with a dozen `@Value` annotations and no idea which settings are required, `@ConfigurationProperties` is the Spring Boot way to make configuration type-safe, structured, and validatable.

In this post, you’ll learn:

- How to model configuration as a class (Java/Kotlin)
- How to validate configuration at startup
- How profile-specific config files (`application-{profile}.yml`) override defaults

---

## 🌟 Why `@ConfigurationProperties`?

- ✅ Type-safe access to config (IDE autocomplete, refactoring-safe)
- ✅ Group and document related settings under a single prefix
- ✅ Validate misconfigurations early (fail fast on startup)

---

## 📋 Prerequisites

- Java 17+
- Spring Boot 3.x
- Maven or Gradle

---

## 🛠️ Step 1: Define configuration in `application.yml`

Create a namespace (prefix) for your app config, for example `app`:

```yaml
app:
  security:
    enabled: true
    token-expiry-seconds: 3600
  allowed-origins:
    - 'https://example.com'
    - 'http://localhost:3000'
```

---

## 🛠️ Step 2: Create a `@ConfigurationProperties` class

:::tabs
@tab Java [icon=java]

```java
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

```kotlin
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

## 🛠️ Step 3: Enable configuration properties

You have two common options:

1. Scan for `@ConfigurationProperties` types:

```java
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class DemoApplication {}
```

2. Register specific classes explicitly:

```java
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class DemoApplication {}
```

---

## 🛠️ Step 4: Validate properties at startup (fail fast)

Add validation constraints and annotate the class with `@Validated`.

:::tabs
@tab Java [icon=java]

```java
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

```kotlin
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

Note: you need a Bean Validation implementation on the classpath (e.g., `spring-boot-starter-validation`) for these constraints to be enforced.

---

## 🛠️ Step 5: Use profile-specific files (`application-{profile}.yml`)

Spring Boot loads `application.yml` and then applies profile-specific overrides.

Example:

- `application.yml` (defaults)
- `application-prod.yml` (production overrides)

```yaml
# application-prod.yml
app:
  security:
    enabled: true
  allowed-origins:
    - 'https://mycompany.com'
```

When multiple profiles are active, profile files are applied with a “last wins” strategy (the last active profile can override earlier ones).

---

## 🌟 Tips

- Prefer `@ConfigurationProperties` over scattered `@Value` for anything non-trivial.
- Keep a single `AppProperties` root per bounded domain (`security`, `mail`, `storage`, etc.).
- Add validation constraints for anything that must not be empty or must be within a safe range.

---

## 🏁 Conclusion

This setup delivers a robust, production-ready configuration layer in Spring Boot by combining @ConfigurationProperties, startup validation with @Validated, and profile-specific overrides—making your app safer to operate across environments.
