---
title: 'Spring Boot JPA Auditing'
publishedDate: '2025-04-10'
category:
  id: programming
  name: Programlama
updatedDate: '2025-04-11'
summary: 'Spring Boot uygulamalarında JPA Auditing ile oluşturulma/değiştirilme tarihlerini ve kullanıcılarını otomatik olarak nasıl yakalayacağınızı öğrenin.'
thumbnail: '/images/spring-boot-jpa-auditing-thumbnail.webp'
readingTime: '1 dk okuma'
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
    name: 'Programlama'
    color: 'brown'
---

Spring Boot'ta JPA Auditing, bir varlığın kim tarafından ve ne zaman oluşturulduğunu veya değiştirildiğini otomatik olarak izlemenizi sağlar. Bu, denetim kayıtları, geçmiş izleme ve hata ayıklama için oldukça kullanışlıdır.

---

## 🌟 Neden JPA Auditing Kullanmalıyım?

Bu bölümde Neden JPA Auditing Kullanmalıyım? konusunu netleştirip uygulamada kullanacağınız temel noktaları özetliyoruz.

- 📅 `createdDate`, `lastModifiedDate` alanlarını otomatik takip edin
- 👤 `createdBy`, `modifiedBy` bilgilerini kaydedin
- 🧼 Alanları manuel ayarlamadan kaçınarak temiz kod yazın

---

## 📋 Gereksinimler

Başlamadan önce aşağıdakileri hazırlayın:

- Java 17+
- Spring Data JPA içeren Spring Boot 3.x projesi
- Yapılandırılmış bir veritabanı bağlantısı (H2, PostgreSQL, MySQL vb.)
- JPA entity ve repository akışı hakkında temel bilgi

---

## 🛠️ Adım 1: Bağımlılıkları Ekleyin

Projenize aşağıdaki bağımlılıkları ekleyin:

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

## 🛠️ Adım 2: JPA Auditing Özelliğini Etkinleştirme

Ana sınıfınıza veya yapılandırma sınıfınıza `@EnableJpaAuditing` ekleyin.

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

## 🛠️ Adım 3: AuditorAware Bean'i Oluşturun

Bu bean, Spring'e geçerli kullanıcıyı bildirir. Statik bir kullanıcı örneği aşağıda:

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

## 🛠️ Adım 4: Entity Sınıfına Anotasyonları Ekle

Aşağıdaki gibi denetim anotasyonlarını kullanın: `@CreatedDate`, `@LastModifiedDate`, vb.

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

  // getter & setter
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

## ▶️ Uygulamayı Çalıştırma

Artık bir entityi `JpaRepository` ile kaydettiğinizde, denetim alanları otomatik olarak doldurulacaktır.

---

## 🧪 Test Etme

Bir entity kaydederek denetim alanlarının otomatik olarak doldurulup doldurulmadığını test edebilirsiniz.

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
    article.setTitle("Test Başlığı");

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
  fun `denetim alanları ayarlanmalı`() {
    val article = Article().apply {
      title = "Test Başlığı"
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

## 🏁 Sonuç

Artık Spring Boot JPA Auditing için üretim odaklı bir Spring Boot temeliniz var. Sonraki adımda ayarları kendi domainine uyarlayıp test ve gözlemlenebilirlik katmanını ekleyerek gerçek trafik altında doğrulayın.
