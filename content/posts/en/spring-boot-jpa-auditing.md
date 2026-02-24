---
title: 'Spring Boot JPA Auditing'
publishedDate: '2025-04-10'
category:
  id: programming
  name: Programming
updatedDate: '2025-04-11'
summary: 'Learn how to automatically capture created/modified timestamps and users with JPA Auditing in Spring Boot applications.'
thumbnail: '/images/spring-boot-jpa-auditing-thumbnail.webp'
readingTime: '1 min read'
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
  - id: 'spring-data'
    name: 'Spring Data'
    color: 'yellow'
  - id: 'jpa'
    name: 'JPA'
    color: 'blue'
  - id: 'auditing'
    name: 'Auditing'
    color: 'orange'
  - id: 'programming'
    name: 'Programming'
    color: 'brown'
---

JPA Auditing in Spring Boot allows you to automatically track who created or modified an entity and when. This is extremely useful for audit logs, history tracking, and debugging.

---

## 🌟 Why Use JPA Auditing?

In this section, we clarify Why Use JPA Auditing? and summarize the key points you will apply in implementation.

- 📅 Auto track `createdDate`, `lastModifiedDate`
- 👤 Record `createdBy`, `modifiedBy`
- 🧼 Cleaner code by avoiding manual field setting

---

## 📋 Prerequisites

Before you start, prepare the following:

- Java 17+
- Spring Boot 3.x project with Spring Data JPA
- A configured datasource (H2, PostgreSQL, MySQL, etc.)
- Basic familiarity with JPA entities and repository flow

---

## 🛠️ Step 1: Add Dependencies

Make sure you have the following dependencies in your project:

Maven:

```xml filename="pom.xml"
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
```

Gradle:

```groovy filename="build.gradle"
dependencies {
  implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
}
```

---

## 🛠️ Step 2: Enable JPA Auditing

Add `@EnableJpaAuditing` to your main class or a configuration class.

:::tabs
@tab Java [icon=java]

```java filename="DemoApplication.java"
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class DemoApplication {
  public static void main(String[] args) {
    SpringApplication.run(DemoApplication.class, args);
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="DemoApplication.kt"
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.data.jpa.repository.config.EnableJpaAuditing

@SpringBootApplication
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
class DemoApplication

fun main(args: Array<String>) {
    runApplication<DemoApplication>(*args)
}
```

:::

---

## 🛠️ Step 3: Create AuditorAware Bean

This bean tells Spring Security who the current user is. Here's a basic static user example:

:::tabs
@tab Java [icon=java]

```java filename="AuditingConfig.java"
@Configuration
public class AuditingConfig {

  @Bean
  public AuditorAware<String> auditorProvider() {
    return () -> Optional.of("Şuayb");
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="AuditingConfig.kt"
@Configuration
class AuditingConfig {

  @Bean
  fun auditorProvider(): AuditorAware<String> = AuditorAware { Optional.of("Şuayb") }
}
```

:::

---

## 🛠️ Step 4: Annotate Your Entity

Use auditing annotations like `@CreatedDate`, `@LastModifiedDate`, etc.

:::tabs
@tab Java [icon=java]

```java filename="Article.java"
@Entity
@EntityListeners(AuditingEntityListener.class)
public class Article {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String title;

  @CreatedDate
  private LocalDateTime createdDate;

  @LastModifiedDate
  private LocalDateTime lastModifiedDate;

  @CreatedBy
  private String createdBy;

  @LastModifiedBy
  private String lastModifiedBy;

  // getters & setters
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="Article.kt"
@Entity
@EntityListeners(AuditingEntityListener::class)
data class Article(
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  val id: Long? = null,

  var title: String? = null,

  @CreatedDate
  var createdDate: LocalDateTime? = null,

  @LastModifiedDate
  var lastModifiedDate: LocalDateTime? = null,

  @CreatedBy
  var createdBy: String? = null,

  @LastModifiedBy
  var lastModifiedBy: String? = null
)
```

:::

---

## ▶️ Running the Application

Now when you save an entity using `JpaRepository`, auditing fields will be populated automatically.

---

## 🧪 Testing

You can test JPA Auditing functionality by saving an entity and checking whether the audit fields are populated.

:::tabs
@tab Java [icon=java]

```java filename="ArticleRepositoryTest.java"
@SpringBootTest
@AutoConfigureTestDatabase
@Transactional
class ArticleRepositoryTest {

  @Autowired
  private ArticleRepository articleRepository;

  @Test
  void testAuditFieldsAreSet() {
    Article article = new Article();
    article.setTitle("Test Title");

    Article saved = articleRepository.save(article);

    assertNotNull(saved.getCreatedDate());
    assertNotNull(saved.getLastModifiedDate());
    assertEquals("Şuayb", saved.getCreatedBy());
    assertEquals("Şuayb", saved.getLastModifiedBy());
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="ArticleRepositoryTest.kt"
@SpringBootTest
@AutoConfigureTestDatabase
@Transactional
class ArticleRepositoryTest {

  @Autowired
  lateinit var articleRepository: ArticleRepository

  @Test
  fun `should set audit fields`() {
    val article = Article().apply {
      title = "Test Title"
    }

    val saved = articleRepository.save(article)

    assertNotNull(saved.createdDate)
    assertNotNull(saved.lastModifiedDate)
    assertEquals("Şuayb", saved.createdBy)
    assertEquals("Şuayb", saved.lastModifiedBy)
  }
}
```

:::

---

## 🏁 Conclusion

You now have a practical Spring Boot JPA Auditing implementation with a clear, production-friendly Spring Boot structure. As a next step, adapt configuration and tests to your own domain, then validate behavior under realistic traffic and failure scenarios.
