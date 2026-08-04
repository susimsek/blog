---
title: 'Spring Boot gRPC'
publishedDate: '2026-08-04'
category:
  id: programming
  name: Programming
  color: blue
  icon: code
updatedDate: '2026-08-04'
summary: 'Learn how to build a secured gRPC API with Spring Boot using protobuf contracts, JWT authentication, validation, JPA, and in-process testing.'
thumbnail: '/images/spring-boot-grpc-thumbnail.webp'
readingTime: '6 min read'
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
  - id: 'grpc'
    name: 'gRPC'
    color: 'cyan'
  - id: 'security'
    name: 'Security'
    color: 'blue'
  - id: 'validation'
    name: 'Validation'
    color: 'orange'
---

Spring Boot brings first-class gRPC server support, which makes it possible to build contract-first APIs without stitching together low-level server bootstrap code by hand. In this article, we will use the real code from the [spring-grpc-samples](https://github.com/susimsek/spring-grpc-samples) repository and shape the walkthrough in the same file-oriented style as the JWE + JPA article.

The sample is more than a hello-world RPC. It combines Spring gRPC, Spring Security, Protovalidate, JPA, Liquibase, localized error handling, and test support in one Todo service.

---

## 🌟 Why Use Spring Boot gRPC?

In this section, we clarify Why Use Spring Boot gRPC? and summarize the key points you will apply in implementation.

- Contract-first API design: protobuf files define RPC names, message shapes, and validation rules.
- Small service layer: Spring Boot auto-exposes `BindableService` beans, so service classes stay focused on business flow.
- Consistent security: authentication and authorization are enforced through the gRPC server pipeline.
- Structured validation: request constraints live close to the contract and are enforced centrally.
- Better client feedback: invalid requests and auth failures are mapped to proper gRPC status responses.
- Production path included: the sample already covers testing, native builds, Docker, Helm, and Terraform.

---

## 📋 Prerequisites

In this section, we clarify Prerequisites and summarize the key points you will apply in implementation.

- ☕ Java Development Kit (JDK) 25
- 📦 Maven Wrapper with `./mvnw`
- 🔤 IDE (IntelliJ IDEA, Eclipse, VS Code)
- 🛢️ Basic familiarity with JPA and Spring Security
- 🧪 Optional: `grpcurl` and `jq` for manual verification

---

## 🛠️ Step 1: Add Dependencies

Include the same core building blocks used in the sample: gRPC transport, JPA persistence, Liquibase migrations, JWT security, cache support, MapStruct, and Protovalidate.

Maven:

```xml filename="pom.xml"
<properties>
  <java.version>25</java.version>
  <org.mapstruct.version>1.6.3</org.mapstruct.version>
  <protovalidate.version>0.14.0</protovalidate.version>
</properties>

<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-grpc-server</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-liquibase</artifactId>
  </dependency>
  <dependency>
    <groupId>org.hibernate.orm</groupId>
    <artifactId>hibernate-jcache</artifactId>
    <version>${hibernate.version}</version>
  </dependency>
  <dependency>
    <groupId>com.github.ben-manes.caffeine</groupId>
    <artifactId>caffeine</artifactId>
  </dependency>
  <dependency>
    <groupId>com.github.ben-manes.caffeine</groupId>
    <artifactId>jcache</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
  </dependency>
  <dependency>
    <groupId>build.buf</groupId>
    <artifactId>protovalidate</artifactId>
    <version>${protovalidate.version}</version>
  </dependency>
  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
  </dependency>
  <dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>${org.mapstruct.version}</version>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-grpc-server-test</artifactId>
    <scope>test</scope>
  </dependency>
</dependencies>
```

Gradle:

```groovy filename="build.gradle"
dependencies {
  implementation 'org.springframework.boot:spring-boot-starter-grpc-server'
  implementation 'org.springframework.boot:spring-boot-starter-cache'
  implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
  implementation 'org.springframework.boot:spring-boot-starter-liquibase'
  implementation 'org.hibernate.orm:hibernate-jcache'
  implementation 'com.github.ben-manes.caffeine:caffeine'
  implementation 'com.github.ben-manes.caffeine:jcache'
  implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
  implementation 'build.buf:protovalidate:0.14.0'
  implementation 'org.mapstruct:mapstruct:1.6.3'
  compileOnly 'org.projectlombok:lombok'
  testImplementation 'org.springframework.boot:spring-boot-starter-grpc-server-test'
}
```

Gradle Kotlin DSL:

```kotlin filename="build.gradle.kts"
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-grpc-server")
    implementation("org.springframework.boot:spring-boot-starter-cache")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-liquibase")
    implementation("org.hibernate.orm:hibernate-jcache")
    implementation("com.github.ben-manes.caffeine:caffeine")
    implementation("com.github.ben-manes.caffeine:jcache")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
    implementation("build.buf:protovalidate:0.14.0")
    implementation("org.mapstruct:mapstruct:1.6.3")
    compileOnly("org.projectlombok:lombok")
    testImplementation("org.springframework.boot:spring-boot-starter-grpc-server-test")
}
```

For local development, the sample uses `H2` in the default `dev` profile and `PostgreSQL` in the `prod` profile, so the runtime database drivers stay profile-specific.

This combination matters because the project is not only serving RPC methods. It also persists Todo data with JPA, applies Liquibase migrations, maps entities with MapStruct, validates protobuf payloads, adds Hibernate cache support, and secures business RPCs with JWT.

---

## 🛠️ Step 2: Configuration Files

In this section, we define the core configuration and migration files used by the sample project and explain why each block matters for a gRPC service with persistence and validation.

- `src/main/resources/config/application.yml`
  Holds the application name, active profile handling, JPA defaults, Hibernate cache settings, Liquibase changelog path, message bundle path, and gRPC server port.

- `src/main/resources/config/application-dev.yml`
  Defines the local H2-based development profile, debug logging, and the `faker` Liquibase context.

- `src/main/resources/config/application-prod.yml`
  Switches the sample to PostgreSQL-oriented production defaults with tighter JWT expiration and larger cache sizes.

- `src/main/resources/logback-spring.xml`
  Trims noisy framework logs so gRPC, Liquibase, Hibernate, and security output stay readable during local development.

- `src/main/resources/db/changelog/db.changelog-master.xml`
  The Liquibase master file that declares DBMS-specific `now` properties and includes the Todo and user-related schema files.

- `src/main/resources/db/changelog/changes/001-create-todos.xml`
  Creates the Todo sequence, `todos` table, supporting indexes, and Faker-context seed load.

- `src/main/resources/db/changelog/changes/002-create-users.xml`
  Creates `users`, `authorities`, and `user_authorities`, then loads the bootstrap security data.

- `src/main/resources/db/data/todos.csv`
  Seed Todo rows used when the `faker` Liquibase context is enabled.

- `src/main/resources/db/data/users.csv`
  Initial application users with bcrypt-hashed passwords.

- `src/main/resources/db/data/authorities.csv`
  Seed role definitions.

- `src/main/resources/db/data/user-authorities.csv`
  User-to-role mappings for the bootstrap security model.

- `src/main/resources/i18n/messages.properties`
  Default English validation, authentication, and Todo error messages returned through the gRPC advice layer.

- `src/main/resources/i18n/messages_tr.properties`
  Turkish translations for the same validation and security message codes.

- `src/main/java/io/github/susimsek/springgrpcsamples/config/i18n/GrpcLocaleServerInterceptor.java`
  Resolves `accept-language` from gRPC metadata and pushes the selected locale into `LocaleContextHolder` before validation and exception translation run.

```yaml filename="application.yml"
spring:
  application:
    name: spring-grpc-samples
  profiles:
    active: '@spring.profiles.active@'
  docker:
    compose:
      lifecycle-management: start-only
      file: src/main/docker/services.yml
  main:
    allow-bean-definition-overriding: true
  data:
    jpa:
      repositories:
        bootstrap-mode: deferred
  jpa:
    open-in-view: false
    properties:
      hibernate.jdbc.time_zone: Europe/Istanbul
      hibernate.cache.region.factory_class: jcache
      hibernate.javax.cache.provider: com.github.benmanes.caffeine.jcache.spi.CaffeineCachingProvider
      hibernate.cache.use_second_level_cache: true
      hibernate.cache.use_query_cache: false
      hibernate.generate_statistics: false
      hibernate.jdbc.batch_size: 50
      hibernate.order_inserts: true
      hibernate.order_updates: true
      hibernate.jdbc.fetch_size: 50
    hibernate:
      ddl-auto: none
      naming:
        physical-strategy: org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy
        implicit-strategy: org.springframework.boot.hibernate.SpringImplicitNamingStrategy
  messages:
    basename: i18n/messages
  liquibase:
    change-log: classpath:db/changelog/db.changelog-master.xml
  grpc:
    server:
      port: 9090
```

The important gRPC-specific setting is `spring.grpc.server.port`, but the surrounding JPA, Liquibase, and message-source configuration is what turns the sample into a realistic server instead of an isolated transport demo.

`application-dev.yml`

```yaml filename="application-dev.yml"
spring:
  devtools:
    restart:
      enabled: true
  docker:
    compose:
      enabled: false
  datasource:
    url: jdbc:h2:mem:grpcsamples;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
    username: sa
    password:
  jpa:
    show-sql: true
    properties:
      hibernate.format_sql: true
  liquibase:
    contexts: dev, faker

app:
  cache:
    caffeine:
      ttl: PT1H
      initial-capacity: 50
      maximum-size: 100
  security:
    jwt:
      secret: CDyi/yxfK/EMHtj20eOFoLc0t08WVHotnfcpgpnjdt4=
      issuer: https://spring-grpc-samples.local
      expires-in: PT1H

logging:
  level:
    root: INFO
    org.hibernate.SQL: DEBUG
    io.github.susimsek.springgrpcsamples: DEBUG
```

`application-prod.yml`

```yaml filename="application-prod.yml"
spring:
  devtools:
    restart:
      enabled: false
  docker:
    compose:
      profiles:
        active: prod
  datasource:
    url: jdbc:postgresql://localhost:5432/grpcsamples
    username: ${SPRING_DATASOURCE_USERNAME}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
  jpa:
    show-sql: false
    properties:
      hibernate.format_sql: false
  liquibase:
    contexts: prod

app:
  cache:
    caffeine:
      ttl: PT1H
      initial-capacity: 500
      maximum-size: 1000
  security:
    jwt:
      secret: ${SECURITY_JWT_SECRET}
      issuer: https://spring-grpc-samples.local
      expires-in: PT30M

logging:
  level:
    root: INFO
    org.hibernate.SQL: INFO
    io.github.susimsek.springgrpcsamples: INFO
```

`logback-spring.xml`

```xml filename="logback-spring.xml"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>
    <include resource="org/springframework/boot/logging/logback/console-appender.xml"/>

    <!-- Noisy frameworks trimmed down to WARN to keep dev console readable -->
    <logger name="com.zaxxer" level="WARN"/>
    <logger name="org.apache" level="WARN"/>
    <logger name="org.hibernate" level="WARN"/>
    <logger name="org.springframework" level="WARN"/>
    <logger name="org.springframework.boot.docker" level="WARN"/>
    <logger name="org.springframework.cache" level="WARN"/>
    <logger name="org.springframework.grpc" level="WARN"/>
    <logger name="org.springframework.security" level="WARN"/>
    <logger name="org.springframework.security.oauth2" level="WARN"/>
    <logger name="liquibase" level="WARN"/>
    <logger name="LiquibaseSchemaResolver" level="INFO"/>
    <logger name="io.grpc" level="WARN"/>

    <springProperty name="log.level" source="logging.level.root" defaultValue="INFO"/>
    <root level="${log.level}">
        <appender-ref ref="CONSOLE"/>
    </root>
</configuration>
```

`messages.properties`

```properties filename="messages.properties"
grpc.validation.failed=One or more validation errors occurred.
grpc.validation.unknown=invalid value
grpc.validation.constraints.notBlank=This field cannot be blank.
grpc.validation.constraints.notEmpty=This field cannot be empty.
grpc.validation.constraints.int32.gte=Value must be greater than or equal to {0}.
grpc.validation.constraints.int32.gte_lte=Value must be between 1 and 100.
grpc.validation.constraints.int32.lte=Value must be less than or equal to {0}.
grpc.validation.constraints.int64.gt=Value must be greater than {0}.
grpc.validation.constraints.string.max_len=Value length must be at most {0} characters.
grpc.validation.constraints.string.min_len=Value length must be at least {0} characters.
grpc.auth.invalidCredentials=invalid username or password
grpc.auth.invalidToken=Invalid or expired token.
grpc.auth.unauthenticated=Authentication failed.
grpc.auth.accessDenied=Access denied.
grpc.todo.notFound=todo not found with id: {0}
grpc.internal=An unexpected error occurred. Please try again later.
```

`messages_tr.properties`

```properties filename="messages_tr.properties"
grpc.validation.failed=Bir veya daha fazla doğrulama hatası oluştu.
grpc.validation.unknown=geçersiz değer
grpc.validation.constraints.notBlank=Bu alan boş bırakılamaz.
grpc.validation.constraints.notEmpty=Bu alan boş olamaz.
grpc.validation.constraints.int32.gte=Değer {0} veya daha büyük olmalıdır.
grpc.validation.constraints.int32.gte_lte=Değer 1 ile 100 arasında olmalıdır.
grpc.validation.constraints.int32.lte=Değer {0} veya daha küçük olmalıdır.
grpc.validation.constraints.int64.gt=Değer {0}''dan büyük olmalıdır.
grpc.validation.constraints.string.max_len=Uzunluk en fazla {0} karakter olmalıdır.
grpc.validation.constraints.string.min_len=Uzunluk en az {0} karakter olmalıdır.
grpc.auth.invalidCredentials=kullanıcı adı veya parola geçersiz
grpc.auth.invalidToken=Token geçersiz veya süresi dolmuş.
grpc.auth.unauthenticated=Authentication failed.
grpc.auth.accessDenied=Access denied.
grpc.todo.notFound=id''si {0} olan todo bulunamadı
grpc.internal=Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.
```

`GrpcLocaleServerInterceptor.java`

:::tabs
@tab Java [icon=java]

```java filename="GrpcLocaleServerInterceptor.java"
package io.github.susimsek.springgrpcsamples.config.i18n;

import io.grpc.ForwardingServerCallListener;
import io.grpc.Metadata;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.ServerInterceptor;
import java.util.List;
import java.util.Locale;
import java.util.function.Supplier;
import org.springframework.context.i18n.LocaleContext;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.context.i18n.SimpleLocaleContext;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.grpc.server.GlobalServerInterceptor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@GlobalServerInterceptor
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GrpcLocaleServerInterceptor implements ServerInterceptor {

    private static final String ACCEPT_LANGUAGE_HEADER = "accept-language";
    private static final List<Locale> SUPPORTED_LOCALES =
            List.of(Locale.ENGLISH, Locale.forLanguageTag("tr"));
    private static final Metadata.Key<String> ACCEPT_LANGUAGE =
            Metadata.Key.of(ACCEPT_LANGUAGE_HEADER, Metadata.ASCII_STRING_MARSHALLER);

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call, Metadata headers, ServerCallHandler<ReqT, RespT> next) {
        Locale locale = resolveLocale(headers);
        ServerCall.Listener<ReqT> listener =
                callWithLocale(locale, () -> next.startCall(call, headers));
        return new LocaleAwareServerCallListener<>(listener, locale);
    }

    private static Locale resolveLocale(Metadata headers) {
        String language = headers.get(ACCEPT_LANGUAGE);
        if (!StringUtils.hasText(language)) {
            return Locale.ENGLISH;
        }
        try {
            Locale locale = Locale.lookup(Locale.LanguageRange.parse(language), SUPPORTED_LOCALES);
            return locale != null ? locale : Locale.ENGLISH;
        } catch (IllegalArgumentException ex) {
            return Locale.ENGLISH;
        }
    }

    private static <T> T callWithLocale(Locale locale, Supplier<T> action) {
        LocaleContext previous = LocaleContextHolder.getLocaleContext();
        try {
            LocaleContextHolder.setLocaleContext(new SimpleLocaleContext(locale));
            return action.get();
        } finally {
            LocaleContextHolder.setLocaleContext(previous);
        }
    }

    private static final class LocaleAwareServerCallListener<ReqT>
            extends ForwardingServerCallListener.SimpleForwardingServerCallListener<ReqT> {

        private final Locale locale;

        private LocaleAwareServerCallListener(ServerCall.Listener<ReqT> delegate, Locale locale) {
            super(delegate);
            this.locale = locale;
        }

        @Override
        public void onMessage(ReqT message) {
            runWithLocale(() -> super.onMessage(message));
        }

        @Override
        public void onHalfClose() {
            runWithLocale(super::onHalfClose);
        }

        @Override
        public void onCancel() {
            runWithLocale(super::onCancel);
        }

        @Override
        public void onComplete() {
            runWithLocale(super::onComplete);
        }

        @Override
        public void onReady() {
            runWithLocale(super::onReady);
        }

        private void runWithLocale(Runnable action) {
            callWithLocale(locale, () -> {
                action.run();
                return null;
            });
        }
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="GrpcLocaleServerInterceptor.kt"
package io.github.susimsek.springgrpcsamples.config.i18n

import io.grpc.*
import org.springframework.context.i18n.LocaleContext
import org.springframework.context.i18n.LocaleContextHolder
import org.springframework.context.i18n.SimpleLocaleContext
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.grpc.server.GlobalServerInterceptor
import org.springframework.stereotype.Component
import org.springframework.util.StringUtils
import java.util.Locale

@Component
@GlobalServerInterceptor
@Order(Ordered.HIGHEST_PRECEDENCE)
class GrpcLocaleServerInterceptor : ServerInterceptor {

    override fun <ReqT : Any?, RespT : Any?> interceptCall(
        call: ServerCall<ReqT, RespT>,
        headers: Metadata,
        next: ServerCallHandler<ReqT, RespT>
    ): ServerCall.Listener<ReqT> {
        val locale = resolveLocale(headers)
        val listener = callWithLocale(locale) { next.startCall(call, headers) }
        return LocaleAwareServerCallListener(listener, locale)
    }

    private fun resolveLocale(headers: Metadata): Locale {
        val language = headers.get(ACCEPT_LANGUAGE)
        if (!StringUtils.hasText(language)) return Locale.ENGLISH
        return try {
            Locale.lookup(Locale.LanguageRange.parse(language), SUPPORTED_LOCALES) ?: Locale.ENGLISH
        } catch (_: IllegalArgumentException) {
            Locale.ENGLISH
        }
    }

    private fun <T> callWithLocale(locale: Locale, action: () -> T): T {
        val previous: LocaleContext = LocaleContextHolder.getLocaleContext()
        return try {
            LocaleContextHolder.setLocaleContext(SimpleLocaleContext(locale))
            action()
        } finally {
            LocaleContextHolder.setLocaleContext(previous)
        }
    }

    private inner class LocaleAwareServerCallListener<ReqT>(
        delegate: ServerCall.Listener<ReqT>,
        private val locale: Locale
    ) : ForwardingServerCallListener.SimpleForwardingServerCallListener<ReqT>(delegate) {

        override fun onMessage(message: ReqT) = runWithLocale { super.onMessage(message) }
        override fun onHalfClose() = runWithLocale { super.onHalfClose() }
        override fun onCancel() = runWithLocale { super.onCancel() }
        override fun onComplete() = runWithLocale { super.onComplete() }
        override fun onReady() = runWithLocale { super.onReady() }

        private fun runWithLocale(action: () -> Unit) {
            callWithLocale(locale) { action() }
        }
    }

    companion object {
        private const val ACCEPT_LANGUAGE_HEADER = "accept-language"
        private val SUPPORTED_LOCALES = listOf(Locale.ENGLISH, Locale.forLanguageTag("tr"))
        private val ACCEPT_LANGUAGE: Metadata.Key<String> =
            Metadata.Key.of(ACCEPT_LANGUAGE_HEADER, Metadata.ASCII_STRING_MARSHALLER)
    }
}
```

:::

`db.changelog-master.xml`

```xml filename="db.changelog-master.xml"
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog https://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-latest.xsd">

    <property name="now" value="now()" dbms="h2"/>
    <property name="now" value="current_timestamp" dbms="postgresql"/>
    <include file="db/changelog/changes/001-create-todos.xml"/>
    <include file="db/changelog/changes/002-create-users.xml"/>
</databaseChangeLog>
```

`001-create-todos.xml`

```xml filename="001-create-todos.xml"
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog https://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-latest.xsd">
    <changeSet id="001-create-todo-sequence" author="susimsek">
        <createSequence
            sequenceName="todo_seq"
            startValue="1"
            incrementBy="1"
            minValue="1"
            maxValue="9999999999999999"
            cacheSize="100"
            cycle="false"/>
    </changeSet>
    <changeSet id="002-create-todos-table" author="susimsek">
        <createTable tableName="todos">
            <column name="id" type="bigint" defaultValueSequenceNext="todo_seq">
                <constraints nullable="false" primaryKey="true" primaryKeyName="pk_todos"/>
            </column>
            <column name="title" type="varchar(255)">
                <constraints nullable="false"/>
            </column>
            <column name="completed" type="boolean" defaultValueBoolean="false">
                <constraints nullable="false"/>
            </column>
            <column name="created_by" type="varchar(100)">
                <constraints nullable="false"/>
            </column>
            <column name="created_at" type="timestamp" defaultValueComputed="${now}">
                <constraints nullable="false"/>
            </column>
            <column name="last_modified_by" type="varchar(100)"/>
            <column name="updated_at" type="timestamp" defaultValueComputed="${now}">
                <constraints nullable="false"/>
            </column>
        </createTable>
    </changeSet>
    <changeSet id="003-create-todo-indexes" author="susimsek">
        <createIndex indexName="idx_todos_completed" tableName="todos">
            <column name="completed"/>
        </createIndex>
        <createIndex indexName="idx_todos_title" tableName="todos">
            <column name="title"/>
        </createIndex>
    </changeSet>
    <changeSet id="004-seed-todos" author="susimsek" context="faker">
        <loadData
            encoding="UTF-8"
            file="db/data/todos.csv"
            separator=";"
            tableName="todos"
            usePreparedStatements="true">
            <column header="title" type="string"/>
            <column header="completed" type="boolean"/>
            <column header="created_by" type="string"/>
            <column header="last_modified_by" type="string"/>
        </loadData>
    </changeSet>
</databaseChangeLog>
```

`002-create-users.xml`

```xml filename="002-create-users.xml"
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog https://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-latest.xsd">
    <changeSet id="001-create-user-sequence" author="susimsek">
        <createSequence
            sequenceName="user_seq"
            startValue="1"
            incrementBy="1"
            minValue="1"
            maxValue="9999999999999999"
            cacheSize="100"
            cycle="false"/>
    </changeSet>
    <changeSet id="002-create-users-table" author="susimsek">
        <createTable tableName="users">
            <column name="id" type="bigint" defaultValueSequenceNext="user_seq">
                <constraints nullable="false" primaryKey="true" primaryKeyName="pk_users"/>
            </column>
            <column name="username" type="varchar(100)">
                <constraints nullable="false" unique="true" uniqueConstraintName="uk_users_username"/>
            </column>
            <column name="password" type="varchar(255)">
                <constraints nullable="false"/>
            </column>
            <column name="enabled" type="boolean" defaultValueBoolean="true">
                <constraints nullable="false"/>
            </column>
            <column name="created_by" type="varchar(100)">
                <constraints nullable="false"/>
            </column>
            <column name="created_at" type="timestamp" defaultValueComputed="${now}">
                <constraints nullable="false"/>
            </column>
            <column name="last_modified_by" type="varchar(100)"/>
            <column name="updated_at" type="timestamp" defaultValueComputed="${now}">
                <constraints nullable="false"/>
            </column>
        </createTable>
    </changeSet>
    <changeSet id="003-create-user-indexes" author="susimsek">
        <createIndex indexName="idx_users_username" tableName="users" unique="true">
            <column name="username"/>
        </createIndex>
    </changeSet>
    <changeSet id="004-create-authorities-table" author="susimsek">
        <createSequence
            sequenceName="authority_seq"
            startValue="1"
            incrementBy="1"
            minValue="1"
            maxValue="9999999999999999"
            cacheSize="100"
            cycle="false"/>
        <createTable tableName="authorities">
            <column name="id" type="bigint" defaultValueSequenceNext="authority_seq">
                <constraints nullable="false" primaryKey="true" primaryKeyName="pk_authorities"/>
            </column>
            <column name="name" type="varchar(50)">
                <constraints nullable="false" unique="true" uniqueConstraintName="uk_authorities_name"/>
            </column>
        </createTable>
    </changeSet>
    <changeSet id="005-create-user-authorities-table" author="susimsek">
        <createTable tableName="user_authorities">
            <column name="user_id" type="bigint">
                <constraints nullable="false"/>
            </column>
            <column name="authority_id" type="bigint">
                <constraints nullable="false"/>
            </column>
        </createTable>
        <addPrimaryKey
            tableName="user_authorities"
            columnNames="user_id, authority_id"
            constraintName="pk_user_authorities"/>
        <addForeignKeyConstraint
            baseTableName="user_authorities"
            baseColumnNames="user_id"
            constraintName="fk_user_authorities_user"
            referencedTableName="users"
            referencedColumnNames="id"/>
        <addForeignKeyConstraint
            baseTableName="user_authorities"
            baseColumnNames="authority_id"
            constraintName="fk_user_authorities_authority"
            referencedTableName="authorities"
            referencedColumnNames="id"/>
        <createIndex indexName="idx_user_authorities_authority" tableName="user_authorities">
            <column name="authority_id"/>
        </createIndex>
    </changeSet>
    <changeSet id="006-seed-authorities" author="susimsek">
        <loadData
            encoding="UTF-8"
            file="db/data/authorities.csv"
            separator=";"
            tableName="authorities"
            usePreparedStatements="true">
            <column header="id" type="numeric"/>
            <column header="name" type="string"/>
        </loadData>
    </changeSet>
    <changeSet id="007-seed-users" author="susimsek">
        <loadData
            encoding="UTF-8"
            file="db/data/users.csv"
            separator=";"
            tableName="users"
            usePreparedStatements="true">
            <column header="username" type="string"/>
            <column header="password" type="string"/>
            <column header="enabled" type="boolean"/>
            <column header="created_by" type="string"/>
            <column header="last_modified_by" type="string"/>
        </loadData>
    </changeSet>
    <changeSet id="008-seed-user-authorities" author="susimsek">
        <loadData
            encoding="UTF-8"
            file="db/data/user-authorities.csv"
            separator=";"
            tableName="user_authorities"
            usePreparedStatements="true">
            <column header="user_id" type="numeric"/>
            <column header="authority_id" type="numeric"/>
        </loadData>
    </changeSet>
</databaseChangeLog>
```

`todos.csv`

```csv filename="todos.csv"
title;completed;created_by;last_modified_by
Refactor gRPC service;false;system;system
Review pageable todo list;true;system;system
Validate mapper records;false;system;system
Prepare Liquibase changelog;true;system;system
Check auditing fields;false;system;system
Update repository tests;true;system;system
Document todo contract;false;system;system
Exercise patch endpoint;true;system;system
Verify delete behavior;false;system;system
Run Maven coverage;true;system;system
```

`users.csv`

```csv filename="users.csv"
username;password;enabled;created_by;last_modified_by
admin;$2a$10$dsEILtFz.VyZL6vXnj1Kg.GFczEdAJ9XlBI234j4ExulU3xub4zTe;true;system;system
user;$2a$10$X4IqH828fc4B.V4t7PtB7.n1eKxlSvCRB6BmntaXnxDCBtj23g6L6;true;system;system
```

`authorities.csv`

```csv filename="authorities.csv"
id;name
1;ROLE_ADMIN
2;ROLE_USER
```

`user-authorities.csv`

```csv filename="user-authorities.csv"
user_id;authority_id
1;1
1;2
2;2
```

The sample also keeps a few native-image metadata files under `src/main/resources/META-INF/native-image`. The application-specific hint registration lives in `NativeRuntimeHints`, while vendor metadata is shipped for Protovalidate, Hibernate JCache, and Liquibase resource scanning:

- `src/main/resources/META-INF/native-image/build.buf/protovalidate/reflect-config.json`
  Registers Buf validation model types for reflection in GraalVM builds.
- `src/main/resources/META-INF/native-image/org.hibernate.orm/hibernate-jcache/reflect-config.json`
  Enables reflective construction of Hibernate’s JCache region factory.
- `src/main/resources/META-INF/native-image/org.liquibase/liquibase-core/resource-config.json`
  Keeps Liquibase CSV seed resources reachable in native mode.

`reflect-config.json`

```json filename="reflect-config.json"
[
  {
    "name": "org.hibernate.cache.jcache.internal.JCacheRegionFactory",
    "allPublicConstructors": true
  }
]
```

`resource-config.json`

```json filename="resource-config.json"
{
  "resources": {
    "includes": [
      {
        "pattern": "\\Qdb/data/\\E.*"
      }
    ]
  }
}
```

---

## 🛠️ Step 3: gRPC Bootstrap and Contracts

We start with the application bootstrap class, then move directly into the protobuf contracts that define the public RPC surface.

- `src/main/java/io/github/susimsek/springgrpcsamples/SpringGrpcSamplesApplication.java`
  Starts the application and keeps bootstrap concerns explicit.

:::tabs
@tab Java [icon=java]

```java filename="SpringGrpcSamplesApplication.java"
package io.github.susimsek.springgrpcsamples;

import io.github.susimsek.springgrpcsamples.config.aot.NativeRuntimeHints;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.context.annotation.ImportRuntimeHints;

@SpringBootApplication
@ConfigurationPropertiesScan
@ImportRuntimeHints(NativeRuntimeHints.class)
public class SpringGrpcSamplesApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpringGrpcSamplesApplication.class, args);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="SpringGrpcSamplesApplication.kt"
package io.github.susimsek.springgrpcsamples

import io.github.susimsek.springgrpcsamples.config.aot.NativeRuntimeHints
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication
import org.springframework.context.annotation.ImportRuntimeHints

@SpringBootApplication
@ConfigurationPropertiesScan
@ImportRuntimeHints(NativeRuntimeHints::class)
class SpringGrpcSamplesApplication

fun main(args: Array<String>) {
    runApplication<SpringGrpcSamplesApplication>(*args)
}
```

:::

---

## 🛠️ Step 4: JPA Integration

Before moving to authentication and protected RPC handlers, it is worth looking at how the sample defines the contract and persistence-facing mapping around the Todo model.

- `ApplicationProperties`, `DatabaseConfig`, `AuditableEntity`, and `AuthorityEntity`
  These supporting classes define app-level JWT/cache settings, JPA auditing, and the shared domain base used by `TodoEntity` and `UserEntity`.

:::tabs
@tab Java [icon=java]

```java filename="ApplicationProperties.java"
package io.github.susimsek.springgrpcsamples.config;

import java.time.Duration;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app")
public class ApplicationProperties {

    private Cache cache = new Cache();
    private Security security = new Security();

    @Getter
    @Setter
    public static class Cache {
        private Caffeine caffeine = new Caffeine();
    }

    @Getter
    @Setter
    public static class Caffeine {
        private Duration ttl = Duration.ofMinutes(10);
        private int initialCapacity = 100;
        private long maximumSize = 1_000;
    }

    @Getter
    @Setter
    public static class Security {
        private Jwt jwt = new Jwt();
    }

    @Getter
    @Setter
    public static class Jwt {
        private String issuer;
        private String secret;
        private Duration expiresIn;
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="ApplicationProperties.kt"
package io.github.susimsek.springgrpcsamples.config

import org.springframework.boot.context.properties.ConfigurationProperties
import java.time.Duration

@ConfigurationProperties(prefix = "app")
class ApplicationProperties {
    var cache: Cache = Cache()
    var security: Security = Security()

    class Cache {
        var caffeine: Caffeine = Caffeine()
    }

    class Caffeine {
        var ttl: Duration = Duration.ofMinutes(10)
        var initialCapacity: Int = 100
        var maximumSize: Long = 1_000
    }

    class Security {
        var jwt: Jwt = Jwt()
    }

    class Jwt {
        var issuer: String? = null
        var secret: String? = null
        var expiresIn: Duration? = null
    }
}
```

:::

:::tabs
@tab Java [icon=java]

```java filename="DatabaseConfig.java"
package io.github.susimsek.springgrpcsamples.config;

import io.github.susimsek.springgrpcsamples.security.SecurityAuditorAware;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration(proxyBeanMethods = false)
@EnableJpaAuditing
public class DatabaseConfig {

    @Bean
    AuditorAware<String> auditorAware() {
        return new SecurityAuditorAware();
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="DatabaseConfig.kt"
package io.github.susimsek.springgrpcsamples.config

import io.github.susimsek.springgrpcsamples.security.SecurityAuditorAware
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.domain.AuditorAware
import org.springframework.data.jpa.repository.config.EnableJpaAuditing

@Configuration(proxyBeanMethods = false)
@EnableJpaAuditing
class DatabaseConfig {
    @Bean
    fun auditorAware(): AuditorAware<String> = SecurityAuditorAware()
}
```

:::

:::tabs
@tab Java [icon=java]

```java filename="AuditableEntity.java"
package io.github.susimsek.springgrpcsamples.domain;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;
import org.jspecify.annotations.Nullable;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Getter
@Setter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class AuditableEntity {
    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    private String createdBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedBy
    @Column(name = "last_modified_by", length = 100)
    private @Nullable String lastModifiedBy;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="AuditableEntity.kt"
package io.github.susimsek.springgrpcsamples.domain

import jakarta.persistence.Column
import jakarta.persistence.EntityListeners
import jakarta.persistence.MappedSuperclass
import org.springframework.data.annotation.CreatedBy
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedBy
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.Instant

@MappedSuperclass
@EntityListeners(AuditingEntityListener::class)
abstract class AuditableEntity {
    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    lateinit var createdBy: String

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    lateinit var createdAt: Instant

    @LastModifiedBy
    @Column(name = "last_modified_by", length = 100)
    var lastModifiedBy: String? = null

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    lateinit var updatedAt: Instant
}
```

:::

:::tabs
@tab Java [icon=java]

```java filename="AuthorityEntity.java"
package io.github.susimsek.springgrpcsamples.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(name = "authorities")
public class AuthorityEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "authority_seq")
    @SequenceGenerator(name = "authority_seq", sequenceName = "authority_seq", allocationSize = 1)
    private Long id;

    @Column(name = "name", nullable = false, unique = true, length = 50)
    private String name;
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="AuthorityEntity.kt"
package io.github.susimsek.springgrpcsamples.domain

import jakarta.persistence.*
import org.hibernate.annotations.Cache
import org.hibernate.annotations.CacheConcurrencyStrategy

@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(name = "authorities")
class AuthorityEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "authority_seq")
    @SequenceGenerator(name = "authority_seq", sequenceName = "authority_seq", allocationSize = 1)
    var id: Long? = null,

    @Column(name = "name", nullable = false, unique = true, length = 50)
    var name: String? = null
)
```

:::

- `src/main/proto/auth.proto`
  Defines the public `Login` RPC and validates username/password shape.

```proto filename="auth.proto"
syntax = "proto3";

import "buf/validate/validate.proto";

option java_multiple_files = true;
option java_package = "io.github.susimsek.springgrpcsamples.proto";
option java_outer_classname = "AuthProto";

service AuthService {
  rpc Login(LoginRequest) returns (Token) {}
}

message LoginRequest {
  string username = 1 [
    (buf.validate.field).ignore = IGNORE_IF_ZERO_VALUE,
    (buf.validate.field).string = {
      min_len: 3
      max_len: 100
    }
  ];

  string password = 2 [
    (buf.validate.field).ignore = IGNORE_IF_ZERO_VALUE,
    (buf.validate.field).string = {
      min_len: 3
      max_len: 100
    }
  ];

  option (buf.validate.message).cel = {
    id: "grpc.validation.constraints.notBlank"
    message: "This field cannot be blank."
    expression: "this.username.matches('.*\\\\S.*') && this.password.matches('.*\\\\S.*')"
  };
}

message Token {
  string access_token = 1;
  string token_type = 2;
  int64 expires_in = 3;
}
```

- `src/main/proto/todo.proto`
  Defines the full CRUD surface and embeds validation rules directly into request messages.

```proto filename="todo.proto"
syntax = "proto3";

import "buf/validate/validate.proto";
import "google/protobuf/timestamp.proto";
import "util/pagination.proto";

option java_multiple_files = true;
option java_package = "io.github.susimsek.springgrpcsamples.proto";
option java_outer_classname = "TodoProto";

service TodoService {
  rpc CreateTodo(CreateTodoRequest) returns (Todo) {}
  rpc GetTodo(GetTodoRequest) returns (Todo) {}
  rpc ListTodos(ListTodosRequest) returns (TodoList) {}
  rpc UpdateTodo(UpdateTodoRequest) returns (Todo) {}
  rpc PatchTodo(PatchTodoRequest) returns (Todo) {}
  rpc DeleteTodo(DeleteTodoRequest) returns (DeleteTodoResponse) {}
}

message CreateTodoRequest {
  string title = 1 [
    (buf.validate.field).ignore = IGNORE_IF_ZERO_VALUE,
    (buf.validate.field).string = {
      min_len: 3
      max_len: 255
    }
  ];

  option (buf.validate.message).cel = {
    id: "grpc.validation.constraints.notBlank"
    message: "This field cannot be blank."
    expression: "this.title.matches('.*\\\\S.*')"
  };
}

message GetTodoRequest {
  int64 id = 1 [
    (buf.validate.field).int64 = {
      gt: 0
    }
  ];
}

message ListTodosRequest {
  util.PageRequest page_request = 1;
}

message TodoList {
  repeated Todo items = 1;
  int32 page = 2;
  int32 size = 3;
  int64 total_elements = 4;
  int32 total_pages = 5;
  bool first = 6;
  bool last = 7;
}

message UpdateTodoRequest {
  int64 id = 1 [
    (buf.validate.field).int64 = {
      gt: 0
    }
  ];

  string title = 2 [
    (buf.validate.field).ignore = IGNORE_IF_ZERO_VALUE,
    (buf.validate.field).string = {
      min_len: 3
      max_len: 255
    }
  ];

  bool completed = 3;

  option (buf.validate.message).cel = {
    id: "grpc.validation.constraints.notBlank"
    message: "This field cannot be blank."
    expression: "this.title.matches('.*\\\\S.*')"
  };
}

message PatchTodoRequest {
  int64 id = 1 [
    (buf.validate.field).int64 = {
      gt: 0
    }
  ];

  optional string title = 2 [
    (buf.validate.field).string = {
      min_len: 3
      max_len: 255
    }
  ];

  optional bool completed = 3;

  option (buf.validate.message).cel = {
    id: "grpc.validation.constraints.notEmpty"
    message: "This field cannot be empty."
    expression: "has(this.title) || has(this.completed)"
  };

  option (buf.validate.message).cel = {
    id: "grpc.validation.constraints.notBlank"
    message: "This field cannot be blank."
    expression: "!has(this.title) || this.title.matches('.*\\\\S.*')"
  };
}

message DeleteTodoRequest {
  int64 id = 1 [
    (buf.validate.field).int64 = {
      gt: 0
    }
  ];
}

message DeleteTodoResponse {
  int64 id = 1;
  bool deleted = 2;
}

message Todo {
  int64 id = 1;
  string title = 2;
  bool completed = 3;
  google.protobuf.Timestamp created_at = 4;
  google.protobuf.Timestamp updated_at = 5;
  string created_by = 6;
  string last_modified_by = 7;
}
```

The contract is already carrying validation semantics, pagination design, and API boundaries. That is one of the main reasons the Java service layer stays small.

- `TodoEntity`, `UserEntity`, and `UserRepository`
  The sample does not stop at protobuf contracts. It also models Todo persistence, cached user lookups, and authority loading through JPA entities and repositories.

:::tabs
@tab Java [icon=java]

```java filename="TodoEntity.java"
package io.github.susimsek.springgrpcsamples.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(name = "todos")
public class TodoEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "todo_seq")
    @SequenceGenerator(name = "todo_seq", sequenceName = "todo_seq", allocationSize = 1)
    private Long id;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "completed", nullable = false)
    private boolean completed;
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="TodoEntity.kt"
package io.github.susimsek.springgrpcsamples.domain

import jakarta.persistence.*
import org.hibernate.annotations.Cache
import org.hibernate.annotations.CacheConcurrencyStrategy

@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(name = "todos")
class TodoEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "todo_seq")
    @SequenceGenerator(name = "todo_seq", sequenceName = "todo_seq", allocationSize = 1)
    var id: Long? = null,

    @Column(name = "title", nullable = false, length = 255)
    var title: String? = null,

    @Column(name = "completed", nullable = false)
    var completed: Boolean = false
) : AuditableEntity()
```

:::

:::tabs
@tab Java [icon=java]

```java filename="UserEntity.java"
package io.github.susimsek.springgrpcsamples.domain;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(name = "users")
@NamedEntityGraph(
        name = "User.withAuthorities",
        attributeNodes = @NamedAttributeNode("authorities"))
public class UserEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_seq")
    @SequenceGenerator(name = "user_seq", sequenceName = "user_seq", allocationSize = 1)
    private Long id;

    @Column(name = "username", nullable = false, length = 100)
    private String username;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @ManyToMany
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @JoinTable(
            name = "user_authorities",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "authority_id"))
    private Set<AuthorityEntity> authorities = new HashSet<>();
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="UserEntity.kt"
package io.github.susimsek.springgrpcsamples.domain

import jakarta.persistence.*
import org.hibernate.annotations.Cache
import org.hibernate.annotations.CacheConcurrencyStrategy

@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(name = "users")
@NamedEntityGraph(
    name = "User.withAuthorities",
    attributeNodes = [NamedAttributeNode("authorities")]
)
class UserEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_seq")
    @SequenceGenerator(name = "user_seq", sequenceName = "user_seq", allocationSize = 1)
    var id: Long? = null,

    @Column(name = "username", nullable = false, length = 100)
    var username: String? = null,

    @Column(name = "password", nullable = false)
    var password: String? = null,

    @Column(name = "enabled", nullable = false)
    var enabled: Boolean = false,

    @ManyToMany
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @JoinTable(
        name = "user_authorities",
        joinColumns = [JoinColumn(name = "user_id")],
        inverseJoinColumns = [JoinColumn(name = "authority_id")]
    )
    var authorities: MutableSet<AuthorityEntity> = linkedSetOf()
) : AuditableEntity()
```

:::

:::tabs
@tab Java [icon=java]

```java filename="UserRepository.java"
package io.github.susimsek.springgrpcsamples.repository;

import io.github.susimsek.springgrpcsamples.domain.UserEntity;
import java.util.Optional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    String USER_BY_USERNAME_CACHE = "usersByUsername";

    @EntityGraph(value = "User.withAuthorities")
    @Cacheable(cacheNames = USER_BY_USERNAME_CACHE, key = "#username", unless = "#result == null")
    Optional<UserEntity> findByUsername(String username);
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="UserRepository.kt"
package io.github.susimsek.springgrpcsamples.repository

import io.github.susimsek.springgrpcsamples.domain.UserEntity
import org.springframework.cache.annotation.Cacheable
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface UserRepository : JpaRepository<UserEntity, Long> {

    companion object {
        const val USER_BY_USERNAME_CACHE: String = "usersByUsername"
    }

    @EntityGraph(value = "User.withAuthorities")
    @Cacheable(cacheNames = [USER_BY_USERNAME_CACHE], key = "#username", unless = "#result == null")
    fun findByUsername(username: String): Optional<UserEntity>
}
```

:::

---

## 🛠️ Step 5: Authentication & Protected Endpoints

Before looking at the protected RPC handlers themselves, it helps to see the repository and mapper pieces they depend on.

- `src/main/java/io/github/susimsek/springgrpcsamples/repository/TodoRepository.java`
  Uses Spring Data JPA directly; no custom implementation is needed for basic CRUD and paging.

:::tabs
@tab Java [icon=java]

```java filename="TodoRepository.java"
package io.github.susimsek.springgrpcsamples.repository;

import io.github.susimsek.springgrpcsamples.domain.TodoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TodoRepository extends JpaRepository<TodoEntity, Long> {}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="TodoRepository.kt"
package io.github.susimsek.springgrpcsamples.repository

import io.github.susimsek.springgrpcsamples.domain.TodoEntity
import org.springframework.data.jpa.repository.JpaRepository

interface TodoRepository : JpaRepository<TodoEntity, Long>
```

:::

- `src/main/java/io/github/susimsek/springgrpcsamples/mapper/TodoMapper.java`
  Converts protobuf requests into JPA entities and maps entities back into protobuf responses.

:::tabs
@tab Java [icon=java]

```java filename="TodoMapper.java"
package io.github.susimsek.springgrpcsamples.mapper;

import io.github.susimsek.springgrpcsamples.domain.TodoEntity;
import io.github.susimsek.springgrpcsamples.proto.CreateTodoRequest;
import io.github.susimsek.springgrpcsamples.proto.PatchTodoRequest;
import io.github.susimsek.springgrpcsamples.proto.Todo;
import io.github.susimsek.springgrpcsamples.proto.UpdateTodoRequest;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValueCheckStrategy;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(
        componentModel = MappingConstants.ComponentModel.SPRING,
        uses = ProtobufMapper.class,
        nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS)
public interface TodoMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "completed", constant = "false")
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "lastModifiedBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    TodoEntity toEntity(CreateTodoRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "lastModifiedBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(UpdateTodoRequest request, @MappingTarget TodoEntity entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "lastModifiedBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void patchEntity(PatchTodoRequest request, @MappingTarget TodoEntity entity);

    @ProtobufMapping
    @Mapping(target = "mergeCreatedAt", ignore = true)
    @Mapping(target = "mergeUpdatedAt", ignore = true)
    @Mapping(target = "createdByBytes", ignore = true)
    @Mapping(target = "lastModifiedByBytes", ignore = true)
    @Mapping(target = "titleBytes", ignore = true)
    Todo toProto(TodoEntity todo);
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="TodoMapper.kt"
package io.github.susimsek.springgrpcsamples.mapper

import io.github.susimsek.springgrpcsamples.domain.TodoEntity
import io.github.susimsek.springgrpcsamples.proto.CreateTodoRequest
import io.github.susimsek.springgrpcsamples.proto.PatchTodoRequest
import io.github.susimsek.springgrpcsamples.proto.Todo
import io.github.susimsek.springgrpcsamples.proto.UpdateTodoRequest
import org.mapstruct.BeanMapping
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.MappingConstants
import org.mapstruct.MappingTarget
import org.mapstruct.NullValueCheckStrategy
import org.mapstruct.NullValuePropertyMappingStrategy

@Mapper(
    componentModel = MappingConstants.ComponentModel.SPRING,
    uses = [ProtobufMapper::class],
    nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS
)
interface TodoMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "completed", constant = "false")
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "lastModifiedBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    fun toEntity(request: CreateTodoRequest): TodoEntity

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "lastModifiedBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    fun updateEntity(request: UpdateTodoRequest, @MappingTarget entity: TodoEntity)

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "lastModifiedBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    fun patchEntity(request: PatchTodoRequest, @MappingTarget entity: TodoEntity)

    @ProtobufMapping
    @Mapping(target = "mergeCreatedAt", ignore = true)
    @Mapping(target = "mergeUpdatedAt", ignore = true)
    @Mapping(target = "createdByBytes", ignore = true)
    @Mapping(target = "lastModifiedByBytes", ignore = true)
    @Mapping(target = "titleBytes", ignore = true)
    fun toProto(todo: TodoEntity): Todo
}
```

:::

To keep `TodoMapper` lean, the repository also adds a tiny protobuf helper and a reusable MapStruct meta-annotation for generated builder fields.

- `src/main/java/io/github/susimsek/springgrpcsamples/mapper/ProtobufMapper.java`
  Converts `Instant` values into protobuf `Timestamp` instances.

:::tabs
@tab Java [icon=java]

```java filename="ProtobufMapper.java"
package io.github.susimsek.springgrpcsamples.mapper;

import com.google.protobuf.Timestamp;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class ProtobufMapper {

    public static Timestamp toTimestamp(Instant instant) {
        return Timestamp.newBuilder()
                .setSeconds(instant.getEpochSecond())
                .setNanos(instant.getNano())
                .build();
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="ProtobufMapper.kt"
package io.github.susimsek.springgrpcsamples.mapper

import com.google.protobuf.Timestamp
import java.time.Instant

object ProtobufMapper {
    @JvmStatic
    fun toTimestamp(instant: Instant): Timestamp =
        Timestamp.newBuilder()
            .setSeconds(instant.epochSecond)
            .setNanos(instant.nano)
            .build()
}
```

:::

- `src/main/java/io/github/susimsek/springgrpcsamples/mapper/ProtobufMapping.java`
  Ignores protobuf builder internals that should not be mapped by MapStruct.

:::tabs
@tab Java [icon=java]

```java filename="ProtobufMapping.java"
package io.github.susimsek.springgrpcsamples.mapper;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.mapstruct.Mapping;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.CLASS)
@Mapping(target = "allFields", ignore = true)
@Mapping(target = "clearField", ignore = true)
@Mapping(target = "clearOneof", ignore = true)
@Mapping(target = "mergeFrom", ignore = true)
@Mapping(target = "mergeUnknownFields", ignore = true)
@Mapping(target = "unknownFields", ignore = true)
public @interface ProtobufMapping {}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="ProtobufMapping.kt"
package io.github.susimsek.springgrpcsamples.mapper

import org.mapstruct.Mapping

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.BINARY)
@Mapping(target = "allFields", ignore = true)
@Mapping(target = "clearField", ignore = true)
@Mapping(target = "clearOneof", ignore = true)
@Mapping(target = "mergeFrom", ignore = true)
@Mapping(target = "mergeUnknownFields", ignore = true)
@Mapping(target = "unknownFields", ignore = true)
annotation class ProtobufMapping
```

:::

Authentication also depends on a dedicated `UserDetailsService` that loads JPA users and exposes their authorities to Spring Security.

- `src/main/java/io/github/susimsek/springgrpcsamples/security/DomainUserDetailsService.java`
  Resolves a persisted user and adapts it into Spring Security’s `UserDetails`.

:::tabs
@tab Java [icon=java]

```java filename="DomainUserDetailsService.java"
package io.github.susimsek.springgrpcsamples.security;

import io.github.susimsek.springgrpcsamples.domain.UserEntity;
import io.github.susimsek.springgrpcsamples.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DomainUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    @Override
    public UserDetails loadUserByUsername(String username) {
        return userRepository
                .findByUsername(username)
                .map(
                        user ->
                                User.withUsername(user.getUsername())
                                        .password(user.getPassword())
                                        .authorities(authorities(user))
                                        .disabled(!user.isEnabled())
                                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("user not found"));
    }

    private static String[] authorities(UserEntity user) {
        return user.getAuthorities().stream()
                .map(authority -> authority.getName())
                .toArray(String[]::new);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="DomainUserDetailsService.kt"
package io.github.susimsek.springgrpcsamples.security

import io.github.susimsek.springgrpcsamples.domain.UserEntity
import io.github.susimsek.springgrpcsamples.repository.UserRepository
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class DomainUserDetailsService(
    private val userRepository: UserRepository
) : UserDetailsService {

    @Transactional(readOnly = true)
    override fun loadUserByUsername(username: String): UserDetails =
        userRepository.findByUsername(username)
            .map { user ->
                User.withUsername(user.username)
                    .password(user.password)
                    .authorities(*authorities(user))
                    .disabled(!user.enabled)
                    .build()
            }
            .orElseThrow { UsernameNotFoundException("user not found") }

    private fun authorities(user: UserEntity): Array<String> =
        user.authorities.map { it.name }.toTypedArray()
}
```

:::

With these pieces in place, the gRPC services can stay focused on orchestration rather than conversion boilerplate.

---

## 🛠️ Step 6: Security, Validation, and Error Handling

In this section, we use the repository’s actual service classes. Authentication and Todo CRUD are implemented as Spring-managed beans that extend generated gRPC base classes.

- `src/main/java/io/github/susimsek/springgrpcsamples/service/AuthGrpcService.java`
  Authenticates credentials and returns a JWT-based token response.

:::tabs
@tab Java [icon=java]

```java filename="AuthGrpcService.java"
package io.github.susimsek.springgrpcsamples.service;

import io.github.susimsek.springgrpcsamples.exception.InvalidCredentialsException;
import io.github.susimsek.springgrpcsamples.proto.AuthServiceGrpc;
import io.github.susimsek.springgrpcsamples.proto.LoginRequest;
import io.github.susimsek.springgrpcsamples.proto.Token;
import io.github.susimsek.springgrpcsamples.security.JwtService;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthGrpcService extends AuthServiceGrpc.AuthServiceImplBase {

    private static final String BEARER_TOKEN_TYPE = "Bearer";

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Override
    public void login(LoginRequest request, StreamObserver<Token> responseObserver) {
        Authentication authentication = authenticate(request);
        responseObserver.onNext(
                Token.newBuilder()
                        .setAccessToken(jwtService.generateToken(authentication))
                        .setTokenType(BEARER_TOKEN_TYPE)
                        .setExpiresIn(jwtService.getExpiresInSeconds())
                        .build());
        responseObserver.onCompleted();
    }

    private Authentication authenticate(LoginRequest request) {
        try {
            return authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            request.getUsername(), request.getPassword()));
        } catch (AuthenticationException ex) {
            throw new InvalidCredentialsException();
        }
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="AuthGrpcService.kt"
package io.github.susimsek.springgrpcsamples.service

import io.github.susimsek.springgrpcsamples.exception.InvalidCredentialsException
import io.github.susimsek.springgrpcsamples.proto.AuthServiceGrpc
import io.github.susimsek.springgrpcsamples.proto.LoginRequest
import io.github.susimsek.springgrpcsamples.proto.Token
import io.github.susimsek.springgrpcsamples.security.JwtService
import io.grpc.stub.StreamObserver
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.AuthenticationException
import org.springframework.stereotype.Service

@Service
class AuthGrpcService(
    private val authenticationManager: AuthenticationManager,
    private val jwtService: JwtService
) : AuthServiceGrpc.AuthServiceImplBase() {

    override fun login(request: LoginRequest, responseObserver: StreamObserver<Token>) {
        val authentication = authenticate(request)
        responseObserver.onNext(
            Token.newBuilder()
                .setAccessToken(jwtService.generateToken(authentication))
                .setTokenType(BEARER_TOKEN_TYPE)
                .setExpiresIn(jwtService.expiresInSeconds)
                .build()
        )
        responseObserver.onCompleted()
    }

    private fun authenticate(request: LoginRequest): Authentication =
        try {
            authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(request.username, request.password)
            )
        } catch (ex: AuthenticationException) {
            throw InvalidCredentialsException()
        }

    companion object {
        private const val BEARER_TOKEN_TYPE = "Bearer"
    }
}
```

:::

- `src/main/java/io/github/susimsek/springgrpcsamples/service/TodoGrpcService.java`
  Implements the CRUD flow with JPA repository access and mapper-based protobuf conversion.

:::tabs
@tab Java [icon=java]

```java filename="TodoGrpcService.java"
package io.github.susimsek.springgrpcsamples.service;

import io.github.susimsek.springgrpcsamples.domain.TodoEntity;
import io.github.susimsek.springgrpcsamples.exception.TodoNotFoundException;
import io.github.susimsek.springgrpcsamples.mapper.TodoMapper;
import io.github.susimsek.springgrpcsamples.proto.CreateTodoRequest;
import io.github.susimsek.springgrpcsamples.proto.DeleteTodoRequest;
import io.github.susimsek.springgrpcsamples.proto.DeleteTodoResponse;
import io.github.susimsek.springgrpcsamples.proto.GetTodoRequest;
import io.github.susimsek.springgrpcsamples.proto.ListTodosRequest;
import io.github.susimsek.springgrpcsamples.proto.PatchTodoRequest;
import io.github.susimsek.springgrpcsamples.proto.Todo;
import io.github.susimsek.springgrpcsamples.proto.TodoList;
import io.github.susimsek.springgrpcsamples.proto.TodoServiceGrpc;
import io.github.susimsek.springgrpcsamples.proto.UpdateTodoRequest;
import io.github.susimsek.springgrpcsamples.repository.TodoRepository;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TodoGrpcService extends TodoServiceGrpc.TodoServiceImplBase {

    private static final int DEFAULT_PAGE_SIZE = 20;

    private final TodoRepository todoRepository;
    private final TodoMapper todoMapper;

    @Override
    public void createTodo(CreateTodoRequest request, StreamObserver<Todo> responseObserver) {
        TodoEntity created = todoRepository.save(todoMapper.toEntity(request));
        responseObserver.onNext(todoMapper.toProto(created));
        responseObserver.onCompleted();
    }

    @Override
    public void getTodo(GetTodoRequest request, StreamObserver<Todo> responseObserver) {
        TodoEntity todo = findTodo(request.getId());

        responseObserver.onNext(todoMapper.toProto(todo));
        responseObserver.onCompleted();
    }

    @Override
    public void listTodos(ListTodosRequest request, StreamObserver<TodoList> responseObserver) {
        var pageRequest = request.getPageRequest();
        int pageSize = pageRequest.getSize() == 0 ? DEFAULT_PAGE_SIZE : pageRequest.getSize();

        Page<TodoEntity> page =
                todoRepository.findAll(PageRequest.of(pageRequest.getPage(), pageSize));
        TodoList.Builder response =
                TodoList.newBuilder()
                        .setPage(page.getNumber())
                        .setSize(page.getSize())
                        .setTotalElements(page.getTotalElements())
                        .setTotalPages(page.getTotalPages())
                        .setFirst(page.isFirst())
                        .setLast(page.isLast());
        page.stream().map(todoMapper::toProto).forEach(response::addItems);
        responseObserver.onNext(response.build());
        responseObserver.onCompleted();
    }

    @Override
    public void updateTodo(UpdateTodoRequest request, StreamObserver<Todo> responseObserver) {
        TodoEntity updated = findTodo(request.getId());

        todoMapper.updateEntity(request, updated);
        updated = todoRepository.save(updated);
        responseObserver.onNext(todoMapper.toProto(updated));
        responseObserver.onCompleted();
    }

    @Override
    public void patchTodo(PatchTodoRequest request, StreamObserver<Todo> responseObserver) {
        TodoEntity existing = findTodo(request.getId());
        todoMapper.patchEntity(request, existing);
        TodoEntity patched = todoRepository.save(existing);

        responseObserver.onNext(todoMapper.toProto(patched));
        responseObserver.onCompleted();
    }

    @Override
    public void deleteTodo(
            DeleteTodoRequest request, StreamObserver<DeleteTodoResponse> responseObserver) {
        TodoEntity existing = findTodo(request.getId());
        todoRepository.delete(existing);

        responseObserver.onNext(
                DeleteTodoResponse.newBuilder().setId(request.getId()).setDeleted(true).build());
        responseObserver.onCompleted();
    }

    private TodoEntity findTodo(Long id) {
        return todoRepository.findById(id).orElseThrow(() -> new TodoNotFoundException(id));
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="TodoGrpcService.kt"
package io.github.susimsek.springgrpcsamples.service

import io.github.susimsek.springgrpcsamples.domain.TodoEntity
import io.github.susimsek.springgrpcsamples.exception.TodoNotFoundException
import io.github.susimsek.springgrpcsamples.mapper.TodoMapper
import io.github.susimsek.springgrpcsamples.proto.*
import io.github.susimsek.springgrpcsamples.repository.TodoRepository
import io.grpc.stub.StreamObserver
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service

@Service
class TodoGrpcService(
    private val todoRepository: TodoRepository,
    private val todoMapper: TodoMapper
) : TodoServiceGrpc.TodoServiceImplBase() {

    override fun createTodo(request: CreateTodoRequest, responseObserver: StreamObserver<Todo>) {
        val created = todoRepository.save(todoMapper.toEntity(request))
        responseObserver.onNext(todoMapper.toProto(created))
        responseObserver.onCompleted()
    }

    override fun getTodo(request: GetTodoRequest, responseObserver: StreamObserver<Todo>) {
        val todo = findTodo(request.id)
        responseObserver.onNext(todoMapper.toProto(todo))
        responseObserver.onCompleted()
    }

    override fun listTodos(request: ListTodosRequest, responseObserver: StreamObserver<TodoList>) {
        val pageRequest = request.pageRequest
        val pageSize = if (pageRequest.size == 0) DEFAULT_PAGE_SIZE else pageRequest.size
        val page = todoRepository.findAll(PageRequest.of(pageRequest.page, pageSize))
        val response = TodoList.newBuilder()
            .setPage(page.number)
            .setSize(page.size)
            .setTotalElements(page.totalElements)
            .setTotalPages(page.totalPages)
            .setFirst(page.isFirst)
            .setLast(page.isLast())
        page.map(todoMapper::toProto).forEach(response::addItems)
        responseObserver.onNext(response.build())
        responseObserver.onCompleted()
    }

    override fun updateTodo(request: UpdateTodoRequest, responseObserver: StreamObserver<Todo>) {
        var updated = findTodo(request.id)
        todoMapper.updateEntity(request, updated)
        updated = todoRepository.save(updated)
        responseObserver.onNext(todoMapper.toProto(updated))
        responseObserver.onCompleted()
    }

    override fun patchTodo(request: PatchTodoRequest, responseObserver: StreamObserver<Todo>) {
        val existing = findTodo(request.id)
        todoMapper.patchEntity(request, existing)
        val patched = todoRepository.save(existing)
        responseObserver.onNext(todoMapper.toProto(patched))
        responseObserver.onCompleted()
    }

    override fun deleteTodo(request: DeleteTodoRequest, responseObserver: StreamObserver<DeleteTodoResponse>) {
        val existing = findTodo(request.id)
        todoRepository.delete(existing)
        responseObserver.onNext(DeleteTodoResponse.newBuilder().setId(request.id).setDeleted(true).build())
        responseObserver.onCompleted()
    }

    private fun findTodo(id: Long): TodoEntity =
        todoRepository.findById(id).orElseThrow { TodoNotFoundException(id) }

    companion object {
        private const val DEFAULT_PAGE_SIZE = 20
    }
}
```

:::

The service layer is intentionally direct. Each method receives a protobuf request, delegates to repository and mapper logic, and completes the `StreamObserver` response.

---

This sample uses one security configuration class to define password encoding, authentication manager creation, and the gRPC authorization rules.

- `src/main/java/io/github/susimsek/springgrpcsamples/config/security/SecurityConfig.java`
  Wires Spring Security into the gRPC server pipeline and protects `TodoService/*` with admin authority.

:::tabs
@tab Java [icon=java]

```java filename="SecurityConfig.java"
package io.github.susimsek.springgrpcsamples.config.security;

import io.github.susimsek.springgrpcsamples.security.AuthoritiesConstants;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.grpc.server.GlobalServerInterceptor;
import org.springframework.grpc.server.security.AuthenticationProcessInterceptor;
import org.springframework.grpc.server.security.GrpcSecurity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration(proxyBeanMethods = false)
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(
            UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider authenticationProvider =
                new DaoAuthenticationProvider(userDetailsService);
        authenticationProvider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(authenticationProvider);
    }

    @Bean
    @GlobalServerInterceptor
    @Order(Ordered.HIGHEST_PRECEDENCE + 5)
    AuthenticationProcessInterceptor grpcSecurityFilterChain(GrpcSecurity grpc) throws Exception {
        return grpc.authorizeRequests(
                        requests ->
                                requests.methods("AuthService/Login", "grpc.*/*")
                                        .permitAll()
                                        .methods("TodoService/*")
                                        .hasAuthority(AuthoritiesConstants.ADMIN)
                                        .allRequests()
                                        .authenticated())
                .oauth2ResourceServer(
                        resourceServer -> resourceServer.jwt(Customizer.withDefaults()))
                .build();
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="SecurityConfig.kt"
package io.github.susimsek.springgrpcsamples.config.security

import io.github.susimsek.springgrpcsamples.security.AuthoritiesConstants
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.grpc.server.GlobalServerInterceptor
import org.springframework.grpc.server.security.AuthenticationProcessInterceptor
import org.springframework.grpc.server.security.GrpcSecurity
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.ProviderManager
import org.springframework.security.authentication.dao.DaoAuthenticationProvider
import org.springframework.security.config.Customizer.withDefaults
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder

@Configuration(proxyBeanMethods = false)
class SecurityConfig {

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    fun authenticationManager(
        userDetailsService: UserDetailsService,
        passwordEncoder: PasswordEncoder
    ): AuthenticationManager {
        val provider = DaoAuthenticationProvider(userDetailsService)
        provider.setPasswordEncoder(passwordEncoder)
        return ProviderManager(provider)
    }

    @Bean
    @GlobalServerInterceptor
    @Order(Ordered.HIGHEST_PRECEDENCE + 5)
    @Throws(Exception::class)
    fun grpcSecurityFilterChain(grpc: GrpcSecurity): AuthenticationProcessInterceptor =
        grpc.authorizeRequests { requests ->
            requests.methods("AuthService/Login", "grpc.*/*")
                .permitAll()
                .methods("TodoService/*")
                .hasAuthority(AuthoritiesConstants.ADMIN)
                .allRequests()
                .authenticated()
        }.oauth2ResourceServer { resourceServer ->
            resourceServer.jwt(withDefaults())
        }.build()
}
```

:::

This is a practical pattern because the authorization model is readable in one place: login and infrastructure calls are public, while business RPCs require a bearer token with the expected authority.

- `src/main/java/io/github/susimsek/springgrpcsamples/security/JwtService.java`
  Generates JWT tokens from authenticated Spring Security principals.

:::tabs
@tab Java [icon=java]

```java filename="JwtService.java"
package io.github.susimsek.springgrpcsamples.security;

import io.github.susimsek.springgrpcsamples.config.ApplicationProperties;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final String issuer;
    private final Duration expiresIn;

    public JwtService(JwtEncoder jwtEncoder, ApplicationProperties applicationProperties) {
        this.jwtEncoder = jwtEncoder;
        ApplicationProperties.Jwt jwtProperties = applicationProperties.getSecurity().getJwt();
        this.issuer = jwtProperties.getIssuer();
        this.expiresIn = jwtProperties.getExpiresIn();
    }

    public String generateToken(Authentication authentication) {
        Instant issuedAt = Instant.now();
        JwtClaimsSet claims =
                JwtClaimsSet.builder()
                        .issuer(issuer)
                        .issuedAt(issuedAt)
                        .expiresAt(issuedAt.plus(expiresIn))
                        .subject(authentication.getName())
                        .claim(SecurityUtils.AUTHORITIES_CLAIM, resolveRoles(authentication))
                        .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public long getExpiresInSeconds() {
        return expiresIn.toSeconds();
    }

    private static List<String> resolveRoles(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="JwtService.kt"
package io.github.susimsek.springgrpcsamples.security

import io.github.susimsek.springgrpcsamples.config.ApplicationProperties
import org.springframework.security.core.Authentication
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.oauth2.jose.jws.MacAlgorithm
import org.springframework.security.oauth2.jwt.JwsHeader
import org.springframework.security.oauth2.jwt.JwtClaimsSet
import org.springframework.security.oauth2.jwt.JwtEncoder
import org.springframework.security.oauth2.jwt.JwtEncoderParameters
import org.springframework.stereotype.Service
import java.time.Duration
import java.time.Instant

@Service
class JwtService(
    private val jwtEncoder: JwtEncoder,
    applicationProperties: ApplicationProperties
) {
    private val issuer: String? = applicationProperties.security.jwt.issuer
    private val expiresIn: Duration = applicationProperties.security.jwt.expiresIn ?: Duration.ofHours(1)

    fun generateToken(authentication: Authentication): String {
        val issuedAt = Instant.now()
        val claims = JwtClaimsSet.builder()
            .issuer(issuer)
            .issuedAt(issuedAt)
            .expiresAt(issuedAt.plus(expiresIn))
            .subject(authentication.name)
            .claim(SecurityUtils.AUTHORITIES_CLAIM, resolveRoles(authentication))
            .build()
        val header = JwsHeader.with(MacAlgorithm.HS256).build()
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).tokenValue
    }

    val expiresInSeconds: Long
        get() = expiresIn.seconds

    private fun resolveRoles(authentication: Authentication): List<String> =
        authentication.authorities.map(GrantedAuthority::getAuthority)
}
```

:::

---

JWT handling is split into focused support classes so the main security configuration stays readable.

- `src/main/java/io/github/susimsek/springgrpcsamples/security/AuthoritiesConstants.java`
  Defines role names used across bootstrap data, authorization rules, and JWT claims.

:::tabs
@tab Java [icon=java]

```java filename="AuthoritiesConstants.java"
package io.github.susimsek.springgrpcsamples.security;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/** Constants for Spring Security authorities. */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class AuthoritiesConstants {

    public static final String ADMIN = "ROLE_ADMIN";

    public static final String USER = "ROLE_USER";

    public static final String ANONYMOUS = "ROLE_ANONYMOUS";
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="AuthoritiesConstants.kt"
package io.github.susimsek.springgrpcsamples.security

object AuthoritiesConstants {
    const val ADMIN = "ROLE_ADMIN"
    const val USER = "ROLE_USER"
    const val ANONYMOUS = "ROLE_ANONYMOUS"
}
```

:::

- `src/main/java/io/github/susimsek/springgrpcsamples/security/SecurityUtils.java`
  Extracts the current username from `UserDetails`, JWT subjects, or plain string principals.

:::tabs
@tab Java [icon=java]

```java filename="SecurityUtils.java"
package io.github.susimsek.springgrpcsamples.security;

import java.util.Optional;
import lombok.experimental.UtilityClass;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jwt.Jwt;

@UtilityClass
public class SecurityUtils {

    public static final String AUTHORITIES_CLAIM = "auth";

    public Optional<String> getCurrentUserLogin() {
        String principal = extractPrincipal(SecurityContextHolder.getContext().getAuthentication());
        return Optional.ofNullable(principal);
    }

    private String extractPrincipal(Authentication authentication) {
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }
        if (principal instanceof Jwt jwt) {
            return jwt.getSubject();
        }
        if (principal instanceof String username) {
            return username;
        }
        return null;
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="SecurityUtils.kt"
package io.github.susimsek.springgrpcsamples.security

import org.springframework.security.authentication.AnonymousAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.oauth2.jwt.Jwt

object SecurityUtils {
    const val AUTHORITIES_CLAIM = "auth"

    fun getCurrentUserLogin(): String? =
        extractPrincipal(SecurityContextHolder.getContext().authentication)

    private fun extractPrincipal(authentication: Authentication?): String? {
        if (authentication == null || authentication is AnonymousAuthenticationToken) {
            return null
        }
        val principal = authentication.principal
        return when (principal) {
            is UserDetails -> principal.username
            is Jwt -> principal.subject
            is String -> principal
            else -> null
        }
    }
}
```

:::

- `src/main/java/io/github/susimsek/springgrpcsamples/security/SecurityAuditorAware.java`
  Bridges Spring Security into JPA auditing so `createdBy` and `lastModifiedBy` fields are populated automatically.

:::tabs
@tab Java [icon=java]

```java filename="SecurityAuditorAware.java"
package io.github.susimsek.springgrpcsamples.security;

import java.util.Optional;
import org.springframework.data.domain.AuditorAware;

public class SecurityAuditorAware implements AuditorAware<String> {

    private static final String DEFAULT_AUDITOR = "system";

    @Override
    public Optional<String> getCurrentAuditor() {
        return Optional.of(SecurityUtils.getCurrentUserLogin().orElse(DEFAULT_AUDITOR));
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="SecurityAuditorAware.kt"
package io.github.susimsek.springgrpcsamples.security

import org.springframework.data.domain.AuditorAware
import java.util.Optional

class SecurityAuditorAware : AuditorAware<String> {
    override fun getCurrentAuditor(): Optional<String> =
        Optional.of(SecurityUtils.getCurrentUserLogin() ?: DEFAULT_AUDITOR)

    companion object {
        private const val DEFAULT_AUDITOR = "system"
    }
}
```

:::

- `src/main/java/io/github/susimsek/springgrpcsamples/config/security/SecurityJwtConfig.java`
  Creates the HMAC key, JWT encoder/decoder, and a `JwtAuthenticationConverter` compatible with the custom `auth` claim.

:::tabs
@tab Java [icon=java]

```java filename="SecurityJwtConfig.java"
package io.github.susimsek.springgrpcsamples.config.security;

import io.github.susimsek.springgrpcsamples.config.ApplicationProperties;
import io.github.susimsek.springgrpcsamples.security.SecurityUtils;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

@Configuration(proxyBeanMethods = false)
public class SecurityJwtConfig {

    private static final String HMAC_SHA_256 = "HmacSHA256";

    @Bean
    SecretKey jwtSecretKey(ApplicationProperties applicationProperties) {
        String secret = applicationProperties.getSecurity().getJwt().getSecret();
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA_256);
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {
        return NimbusJwtEncoder.withSecretKey(jwtSecretKey).algorithm(MacAlgorithm.HS256).build();
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey jwtSecretKey) {
        return NimbusJwtDecoder.withSecretKey(jwtSecretKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter =
                new JwtGrantedAuthoritiesConverter();
        grantedAuthoritiesConverter.setAuthoritiesClaimName(SecurityUtils.AUTHORITIES_CLAIM);
        grantedAuthoritiesConverter.setAuthorityPrefix("");

        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
        return jwtAuthenticationConverter;
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="SecurityJwtConfig.kt"
package io.github.susimsek.springgrpcsamples.config.security

import io.github.susimsek.springgrpcsamples.config.ApplicationProperties
import io.github.susimsek.springgrpcsamples.security.SecurityUtils
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.oauth2.jose.jws.MacAlgorithm
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.JwtEncoder
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter
import java.nio.charset.StandardCharsets
import javax.crypto.SecretKey
import javax.crypto.spec.SecretKeySpec

@Configuration(proxyBeanMethods = false)
class SecurityJwtConfig {

    @Bean
    fun jwtSecretKey(applicationProperties: ApplicationProperties): SecretKey {
        val secret = applicationProperties.security.jwt.secret
        return SecretKeySpec(secret.toByteArray(StandardCharsets.UTF_8), HMAC_SHA_256)
    }

    @Bean
    fun jwtEncoder(jwtSecretKey: SecretKey): JwtEncoder =
        NimbusJwtEncoder.withSecretKey(jwtSecretKey).algorithm(MacAlgorithm.HS256).build()

    @Bean
    fun jwtDecoder(jwtSecretKey: SecretKey): JwtDecoder =
        NimbusJwtDecoder.withSecretKey(jwtSecretKey).macAlgorithm(MacAlgorithm.HS256).build()

    @Bean
    fun jwtAuthenticationConverter(): JwtAuthenticationConverter {
        val grantedAuthoritiesConverter = JwtGrantedAuthoritiesConverter()
        grantedAuthoritiesConverter.setAuthoritiesClaimName(SecurityUtils.AUTHORITIES_CLAIM)
        grantedAuthoritiesConverter.setAuthorityPrefix("")

        return JwtAuthenticationConverter().apply {
            setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter)
        }
    }

    companion object {
        private const val HMAC_SHA_256 = "HmacSHA256"
    }
}
```

:::

- `src/main/java/io/github/susimsek/springgrpcsamples/config/cache/CacheConfig.java`
  Configures Spring Cache and optional Hibernate second-level caching backed by Caffeine.

:::tabs
@tab Java [icon=java]

```java filename="CacheConfig.java"
package io.github.susimsek.springgrpcsamples.config.cache;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.jcache.configuration.CaffeineConfiguration;
import com.github.benmanes.caffeine.jcache.spi.CaffeineCachingProvider;
import io.github.susimsek.springgrpcsamples.config.ApplicationProperties;
import io.github.susimsek.springgrpcsamples.domain.AuthorityEntity;
import io.github.susimsek.springgrpcsamples.domain.TodoEntity;
import io.github.susimsek.springgrpcsamples.domain.UserEntity;
import io.github.susimsek.springgrpcsamples.repository.UserRepository;
import java.util.OptionalLong;
import javax.cache.CacheManager;
import javax.cache.Caching;
import lombok.RequiredArgsConstructor;
import org.hibernate.cache.jcache.ConfigSettings;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.cache.autoconfigure.JCacheManagerCustomizer;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@EnableCaching
@RequiredArgsConstructor
public class CacheConfig {

    private final ApplicationProperties applicationProperties;

    @Bean
    public org.springframework.cache.CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(buildCaffeineConfig(cacheProperties()));
        return cacheManager;
    }

    private ApplicationProperties.Caffeine cacheProperties() {
        return applicationProperties.getCache().getCaffeine();
    }

    private Caffeine<Object, Object> buildCaffeineConfig(ApplicationProperties.Caffeine config) {
        return Caffeine.newBuilder()
                .expireAfterWrite(config.getTtl())
                .initialCapacity(config.getInitialCapacity())
                .maximumSize(config.getMaximumSize())
                .recordStats();
    }

    @Configuration(proxyBeanMethods = false)
    @ConditionalOnProperty(
            name = "spring.jpa.properties.hibernate.cache.use_second_level_cache",
            havingValue = "true")
    @RequiredArgsConstructor
    static class HibernateSecondLevelCacheConfiguration {

        private final ApplicationProperties applicationProperties;

        @Bean
        CacheManager jcacheManager(JCacheManagerCustomizer customizer) {
            CacheManager manager =
                    Caching.getCachingProvider(CaffeineCachingProvider.class.getName())
                            .getCacheManager();
            customizer.customize(manager);
            return manager;
        }

        @Bean
        HibernatePropertiesCustomizer hibernatePropertiesCustomizer(CacheManager jcacheManager) {
            return properties -> properties.put(ConfigSettings.CACHE_MANAGER, jcacheManager);
        }

        @Bean
        JCacheManagerCustomizer cacheManagerCustomizer() {
            return cacheManager -> {
                createCache(cacheManager, "default-update-timestamps-region");
                createCache(cacheManager, "default-query-results-region");
                createCache(cacheManager, AuthorityEntity.class.getName());
                createCache(cacheManager, TodoEntity.class.getName());
                createCache(cacheManager, UserEntity.class.getName());
                createCache(cacheManager, UserEntity.class.getName() + ".authorities");
                createCache(cacheManager, UserRepository.USER_BY_USERNAME_CACHE);
            };
        }

        private void createCache(CacheManager cacheManager, String cacheName) {
            javax.cache.Cache<Object, Object> cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
                return;
            }
            ApplicationProperties.Caffeine config = applicationProperties.getCache().getCaffeine();
            CaffeineConfiguration<Object, Object> caffeineConfig = new CaffeineConfiguration<>();
            caffeineConfig.setMaximumSize(OptionalLong.of(config.getMaximumSize()));
            caffeineConfig.setExpireAfterWrite(OptionalLong.of(config.getTtl().toNanos()));
            caffeineConfig.setStatisticsEnabled(true);
            cacheManager.createCache(cacheName, caffeineConfig);
        }
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="CacheConfig.kt"
package io.github.susimsek.springgrpcsamples.config.cache

import com.github.benmanes.caffeine.cache.Caffeine
import com.github.benmanes.caffeine.jcache.configuration.CaffeineConfiguration
import com.github.benmanes.caffeine.jcache.spi.CaffeineCachingProvider
import io.github.susimsek.springgrpcsamples.config.ApplicationProperties
import io.github.susimsek.springgrpcsamples.domain.AuthorityEntity
import io.github.susimsek.springgrpcsamples.domain.TodoEntity
import io.github.susimsek.springgrpcsamples.domain.UserEntity
import io.github.susimsek.springgrpcsamples.repository.UserRepository
import org.hibernate.cache.jcache.ConfigSettings
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.boot.cache.autoconfigure.JCacheManagerCustomizer
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer
import org.springframework.cache.annotation.EnableCaching
import org.springframework.cache.caffeine.CaffeineCacheManager
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.util.OptionalLong
import javax.cache.CacheManager
import javax.cache.Caching

@Configuration(proxyBeanMethods = false)
@EnableCaching
class CacheConfig(
    private val applicationProperties: ApplicationProperties
) {

    @Bean
    fun cacheManager(): org.springframework.cache.CacheManager =
        CaffeineCacheManager().apply {
            setCaffeine(buildCaffeineConfig(cacheProperties()))
        }

    private fun cacheProperties(): ApplicationProperties.Caffeine =
        applicationProperties.cache.caffeine

    private fun buildCaffeineConfig(config: ApplicationProperties.Caffeine): Caffeine<Any, Any> =
        Caffeine.newBuilder()
            .expireAfterWrite(config.ttl)
            .initialCapacity(config.initialCapacity)
            .maximumSize(config.maximumSize)
            .recordStats()

    @Configuration(proxyBeanMethods = false)
    @ConditionalOnProperty(
        name = ["spring.jpa.properties.hibernate.cache.use_second_level_cache"],
        havingValue = "true"
    )
    class HibernateSecondLevelCacheConfiguration(
        private val applicationProperties: ApplicationProperties
    ) {

        @Bean
        fun jcacheManager(customizer: JCacheManagerCustomizer): CacheManager =
            Caching.getCachingProvider(CaffeineCachingProvider::class.java.name)
                .cacheManager
                .also(customizer::customize)

        @Bean
        fun hibernatePropertiesCustomizer(jcacheManager: CacheManager): HibernatePropertiesCustomizer =
            HibernatePropertiesCustomizer { properties ->
                properties[ConfigSettings.CACHE_MANAGER] = jcacheManager
            }

        @Bean
        fun cacheManagerCustomizer(): JCacheManagerCustomizer =
            JCacheManagerCustomizer { cacheManager ->
                createCache(cacheManager, "default-update-timestamps-region")
                createCache(cacheManager, "default-query-results-region")
                createCache(cacheManager, AuthorityEntity::class.java.name)
                createCache(cacheManager, TodoEntity::class.java.name)
                createCache(cacheManager, UserEntity::class.java.name)
                createCache(cacheManager, UserEntity::class.java.name + ".authorities")
                createCache(cacheManager, UserRepository.USER_BY_USERNAME_CACHE)
            }

        private fun createCache(cacheManager: CacheManager, cacheName: String) {
            val cache = cacheManager.getCache(cacheName)
            if (cache != null) {
                cache.clear()
                return
            }
            val config = applicationProperties.cache.caffeine
            val caffeineConfig = CaffeineConfiguration<Any, Any>()
            caffeineConfig.setMaximumSize(OptionalLong.of(config.maximumSize))
            caffeineConfig.setExpireAfterWrite(OptionalLong.of(config.ttl.toNanos()))
            caffeineConfig.isStatisticsEnabled = true
            cacheManager.createCache(cacheName, caffeineConfig)
        }
    }
}
```

:::

The sample does not validate requests manually in every service method. Instead, it uses a global server interceptor to run Protovalidate against application protobuf messages, then translates failures through a centralized gRPC advice.

- `src/main/java/io/github/susimsek/springgrpcsamples/config/validation/GrpcValidationConfig.java`
  Registers the shared Protovalidate `Validator` bean used by the interceptor.

:::tabs
@tab Java [icon=java]

```java filename="GrpcValidationConfig.java"
package io.github.susimsek.springgrpcsamples.config.validation;

import build.buf.protovalidate.Validator;
import build.buf.protovalidate.ValidatorFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class GrpcValidationConfig {

    @Bean
    public Validator grpcValidator() {
        return ValidatorFactory.newBuilder().build();
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="GrpcValidationConfig.kt"
package io.github.susimsek.springgrpcsamples.config.validation

import build.buf.protovalidate.Validator
import build.buf.protovalidate.ValidatorFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class GrpcValidationConfig {
    @Bean
    fun grpcValidator(): Validator = ValidatorFactory.newBuilder().build()
}
```

:::

- `src/main/java/io/github/susimsek/springgrpcsamples/config/validation/GrpcValidationServerInterceptor.java`
  Applies protobuf validation before service logic runs.

:::tabs
@tab Java [icon=java]

```java filename="GrpcValidationServerInterceptor.java"
package io.github.susimsek.springgrpcsamples.config.validation;

import build.buf.protovalidate.ValidationResult;
import build.buf.protovalidate.Validator;
import build.buf.protovalidate.exceptions.ValidationException;
import com.google.protobuf.Message;
import io.github.susimsek.springgrpcsamples.exception.GrpcValidationException;
import io.github.susimsek.springgrpcsamples.exception.GrpcViolation;
import io.grpc.ForwardingServerCallListener;
import io.grpc.Metadata;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.ServerInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.grpc.server.GlobalServerInterceptor;
import org.springframework.stereotype.Component;

@Component
@GlobalServerInterceptor
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@RequiredArgsConstructor
public class GrpcValidationServerInterceptor implements ServerInterceptor {

    private static final String APPLICATION_PROTO_PACKAGE =
            "io.github.susimsek.springgrpcsamples.proto";

    private final Validator validator;

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call, Metadata headers, ServerCallHandler<ReqT, RespT> next) {
        ServerCall.Listener<ReqT> listener = next.startCall(call, headers);
        return new ValidationServerCallListener<>(listener, validator);
    }

    private static final class ValidationServerCallListener<ReqT>
            extends ForwardingServerCallListener.SimpleForwardingServerCallListener<ReqT> {

        private final Validator validator;

        private ValidationServerCallListener(
                ServerCall.Listener<ReqT> delegate, Validator validator) {
            super(delegate);
            this.validator = validator;
        }

        @Override
        public void onMessage(ReqT message) {
            if (message instanceof Message protoMessage
                    && APPLICATION_PROTO_PACKAGE.equals(protoMessage.getClass().getPackageName())) {
                validate(protoMessage);
            }
            super.onMessage(message);
        }

        private void validate(Message message) {
            try {
                ValidationResult result = validator.validate(message);
                if (!result.isSuccess()) {
                    throw new GrpcValidationException(
                            result.getViolations().stream()
                                    .map(v -> GrpcViolation.from(v))
                                    .toList());
                }
            } catch (ValidationException ex) {
                throw new IllegalStateException("Failed to validate gRPC request", ex);
            }
        }
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="GrpcValidationServerInterceptor.kt"
package io.github.susimsek.springgrpcsamples.config.validation

import build.buf.protovalidate.ValidationResult
import build.buf.protovalidate.Validator
import build.buf.protovalidate.exceptions.ValidationException
import com.google.protobuf.Message
import io.github.susimsek.springgrpcsamples.exception.GrpcValidationException
import io.github.susimsek.springgrpcsamples.exception.GrpcViolation
import io.grpc.*
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.grpc.server.GlobalServerInterceptor
import org.springframework.stereotype.Component

@Component
@GlobalServerInterceptor
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
class GrpcValidationServerInterceptor(
    private val validator: Validator
) : ServerInterceptor {

    override fun <ReqT : Any?, RespT : Any?> interceptCall(
        call: ServerCall<ReqT, RespT>,
        headers: Metadata,
        next: ServerCallHandler<ReqT, RespT>
    ): ServerCall.Listener<ReqT> {
        val listener = next.startCall(call, headers)
        return ValidationServerCallListener(listener, validator)
    }

    private class ValidationServerCallListener<ReqT>(
        delegate: ServerCall.Listener<ReqT>,
        private val validator: Validator
    ) : ForwardingServerCallListener.SimpleForwardingServerCallListener<ReqT>(delegate) {

        override fun onMessage(message: ReqT) {
            if (message is Message && message.javaClass.packageName == APPLICATION_PROTO_PACKAGE) {
                validate(message)
            }
            super.onMessage(message)
        }

        private fun validate(message: Message) {
            try {
                val result: ValidationResult = validator.validate(message)
                if (!result.isSuccess) {
                    throw GrpcValidationException(result.violations.map { GrpcViolation.from(it) })
                }
            } catch (ex: ValidationException) {
                throw IllegalStateException("Failed to validate gRPC request", ex)
            }
        }
    }

    companion object {
        private const val APPLICATION_PROTO_PACKAGE = "io.github.susimsek.springgrpcsamples.proto"
    }
}
```

:::

- `src/main/java/io/github/susimsek/springgrpcsamples/exception/GlobalGrpcExceptionHandler.java`
  Converts validation, authentication, authorization, and unexpected failures into structured gRPC status responses.

:::tabs
@tab Java [icon=java]

```java filename="GlobalGrpcExceptionHandler.java"
package io.github.susimsek.springgrpcsamples.exception;

import build.buf.validate.FieldPathElement;
import build.buf.validate.Violation;
import com.google.protobuf.Any;
import com.google.rpc.BadRequest;
import io.grpc.Status;
import io.grpc.StatusException;
import io.grpc.protobuf.StatusProto;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.grpc.server.advice.GrpcAdvice;
import org.springframework.grpc.server.advice.GrpcExceptionHandler;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.util.StringUtils;

@GrpcAdvice
@RequiredArgsConstructor
@Slf4j
public class GlobalGrpcExceptionHandler {

    private final MessageSource messageSource;

    @GrpcExceptionHandler(GrpcApiException.class)
    public StatusException handleGrpcApiException(GrpcApiException exception) {
        return Status.fromCode(exception.getStatusCode())
                .withDescription(resolveMessage(exception))
                .asException();
    }

    @GrpcExceptionHandler(GrpcValidationException.class)
    public StatusException handleGrpcValidationException(GrpcValidationException exception) {
        BadRequest.Builder badRequest = BadRequest.newBuilder();
        exception.getViolations().stream()
                .map(this::toFieldViolation)
                .forEach(badRequest::addFieldViolations);

        com.google.rpc.Status status =
                com.google.rpc.Status.newBuilder()
                        .setCode(com.google.rpc.Code.INVALID_ARGUMENT_VALUE)
                        .setMessage(
                                resolveMessage(
                                        "grpc.validation.failed",
                                        "One or more validation errors occurred."))
                        .addDetails(Any.pack(badRequest.build()))
                        .build();

        return StatusProto.toStatusException(status);
    }

    @GrpcExceptionHandler(InvalidBearerTokenException.class)
    public StatusException handleInvalidBearerTokenException(
            InvalidBearerTokenException exception) {
        return Status.UNAUTHENTICATED
                .withDescription(
                        resolveMessage("grpc.auth.invalidToken", "Invalid or expired token."))
                .asException();
    }

    @GrpcExceptionHandler(AuthenticationException.class)
    public StatusException handleAuthenticationException(AuthenticationException exception) {
        return Status.UNAUTHENTICATED
                .withDescription(
                        resolveMessage("grpc.auth.unauthenticated", "Authentication failed."))
                .asException();
    }

    @GrpcExceptionHandler(AccessDeniedException.class)
    public StatusException handleAccessDeniedException(AccessDeniedException exception) {
        return Status.PERMISSION_DENIED
                .withDescription(resolveMessage("grpc.auth.accessDenied", "Access denied."))
                .asException();
    }

    @GrpcExceptionHandler(Exception.class)
    public StatusException handleException(Exception exception) {
        log.error("Unhandled gRPC exception", exception);
        return Status.INTERNAL
                .withDescription(
                        resolveMessage(
                                "grpc.internal",
                                "An unexpected error occurred. Please try again later."))
                .asException();
    }

    private String resolveMessage(GrpcApiException exception) {
        return resolveMessage(
                exception.getMessageCode(),
                exception.getMessage(),
                exception.getMessageArguments());
    }

    private String resolveMessage(
            String messageCode, String defaultMessage, Object... messageArguments) {
        Locale locale = LocaleContextHolder.getLocale();
        return messageSource.getMessage(messageCode, messageArguments, defaultMessage, locale);
    }

    private BadRequest.FieldViolation toFieldViolation(GrpcViolation validationViolation) {
        Violation violation = validationViolation.violation();
        return BadRequest.FieldViolation.newBuilder()
                .setField(resolveField(violation))
                .setDescription(resolveValidationMessage(validationViolation))
                .build();
    }

    private String resolveValidationMessage(GrpcViolation validationViolation) {
        Violation violation = validationViolation.violation();
        String defaultMessage = violation.hasMessage() ? violation.getMessage() : "invalid value";
        return resolveMessage(
                validationViolation.messageCode(),
                defaultMessage,
                validationViolation.messageArguments());
    }

    private static String resolveField(Violation violation) {
        if (!violation.hasField() || violation.getField().getElementsCount() == 0) {
            return resolveMessageLevelField();
        }
        return violation.getField().getElementsList().stream()
                .map(GlobalGrpcExceptionHandler::resolveFieldElement)
                .filter(StringUtils::hasText)
                .reduce((left, right) -> left + "." + right)
                .orElseGet(GlobalGrpcExceptionHandler::resolveMessageLevelField);
    }

    private static String resolveFieldElement(FieldPathElement element) {
        if (element.hasFieldName()) {
            return element.getFieldName();
        }
        if (element.hasFieldNumber()) {
            return String.valueOf(element.getFieldNumber());
        }
        return "";
    }

    private static String resolveMessageLevelField() {
        return "request";
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="GlobalGrpcExceptionHandler.kt"
package io.github.susimsek.springgrpcsamples.exception

import build.buf.validate.FieldPathElement
import build.buf.validate.Violation
import com.google.protobuf.Any
import com.google.rpc.BadRequest
import io.grpc.Status
import io.grpc.StatusException
import io.grpc.protobuf.StatusProto
import org.slf4j.LoggerFactory
import org.springframework.context.MessageSource
import org.springframework.context.i18n.LocaleContextHolder
import org.springframework.grpc.server.advice.GrpcAdvice
import org.springframework.grpc.server.advice.GrpcExceptionHandler
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.core.AuthenticationException
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException
import org.springframework.util.StringUtils

@GrpcAdvice
class GlobalGrpcExceptionHandler(
    private val messageSource: MessageSource
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @GrpcExceptionHandler(GrpcApiException::class)
    fun handleGrpcApiException(exception: GrpcApiException): StatusException =
        Status.fromCode(exception.statusCode).withDescription(resolveMessage(exception)).asException()

    @GrpcExceptionHandler(GrpcValidationException::class)
    fun handleGrpcValidationException(exception: GrpcValidationException): StatusException {
        val badRequest = BadRequest.newBuilder()
        exception.violations.map(::toFieldViolation).forEach(badRequest::addFieldViolations)
        val status = com.google.rpc.Status.newBuilder()
            .setCode(com.google.rpc.Code.INVALID_ARGUMENT_VALUE)
            .setMessage(resolveMessage("grpc.validation.failed", "One or more validation errors occurred."))
            .addDetails(Any.pack(badRequest.build()))
            .build()
        return StatusProto.toStatusException(status)
    }

    @GrpcExceptionHandler(InvalidBearerTokenException::class)
    fun handleInvalidBearerTokenException(exception: InvalidBearerTokenException): StatusException =
        Status.UNAUTHENTICATED.withDescription(resolveMessage("grpc.auth.invalidToken", "Invalid or expired token.")).asException()

    @GrpcExceptionHandler(AuthenticationException::class)
    fun handleAuthenticationException(exception: AuthenticationException): StatusException =
        Status.UNAUTHENTICATED.withDescription(resolveMessage("grpc.auth.unauthenticated", "Authentication failed.")).asException()

    @GrpcExceptionHandler(AccessDeniedException::class)
    fun handleAccessDeniedException(exception: AccessDeniedException): StatusException =
        Status.PERMISSION_DENIED.withDescription(resolveMessage("grpc.auth.accessDenied", "Access denied.")).asException()

    @GrpcExceptionHandler(Exception::class)
    fun handleException(exception: Exception): StatusException {
        log.error("Unhandled gRPC exception", exception)
        return Status.INTERNAL.withDescription(resolveMessage("grpc.internal", "An unexpected error occurred. Please try again later.")).asException()
    }

    private fun resolveMessage(exception: GrpcApiException): String =
        resolveMessage(exception.messageCode, exception.message ?: "", *exception.messageArguments)

    private fun resolveMessage(messageCode: String, defaultMessage: String, vararg args: Any?): String =
        messageSource.getMessage(messageCode, args, defaultMessage, LocaleContextHolder.getLocale())

    private fun toFieldViolation(validationViolation: GrpcViolation): BadRequest.FieldViolation =
        BadRequest.FieldViolation.newBuilder()
            .setField(resolveField(validationViolation.violation()))
            .setDescription(resolveValidationMessage(validationViolation))
            .build()

    private fun resolveValidationMessage(validationViolation: GrpcViolation): String {
        val violation = validationViolation.violation()
        val defaultMessage = if (violation.hasMessage()) violation.message else "invalid value"
        return resolveMessage(validationViolation.messageCode(), defaultMessage, *validationViolation.messageArguments())
    }

    private fun resolveField(violation: Violation): String {
        if (!violation.hasField() || violation.field.elementsCount == 0) return "request"
        return violation.field.elementsList.map(::resolveFieldElement).filter(StringUtils::hasText).reduceOrNull { left, right -> "$left.$right" } ?: "request"
    }

    private fun resolveFieldElement(element: FieldPathElement): String =
        when {
            element.hasFieldName() -> element.fieldName
            element.hasFieldNumber() -> element.fieldNumber.toString()
            else -> ""
        }
}
```

:::

This design keeps service methods free from repetitive guard clauses and manual exception mapping. The protobuf contract, interceptor layer, and advice layer work together.

- `src/main/java/io/github/susimsek/springgrpcsamples/exception/GrpcApiException.java`
  Defines the base contract for application-level gRPC exceptions with a status code and message metadata.

:::tabs
@tab Java [icon=java]

```java filename="GrpcApiException.java"
package io.github.susimsek.springgrpcsamples.exception;

import io.grpc.Status;
import lombok.Getter;

@Getter
public abstract class GrpcApiException extends RuntimeException {

    private final Status.Code statusCode;
    private final String messageCode;
    private final Object[] messageArguments;

    protected GrpcApiException(
            Status.Code statusCode,
            String messageCode,
            String defaultMessage,
            Object... messageArguments) {
        super(defaultMessage);
        this.statusCode = statusCode;
        this.messageCode = messageCode;
        this.messageArguments = messageArguments;
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="GrpcApiException.kt"
package io.github.susimsek.springgrpcsamples.exception

import io.grpc.Status

abstract class GrpcApiException(
    val statusCode: Status.Code,
    val messageCode: String,
    defaultMessage: String,
    vararg val messageArguments: Any?
) : RuntimeException(defaultMessage)
```

:::

- `src/main/java/io/github/susimsek/springgrpcsamples/exception/GrpcValidationException.java`
  Wraps all Protovalidate violations into a single runtime exception handled by the global advice.

:::tabs
@tab Java [icon=java]

```java filename="GrpcValidationException.java"
package io.github.susimsek.springgrpcsamples.exception;

import java.util.List;
import lombok.Getter;

@Getter
public class GrpcValidationException extends RuntimeException {

    private final List<GrpcViolation> violations;

    public GrpcValidationException(List<GrpcViolation> violations) {
        super("gRPC request validation failed");
        this.violations = List.copyOf(violations);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="GrpcValidationException.kt"
package io.github.susimsek.springgrpcsamples.exception

class GrpcValidationException(
    val violations: List<GrpcViolation>
) : RuntimeException("gRPC request validation failed")
```

:::

- `src/main/java/io/github/susimsek/springgrpcsamples/exception/GrpcViolation.java`
  Normalizes Protovalidate violations into i18n-friendly message codes and arguments.

:::tabs
@tab Java [icon=java]

```java filename="GrpcViolation.java"
package io.github.susimsek.springgrpcsamples.exception;

import build.buf.validate.Violation;
import java.util.Arrays;

public record GrpcViolation(Violation violation, String messageCode, Object[] messageArguments) {

    private static final String CUSTOM_RULE_ID_PREFIX = "grpc.";
    private static final String STANDARD_RULE_MESSAGE_CODE_PREFIX = "grpc.validation.constraints.";
    private static final String UNKNOWN_MESSAGE_CODE = "grpc.validation.unknown";

    public static GrpcViolation from(build.buf.protovalidate.Violation violation) {
        Violation proto = violation.toProto();
        Object[] args =
                isStandardRule(proto)
                        ? new Object[] {violation.getRuleValue().getValue()}
                        : new Object[0];
        return new GrpcViolation(proto, resolveMessageCode(proto), args);
    }

    private static boolean isStandardRule(Violation violation) {
        return violation.hasRuleId() && !violation.getRuleId().startsWith(CUSTOM_RULE_ID_PREFIX);
    }

    private static String resolveMessageCode(Violation violation) {
        if (!violation.hasRuleId()) {
            return UNKNOWN_MESSAGE_CODE;
        }
        String ruleId = violation.getRuleId();
        boolean standardRule = !ruleId.startsWith(CUSTOM_RULE_ID_PREFIX);
        return standardRule ? STANDARD_RULE_MESSAGE_CODE_PREFIX + ruleId : ruleId;
    }

    @Override
    public Object[] messageArguments() {
        return messageArguments;
    }

    @Override
    public boolean equals(Object object) {
        if (object == this) {
            return true;
        }
        return object
                        instanceof
                        GrpcViolation(Violation violation1, String code, Object[] arguments)
                && violation.equals(violation1)
                && messageCode.equals(code)
                && Arrays.equals(messageArguments, arguments);
    }

    @Override
    public int hashCode() {
        int result = violation.hashCode();
        result = 31 * result + messageCode.hashCode();
        result = 31 * result + Arrays.hashCode(messageArguments);
        return result;
    }

    @Override
    public String toString() {
        return "GrpcViolation[violation="
                + violation
                + ", messageCode="
                + messageCode
                + ", messageArguments="
                + Arrays.toString(messageArguments)
                + "]";
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="GrpcViolation.kt"
package io.github.susimsek.springgrpcsamples.exception

import build.buf.validate.Violation

data class GrpcViolation(
    val violation: Violation,
    val messageCode: String,
    private val args: Array<out Any?>
) {
    fun messageArguments(): Array<out Any?> = args

    companion object {
        private const val CUSTOM_RULE_ID_PREFIX = "grpc."
        private const val STANDARD_RULE_MESSAGE_CODE_PREFIX = "grpc.validation.constraints."
        private const val UNKNOWN_MESSAGE_CODE = "grpc.validation.unknown"

        fun from(violation: build.buf.protovalidate.Violation): GrpcViolation {
            val proto = violation.toProto()
            val arguments =
                if (isStandardRule(proto)) arrayOf(violation.ruleValue.value) else emptyArray()
            return GrpcViolation(proto, resolveMessageCode(proto), arguments)
        }

        private fun isStandardRule(violation: Violation): Boolean =
            violation.hasRuleId() && !violation.ruleId.startsWith(CUSTOM_RULE_ID_PREFIX)

        private fun resolveMessageCode(violation: Violation): String {
            if (!violation.hasRuleId()) {
                return UNKNOWN_MESSAGE_CODE
            }
            val ruleId = violation.ruleId
            val standardRule = !ruleId.startsWith(CUSTOM_RULE_ID_PREFIX)
            return if (standardRule) STANDARD_RULE_MESSAGE_CODE_PREFIX + ruleId else ruleId
        }
    }
}
```

:::

- `src/main/java/io/github/susimsek/springgrpcsamples/exception/InvalidCredentialsException.java`
  Represents failed login attempts as a gRPC `UNAUTHENTICATED` application exception.

:::tabs
@tab Java [icon=java]

```java filename="InvalidCredentialsException.java"
package io.github.susimsek.springgrpcsamples.exception;

import io.grpc.Status;

public class InvalidCredentialsException extends GrpcApiException {

    public InvalidCredentialsException() {
        super(
                Status.Code.UNAUTHENTICATED,
                "grpc.auth.invalidCredentials",
                "invalid username or password");
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="InvalidCredentialsException.kt"
package io.github.susimsek.springgrpcsamples.exception

import io.grpc.Status

class InvalidCredentialsException : GrpcApiException(
    Status.Code.UNAUTHENTICATED,
    "grpc.auth.invalidCredentials",
    "invalid username or password"
)
```

:::

- `src/main/java/io/github/susimsek/springgrpcsamples/exception/TodoNotFoundException.java`
  Exposes missing records as a gRPC `NOT_FOUND` failure with the missing Todo ID.

:::tabs
@tab Java [icon=java]

```java filename="TodoNotFoundException.java"
package io.github.susimsek.springgrpcsamples.exception;

import io.grpc.Status;

public class TodoNotFoundException extends GrpcApiException {

    public TodoNotFoundException(Long id) {
        super(
                Status.Code.NOT_FOUND,
                "grpc.todo.notFound",
                "todo not found with id: " + id,
                id.toString());
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="TodoNotFoundException.kt"
package io.github.susimsek.springgrpcsamples.exception

import io.grpc.Status

class TodoNotFoundException(id: Long) : GrpcApiException(
    Status.Code.NOT_FOUND,
    "grpc.todo.notFound",
    "todo not found with id: $id",
    id.toString()
)
```

:::

- `src/main/java/io/github/susimsek/springgrpcsamples/config/aot/NativeRuntimeHints.java`
  Registers i18n resources, protobuf request classes, and exception handler reflection hints for native builds.

:::tabs
@tab Java [icon=java]

```java filename="NativeRuntimeHints.java"
package io.github.susimsek.springgrpcsamples.config.aot;

import io.github.susimsek.springgrpcsamples.exception.GlobalGrpcExceptionHandler;
import java.io.IOException;
import java.util.List;
import java.util.stream.Stream;
import org.springframework.aot.hint.MemberCategory;
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;
import org.springframework.aot.hint.TypeReference;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.type.classreading.MetadataReader;
import org.springframework.core.type.classreading.SimpleMetadataReaderFactory;

public class NativeRuntimeHints implements RuntimeHintsRegistrar {

    private static final String APPLICATION_PROTO_REQUEST_PATTERN =
            "classpath*:io/github/susimsek/springgrpcsamples/proto/*Request.class";

    @Override
    public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
        hints.resources().registerPattern("i18n/**");
        hints.reflection()
                .registerTypes(
                        findApplicationProtoRequestTypes(classLoader).stream()
                                .flatMap(
                                        typeName ->
                                                Stream.of(
                                                        TypeReference.of(typeName),
                                                        TypeReference.of(typeName + "$Builder")))
                                .toList(),
                        builder -> builder.withMembers(MemberCategory.INVOKE_PUBLIC_METHODS));
        hints.reflection()
                .registerType(
                        GlobalGrpcExceptionHandler.class, MemberCategory.INVOKE_PUBLIC_METHODS);
    }

    private static List<String> findApplicationProtoRequestTypes(ClassLoader classLoader) {
        PathMatchingResourcePatternResolver resolver =
                new PathMatchingResourcePatternResolver(classLoader);
        SimpleMetadataReaderFactory metadataReaderFactory =
                new SimpleMetadataReaderFactory(classLoader);
        try {
            return Stream.of(resolver.getResources(APPLICATION_PROTO_REQUEST_PATTERN))
                    .filter(Resource::isReadable)
                    .map(resource -> className(resource, metadataReaderFactory))
                    .sorted()
                    .toList();
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to scan application proto request types", ex);
        }
    }

    private static String className(
            Resource resource, SimpleMetadataReaderFactory metadataReaderFactory) {
        try {
            MetadataReader metadataReader = metadataReaderFactory.getMetadataReader(resource);
            return metadataReader.getClassMetadata().getClassName();
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to read proto request metadata", ex);
        }
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="NativeRuntimeHints.kt"
package io.github.susimsek.springgrpcsamples.config.aot

import io.github.susimsek.springgrpcsamples.exception.GlobalGrpcExceptionHandler
import org.springframework.aot.hint.MemberCategory
import org.springframework.aot.hint.RuntimeHints
import org.springframework.aot.hint.RuntimeHintsRegistrar
import org.springframework.aot.hint.TypeReference
import org.springframework.core.io.Resource
import org.springframework.core.io.support.PathMatchingResourcePatternResolver
import org.springframework.core.type.classreading.MetadataReader
import org.springframework.core.type.classreading.SimpleMetadataReaderFactory
import java.io.IOException

class NativeRuntimeHints : RuntimeHintsRegistrar {

    override fun registerHints(hints: RuntimeHints, classLoader: ClassLoader) {
        hints.resources().registerPattern("i18n/**")
        hints.reflection().registerTypes(
            findApplicationProtoRequestTypes(classLoader).flatMap { typeName ->
                listOf(TypeReference.of(typeName), TypeReference.of("${typeName}\$Builder"))
            }
        ) { builder ->
            builder.withMembers(MemberCategory.INVOKE_PUBLIC_METHODS)
        }
        hints.reflection().registerType(
            GlobalGrpcExceptionHandler::class.java,
            MemberCategory.INVOKE_PUBLIC_METHODS
        )
    }

    private fun findApplicationProtoRequestTypes(classLoader: ClassLoader): List<String> {
        val resolver = PathMatchingResourcePatternResolver(classLoader)
        val metadataReaderFactory = SimpleMetadataReaderFactory(classLoader)
        try {
            return resolver.getResources(APPLICATION_PROTO_REQUEST_PATTERN)
                .asSequence()
                .filter(Resource::isReadable)
                .map { resource -> className(resource, metadataReaderFactory) }
                .sorted()
                .toList()
        } catch (ex: IOException) {
            throw IllegalStateException("Failed to scan application proto request types", ex)
        }
    }

    private fun className(
        resource: Resource,
        metadataReaderFactory: SimpleMetadataReaderFactory
    ): String =
        try {
            val metadataReader: MetadataReader = metadataReaderFactory.getMetadataReader(resource)
            metadataReader.classMetadata.className
        } catch (ex: IOException) {
            throw IllegalStateException("Failed to read proto request metadata", ex)
        }

    companion object {
        private const val APPLICATION_PROTO_REQUEST_PATTERN =
            "classpath*:io/github/susimsek/springgrpcsamples/proto/*Request.class"
    }
}
```

:::

---

## ▶️ Run the App

Use the repository’s documented local flow to start the server locally.

```bash
./mvnw spring-boot:run

grpcurl -plaintext localhost:9090 list

TOKEN=$(grpcurl -plaintext \
  -d '{"username":"admin","password":"admin"}' \
  localhost:9090 \
  AuthService/Login | jq -r '.access_token')

grpcurl -plaintext \
  -rpc-header "authorization: Bearer ${TOKEN}" \
  -d '{"pageRequest":{"page":0,"size":5}}' \
  localhost:9090 \
  TodoService/ListTodos
```

Expected behavior:

- `grpcurl ... list` should show `AuthService`, `TodoService`, `grpc.health.v1.Health`, and reflection support.
- `AuthService/Login` should return `access_token`, `token_type`, and `expires_in`.
- `TodoService/ListTodos` should work only with a valid bearer token that has the expected authority.
- Invalid payloads should return `InvalidArgument` with structured field violations.

Spring also supports in-process test transport for gRPC. The sample README notes the use of `@AutoConfigureTestGrpcTransport` and explicit client stub registration with `@ImportGrpcClients`, which is the right direction for deterministic integration tests.

---

## 🧪 Test gRPC Endpoints

This sample is easiest to verify with `grpcurl`. Use the seeded `admin` account for the full Todo flow and the `user` account to confirm authorization failures.

### Admin Flow

Login as `admin` and capture the JWT token:

```bash
grpcurl -plaintext \
  -d '{"username":"admin","password":"admin"}' \
  localhost:9090 \
  AuthService/Login
```

Expected response:

```json filename="config.json"
{
  "accessToken": "<jwt-token>",
  "tokenType": "Bearer",
  "expiresIn": "3600"
}
```

Use that token to list Todos:

```bash
grpcurl -plaintext \
  -rpc-header "authorization: Bearer <jwt-token>" \
  -d '{"pageRequest":{"page":0,"size":5}}' \
  localhost:9090 \
  TodoService/ListTodos
```

Create a Todo:

```bash
grpcurl -plaintext \
  -rpc-header "authorization: Bearer <jwt-token>" \
  -d '{"title":"Write article examples"}' \
  localhost:9090 \
  TodoService/CreateTodo
```

Patch an existing Todo:

```bash
grpcurl -plaintext \
  -rpc-header "authorization: Bearer <jwt-token>" \
  -d '{"id":1,"completed":true}' \
  localhost:9090 \
  TodoService/PatchTodo
```

Delete a Todo:

```bash
grpcurl -plaintext \
  -rpc-header "authorization: Bearer <jwt-token>" \
  -d '{"id":1}' \
  localhost:9090 \
  TodoService/DeleteTodo
```

### User Flow

Login as the lower-privileged `user` account:

```bash
grpcurl -plaintext \
  -d '{"username":"user","password":"user"}' \
  localhost:9090 \
  AuthService/Login
```

Then try to call an admin-protected RPC:

```bash
grpcurl -plaintext \
  -rpc-header "authorization: Bearer <jwt-token>" \
  -d '{"pageRequest":{"page":0,"size":5}}' \
  localhost:9090 \
  TodoService/ListTodos
```

Expected behavior:

- `admin` can call every `TodoService/*` RPC successfully.
- `user` receives `PermissionDenied` because the service requires `ROLE_ADMIN`.
- Invalid credentials return `Unauthenticated`.

### Validation and i18n Check

Send an invalid payload to verify Protovalidate and localized error handling:

```bash
grpcurl -plaintext \
  -rpc-header "authorization: Bearer <jwt-token>" \
  -rpc-header "accept-language: tr" \
  -d '{"title":""}' \
  localhost:9090 \
  TodoService/CreateTodo
```

Expected behavior:

- The RPC fails with `InvalidArgument`.
- The response details contain structured field violations.
- Validation messages are resolved from `messages_tr.properties` when `accept-language: tr` is present.

---

## 🏁 Conclusion

This setup delivers a robust, production-ready gRPC API by combining Spring Boot, protobuf-first contracts, JPA-backed persistence, Spring Security, interceptor-based validation, and centralized exception mapping in one coherent server design. As a practical next step for production hardening, move the sample’s local JWT defaults and profile-specific database settings into environment-specific secure configuration and add regression tests around the most critical RPC contracts.
