---
title: 'Spring Boot GraphQL JWE Authentication'
date: '2025-05-17'
summary: 'Learn how to secure your Spring Boot GraphQL APIs with stateless encrypted JWTs (JWE) while persisting user identities and roles in a JPA-backed database.'
thumbnail: '/images/spring-boot-graphql-jwe-auth-thumbnail.webp'
readingTime: '5 min read'
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
  - id: 'security'
    name: 'Security'
    color: 'blue'
  - id: 'jwt'
    name: 'JWT'
    color: 'pink'
  - id: 'jwe'
    name: 'JWE'
  - id: 'graphql'
    name: 'GraphQL'
    color: 'pink'
  - id: 'programming'
    name: 'Programming'
    color: 'brown'
---

Spring Boot GraphQL JWE Authentication combines the flexibility of GraphQL with stateless encrypted JWTs (JWE) and a JPA-backed user store to deliver a secure, scalable API.

---

## 🌟 Why Use GraphQL + JWE Authentication?

- Stateless Security: Tokens are self-contained and require no server-side storage.
- GraphQL Flexibility: Secure any query or mutation uniformly.
- Data Precision: Fetch exactly what clients request.
- Integrity: Signed tokens ensure tamper evidence.
- Confidentiality: Encrypted JWTs hide sensitive claims.
- Standards-based: Leverage JOSE, Spring Security, and GraphQL.
- Scalable: Scale horizontally without session replication or sticky sessions.

---

## 📋 Prerequisites

- ☕ Java Development Kit (JDK) 17 or higher
- 📦 Spring Boot 3.2+
- 🔤 IDE (IntelliJ IDEA, Eclipse)
- 🛢️ PostgreSQL (or H2 for dev)

---

## 🛠️ Step 1: Add Dependencies

Include these in your `pom.xml` or `build.gradle` file.

Maven:

```xml
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-oauth2-resource-server</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-graphql</artifactId>
  </dependency>
  <dependency>
    <groupId>com.graphql-java</groupId>
    <artifactId>graphql-java-extended-scalars</artifactId>
    <version>22.0</version>
  </dependency>
  <dependency>
    <groupId>org.liquibase</groupId>
    <artifactId>liquibase-core</artifactId>
  </dependency>
  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
  </dependency>
  <dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>runtime</scope>
  </dependency>
</dependencies>

<build>
<plugins>
  <plugin>
    <groupId>org.hibernate.orm.tooling</groupId>
    <artifactId>hibernate-enhance-maven-plugin</artifactId>
    <version>${hibernate.version}</version>
    <executions>
      <execution>
        <id>enhance</id>
        <goals>
          <goal>enhance</goal>
        </goals>
        <configuration>
          <enableLazyInitialization>true</enableLazyInitialization>
          <enableDirtyTracking>true</enableDirtyTracking>
          <enableAssociationManagement>true</enableAssociationManagement>
        </configuration>
      </execution>
    </executions>
  </plugin>
  <plugin>
    <groupId>org.graalvm.buildtools</groupId>
    <artifactId>native-maven-plugin</artifactId>
  </plugin>
</plugins>
</build>
```

Gradle:

```groovy
dependencies {
  implementation 'org.springframework.boot:spring-boot-starter-web'
  implementation 'org.springframework.boot:spring-boot-starter-websocket'
  implementation 'org.springframework.security:spring-security-oauth2-resource-server'
  implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
  implementation 'org.springframework.boot:spring-boot-starter-graphql'
  implementation 'com.graphql-java:graphql-java-extended-scalars:22.0'
  implementation 'org.liquibase:liquibase-core'
  compileOnly 'org.projectlombok:lombok'
  runtimeOnly 'com.h2database:h2'
}

plugins {
  id 'org.hibernate.orm' version '6.6.13.Final'
  id 'org.graalvm.buildtools.native' version '0.10.6'
}

hibernate {
  enhancement {
    enableAssociationManagement = true
  }
}
```

---

## 🛠️ Step 2: Configuration Files

In this section, we define all of the application- and database-level configuration files required to wire up our Spring Boot app with H2/PostgreSQL, JPA, Liquibase changelogs, initial data loads, JWE key properties and GraphQL schema definitions, and GraalVM native-image reflection config.

- `application.yml`
  Holds Spring datasource, H2 console, JPA/Hibernate settings, Liquibase changelog path, GraphQL subscriptions path, and all JWT/JWE keys, issuer, and expiration configurations.

- `liquibase/master.xml`
  The Liquibase master changelog, with includes and DBMS-specific properties for H2 and PostgreSQL.

- `liquibase/changelog/changelog-user.xml`
  Your core schema changelog defining `user_identity`, `authority`, and `user_authority_mapping` tables, indexes, FKs, and initial `<loadData>` steps.

- `liquibase/data/user.csv`
  Initial user records (UUID, username, bcrypt-hashed password, email, enabled flag, timestamps, auditor).

- `liquibase/data/authority.csv`
  Initial authority records (UUID, name, description, timestamps, auditor).

- `liquibase/data/user_authority_mapping.csv`
  Initial mapping of users ↔ authorities (composite PK, timestamps, auditor).

- `graphql/schema.graphqls`
  GraphQL schema definitions for the API, including custom scalars, query, subscription and mutation types, and DTO definitions.

- `META-INF/native-image/liquibase/reflect-config.json`
  Native-image reflection configuration for Liquibase classes to ensure compatibility when building a GraalVM native image.

<span style="display:block; height:1rem;"></span>

### application.yml

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
    driver-class-name: org.h2.Driver
    username: sa
    password: password
  h2:
    console:
      enabled: true
  jpa:
    open-in-view: false
    hibernate:
      ddl-auto: none
    show-sql: true
    properties:
      hibernate.format_sql: true
  liquibase:
    change-log: classpath:liquibase/master.xml
  graphql:
    websocket:
      path: /subscriptions
    graphiql:
      enabled: true
security:
  admin:
    username: admin
    password: adminpass
  user:
    username: user
    password: userpass
  jwt:
    issuer: demo-issuer
    expiration-duration: 3600s
    signing:
      key-id: signing-key
      public-key: |-
        -----BEGIN PUBLIC KEY-----
        MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAjZEcz5itWkDGOSqZdB5P
        JE0ccOCckskp0hN3kQbT1qnv+9/k66jlWgVi4HSTppwdNF/Ylu5u541Qj+Okyg+u
        8o2PvKo5CfgvTDsFLTrZHUXU6hCSGatLAQoeN6lT8wzov2r4DFecXrIqcO6SvMB5
        ecPqsfiTi4trsNKgJ4cWS6gILH62ISd1ipUadfpnUzDMO1OulV0CJNV6bcBk7Es9
        RW6AHfg9j8osSanpwvRM4MJkB0SRxYUnrN9faGpkBZISZJ8TShhaTHEGfSNgKe5y
        8iu+AMGGZu8DYczVmqS3Ske1fq6y5HEGCma7Mo019GmwKeHBo1obuET6cZRygj4y
        twIDAQAB
        -----END PUBLIC KEY-----
      private-key: |-
        -----BEGIN PRIVATE KEY-----
        MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCNkRzPmK1aQMY5
        Kpl0Hk8kTRxw4JySySnSE3eRBtPWqe/73+TrqOVaBWLgdJOmnB00X9iW7m7njVCP
        46TKD67yjY+8qjkJ+C9MOwUtOtkdRdTqEJIZq0sBCh43qVPzDOi/avgMV5xesipw
        7pK8wHl5w+qx+JOLi2uw0qAnhxZLqAgsfrYhJ3WKlRp1+mdTMMw7U66VXQIk1Xpt
        wGTsSz1FboAd+D2PyixJqenC9EzgwmQHRJHFhSes319oamQFkhJknxNKGFpMcQZ9
        I2Ap7nLyK74AwYZm7wNhzNWapLdKR7V+rrLkcQYKZrsyjTX0abAp4cGjWhu4RPpx
        lHKCPjK3AgMBAAECggEABMo/sNCIMREXA/EqjxDFecN4LmOTOK5A0YBiH9Cc01sd
        qSaavtSQqhqbjV+0bUNEA7UohXbc3s3bx3qa5VFhiIh8sBQMaQdyRkCK/MxMc16d
        BSx5XQ/8MjVO73A1zHgH2g47BWPjgRrDL94KrgNPOO0FoG76QxL9GlcOHzhFa1rf
        xbb2auLBtflKy+5TZNnB/sbFC9ISpWywzfblD2Fsvxupl0vNWtA0Y2rPbKMZRnY+
        V6NC38yxW3HHAdWQRYLGOitM59I0HBgnjQKzTBNIsjPnJA2BSZvMBtQ1e3RQV0qE
        8VVoktZ8A0KDUxqdKWYlGYAY5hIw1y3UUsPRUbS3fQKBgQDAZehu+Kb5Sw+h00Qu
        vViNHDvi0PwmhQrHVpgjrppCnWsTk6FJFm+EBLY+87usXuRCnfZ1semb6P+yjLh2
        bJ9IXIrFAztcyE+7eZfn0H7mHA7E2ICKTjNdKbjy8kHViHpgdXREnAOrFTTk/BqW
        dq+weG2OuxYczWsY4XliWaVyiwKBgQC8XYExpSmoyI37o+jr9405k30tbGUw4X+/
        xYOvSUuafI8IOSLfKTpsvkMN3hxpJO6apIRAjOALbotKUA5FrHQPenuBWOr3mBJT
        euLiaWphqU8YN5dbNd+JhC/Jh5DLhY5FpB2Fv2MKSoF7+onpjDy9pEU5aReeBB0v
        ekUw4nWiBQKBgHxyrnjxP1frFG5xMB4nfZqw04+v7BmiXsl3mqsh6kgCeNtN17pl
        17YGMjfgAdnJ+02XzW5tqRSfDp3YZgy7z//HVD+BCqnGK8SxLu/ULfD73xW2kNZl
        JNYzAZ2r06eiQr4X2x/x5nGIIxGmfDAtDxFPpFX5b6ErwgVy+sgCAoFnAoGAWSpu
        EMEdQk+FnnwNsz2g9YNSuyDXmdb08SOfXWd1yXBzCLJ7RmYuyPEbrsHYcxFPfZap
        ICFPoTm35/qTdvnWiskxE56yw3eSHUBLjF/YQtixn0YZeMy8v0z6jgyFR0I2gdLZ
        QsnBKUrxlm2XwR1oV2Eef7m2u085PZNEk4pvor0CgYA6n060r48/CgRVslAeGder
        fZ3n+2ru8q2UVB38evepjLifn5+tKdFzZ7/NckXMC0NOVzm74qG46VFLMw5TtyT4
        /hRvGSYxA6dMjXy+tcrAns9Isrz2PnYFntlbhU6hw0um809tFunbvITfyeOjAsDW
        stC4thnhzXXT1Y3RfFtYEg==
        -----END PRIVATE KEY-----
    encryption:
      key-id: encryption-key
      public-key: |-
        -----BEGIN PUBLIC KEY-----
        MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtU7Vu4tML8qg9BISaUH0
        BTU0+qkHJS3TUl3R0hEPttZJGf8EgT7bpWqRjdhMC2SYt2ifNF82EgMo/eva1rLn
        wYtCsxjJ7oB4U2m16/JKHtphmMUGhSLgbp+Y8pGAQ+P6u4HLlI0qbL92Syb6QCTr
        nYIlzZ2uUAvUQg/SbuAvdS4kdauZtpMNbhryusMVvILVBC5yUhfLJAkjbU3qWo/n
        2NKPr4kjwwFh6FaAf0HLsXCFmJbPPok6WMZeDqPORPZCt5gU2t04fS7s/2SSbhQ/
        i+7yyT4pl44cUlNLLN3Qo73sai5H90q7Dvmk3M5/YMJB0Ueyb705LHyOO5xA618s
        qQIDAQAB
        -----END PUBLIC KEY-----
      private-key: |-
        -----BEGIN PRIVATE KEY-----
        MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC1TtW7i0wvyqD0
        EhJpQfQFNTT6qQclLdNSXdHSEQ+21kkZ/wSBPtulapGN2EwLZJi3aJ80XzYSAyj9
        69rWsufBi0KzGMnugHhTabXr8koe2mGYxQaFIuBun5jykYBD4/q7gcuUjSpsv3ZL
        JvpAJOudgiXNna5QC9RCD9Ju4C91LiR1q5m2kw1uGvK6wxW8gtUELnJSF8skCSNt
        Tepaj+fY0o+viSPDAWHoVoB/QcuxcIWYls8+iTpYxl4Oo85E9kK3mBTa3Th9Luz/
        ZJJuFD+L7vLJPimXjhxSU0ss3dCjvexqLkf3SrsO+aTczn9gwkHRR7JvvTksfI47
        nEDrXyypAgMBAAECggEAREnJHrY8n9OGA+e6n4KD0mJT7gUz98Dm0yMbIC/k50yW
        hAAVRkjSmd8lq3NIURI2ov342NTznJ0sF1d6OVtxBujY2nP/uqEQsPoj1xaO7Ef8
        cnnjFsooFgJurQ44bVm02mLstqrky8jhWTT5FKfTRqP6cRNu0B9kdu1WqQQvW8a/
        C8xD8XUFzzJFQsEstJ076NjlZNH3EeqFiLxyVdV7tPEJRnOe2V2BAAgda3ByA6Jc
        Nd4xYHTVr5rZ+KES9gaAgb86+S7hNigsxz5Gp58NimLEyz1Qd+d9QCgPRgKOV5Uq
        0ci6c28ZrxW9wa/2CGCpoow1V7hRy1fZ24g2Tz91cQKBgQDbSdP/FQYuem0pUf8u
        mA/niEC8Jz30FW3ix5aqbQ8YRudK48Xy8F7AWnlS0wT2k/Xaeppn9YSPK4HlsNk2
        1gnpNfzdqXpJQtuxcPPeFNzUdXzBrsLXYqtlhOX/afrzqMhp73gkqoxXtqwD7BqN
        VfMcVXsWrEZQrRPBn/RUnnLdJwKBgQDTqUGupm93UlhoPgLXHGF/seQwPPHcU6lS
        SS9l512Ie21B+vZecgO4r77BXJwbY4rZVA5/m+wrsNmsT2f8yfdbs84cBDDWiKy5
        t2Um8zrus+BCIffxc9Fck9/htK33jLLcYwdSAm3a9pJxR9f/kAdredSTGBNJ3W/2
        rfh3cdNprwKBgDi7WfBFRSsjGzi0cPth9cNlubGzyVBrdtlT34PJ4Tzboxz53o1i
        aHEFNxwZYdBVKSbTzzyUBS5xCBMfdKK+LyQ5hmjmXq+zb1jxqvXKmfMRTixhhSDp
        8wO5pTM1/Omqwea+QGvj/5j1tnzxSVFFajbrWoPcH/jhPho6wqBducPDAoGBALOJ
        MEOavZXy7TaO0w3v7uvH0wzvxR/kfw1jMqc3l2j7ePOskmoOQAXaXO3bRjcdOlua
        Jyoq8islOZ4lRMlx7zWD0OKG035GNGzbmRtu2aA8R48RDSVr3jyu2gqznZULbXPv
        M/hmQxSmbhVUoW0PmJubnaqfk0zmXeBaNRXsIS3VAoGBALdsAtqR23PVeL6sYj2l
        dRNTDXpfvjFqJ5NThRO/4mT0CrPHQVj+Mz2bTc/Dxiwi8s8m3L+g23i3hodh/QMb
        Iz+UbcJZBGAKsFbPKGOtj6Bi07y/L11mcuNJzOWe61/JbVmJss0s+N/v3XucK/Ge
        CUaGOccsMO221v6JoBh9J3Hz
        -----END PRIVATE KEY-----
```

<span style="display:block; height:1rem;"></span>

### master.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
  xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="
      http://www.liquibase.org/xml/ns/dbchangelog
      http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.9.xsd">

  <!-- H2 defaults -->
  <property name="now" value="now()" dbms="h2"/>
  <property name="floatType" value="float4" dbms="h2"/>
  <property name="uuidType" value="uuid" dbms="h2"/>
  <property name="datetimeType" value="datetime(6)" dbms="h2"/>
  <property name="binaryType" value="LONGVARBINARY" dbms="h2"/>
  <property name="clobType" value="longvarchar" dbms="h2"/>
  <property name="blobType" value="blob" dbms="h2"/>

  <!-- PostgreSQL overrides -->
  <property name="now" value="current_timestamp" dbms="postgresql"/>
  <property name="floatType" value="float4" dbms="postgresql"/>
  <property name="uuidType" value="uuid" dbms="postgresql"/>
  <property name="datetimeType" value="datetime" dbms="postgresql"/>
  <property name="binaryType" value="BYTEA" dbms="postgresql"/>
  <property name="clobType" value="clob" dbms="postgresql"/>
  <property name="blobType" value="blob" dbms="postgresql"/>

  <!-- include the core auth changelog -->
  <include file="classpath:db/changelog/changelog-user.xml"/>

</databaseChangeLog>
```

<span style="display:block; height:1rem;"></span>

### changelog-user.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
  xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="
      http://www.liquibase.org/xml/ns/dbchangelog
      http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.9.xsd">

  <changeSet id="20250510-1" author="susimsek">
    <createTable tableName="user_identity">
      <column name="id" type="varchar(36)">
        <constraints primaryKey="true" primaryKeyName="pk_user_identity" nullable="false"/>
      </column>
      <column name="username" type="varchar(50)">
        <constraints nullable="false" unique="true"/>
      </column>
      <column name="password" type="varchar(100)">
        <constraints nullable="false"/>
      </column>
      <column name="email" type="varchar(100)">
        <constraints nullable="false" unique="true"/>
      </column>
      <column name="first_name" type="varchar(50)"/>
      <column name="last_name" type="varchar(50)"/>
      <column name="enabled" type="boolean">
        <constraints nullable="false"/>
      </column>
      <column name="created_at" type="datetime">
        <constraints nullable="false"/>
      </column>
      <column name="created_by" type="varchar(50)">
        <constraints nullable="false"/>
      </column>
      <column name="updated_at" type="datetime"/>
      <column name="updated_by" type="varchar(50)"/>
    </createTable>

    <createIndex indexName="idx_user_identity_username" tableName="user_identity">
      <column name="username"/>
    </createIndex>
    <createIndex indexName="idx_user_identity_email" tableName="user_identity">
      <column name="email"/>
    </createIndex>
  </changeSet>

  <changeSet id="20250510-2" author="susimsek">
    <createTable tableName="authority">
      <column name="id" type="varchar(36)">
        <constraints primaryKey="true" primaryKeyName="pk_authority" nullable="false"/>
      </column>
      <column name="name" type="varchar(50)">
        <constraints nullable="false" unique="true"/>
      </column>
      <column name="description" type="varchar(255)"/>
      <column name="created_at" type="datetime">
        <constraints nullable="false"/>
      </column>
      <column name="created_by" type="varchar(50)">
        <constraints nullable="false"/>
      </column>
      <column name="updated_at" type="datetime"/>
      <column name="updated_by" type="varchar(50)"/>
    </createTable>

    <createIndex indexName="idx_authority_name" tableName="authority">
      <column name="name"/>
    </createIndex>
  </changeSet>

  <changeSet id="20250510-3" author="susimsek">
    <createTable tableName="user_authority_mapping">
      <column name="user_id" type="varchar(36)">
        <constraints nullable="false"/>
      </column>
      <column name="authority_id" type="varchar(36)">
        <constraints nullable="false"/>
      </column>
      <column name="created_at" type="datetime">
        <constraints nullable="false"/>
      </column>
      <column name="created_by" type="varchar(50)">
        <constraints nullable="false"/>
      </column>
      <column name="updated_at" type="datetime"/>
      <column name="updated_by" type="varchar(50)"/>
    </createTable>

    <addPrimaryKey
      tableName="user_authority_mapping"
      columnNames="user_id, authority_id"
      constraintName="pk_user_authority_mapping"/>
  </changeSet>

  <changeSet id="20250510-4" author="susimsek">
    <addForeignKeyConstraint
      baseTableName="user_authority_mapping"
      baseColumnNames="user_id"
      constraintName="fk_user_authority_user"
      referencedTableName="user_identity"
      referencedColumnNames="id"/>
  </changeSet>

  <changeSet id="20250510-5" author="susimsek">
    <addForeignKeyConstraint
      baseTableName="user_authority_mapping"
      baseColumnNames="authority_id"
      constraintName="fk_user_authority_authority"
      referencedTableName="authority"
      referencedColumnNames="id"/>
  </changeSet>

  <changeSet id="20250510-1-data" author="susimsek">
    <loadData
      file="db/data/user.csv"
      separator=";"
      tableName="user_identity">
      <column name="id" type="string"/>
      <column name="username" type="string"/>
      <column name="password" type="string"/>
      <column name="email" type="string"/>
      <column name="first_name" type="string"/>
      <column name="last_name" type="string"/>
      <column name="enabled" type="boolean"/>
      <column name="created_at" type="datetime"/>
      <column name="created_by" type="string"/>
      <column name="updated_at" type="datetime"/>
      <column name="updated_by" type="string"/>
    </loadData>
  </changeSet>

  <changeSet id="20250510-2-data" author="susimsek">
    <loadData
      file="db/data/authority.csv"
      separator=";"
      tableName="authority">
      <column name="id" type="string"/>
      <column name="name" type="string"/>
      <column name="description" type="string"/>
      <column name="created_at" type="datetime"/>
      <column name="created_by" type="string"/>
      <column name="updated_at" type="datetime"/>
      <column name="updated_by" type="string"/>
    </loadData>
  </changeSet>

  <changeSet id="20250510-3-data" author="susimsek">
    <loadData
      file="db/data/user_authority_mapping.csv"
      separator=";"
      tableName="user_authority_mapping">
      <column name="user_id" type="string"/>
      <column name="authority_id" type="string"/>
      <column name="created_at" type="datetime"/>
      <column name="created_by" type="string"/>
      <column name="updated_at" type="datetime"/>
      <column name="updated_by" type="string"/>
    </loadData>
  </changeSet>

</databaseChangeLog>
```

<span style="display:block; height:1rem;"></span>

### user.csv

```csv
id;username;password;email;first_name;last_name;enabled;created_at;created_by;updated_at;updated_by
a1b2c3d4-e5f6-7890-abcd-ef1234567890;admin;$2a$10$sva6wl8pmGKJE6NIWrxwcuJK1Jaa2I/LOI43iHVpbR4YB8KjGViiK;admin@example.com;Admin;User;true;2025-05-10 12:00:00;system;2025-05-10 12:00:00;system
09876543-21fe-dcba-0987-654321fedcba;user;$2a$10$5Py4PyteLuXEqnGpSigzfu0V55C7Hi7zX18lmh.J8Bpmft.h23voG;user@example.com;Normal;User;true;2025-05-10 12:00:00;system;2025-05-10 12:00:00;system
```

<span style="display:block; height:1rem;"></span>

### authority.csv

```csv
id;name;description;created_at;created_by;updated_at;updated_by
f47ac10b-58cc-4372-a567-0e02b2c3d479;ROLE_ADMIN;Administrator role;2025-05-10 12:00:00;system;2025-05-10 12:00:00;system
9c858901-8a57-4791-81fe-4c455b099bc9;ROLE_USER;User role;2025-05-10 12:00:00;system;2025-05-10 12:00:00;system
```

<span style="display:block; height:1rem;"></span>

### user_authority_mapping.csv

```csv
user_id;authority_id;created_at;created_by;updated_at;updated_by
a1b2c3d4-e5f6-7890-abcd-ef1234567890;9c858901-8a57-4791-81fe-4c455b099bc9;2025-05-10 12:00:00;system;2025-05-10 12:00:00;system
a1b2c3d4-e5f6-7890-abcd-ef1234567890;f47ac10b-58cc-4372-a567-0e02b2c3d479;2025-05-10 12:00:00;system;2025-05-10 12:00:00;system
09876543-21fe-dcba-0987-654321fedcba;9c858901-8a57-4791-81fe-4c455b099bc9;2025-05-10 12:00:00;system;2025-05-10 12:00:00;system
```

<span style="display:block; height:1rem;"></span>

### schema.graphqls

```graphql
scalar Long
scalar Date
scalar Instant

type Query {
  helloAll: String!
  helloAdmin: String!
}

type Mutation {
  login(input: LoginInput!): TokenDTO!
  logout: Boolean!
  greet(input: GreetInput!): GreetDTO!
}

type Subscription {
  greetStream(input: GreetInput!): GreetDTO!
  greetStreamAdmin(input: GreetInput!): GreetDTO!
}

input LoginInput {
  username: String!
  password: String!
}

input GreetInput {
  message: String!
}

type TokenDTO {
  accessToken: String!
  tokenType: String!
  accessTokenExpiresIn: Long!
}

type GreetDTO {
  greeting: String!
  timestamp: Instant!
}
```

<span style="display:block; height:1rem;"></span>

### reflect-config.json

```json
[
  {
    "name": "liquibase.logging.mdc.MdcManagerFactory",
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.change.core.LoadDataColumnConfig",
    "queryAllPublicMethods": true,
    "allDeclaredMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.command.CommandFactory",
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.changelog.ChangeLogHistoryServiceFactory",
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.BigIntType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.BlobType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.BooleanType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.CharType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.ClobType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.CurrencyType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.DatabaseFunctionType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.DateTimeType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.DateType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.DecimalType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.DoubleType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.FloatType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.IntType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.MediumIntType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.NCharType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.NumberType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.NVarcharType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.SmallIntType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.TimestampType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.TimeType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.TinyIntType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.UnknownType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.UUIDType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.VarcharType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  },
  {
    "name": "liquibase.datatype.core.XMLType",
    "allPublicMethods": true,
    "methods": [{ "name": "<init>", "parameterTypes": [] }]
  }
]
```

---

## 🛠️ Step 3: GraphQL & Security & Database Configuration

In this section, we define the beans and properties RSA keys, HTTP security filters, and JPA repository/auditing setup for JWE‑based authentication, GraalVM native-image runtime hints, GraphQL wiring and custom scalars:

- JwtProperties: Configures JWT issuer, expiration, and signing/encryption key pairs.
- SecurityJwtConfig: Builds RSA keys and JWK sources; configures JWT encoder/decoder, authentication converter, token resolver, and WebSocket interceptor beans.
- SecurityConfig: Integrates `DomainUserDetailsService`, configures authentication manager, password encoder, and stateless security filter chain with JWE support.
- DatabaseConfig: Enables JPA repositories, auditing, and transaction management.
- GraphQLConfig: Registers custom scalars for GraphQL (`Long`, `Date`, `Instant`).
- InstantScalar: Defines an ISO-8601 `Instant` scalar for GraphQL.
- NativeConfig: Registers runtime hints for GraalVM native-image, including reflection and resource patterns.

<span style="display:block; height:1rem;"></span>

### SecurityJwtConfig

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.config;

import com.nimbusds.jose.EncryptionMethod;
import com.nimbusds.jose.JWEAlgorithm;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.JWEDecryptionKeySelector;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import io.github.susimsek.springbootgraphqljwedemo.security.CookieAuthenticationWebSocketInterceptor;
import io.github.susimsek.springbootgraphqljwedemo.security.CookieBearerTokenResolver;
import io.github.susimsek.springbootgraphqljwedemo.security.KeyUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.graphql.server.WebSocketGraphQlInterceptor;
import org.springframework.graphql.server.support.BearerTokenAuthenticationExtractor;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationProvider;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;

import java.util.List;

import static io.github.susimsek.springbootgraphqljwedemo.security.SecurityUtils.AUTHORITIES_KEY;

@Configuration
public class SecurityJwtConfig {

  private final JwtProperties props;

  public SecurityJwtConfig(JwtProperties props) {
    this.props = props;
  }

  @Bean
  public RSAKey signingKey() throws Exception {
    return KeyUtils.buildRsaKey(
      props.getSigning().getPublicKey(),
      props.getSigning().getPrivateKey(),
      props.getSigning().getKeyId(),
      true
    );
  }

  @Bean
  public RSAKey encryptionKey() throws Exception {
    return KeyUtils.buildRsaKey(
      props.getEncryption().getPublicKey(),
      props.getEncryption().getPrivateKey(),
      props.getEncryption().getKeyId(),
      false
    );
  }

  @Bean
  public JWKSource<SecurityContext> jwkSource(RSAKey signingKey, RSAKey encryptionKey) {
    JWKSet jwkSet = new JWKSet(List.of(signingKey, encryptionKey));
    return (jwkSelector, context) -> jwkSelector.select(jwkSet);
  }

  @Bean
  public JwtDecoder jwtDecoder(JWKSource<SecurityContext> jwkSource) {
    DefaultJWTProcessor<SecurityContext> jwtProcessor = new DefaultJWTProcessor<>();

    jwtProcessor.setJWEKeySelector(new JWEDecryptionKeySelector<>(
      JWEAlgorithm.RSA_OAEP_256,
      EncryptionMethod.A128GCM,
      jwkSource
    ));
    jwtProcessor.setJWSKeySelector(new JWSVerificationKeySelector<>(
      JWSAlgorithm.RS256,
      jwkSource
    ));
    jwtProcessor.setJWTClaimsSetVerifier((claims, ctx) -> {});

    return new NimbusJwtDecoder(jwtProcessor);
  }

  @Bean
  public JwtEncoder jwtEncoder(JWKSource<SecurityContext> jwkSource) {
    return new NimbusJwtEncoder(jwkSource);
  }

  @Bean
  public JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter converter = new JwtGrantedAuthoritiesConverter();
    converter.setAuthorityPrefix("");
    converter.setAuthoritiesClaimName(AUTHORITIES_KEY);

    JwtAuthenticationConverter authConverter = new JwtAuthenticationConverter();
    authConverter.setJwtGrantedAuthoritiesConverter(converter);
    return authConverter;
  }

  @Bean
  public BearerTokenResolver bearerTokenResolver() {
    CookieBearerTokenResolver resolver = new CookieBearerTokenResolver();
    resolver.setAllowUriQueryParameter(false);
    resolver.setAllowFormEncodedBodyParameter(false);
    resolver.setAllowCookie(true);
    return resolver;
  }

  @Bean
  public WebSocketGraphQlInterceptor authenticationInterceptor(JwtDecoder jwtDecoder) {
    return new CookieAuthenticationWebSocketInterceptor(
      new BearerTokenAuthenticationExtractor(),
      new ProviderManager(new JwtAuthenticationProvider(jwtDecoder))
    );
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.config

import com.nimbusds.jose.EncryptionMethod
import com.nimbusds.jose.JWEAlgorithm
import com.nimbusds.jose.JWSAlgorithm
import com.nimbusds.jose.jwk.JWKSet
import com.nimbusds.jose.jwk.RSAKey
import com.nimbusds.jose.jwk.source.JWKSource
import com.nimbusds.jose.proc.JWEDecryptionKeySelector
import com.nimbusds.jose.proc.JWSVerificationKeySelector
import com.nimbusds.jose.proc.SecurityContext
import com.nimbusds.jwt.proc.DefaultJWTProcessor
import io.github.susimsek.springbootgraphqljwedemo.security.CookieAuthenticationWebSocketInterceptor
import io.github.susimsek.springbootgraphqljwedemo.security.CookieBearerTokenResolver
import io.github.susimsek.springbootgraphqljwedemo.security.KeyUtils
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.graphql.server.WebSocketGraphQlInterceptor
import org.springframework.graphql.server.support.BearerTokenAuthenticationExtractor
import org.springframework.security.authentication.ProviderManager
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.JwtEncoder
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationProvider
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver

@Configuration
class SecurityJwtConfig(
  private val props: JwtProperties
) {

  @Bean
  @Throws(Exception::class)
  fun signingKey(): RSAKey = KeyUtils.buildRsaKey(
    props.signing.publicKey,
    props.signing.privateKey,
    props.signing.keyId,
    true
  )

  @Bean
  @Throws(Exception::class)
  fun encryptionKey(): RSAKey = KeyUtils.buildRsaKey(
    props.encryption.publicKey,
    props.encryption.privateKey,
    props.encryption.keyId,
    false
  )

  @Bean
  fun jwkSource(
    signingKey: RSAKey,
    encryptionKey: RSAKey
  ): JWKSource<SecurityContext> {
    val jwkSet = JWKSet(listOf(signingKey, encryptionKey))
    return JWKSource { jwkSelector, _ -> jwkSelector.select(jwkSet) }
  }

  @Bean
  fun jwtDecoder(jwkSource: JWKSource<SecurityContext>): JwtDecoder {
    val processor = DefaultJWTProcessor<SecurityContext>().apply {
      setJWEKeySelector(JWEDecryptionKeySelector(
        JWEAlgorithm.RSA_OAEP_256,
        EncryptionMethod.A128GCM,
        jwkSource
      ))
      setJWSKeySelector(JWSVerificationKeySelector(
        JWSAlgorithm.RS256,
        jwkSource
      ))
      setJWTClaimsSetVerifier { _, _ -> }
    }
    return NimbusJwtDecoder(processor)
  }

  @Bean
  fun jwtEncoder(jwkSource: JWKSource<SecurityContext>): JwtEncoder =
    NimbusJwtEncoder(jwkSource)

  @Bean
  fun jwtAuthenticationConverter(): JwtAuthenticationConverter {
    val granted = JwtGrantedAuthoritiesConverter().apply {
      authorityPrefix = ""
      authoritiesClaimName = SecurityUtils.AUTHORITIES_KEY
    }
    return JwtAuthenticationConverter().apply {
      setJwtGrantedAuthoritiesConverter(granted)
    }
  }

  @Bean
  fun bearerTokenResolver(): BearerTokenResolver =
    CookieBearerTokenResolver().apply {
      setAllowUriQueryParameter(false)
      setAllowFormEncodedBodyParameter(false)
      setAllowCookie(true)
    }

  @Bean
  fun authenticationInterceptor(jwtDecoder: JwtDecoder): WebSocketGraphQlInterceptor =
    CookieAuthenticationWebSocketInterceptor(
      BearerTokenAuthenticationExtractor(),
      ProviderManager(JwtAuthenticationProvider(jwtDecoder))
    )
}
```

:::

<span style="display:block; height:1rem;"></span>

### SecurityConfig

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.config;

import io.github.susimsek.springbootgraphqljwedemo.repository.UserRepository;
import io.github.susimsek.springbootgraphqljwedemo.security.DomainUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.servlet.util.matcher.MvcRequestMatcher;
import org.springframework.web.servlet.handler.HandlerMappingIntrospector;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableMethodSecurity(securedEnabled = true)
public class SecurityConfig {

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                 MvcRequestMatcher.Builder mvc) throws Exception {
    http
      .cors(withDefaults())
      .csrf(AbstractHttpConfigurer::disable)
      .authorizeHttpRequests(authz ->
        authz
          .requestMatchers(
            mvc.pattern("/webjars/**"),
            mvc.pattern("/css/**"),
            mvc.pattern("/js/**")
          ).permitAll()
          .requestMatchers(
            mvc.pattern("/*.ico"),
            mvc.pattern("/*.png"),
            mvc.pattern("/*.svg"),
            mvc.pattern("/*.webapp")
          ).permitAll()
          .requestMatchers("/actuator/**").permitAll()
          .requestMatchers(
            "/v3/api-docs/**",
            "/swagger-ui.html",
            "/swagger-ui/**"
          ).permitAll()
          .requestMatchers(
            mvc.pattern("/graphql"),
            mvc.pattern("/graphiql"),
            mvc.pattern("/subscriptions")
          ).permitAll()
          .anyRequest().authenticated()
      )
      .sessionManagement(session ->
        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .oauth2ResourceServer(oauth2 -> oauth2
        .jwt(withDefaults())
      );

    return http.build();
  }

  @Bean
  public UserDetailsService userDetailsService(UserRepository userRepository) {
    return new DomainUserDetailsService(userRepository);
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public AuthenticationManager authenticationManager(
    UserDetailsService userDetailsService,
    PasswordEncoder passwordEncoder) {
    DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
    provider.setUserDetailsService(userDetailsService);
    provider.setPasswordEncoder(passwordEncoder);
    return new ProviderManager(provider);
  }

  @Bean
  public MvcRequestMatcher.Builder mvc(HandlerMappingIntrospector introspector) {
    return new MvcRequestMatcher.Builder(introspector);
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.config

import io.github.susimsek.springbootgraphqljwedemo.repository.UserRepository
import io.github.susimsek.springbootgraphqljwedemo.security.DomainUserDetailsService
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.ProviderManager
import org.springframework.security.authentication.dao.DaoAuthenticationProvider
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.servlet.util.matcher.MvcRequestMatcher
import org.springframework.web.servlet.handler.HandlerMappingIntrospector
import org.springframework.security.config.Customizer.withDefaults

@Configuration
@EnableMethodSecurity(securedEnabled = true)
class SecurityConfig {

  @Bean
  @Throws(Exception::class)
  fun securityFilterChain(
    http: HttpSecurity,
    mvc: MvcRequestMatcher.Builder
  ): SecurityFilterChain {
    http
      .cors(withDefaults())
      .csrf { it.disable() }
      .authorizeHttpRequests { authz ->
        authz
          .requestMatchers(
            mvc.pattern("/webjars/**"),
            mvc.pattern("/css/**"),
            mvc.pattern("/js/**")
          ).permitAll()
          .requestMatchers(
            mvc.pattern("/*.ico"),
            mvc.pattern("/*.png"),
            mvc.pattern("/*.svg"),
            mvc.pattern("/*.webapp")
          ).permitAll()
          .requestMatchers("/actuator/**").permitAll()
          .requestMatchers(
            "/v3/api-docs/**",
            "/swagger-ui.html",
            "/swagger-ui/**"
          ).permitAll()
          .requestMatchers(
            mvc.pattern("/graphql"),
            mvc.pattern("/graphiql"),
            mvc.pattern("/subscriptions")
          ).permitAll()
          .anyRequest().authenticated()
      }
      .sessionManagement {
        it.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
      }
      .oauth2ResourceServer {
        it.jwt(withDefaults())
      }

    return http.build()
  }

  @Bean
  fun userDetailsService(userRepository: UserRepository): UserDetailsService =
    DomainUserDetailsService(userRepository)

  @Bean
  fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

  @Bean
  fun authenticationManager(
    userDetailsService: UserDetailsService,
    passwordEncoder: PasswordEncoder
  ): AuthenticationManager {
    val provider = DaoAuthenticationProvider().apply {
      setUserDetailsService(userDetailsService)
      setPasswordEncoder(passwordEncoder)
    }
    return ProviderManager(provider)
  }

  @Bean
  fun mvc(introspector: HandlerMappingIntrospector): MvcRequestMatcher.Builder =
    MvcRequestMatcher.Builder(introspector)
}
```

:::

<span style="display:block; height:1rem;"></span>

### JwtProperties

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
@ConfigurationProperties(prefix = "security.jwt")
@Data
public class JwtProperties {

    @Data
    public static class Pair {
        private String publicKey;
        private String privateKey;
        private String keyId;
    }

    private Pair signing;
    private Pair encryption;
    private String issuer;
    private Duration expirationDuration;
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration
import java.time.Duration

@Configuration
@ConfigurationProperties(prefix = "security.jwt")
class JwtProperties {

  class Pair {
    lateinit var publicKey: String
    lateinit var privateKey: String
    lateinit var keyId: String
  }

  lateinit var signing: Pair
  lateinit var encryption: Pair
  lateinit var issuer: String
  lateinit var expirationDuration: Duration
}
```

:::

<span style="display:block; height:1rem;"></span>

### DatabaseConfig

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableJpaRepositories("io.github.susimsek.springbootgraphqljwedemo.repository")
@EnableJpaAuditing(auditorAwareRef = "springSecurityAuditorAware")
@EnableTransactionManagement
public class DatabaseConfig {

}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.config

import org.springframework.context.annotation.Configuration
import org.springframework.data.jpa.repository.config.EnableJpaAuditing
import org.springframework.data.jpa.repository.config.EnableJpaRepositories
import org.springframework.transaction.annotation.EnableTransactionManagement

@Configuration
@EnableJpaRepositories("io.github.susimsek.springbootgraphqljwedemo.repository")
@EnableJpaAuditing(auditorAwareRef = "springSecurityAuditorAware")
@EnableTransactionManagement
class DatabaseConfig
```

:::

<span style="display:block; height:1rem;"></span>

### GraphQLConfig

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.config;

import graphql.scalars.ExtendedScalars;
import io.github.susimsek.springbootgraphqljwedemo.scalar.InstantScalar;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.graphql.execution.RuntimeWiringConfigurer;

@Configuration
public class GraphQLConfig {

  @Bean
  public RuntimeWiringConfigurer runtimeWiringConfigurer() {
    return wiring -> wiring
      .scalar(ExtendedScalars.GraphQLLong)
      .scalar(ExtendedScalars.Date)
      .scalar(InstantScalar.INSTANCE);
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.config

import graphql.scalars.ExtendedScalars
import io.github.susimsek.springbootgraphqljwedemo.scalar.InstantScalar
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.graphql.execution.RuntimeWiringConfigurer

@Configuration
class GraphQLConfig {

  @Bean
  fun runtimeWiringConfigurer(): RuntimeWiringConfigurer {
    return RuntimeWiringConfigurer { wiring ->
      wiring
        .scalar(ExtendedScalars.GraphQLLong)
        .scalar(ExtendedScalars.Date)
        .scalar(InstantScalar.INSTANCE)
    }
  }
}
```

:::

<span style="display:block; height:1rem;"></span>

### InstantScalar

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.scalar;

import graphql.GraphQLContext;
import graphql.execution.CoercedVariables;
import graphql.language.StringValue;
import graphql.language.Value;
import graphql.scalars.util.Kit;
import graphql.schema.Coercing;
import graphql.schema.CoercingParseLiteralException;
import graphql.schema.CoercingParseValueException;
import graphql.schema.CoercingSerializeException;
import graphql.schema.GraphQLScalarType;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.lang.NonNull;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Locale;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class InstantScalar {

  public static final GraphQLScalarType INSTANCE;

  static {
    Coercing<Instant, String> coercing = new Coercing<>() {
      @Override
      public String serialize(
        @NonNull Object input,
        @NonNull GraphQLContext context,
        @NonNull Locale locale
      ) throws CoercingSerializeException {
        if (input instanceof Instant instant) {
          return instant.toString();
        }
        throw new CoercingSerializeException(
          "Expected java.time.Instant but was: " + Kit.typeName(input) + "'."
        );
      }

      @Override
      public Instant parseValue(
        @NonNull Object input,
        @NonNull GraphQLContext context,
        @NonNull Locale locale
      ) throws CoercingParseValueException {
        if (input instanceof String s) {
          try {
            return Instant.parse(s);
          } catch (DateTimeParseException e) {
            throw new CoercingParseValueException("Invalid Instant value: " + e.getMessage() + "'.");
          }
        }
        throw new CoercingParseValueException(
          "Expected a String for Instant but was: " + Kit.typeName(input) + "'."
        );
      }

      @Override
      public Instant parseLiteral(
        @NonNull Value<?> input,
        @NonNull CoercedVariables variables,
        @NonNull GraphQLContext context,
        @NonNull Locale locale
      ) throws CoercingParseLiteralException {
        if (input instanceof StringValue sv) {
          String s = sv.getValue();
          try {
            return Instant.parse(s);
          } catch (DateTimeParseException e) {
            throw new CoercingParseLiteralException("Invalid Instant literal: " + e.getMessage() + "'");
          }
        }
        throw new CoercingParseLiteralException(
          "Expected AST type 'StringValue' but was: " + Kit.typeName(input) + "'."
        );
      }

      @Override
      @NonNull
      public Value<?> valueToLiteral(
        @NonNull Object input,
        @NonNull GraphQLContext context,
        @NonNull Locale locale
      ) {
        String serialized = serialize(input, context, locale);
        return StringValue.newStringValue(serialized).build();
      }
    };

    INSTANCE = GraphQLScalarType.newScalar()
      .name("Instant")
      .description("An ISO-8601 compliant java.time.Instant scalar")
      .specifiedByUrl("https://www.rfc-editor.org/rfc/rfc3339.html#section-5.6")
      .coercing(coercing)
      .build();
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.scalar

import graphql.GraphQLContext
import graphql.execution.CoercedVariables
import graphql.language.StringValue
import graphql.language.Value
import graphql.scalars.util.Kit
import graphql.schema.Coercing
import graphql.schema.CoercingParseLiteralException
import graphql.schema.CoercingParseValueException
import graphql.schema.CoercingSerializeException
import graphql.schema.GraphQLScalarType
import java.time.Instant
import java.time.format.DateTimeParseException
import java.util.Locale

object InstantScalar {

  @JvmField
  val INSTANCE: GraphQLScalarType = GraphQLScalarType.newScalar()
    .name("Instant")
    .description("An ISO-8601 compliant java.time.Instant scalar")
    .specifiedByUrl("https://www.rfc-editor.org/rfc/rfc3339.html#section-5.6")
    .coercing(object : Coercing<Instant, String> {
      override fun serialize(
        input: Any,
        context: GraphQLContext,
        locale: Locale
      ): String {
        return if (input is Instant) {
          input.toString()
        } else {
          throw CoercingSerializeException("Expected java.time.Instant but was: ${Kit.typeName(input)}'.")
        }
      }

      override fun parseValue(
        input: Any,
        context: GraphQLContext,
        locale: Locale
      ): Instant {
        if (input is String) {
          return try {
            Instant.parse(input)
          } catch (e: DateTimeParseException) {
            throw CoercingParseValueException("Invalid Instant value: ${e.message}'.")
          }
        }
        throw CoercingParseValueException("Expected a String for Instant but was: ${Kit.typeName(input)}'.")
      }

      override fun parseLiteral(
        input: Value<*>,
        variables: CoercedVariables,
        context: GraphQLContext,
        locale: Locale
      ): Instant {
        if (input is StringValue) {
          return try {
            Instant.parse(input.value)
          } catch (e: DateTimeParseException) {
            throw CoercingParseLiteralException("Invalid Instant literal: ${e.message}'")
          }
        }
        throw CoercingParseLiteralException("Expected AST type 'StringValue' but was: ${Kit.typeName(input)}'.")
      }

      override fun valueToLiteral(
        input: Any,
        context: GraphQLContext,
        locale: Locale
      ): Value<*> {
        val serialized = serialize(input, context, locale)
        return StringValue.newStringValue(serialized).build()
      }
    })
    .build()
}
```

:::

<span style="display:block; height:1rem;"></span>

### NativeConfig

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.config;

import org.springframework.aot.hint.MemberCategory;
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;

public class NativeConfig {

  public static class AppNativeRuntimeHints implements RuntimeHintsRegistrar {

    @Override
    public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
      hints.reflection()
        .registerType(sun.misc.Unsafe.class,
          hint -> hint.withMembers(MemberCategory.INVOKE_PUBLIC_METHODS));
      hints.reflection()
        .registerType(java.util.Locale.class,
          hint -> hint.withMembers(MemberCategory.INVOKE_PUBLIC_METHODS));
      hints.reflection()
        .registerType(org.hibernate.binder.internal.BatchSizeBinder.class,
          hint -> hint.withMembers(MemberCategory.INVOKE_PUBLIC_CONSTRUCTORS));
      hints.resources().registerPattern("liquibase/*");
      hints.reflection()
        .registerType(liquibase.ui.LoggerUIService.class,
          hint -> hint.withMembers(MemberCategory.INVOKE_PUBLIC_CONSTRUCTORS));
      hints.reflection()
        .registerType(liquibase.database.LiquibaseTableNamesFactory.class,
          hint -> hint.withMembers(MemberCategory.INVOKE_DECLARED_CONSTRUCTORS));
      hints.reflection()
        .registerType(liquibase.report.ShowSummaryGeneratorFactory.class,
          hint -> hint.withMembers(MemberCategory.INVOKE_DECLARED_CONSTRUCTORS));
      hints.reflection()
        .registerType(liquibase.changelog.FastCheckService.class,
          hint -> hint.withMembers(MemberCategory.INVOKE_DECLARED_CONSTRUCTORS));
      hints.reflection()
        .registerType(liquibase.changelog.visitor.ValidatingVisitorGeneratorFactory.class,
          hint -> hint.withMembers(MemberCategory.INVOKE_DECLARED_CONSTRUCTORS));
    }
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.config

import org.springframework.aot.hint.MemberCategory
import org.springframework.aot.hint.RuntimeHints
import org.springframework.aot.hint.RuntimeHintsRegistrar

class NativeConfig {

  class AppNativeRuntimeHints : RuntimeHintsRegistrar {
    override fun registerHints(hints: RuntimeHints, classLoader: ClassLoader) {
      hints.reflection().registerType(
        sun.misc.Unsafe::class.java,
        hint = hint@{ it.withMembers(MemberCategory.INVOKE_PUBLIC_METHODS) }
      )
      hints.reflection().registerType(
        java.util.Locale::class.java,
        hint = hint@{ it.withMembers(MemberCategory.INVOKE_PUBLIC_METHODS) }
      )
      hints.reflection().registerType(
        org.hibernate.binder.internal.BatchSizeBinder::class.java,
        hint = hint@{ it.withMembers(MemberCategory.INVOKE_PUBLIC_CONSTRUCTORS) }
      )
      hints.resources().registerPattern("liquibase/*")
      hints.reflection().registerType(
        liquibase.ui.LoggerUIService::class.java,
        hint = hint@{ it.withMembers(MemberCategory.INVOKE_PUBLIC_CONSTRUCTORS) }
      )
      hints.reflection().registerType(
        liquibase.database.LiquibaseTableNamesFactory::class.java,
        hint = hint@{ it.withMembers(MemberCategory.INVOKE_DECLARED_CONSTRUCTORS) }
      )
      hints.reflection().registerType(
        liquibase.report.ShowSummaryGeneratorFactory::class.java,
        hint = hint@{ it.withMembers(MemberCategory.INVOKE_DECLARED_CONSTRUCTORS) }
      )
      hints.reflection().registerType(
        liquibase.changelog.FastCheckService::class.java,
        hint = hint@{ it.withMembers(MemberCategory.INVOKE_DECLARED_CONSTRUCTORS) }
      )
      hints.reflection().registerType(
        liquibase.changelog.visitor.ValidatingVisitorGeneratorFactory::class.java,
        hint = hint@{ it.withMembers(MemberCategory.INVOKE_DECLARED_CONSTRUCTORS) }
      )
    }
  }
}
```

:::

<span style="display:block; height:1rem;"></span>

### Main

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo;

import io.github.susimsek.springbootgraphqljwedemo.config.NativeConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ImportRuntimeHints;

@SpringBootApplication
@ImportRuntimeHints({ NativeConfig.AppNativeRuntimeHints.class })
public class SpringBootJweAuthJpaDemoApplication {

  public static void main(String[] args) {
    SpringApplication.run(SpringBootJweAuthJpaDemoApplication.class, args);
  }

}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo

import io.github.susimsek.springbootgraphqljwedemo.config.NativeConfig
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.context.annotation.ImportRuntimeHints

@SpringBootApplication
@ImportRuntimeHints(NativeConfig.AppNativeRuntimeHints::class)
class SpringBootJweAuthJpaDemoApplication

fun main(args: Array<String>) {
  runApplication<SpringBootJweAuthJpaDemoApplication>(*args)
}
```

:::

---

## 🛠️ Step 4: JPA Integration

In this section, we define the JPA entities representing users, authorities, and their mappings, along with the Spring Data repository for loading users with their authorities.

- BaseEntity: Abstract superclass providing audit fields (`createdAt`, `createdBy`, `updatedAt`, `updatedBy`).
- Authority: `authority` table entity storing role data.
- User: `user_identity` table entity storing user credentials and profile.
- UserAuthorityMapping: `user_authority_mapping` join table entity linking users and authorities.
- UserAuthorityMappingId: Composite key class for `UserAuthorityMapping`.
- UserRepository: Spring Data JPA repository for `User` with an entity graph to load authorities.

<span style="display:block; height:1rem;"></span>

### BaseEntity

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public abstract class BaseEntity {

  @CreatedDate
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @CreatedBy
  @Column(name = "created_by", nullable = false, updatable = false, length = 50)
  private String createdBy;

  @LastModifiedDate
  @Column(name = "updated_at")
  private Instant updatedAt;

  @LastModifiedBy
  @Column(name = "updated_by", length = 50)
  private String updatedBy;
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.entity

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
abstract class BaseEntity {

  @CreatedDate
  @Column(name = "created_at", nullable = false, updatable = false)
  lateinit var createdAt: Instant

  @CreatedBy
  @Column(name = "created_by", nullable = false, updatable = false, length = 50)
  lateinit var createdBy: String

  @LastModifiedDate
  @Column(name = "updated_at")
  var updatedAt: Instant? = null

  @LastModifiedBy
  @Column(name = "updated_by", length = 50)
  var updatedBy: String? = null
}
```

:::

<span style="display:block; height:1rem;"></span>

### Authority

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.proxy.HibernateProxy;

import java.util.Objects;

@Entity
@Table(name = "authority")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Authority extends BaseEntity {

  @Id
  @Column(length = 36, nullable = false)
  private String id;

  @Column(length = 50, nullable = false, unique = true)
  private String name;

  @Column(length = 255)
  private String description;

  @Override
  public final boolean equals(Object obj) {
    if (this == obj) {
      return true;
    }
    if (!(obj instanceof Authority other)) {
      return false;
    }
    Class<?> objClass = obj instanceof HibernateProxy proxy
      ? proxy.getHibernateLazyInitializer().getPersistentClass()
      : obj.getClass();
    Class<?> thisClass = this instanceof HibernateProxy proxy
      ? proxy.getHibernateLazyInitializer().getPersistentClass()
      : this.getClass();
    if (!thisClass.equals(objClass)) {
      return false;
    }
    return id != null && Objects.equals(id, other.id);
  }

  @Override
  public final int hashCode() {
    return this instanceof HibernateProxy proxy
      ? proxy.getHibernateLazyInitializer().getPersistentClass().hashCode()
      : getClass().hashCode();
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.proxy.HibernateProxy
import java.util.Objects

@Entity
@Table(name = "authority")
class Authority(
  @Id
  @Column(length = 36, nullable = false)
  var id: String,

  @Column(length = 50, nullable = false, unique = true)
  var name: String,

  @Column(length = 255)
  var description: String?
) : BaseEntity() {

  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (other !is Authority) return false
    val objClass = (other as? HibernateProxy)?.hibernateLazyInitializer?.persistentClass ?: other::class.java
    val thisClass = (this as? HibernateProxy)?.hibernateLazyInitializer?.persistentClass ?: this::class.java
    if (thisClass != objClass) return false
    return id == other.id
  }

  override fun hashCode(): Int {
    return (this as? HibernateProxy)?.hibernateLazyInitializer?.persistentClass?.hashCode()
      ?: javaClass.hashCode()
  }
}
```

:::

<span style="display:block; height:1rem;"></span>

### User

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.NamedAttributeNode;
import jakarta.persistence.NamedEntityGraph;
import jakarta.persistence.NamedSubgraph;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.proxy.HibernateProxy;

import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Entity
@Table(name = "user_identity")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@NamedEntityGraph(
  name = "User.withAuthorities",
  attributeNodes = @NamedAttributeNode(value = "authorities", subgraph = "auth-subgraph"),
  subgraphs = @NamedSubgraph(
    name = "auth-subgraph",
    attributeNodes = @NamedAttributeNode("authority")
  )
)
public class User extends BaseEntity {

  @Id
  @Column(name = "id", length = 36, nullable = false, updatable = false)
  private String id;

  @Column(name = "username", length = 50, nullable = false, unique = true)
  private String username;

  @Column(name = "password", length = 100, nullable = false)
  private String password;

  @Column(name = "email", length = 100, nullable = false, unique = true)
  private String email;

  @Column(name = "first_name", length = 50)
  private String firstName;

  @Column(name = "last_name", length = 50)
  private String lastName;

  @Column(name = "enabled", nullable = false)
  private boolean enabled;

  @OneToMany(mappedBy = "user", fetch = FetchType.LAZY,
    cascade = CascadeType.ALL, orphanRemoval = true)
  private Set<UserAuthorityMapping> authorities = new HashSet<>();

  @Override
  public final boolean equals(Object obj) {
    if (this == obj) return true;
    if (!(obj instanceof User other)) return false;
    Class<?> objClass = (obj instanceof HibernateProxy hp
      ? hp.getHibernateLazyInitializer().getPersistentClass()
      : obj.getClass());
    Class<?> thisClass = (this instanceof HibernateProxy hp
      ? hp.getHibernateLazyInitializer().getPersistentClass()
      : this.getClass());
    if (!thisClass.equals(objClass)) return false;
    return id != null && id.equals(other.id);
  }

  @Override
  public final int hashCode() {
    return (this instanceof HibernateProxy hp
      ? hp.getHibernateLazyInitializer().getPersistentClass().hashCode()
      : getClass().hashCode());
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.entity

import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.NamedAttributeNode
import jakarta.persistence.NamedEntityGraph
import jakarta.persistence.NamedSubgraph
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import org.hibernate.proxy.HibernateProxy
import java.util.*

@Entity
@Table(name = "user_identity")
@NamedEntityGraph(
  name = "User.withAuthorities",
  attributeNodes = [NamedAttributeNode(value = "authorities", subgraph = "auth-subgraph")],
  subgraphs = [
    NamedSubgraph(
      name = "auth-subgraph",
      attributeNodes = [NamedAttributeNode("authority")]
    )
  ]
)
class User(

  @Id
  @Column(name = "id", length = 36, nullable = false, updatable = false)
  var id: String,

  @Column(name = "username", length = 50, nullable = false, unique = true)
  var username: String,

  @Column(name = "password", length = 100, nullable = false)
  var password: String,

  @Column(name = "email", length = 100, nullable = false, unique = true)
  var email: String,

  @Column(name = "first_name", length = 50)
  var firstName: String? = null,

  @Column(name = "last_name", length = 50)
  var lastName: String? = null,

  @Column(name = "enabled", nullable = false)
  var enabled: Boolean = true

) : BaseEntity() {

  @OneToMany(
    mappedBy = "user",
    fetch = FetchType.LAZY,
    cascade = [CascadeType.ALL],
    orphanRemoval = true
  )
  var authorities: MutableSet<UserAuthorityMapping> = HashSet()

  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (other !is User) return false
    val objClass = (other as? HibernateProxy)?.hibernateLazyInitializer?.persistentClass
      ?: other::class.java
    val thisClass = (this as? HibernateProxy)?.hibernateLazyInitializer?.persistentClass
      ?: this::class.java
    if (thisClass != objClass) return false
    return id == other.id
  }

  override fun hashCode(): Int =
    ((this as? HibernateProxy)?.hibernateLazyInitializer?.persistentClass?.hashCode()
      ?: javaClass.hashCode())
}
```

:::

<span style="display:block; height:1rem;"></span>

### UserAuthorityMapping

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.proxy.HibernateProxy;

import java.util.Objects;

@Entity
@Table(name = "user_authority_mapping")
@IdClass(UserAuthorityMappingId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserAuthorityMapping extends BaseEntity {

  @Id
  @Column(name = "user_id", length = 36, nullable = false)
  private String userId;

  @Id
  @Column(name = "authority_id", length = 36, nullable = false)
  private String authorityId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", insertable = false, updatable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "authority_id", insertable = false, updatable = false)
  private Authority authority;

  @Override
  public final boolean equals(Object obj) {
    if (this == obj) return true;
    if (!(obj instanceof UserAuthorityMapping other)) return false;
    Class<?> objCls = (obj instanceof HibernateProxy hp
      ? hp.getHibernateLazyInitializer().getPersistentClass()
      : obj.getClass());
    Class<?> thisCls = (this instanceof HibernateProxy hp
      ? hp.getHibernateLazyInitializer().getPersistentClass()
      : this.getClass());
    if (!thisCls.equals(objCls)) return false;
    return userId != null && userId.equals(other.userId)
      && authorityId != null && authorityId.equals(other.authorityId);
  }

  @Override
  public final int hashCode() {
    return (this instanceof HibernateProxy hp
      ? hp.getHibernateLazyInitializer().getPersistentClass().hashCode()
      : Objects.hash(userId, authorityId));
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.entity

import jakarta.persistence.*
import org.hibernate.proxy.HibernateProxy
import java.util.*

@Entity
@Table(name = "user_authority_mapping")
@IdClass(UserAuthorityMappingId::class)
data class UserAuthorityMapping(

  @Id
  @Column(name = "user_id", length = 36, nullable = false)
  var userId: String = "",

  @Id
  @Column(name = "authority_id", length = 36, nullable = false)
  var authorityId: String = "",

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", insertable = false, updatable = false)
  var user: User? = null,

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "authority_id", insertable = false, updatable = false)
  var authority: Authority? = null

) : BaseEntity() {

  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (other !is UserAuthorityMapping) return false

    val objCls = (other as? HibernateProxy)?.hibernateLazyInitializer?.persistentClass
      ?: other::class.java
    val thisCls = (this as? HibernateProxy)?.hibernateLazyInitializer?.persistentClass
      ?: this::class.java

    if (thisCls != objCls) return false
    return userId == other.userId && authorityId == other.authorityId
  }

  override fun hashCode(): Int {
    return (this as? HibernateProxy)?.hibernateLazyInitializer?.persistentClass?.hashCode()
      ?: Objects.hash(userId, authorityId)
  }
}
```

:::

<span style="display:block; height:1rem;"></span>

### UserAuthorityMappingId

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.entity;

import java.io.Serializable;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserAuthorityMappingId implements Serializable {

  private String userId;
  private String authorityId;

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    UserAuthorityMappingId that = (UserAuthorityMappingId) o;
    return Objects.equals(userId, that.userId) &&
      Objects.equals(authorityId, that.authorityId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(userId, authorityId);
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.entity

import java.io.Serializable
import java.util.Objects

data class UserAuthorityMappingId(
  var userId: String = "",
  var authorityId: String = ""
) : Serializable {

  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (other == null || this::class != other::class) return false
    other as UserAuthorityMappingId
    return userId == other.userId && authorityId == other.authorityId
  }

  override fun hashCode(): Int {
    return Objects.hash(userId, authorityId)
  }
}
```

:::

<span style="display:block; height:1rem;"></span>

### UserRepository

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.repository;

import io.github.susimsek.springbootgraphqljwedemo.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

  @EntityGraph("User.withAuthorities")
  Optional<User> findOneWithAuthoritiesByUsername(String username);
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.repository

import io.github.susimsek.springbootgraphqljwedemo.entity.User
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface UserRepository : JpaRepository<User, String> {

  @EntityGraph("User.withAuthorities")
  fun findOneWithAuthoritiesByUsername(username: String): Optional<User>
}
```

:::

---

## 🛠️ Step 5: Secure JWE Token Utilities

In this section, we define the core utility classes and constants needed to generate, encrypt, and resolve JSON Web Encryption (JWE) tokens in your Spring Boot application, integrate auditing, and implement a JPA-based user details service:

- AuthoritiesConstants: Centralize role names with the `ROLE_` prefix.
- CookieBearerTokenResolver: Resolve bearer tokens from Authorization headers or HTTP cookies.
- CookieUtils: Generates HTTP-only, secure `ResponseCookie` for new or expired tokens, and extracts the raw `accessToken` from `HttpHeaders`
- JweUtil: Sign (JWS) and encrypt (JWE) JWTs using RSA keys and Nimbus.
- KeyUtils: Build RSA JWKs from PEM‐encoded key material.
- SecurityUtils: Extract the current user’s login from the security context.
- SpringSecurityAuditorAware: Implement `AuditorAware` to provide the current user for auditing.
- DomainUserDetailsService: JPA-based `UserDetailsService` loading user and authorities for authentication.
- GraphQlTokenCookieInterceptor: Intercepts GraphQL responses to set or clear the access token cookie based on `accessToken` and `clearAccessToken` flags in the `GraphQLContext`.
- CookieAuthenticationWebSocketInterceptor: Intercept WebSocket connections to authenticate using JWE tokens from headers or cookies.

These utilities form the foundation for a stateless, JWE‐based authentication flow in Spring Security.

### AuthoritiesConstants

:::tabs
@tab Java [icon=java]

```java

package io.github.susimsek.springbootgraphqljwedemo.security;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class AuthoritiesConstants {
    public static final String ADMIN = "ROLE_ADMIN";
    public static final String USER = "ROLE_USER";
    public static final String ANONYMOUS = "ROLE_ANONYMOUS";
}
```

@tab Kotlin [icon=kotlin]

```kotlin

package io.github.susimsek.springbootgraphqljwedemo.security

object AuthoritiesConstants {
  const val ADMIN = "ROLE_ADMIN"
  const val USER = "ROLE_USER"
  const val ANONYMOUS = "ROLE_ANONYMOUS"
}
```

:::

<span style="display:block; height:1rem;"></span>

### CookieBearerTokenResolver

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Setter;
import org.springframework.http.HttpMethod;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.server.resource.BearerTokenError;
import org.springframework.security.oauth2.server.resource.BearerTokenErrors;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.util.StringUtils;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Setter
public class CookieBearerTokenResolver implements BearerTokenResolver {
    private static final String ACCESS_TOKEN_PARAMETER_NAME = "access_token";
    private static final Pattern AUTHORIZATION_PATTERN =
        Pattern.compile("^Bearer (?<token>[A-Za-z0-9-._~+/]+=*)$", Pattern.CASE_INSENSITIVE);

    private boolean allowFormEncodedBodyParameter = false;
    private boolean allowUriQueryParameter       = false;
    private boolean allowCookie                  = true;
    private String  bearerTokenHeaderName       = "Authorization";
    private String  cookieName                  = "accessToken";

    @Override
    public String resolve(HttpServletRequest request) {
        String headerToken = resolveFromAuthorizationHeader(request);
        String queryToken  = resolveAccessTokenFromQueryString(request);
        String bodyToken   = resolveAccessTokenFromBody(request);
        String cookieToken = (headerToken == null && queryToken == null && bodyToken == null)
            ? resolveFromCookie(request)
            : null;

        return resolveToken(headerToken, queryToken, bodyToken, cookieToken);
    }

    private String resolveFromAuthorizationHeader(HttpServletRequest request) {
        String authorization = request.getHeader(this.bearerTokenHeaderName);
        if (!StringUtils.hasText(authorization) || !authorization.toLowerCase().startsWith("bearer")) {
            return null;
        }
        Matcher matcher = AUTHORIZATION_PATTERN.matcher(authorization.trim());
        if (!matcher.matches()) {
            BearerTokenError error = BearerTokenErrors.invalidToken("Bearer token is malformed");
            throw new OAuth2AuthenticationException(error);
        }
        return matcher.group("token");
    }

    private String resolveAccessTokenFromQueryString(HttpServletRequest request) {
        if (allowUriQueryParameter && HttpMethod.GET.matches(request.getMethod())) {
            return resolveToken(request.getParameterValues(ACCESS_TOKEN_PARAMETER_NAME));
        }
        return null;
    }

    private String resolveAccessTokenFromBody(HttpServletRequest request) {
        if (allowFormEncodedBodyParameter
            && HttpMethod.POST.matches(request.getMethod())
            && "application/x-www-form-urlencoded".equals(request.getContentType())) {
            return resolveToken(request.getParameterValues(ACCESS_TOKEN_PARAMETER_NAME));
        }
        return null;
    }

    private String resolveFromCookie(HttpServletRequest request) {
        if (!allowCookie || request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (cookieName.equals(cookie.getName())) {
                String val = cookie.getValue();
                return StringUtils.hasText(val) ? val : null;
            }
        }
        return null;
    }

    private String resolveToken(String... tokens) {
        String found = null;
        for (String token : tokens) {
            if (token == null) continue;
            if (found != null) {
                BearerTokenError error = BearerTokenErrors.invalidRequest("Found multiple bearer tokens in the request");
                throw new OAuth2AuthenticationException(error);
            }
            found = token;
        }
        if (found != null && found.isBlank()) {
            BearerTokenError error = BearerTokenErrors.invalidRequest("The requested token parameter is an empty string");
            throw new OAuth2AuthenticationException(error);
        }
        return found;
    }
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.security

import jakarta.servlet.http.Cookie
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpMethod
import org.springframework.security.oauth2.core.OAuth2AuthenticationException
import org.springframework.security.oauth2.server.resource.BearerTokenError
import org.springframework.security.oauth2.server.resource.BearerTokenErrors
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver
import org.springframework.util.StringUtils
import java.util.regex.Pattern

class CookieBearerTokenResolver {
    var allowFormEncodedBodyParameter: Boolean = false
    var allowUriQueryParameter: Boolean = false
    var allowCookie: Boolean = true
    var bearerTokenHeaderName: String = "Authorization"
    var cookieName: String = "accessToken"

    companion object {
        private const val ACCESS_TOKEN_PARAMETER_NAME = "access_token"
        private val AUTHORIZATION_PATTERN =
            Pattern.compile("^Bearer (?<token>[A-Za-z0-9-._~+/]+=*)$", Pattern.CASE_INSENSITIVE)
    }

    fun resolve(request: HttpServletRequest): String? {
        val header = resolveFromAuthorizationHeader(request)
        val query  = if (allowUriQueryParameter && HttpMethod.GET.matches(request.method))
            request.getParameterValues(ACCESS_TOKEN_PARAMETER_NAME)?.let(::resolveToken)
        else null
        val body   = if (allowFormEncodedBodyParameter && HttpMethod.POST.matches(request.method)
            && request.contentType == "application/x-www-form-urlencoded")
            request.getParameterValues(ACCESS_TOKEN_PARAMETER_NAME)?.let(::resolveToken)
        else null
        val cookie = if (header == null && query == null && body == null)
            resolveFromCookie(request)
        else null
      return listOf(header, query, body, cookie).filterNotNull().let {
            if (it.size > 1) throw OAuth2AuthenticationException(BearerTokenErrors.invalidRequest("Found multiple bearer tokens"))
            it.firstOrNull()?: null
        }
    }

    private fun resolveFromAuthorizationHeader(request: HttpServletRequest): String? {
        val auth = request.getHeader(bearerTokenHeaderName) ?: return null
        if (!auth.startsWith("Bearer ", true)) return null
        val matcher = AUTHORIZATION_PATTERN.matcher(auth.trim())
        return if (matcher.matches()) matcher.group("token")
        else throw OAuth2AuthenticationException(BearerTokenErrors.invalidToken("Malformed token"))
    }

    private fun resolveFromCookie(request: HttpServletRequest): String? {
        if (!allowCookie) return null
        return request.cookies?.firstOrNull { it.name == cookieName }?.value?.takeIf { it.isNotBlank() }
    }

    private fun resolveToken(tokens: Array<String>): String? {
        return tokens.filter { it.isNotBlank() }.let {
            when {
                it.isEmpty() -> null
                it.size > 1   -> throw OAuth2AuthenticationException(BearerTokenErrors.invalidRequest("Multiple tokens"))
                else          -> it[0]
            }
        }
    }
```

:::

<span style="display:block; height:1rem;"></span>

### CookieUtils

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootjweauthjpademo.security;

import io.github.susimsek.springbootjweauthjpademo.dto.TokenDTO;
import lombok.experimental.UtilityClass;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;

import java.net.HttpCookie;
import java.util.Arrays;
import java.util.Optional;

@UtilityClass
public class CookieUtils {

  public static final String COOKIE_NAME = "accessToken";

  public ResponseCookie createAccessTokenCookie(TokenDTO tokenDto) {
    return ResponseCookie.from(COOKIE_NAME, tokenDto.accessToken())
      .httpOnly(true)
      .secure(true)
      .path("/")
      .maxAge(tokenDto.accessTokenExpiresIn())
      .sameSite("Strict")
      .build();
  }

  public static ResponseCookie removeAccessTokenCookie() {
    return ResponseCookie.from(COOKIE_NAME, "")
      .httpOnly(true)
      .secure(true)
      .path("/")
      .maxAge(0)
      .sameSite("Strict")
      .build();
  }

  public String resolveToken(HttpHeaders headers) {
    return Optional.ofNullable(headers.getFirst(HttpHeaders.COOKIE))
      .map(h -> h.split(";"))
      .stream()
      .flatMap(Arrays::stream)
      .flatMap(part -> HttpCookie.parse(part).stream())
      .filter(c -> COOKIE_NAME.equals(c.getName()))
      .map(HttpCookie::getValue)
      .findFirst()
      .orElse(null);
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootjweauthjpademo.security

import io.github.susimsek.springbootjweauthjpademo.dto.TokenDTO
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseCookie
import java.net.HttpCookie

object CookieUtils {

  const val COOKIE_NAME = "accessToken"

  fun createAccessTokenCookie(tokenDto: TokenDTO): ResponseCookie =
    ResponseCookie.from(COOKIE_NAME, tokenDto.accessToken())
      .httpOnly(true)
      .secure(true)
      .path("/")
      .maxAge(tokenDto.accessTokenExpiresIn())
      .sameSite("Strict")
      .build()

  fun removeAccessTokenCookie(): ResponseCookie =
    ResponseCookie.from(COOKIE_NAME, "")
      .httpOnly(true)
      .secure(true)
      .path("/")
      .maxAge(0)
      .sameSite("Strict")
      .build()

  fun resolveToken(headers: HttpHeaders): String? =
    headers.getFirst(HttpHeaders.COOKIE)
      ?.split(";")
      .orEmpty()
      .asSequence()
      .flatMap { HttpCookie.parse(it).asSequence() }
      .firstOrNull { it.name == COOKIE_NAME }
      ?.value
}
```

:::

<span style="display:block; height:1rem;"></span>

### JweUtil

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.security;

import com.nimbusds.jose.EncryptionMethod;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWEAlgorithm;
import com.nimbusds.jose.JWEHeader;
import com.nimbusds.jose.JWEObject;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.RSAEncrypter;
import com.nimbusds.jose.jwk.RSAKey;
import io.github.susimsek.springbootgraphqljwedemo.config.JwtProperties;
import io.github.susimsek.springbootgraphqljwedemo.dto.TokenDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

import static io.github.susimsek.springbootgraphqljwedemo.security.SecurityUtils.AUTHORITIES_KEY;

@Component
@RequiredArgsConstructor
public class JweUtil {

    private final JwtEncoder jwtEncoder;
    private final RSAKey signingKey;
    private final RSAKey encryptionKey;
    private final JwtProperties props;

    public TokenDTO generateToken(Authentication authentication) throws JOSEException {
        String subject = authentication.getName();
        List<String> roles = authentication.getAuthorities()
            .stream()
            .map(GrantedAuthority::getAuthority)
            .toList();

        Instant now = Instant.now();
        long expiresIn = props.getExpirationDuration().getSeconds();
        Instant exp = now.plusSeconds(expiresIn);

        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer(props.getIssuer())
            .issuedAt(now)
            .expiresAt(exp)
            .subject(subject)
            .claim(AUTHORITIES_KEY, roles)
            .build();

        JwsHeader jwsHeader = JwsHeader.with(SignatureAlgorithm.RS256)
            .keyId(signingKey.getKeyID())
            .build();

        String jws = jwtEncoder
            .encode(JwtEncoderParameters.from(jwsHeader, claims))
            .getTokenValue();

        JWEHeader jweHeader = new JWEHeader.Builder(JWEAlgorithm.RSA_OAEP_256, EncryptionMethod.A128GCM)
            .contentType("JWT")
            .keyID(encryptionKey.getKeyID())
            .build();

        JWEObject jweObject = new JWEObject(jweHeader, new Payload(jws));
        jweObject.encrypt(new RSAEncrypter(encryptionKey.toRSAPublicKey()));
        String token = jweObject.serialize();

        return new TokenDTO(token, "Bearer", expiresIn);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.security

import com.nimbusds.jose.EncryptionMethod
import com.nimbusds.jose.JOSEException
import com.nimbusds.jose.JWEAlgorithm
import com.nimbusds.jose.JWEHeader
import com.nimbusds.jose.JWEObject
import com.nimbusds.jose.Payload
import com.nimbusds.jose.crypto.RSAEncrypter
import com.nimbusds.jose.jwk.RSAKey
import io.github.susimsek.springbootgraphqljwedemo.config.JwtProperties
import io.github.susimsek.springbootgraphqljwedemo.dto.TokenDTO
import lombok.RequiredArgsConstructor
import org.springframework.security.core.Authentication
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm
import org.springframework.security.oauth2.jwt.JwtClaimsSet
import org.springframework.security.oauth2.jwt.JwtEncoder
import org.springframework.security.oauth2.jwt.JwtEncoderParameters
import org.springframework.stereotype.Component

import java.time.Instant

@Component
@RequiredArgsConstructor
class JweUtil(
    private val jwtEncoder: JwtEncoder,
    private val signingKey: RSAKey,
    private val encryptionKey: RSAKey,
    private val props: JwtProperties
) {
    fun generateToken(authentication: Authentication): TokenDTO {
        val subject = authentication.name
        val roles = authentication.authorities.map { it.authority }

        val now = Instant.now()
        val expiresIn = props.expirationDuration.seconds
        val exp = now.plusSeconds(expiresIn)

        val claims = JwtClaimsSet.builder()
            .issuer(props.issuer)
            .issuedAt(now)
            .expiresAt(exp)
            .subject(subject)
            .claim(AUTHORITIES_KEY, roles)
            .build()

        val jwsHeader = org.springframework.security.oauth2.jwt.JwsHeader.with(SignatureAlgorithm.RS256)
            .keyId(signingKey.keyID)
            .build()

        val jws = jwtEncoder
            .encode(JwtEncoderParameters.from(jwsHeader, claims))
            .tokenValue

        val jweHeader = JWEHeader.Builder(JWEAlgorithm.RSA_OAEP_256, EncryptionMethod.A128GCM)
            .contentType("JWT")
            .keyID(encryptionKey.keyID)
            .build()

        val jweObject = JWEObject(jweHeader, Payload(jws))
        jweObject.encrypt(RSAEncrypter(encryptionKey.toRSAPublicKey()))
        val token = jweObject.serialize()

        return TokenDTO(token, "Bearer", expiresIn)
    }
}
```

:::

<span style="display:block; height:1rem;"></span>

### KeyUtils

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.security;

import com.nimbusds.jose.JWEAlgorithm;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.KeyUse;
import com.nimbusds.jose.jwk.RSAKey;
import lombok.experimental.UtilityClass;

import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@UtilityClass
public class KeyUtils {
    public RSAKey buildRsaKey(
            String pubPem,
            String privPem,
            String kid,
            boolean forSign
    ) throws Exception {
        String pubContent = pubPem
            .replace("-----BEGIN PUBLIC KEY-----", "")
            .replace("-----END PUBLIC KEY-----", "")
            .replaceAll("\\s", "");
        String privContent = privPem
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replaceAll("\\s", "");

        byte[] decodedPub = Base64.getDecoder().decode(pubContent);
        byte[] decodedPriv = Base64.getDecoder().decode(privContent);

        KeyFactory kf = KeyFactory.getInstance("RSA");
        RSAPublicKey publicKey = (RSAPublicKey) kf.generatePublic(new X509EncodedKeySpec(decodedPub));
        RSAPrivateKey privateKey = (RSAPrivateKey) kf.generatePrivate(new PKCS8EncodedKeySpec(decodedPriv));

        RSAKey.Builder builder = new RSAKey.Builder(publicKey)
            .privateKey(privateKey)
            .keyID(kid);

        if (forSign) {
            builder
                .algorithm(JWSAlgorithm.RS256)
                .keyUse(KeyUse.SIGNATURE);
        } else {
            builder
                .algorithm(JWEAlgorithm.RSA_OAEP_256)
                .keyUse(KeyUse.ENCRYPTION);
        }

        return builder.build();
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.security

import com.nimbusds.jose.JWEAlgorithm
import com.nimbusds.jose.JWSAlgorithm
import com.nimbusds.jose.jwk.KeyUse
import com.nimbusds.jose.jwk.RSAKey
import java.security.KeyFactory
import java.security.interfaces.RSAPrivateKey
import java.security.interfaces.RSAPublicKey
import java.security.spec.PKCS8EncodedKeySpec
import java.security.spec.X509EncodedKeySpec
import java.util.Base64

object KeyUtils {
    @JvmStatic
    @Throws(Exception::class)
    fun buildRsaKey(
        pubPem: String,
        privPem: String,
        kid: String,
        forSign: Boolean
    ): RSAKey {
        val pubContent = pubPem
            .replace("-----BEGIN PUBLIC KEY-----", "")
            .replace("-----END PUBLIC KEY-----", "")
            .replace(Regex("\\s"), "")
        val privContent = privPem
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replace(Regex("\\s"), "")

        val decodedPub = Base64.getDecoder().decode(pubContent)
        val decodedPriv = Base64.getDecoder().decode(privContent)

        val kf = KeyFactory.getInstance("RSA")
        val publicKey = kf.generatePublic(X509EncodedKeySpec(decodedPub)) as RSAPublicKey
        val privateKey = kf.generatePrivate(PKCS8EncodedKeySpec(decodedPriv)) as RSAPrivateKey

        val builder = RSAKey.Builder(publicKey)
            .privateKey(privateKey)
            .keyID(kid)

        if (forSign) {
            builder
                .algorithm(JWSAlgorithm.RS256)
                .keyUse(KeyUse.SIGNATURE)
        } else {
            builder
                .algorithm(JWEAlgorithm.RSA_OAEP_256)
                .keyUse(KeyUse.ENCRYPTION)
        }

        return builder.build()
    }
}
```

:::

<span style="display:block; height:1rem;"></span>

### SecurityUtils

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.security;

import lombok.experimental.UtilityClass;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Optional;

@UtilityClass
public class SecurityUtils {

    public static final String AUTHORITIES_KEY = "auth";

    public Optional<String> getCurrentUserLogin() {
        var ctx = SecurityContextHolder.getContext();
        return Optional.ofNullable(extractPrincipal(ctx.getAuthentication()));
    }

    private String extractPrincipal(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            return jwt.getSubject();
        }
        if (principal instanceof UserDetails ud) {
            return ud.getUsername();
        }
        if (principal instanceof String username) {
            return username;
        }
        return null;
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.security

import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.oauth2.jwt.Jwt
import java.util.Optional

object SecurityUtils {
  const val AUTHORITIES_KEY = "auth"

  fun getCurrentUserLogin(): Optional<String> {
    val authentication: Authentication? = SecurityContextHolder.getContext().authentication
    return Optional.ofNullable(extractPrincipal(authentication))
  }

  private fun extractPrincipal(authentication: Authentication?): String? {
    return when (val principal = authentication?.principal) {
      is Jwt -> principal.subject
      is UserDetails -> principal.username
      is String -> principal
      else -> null
    }
  }
}
```

:::

<span style="display:block; height:1rem;"></span>

### DomainUserDetailsService

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.security;

import io.github.susimsek.springbootgraphqljwedemo.entity.User;
import io.github.susimsek.springbootgraphqljwedemo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
public class DomainUserDetailsService implements UserDetailsService {

  private final UserRepository userRepository;

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    User user = userRepository.findOneWithAuthoritiesByUsername(username)
      .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

    List<GrantedAuthority> authorities = user.getAuthorities().stream()
      .map(mapping -> mapping.getAuthority().getName())
      .map(SimpleGrantedAuthority::new)
      .collect(Collectors.toList());

    return new org.springframework.security.core.userdetails.User(
      user.getUsername(),
      user.getPassword(),
      user.isEnabled(),  // enabled
      true,              // accountNonExpired
      true,              // credentialsNonExpired
      true,              // accountNonLocked
      authorities
    );
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.security

import io.github.susimsek.springbootgraphqljwedemo.repository.UserRepository
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import java.util.stream.Collectors

class DomainUserDetailsService(
  private val userRepository: UserRepository
) : UserDetailsService {
  override fun loadUserByUsername(username: String): UserDetails {
    val user = userRepository.findOneWithAuthoritiesByUsername(username)
      .orElseThrow { UsernameNotFoundException("User not found with username: $username") }

    val authorities: List<GrantedAuthority> = user.authorities.stream()
      .map { SimpleGrantedAuthority(it.authority.name) }
      .collect(Collectors.toList())

    return org.springframework.security.core.userdetails.User(
      user.username,
      user.password,
      user.enabled,
      true,
      true,
      true,
      authorities
    )
  }
}
```

:::

<span style="display:block; height:1rem;"></span>

### SpringSecurityAuditorAware

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.security;

import org.springframework.data.domain.AuditorAware;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class SpringSecurityAuditorAware implements AuditorAware<String> {

  @Override
  @NonNull
  public Optional<String> getCurrentAuditor() {
    return Optional.of(SecurityUtils.getCurrentUserLogin().orElse("system"));
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.security

import org.springframework.data.domain.AuditorAware
import org.springframework.lang.NonNull
import org.springframework.stereotype.Component

@Component
class SpringSecurityAuditorAware : AuditorAware<String> {
    @NonNull
    override fun getCurrentAuditor(): Optional<String> =
        Optional.of(SecurityUtils.getCurrentUserLogin().orElse("system"))
}
```

:::

<span style="display:block; height:1rem;"></span>

### GraphQlTokenCookieInterceptor

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootjweauthjpademo.security;

import graphql.GraphQLContext;
import io.github.susimsek.springbootjweauthjpademo.dto.TokenDTO;
import org.springframework.graphql.server.WebGraphQlInterceptor;
import org.springframework.graphql.server.WebGraphQlRequest;
import org.springframework.graphql.server.WebGraphQlResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class GraphQlTokenCookieInterceptor implements WebGraphQlInterceptor {

  @Override
  @NonNull
  public Mono<WebGraphQlResponse> intercept(@NonNull WebGraphQlRequest request, Chain chain) {
    return chain.next(request)
      .doOnNext(response -> {
        GraphQLContext ctx = response.getExecutionInput().getGraphQLContext();

        if (Boolean.TRUE.equals(ctx.get("clearAccessToken"))) {
          ResponseCookie expired = CookieUtils.removeAccessTokenCookie();
          response.getResponseHeaders().add(HttpHeaders.SET_COOKIE, expired.toString());
          return;
        }

        TokenDTO tokenDto = ctx.get("accessToken");
        if (tokenDto != null) {
          ResponseCookie cookie = CookieUtils.createAccessTokenCookie(tokenDto);
          response.getResponseHeaders()
            .add(HttpHeaders.SET_COOKIE, cookie.toString());
        }
      });
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootjweauthjpademo.security

import graphql.GraphQLContext
import io.github.susimsek.springbootjweauthjpademo.dto.TokenDTO
import org.springframework.graphql.server.WebGraphQlInterceptor
import org.springframework.graphql.server.WebGraphQlRequest
import org.springframework.graphql.server.WebGraphQlResponse
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseCookie
import org.springframework.stereotype.Component
import reactor.core.publisher.Mono

@Component
class GraphQlTokenCookieInterceptor : WebGraphQlInterceptor {

  override fun intercept(
    request: WebGraphQlRequest,
    chain: WebGraphQlInterceptor.Chain
  ): Mono<WebGraphQlResponse> {
    return chain.next(request)
      .doOnNext { response ->
        val ctx: GraphQLContext = response.executionInput.graphQLContext

        if (ctx.get<Boolean>("clearAccessToken") == true) {
          val expired: ResponseCookie = CookieUtils.removeAccessTokenCookie()
          response.responseHeaders.add(HttpHeaders.SET_COOKIE, expired.toString())
          return@doOnNext
        }

        ctx.get<TokenDTO>("accessToken")?.let { tokenDto ->
          val cookie: ResponseCookie = CookieUtils.createAccessTokenCookie(tokenDto)
          response.responseHeaders.add(HttpHeaders.SET_COOKIE, cookie.toString())
        }
      }
  }
}
```

:::

<span style="display:block; height:1rem;"></span>

### CookieAuthenticationWebSocketInterceptor

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.security;

import io.github.susimsek.springbootgraphqljwedemo.security.CookieUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.server.WebGraphQlInterceptor;
import org.springframework.graphql.server.WebGraphQlRequest;
import org.springframework.graphql.server.WebGraphQlResponse;
import org.springframework.graphql.server.WebSocketGraphQlInterceptor;
import org.springframework.graphql.server.WebSocketGraphQlRequest;
import org.springframework.graphql.server.WebSocketSessionInfo;
import org.springframework.graphql.server.support.AuthenticationExtractor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.oauth2.server.resource.authentication.BearerTokenAuthenticationToken;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;
import reactor.util.context.ContextView;

import java.util.Map;

@RequiredArgsConstructor
public class CookieAuthenticationWebSocketInterceptor implements WebSocketGraphQlInterceptor {

  private final String authenticationAttribute = this.getClass().getName() + ".AUTHENTICATION";
  private final AuthenticationExtractor authExtractor;
  private final AuthenticationManager authenticationManager;

  @Override
  @NonNull
  public Mono<Object> handleConnectionInitialization(@NonNull WebSocketSessionInfo info,
                                                     @NonNull Map<String, Object> payload) {

    Mono<Authentication> headerAuth = authExtractor.getAuthentication(payload);

    Mono<Authentication> cookieAuth = Mono.defer(() -> {
      String token = CookieUtils.resolveToken(info.getHeaders());
      return token != null
        ? Mono.just(new BearerTokenAuthenticationToken(token))
        : Mono.empty();
    });

    return headerAuth
      .switchIfEmpty(cookieAuth)
      .flatMap(this::authenticate)
      .doOnNext(auth -> {
        SecurityContext securityContext = new SecurityContextImpl(auth);
        info.getAttributes().put(this.authenticationAttribute, securityContext);
      })
      .then(Mono.empty());
  }

  @Override
  @NonNull
  public Mono<WebGraphQlResponse> intercept(@NonNull WebGraphQlRequest request,
                                            @NonNull WebGraphQlInterceptor.Chain chain) {
    if (request instanceof WebSocketGraphQlRequest webSocketRequest) {
      Map<String, Object> attributes = webSocketRequest.getSessionInfo().getAttributes();
      SecurityContext securityContext = (SecurityContext) attributes.get(this.authenticationAttribute);
      ContextView contextView = this.getContextToWrite(securityContext);
      return chain.next(request).contextWrite(contextView);
    } else {
      return chain.next(request);
    }
  }

  protected Mono<Authentication> authenticate(Authentication authentication) {
    return Mono.just(this.authenticationManager.authenticate(authentication));
  }

  protected ContextView getContextToWrite(SecurityContext securityContext) {
    return Context.of(SecurityContext.class.getName(), securityContext);
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.security

import io.github.susimsek.springbootgraphqljwedemo.security.CookieUtils
import org.springframework.graphql.server.WebGraphQlInterceptor
import org.springframework.graphql.server.WebGraphQlRequest
import org.springframework.graphql.server.WebGraphQlResponse
import org.springframework.graphql.server.WebSocketGraphQlInterceptor
import org.springframework.graphql.server.WebSocketGraphQlRequest
import org.springframework.graphql.server.WebSocketSessionInfo
import org.springframework.graphql.server.support.AuthenticationExtractor
import org.springframework.lang.NonNull
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContext
import org.springframework.security.core.context.SecurityContextImpl
import org.springframework.security.oauth2.server.resource.authentication.BearerTokenAuthenticationToken
import reactor.core.publisher.Mono
import reactor.util.context.Context
import reactor.util.context.ContextView

class CookieAuthenticationWebSocketInterceptor(
  private val authExtractor: AuthenticationExtractor,
  private val authenticationManager: AuthenticationManager
) : WebSocketGraphQlInterceptor {

  private val authenticationAttribute: String = "${this::class.java.name}.AUTHENTICATION"

  @NonNull
  override fun handleConnectionInitialization(
    @NonNull info: WebSocketSessionInfo,
    @NonNull payload: Map<String, Any>
  ): Mono<Any> {
    val headerAuth: Mono<Authentication> = authExtractor.getAuthentication(payload)

    val cookieAuth: Mono<Authentication> = Mono.defer {
      val token = CookieUtils.resolveToken(info.headers)
      if (token != null) {
        Mono.just(BearerTokenAuthenticationToken(token))
      } else {
        Mono.empty()
      }
    }

    return headerAuth
      .switchIfEmpty(cookieAuth)
      .flatMap { authenticate(it) }
      .doOnNext { auth ->
        val securityContext = SecurityContextImpl(auth)
        info.attributes[authenticationAttribute] = securityContext
      }
      .then(Mono.empty())
  }

  @NonNull
  override fun intercept(
    @NonNull request: WebGraphQlRequest,
    @NonNull chain: WebGraphQlInterceptor.Chain
  ): Mono<WebGraphQlResponse> {
    return if (request is WebSocketGraphQlRequest) {
      val attributes = request.sessionInfo.attributes
      val securityContext = attributes[authenticationAttribute] as SecurityContext
      val contextView: ContextView = getContextToWrite(securityContext)
      chain.next(request).contextWrite(contextView)
    } else {
      chain.next(request)
    }
  }

  protected fun authenticate(authentication: Authentication): Mono<Authentication> =
    Mono.just(authenticationManager.authenticate(authentication))

  protected fun getContextToWrite(securityContext: SecurityContext): ContextView =
    Context.of(SecurityContext::class.java.name, securityContext)
}
```

:::

---

## 🛠️ Step 6: Authentication & Protected Endpoints

In this section, we define the GraphQL controllers and DTOs necessary for:

- AuthController: Authenticates users, issues JWE tokens via a GraphQL mutation, and places `accessToken` or `clearAccessToken` flags into the GraphQLContext.
- HelloController: Expose protected GraphQL queries, subscriptions and mutations for authenticated users and admin-only operations.
- LoginInput: GraphQL input type for login (username/password).
- GreetInput & GreetDTO: GraphQL mutation input and response for a greeting operation.
- TokenDTO: Model the JWE token response including token, type, and expiration.

These components complete the stateless authentication flow in a GraphQL API using JWE tokens and a JPA-backed user store.

### AuthController

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootjweauthjpademo.controller;

import graphql.GraphQLContext;
import io.github.susimsek.springbootjweauthjpademo.dto.LoginInput;
import io.github.susimsek.springbootjweauthjpademo.dto.TokenDTO;
import io.github.susimsek.springbootjweauthjpademo.security.JweUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class AuthController {

  private final AuthenticationManager authenticationManager;
  private final JweUtil jweUtil;

  @MutationMapping
  public TokenDTO login(@Argument LoginInput input,
                        GraphQLContext context) {
    // Authenticate user
    Authentication auth = authenticationManager.authenticate(
      new UsernamePasswordAuthenticationToken(input.username(), input.password())
    );
    SecurityContextHolder.getContext().setAuthentication(auth);

    // Generate JWE token
    TokenDTO tokenDto = jweUtil.generateToken(auth);

    // Store token in GraphQLContext for the interceptor to set cookie
    context.put("accessToken", tokenDto);

    return tokenDto;
  }

  @PreAuthorize("isAuthenticated()")
  @MutationMapping
  public Boolean logout(GraphQLContext context) {
    // Signal the interceptor to clear the cookie
    context.put("clearAccessToken", Boolean.TRUE);
    return true;
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootjweauthjpademo.controller

import graphql.GraphQLContext
import io.github.susimsek.springbootjweauthjpademo.dto.LoginInput
import io.github.susimsek.springbootjweauthjpademo.dto.TokenDTO
import io.github.susimsek.springbootjweauthjpademo.security.JweUtil
import org.springframework.graphql.data.method.annotation.Argument
import org.springframework.graphql.data.method.annotation.MutationMapping
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Controller

@Controller
class AuthController(
  private val authenticationManager: AuthenticationManager,
  private val jweUtil: JweUtil
) {

  @MutationMapping
  fun login(
    @Argument input: LoginInput,
    context: GraphQLContext
  ): TokenDTO {
    // Authenticate user
    val auth = authenticationManager.authenticate(
      UsernamePasswordAuthenticationToken(input.username, input.password)
    )
    SecurityContextHolder.getContext().authentication = auth

    // Generate JWE token
    val tokenDto = jweUtil.generateToken(auth)

    // Store token in GraphQLContext for the interceptor to set cookie
    context.put("accessToken", tokenDto)

    return tokenDto
  }

  @PreAuthorize("isAuthenticated()")
  @MutationMapping
  fun logout(context: GraphQLContext): Boolean {
    // Signal the interceptor to clear the cookie
    context.put("clearAccessToken", true)
    return true
  }
}
```

:::

<span style="display:block; height:1rem;"></span>

### HelloController

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.controller;

import io.github.susimsek.springbootgraphqljwedemo.dto.GreetDTO;
import io.github.susimsek.springbootgraphqljwedemo.dto.GreetInput;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SubscriptionMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.time.Instant;

import static io.github.susimsek.springbootgraphqljwedemo.security.SecurityUtils.AUTHORITIES_KEY;

@Controller
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class HelloController {

  @QueryMapping
  public String helloAll(@AuthenticationPrincipal Jwt jwt) {
    var roles = jwt.getClaimAsStringList(AUTHORITIES_KEY);
    return "Hello, " + jwt.getSubject() + "! Your roles: " + roles;
  }

  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  @QueryMapping
  public String helloAdmin(@AuthenticationPrincipal Jwt jwt) {
    return "Hello Admin, " + jwt.getSubject() + "!";
  }

  @MutationMapping
  public GreetDTO greet(
    @Argument GreetInput input,
    @AuthenticationPrincipal Jwt jwt
  ) {
    String msg = "Hello " + jwt.getSubject() + ", you said: " + input.getMessage();
    return new GreetDTO(msg, Instant.now());
  }

  @SubscriptionMapping("greetStream")
  public Flux<GreetDTO> greetStream(
    @Argument GreetInput input,
    @AuthenticationPrincipal Jwt jwt
  ) {
    return Flux.interval(Duration.ofSeconds(1))
      .map(i -> {
        String msg = "Hello " + jwt.getSubject()
          + ", you said: " + input.getMessage()
          + " (event " + (i + 1) + ")";
        return new GreetDTO(msg, Instant.now());
      });
  }

  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  @SubscriptionMapping("greetStreamAdmin")
  public Flux<GreetDTO> greetStreamAdmin(
    @Argument GreetInput input,
    @AuthenticationPrincipal Jwt jwt
  ) {
    return Flux.interval(Duration.ofSeconds(2))
      .map(i -> {
        String msg = "Hello Admin " + jwt.getSubject()
          + ", you said: " + input.getMessage()
          + " (admin event " + (i + 1) + ")";
        return new GreetDTO(msg, Instant.now());
      });
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin

```

:::

<span style="display:block; height:1rem;"></span>

### LoginInput

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.dto;

public record LoginInput(
  String username,
  String password
) {}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.dto

data class LoginInput(
  val username: String,
  val password: String
)
```

:::

<span style="display:block; height:1rem;"></span>

### GreetInput

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.dto;

public record GreetInput(
  String message
) {}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.dto

data class GreetInput(
  val message: String
)
```

:::

<span style="display:block; height:1rem;"></span>

### GreetDTO

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.dto;

import java.time.Instant;

public record GreetDTO(
  String greeting,
  Instant timestamp
) {}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.dto

import java.time.Instant

data class GreetDTO(
  val greeting: String,
  val timestamp: Instant
)
```

:::

<span style="display:block; height:1rem;"></span>

### TokenDTO

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootgraphqljwedemo.dto;

public record TokenDTO(
  String accessToken,
  String tokenType,
  long accessTokenExpiresIn
) {}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootgraphqljwedemo.dto

data class TokenDTO(
  val accessToken: String,
  val tokenType: String,
  val accessTokenExpiresIn: Long
)
```

:::

---

## ▶️ Run the App

```bash
./mvnw spring-boot:run
# or
gradle bootRun
```

If you have GraalVM 22.3+ installed, you can compile a native image with the `native` profile:

```bash
./mvnw native:compile -Pnative
```

After successful native-image compilation, the executable will be generated under `target/` (e.g., `target/spring-boot-graphql-jwe-auth-demo`). Run it directly:

```bash
./target/spring-boot-graphql-jwe-auth-demo
```

Optionally, compress the native executable using UPX for a smaller file size (if UPX is installed):

```bash
upx --ultra-brute --lzma target/spring-boot-graphql-jwe-auth-demo
```

---

## 🧪 Test GraphQL Endpoints

### Admin Flow

Login as admin and capture the JWE token from the `Set-Cookie` header:

```bash
curl -i -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{ "query": "mutation { login(input: { username: \"admin\", password: \"adminpass\" }) { accessToken tokenType accessTokenExpiresIn } }" }'
```

- Set-Cookie header contains `accessToken=<jwe-token>`
- Response body:

```json
{
  "data": {
    "login": {
      "accessToken": "<jwe-token>",
      "tokenType": "Bearer",
      "accessTokenExpiresIn": 3600
    }
  }
}
```

Use cookie to access hello endpoint:

```bash
curl -b "accessToken=<jwe-token>" \
  -H "Content-Type: application/json" \
  -d '{ "query": "{ helloAll }" }' \
  http://localhost:8080/graphql
```

Use Authorization header instead:

```bash
curl -H "Authorization: Bearer <jwe-token>" \
  -H "Content-Type: application/json" \
  -d '{ "query": "{ helloAll }" }' \
  http://localhost:8080/graphql
```

Call the admin-restricted `helloAdmin` query:

```bash
curl -H "Authorization: Bearer <jwe-token>" \
  -H "Content-Type: application/json" \
  -d '{ "query": "{ helloAdmin }" }' \
  http://localhost:8080/graphql
```

Execute the `logout` mutation to clear the session cookie:

```bash
curl -H "Authorization: Bearer <jwe-token>" \
  -H "Content-Type: application/json" \
  -d '{ "query": "mutation { logout }" }' \
  http://localhost:8080/graphql
```

### User Flow

Login as user and capture JWE token from cookie:

```bash
curl -i -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{ "query": "mutation { login(input: { username: \"user\", password: \"userpass\" }) { accessToken tokenType accessTokenExpiresIn } }" }'
```

- Set-Cookie header contains `accessToken=<jwe-token>`

Use cookie to call `helloAll`:

```bash
curl -b "accessToken=<jwe-token>" \
  -H "Content-Type: application/json" \
  -d '{ "query": "{ helloAll }" }' \
  http://localhost:8080/graphql
```

Use Authorization header:

```bash
curl -H "Authorization: Bearer <jwe-token>" \
  -H "Content-Type: application/json" \
  -d '{ "query": "{ helloAll }" }' \
  http://localhost:8080/graphql
```

Attempt the `helloAdmin` query (should return errors with 403):

```bash
curl -H "Authorization: Bearer <jwe-token>" \
  -H "Content-Type: application/json" \
  -d '{ "query": "{ helloAdmin }" }' \
  http://localhost:8080/graphql
```

### Subscription Test via GraphiQL

Test subscriptions directly in the GraphiQL UI at `http://localhost:8080/graphiql`:

1. Token Retrieval in GraphiQL

1. In the Query pane, enter:

   ```graphql
   mutation Login($in: LoginInput!) {
     login(input: $in) {
       accessToken
     }
   }
   ```

1. Switch to the Variables pane and add:

   ```json
   {
     "in": { "username": "admin", "password": "adminpass" }
   }
   ```

1. Click ▶️ to execute and copy the returned `accessToken` from the response.

<span style="display:block; height:1rem;"></span>

2. Configure Headers

1. Click the Headers tab in the sidebar.
1. Add:

   ```json
   {
     "Authorization": "Bearer <accessToken>"
   }
   ```

<span style="display:block; height:1rem;"></span>

3. Subscribe as User

1. Switch to the Subscriptions pane.
1. Enter:

   ```graphql
   subscription UserSubscribe($in: GreetInput!) {
     greetStream(input: $in) {
       greeting
       timestamp
     }
   }
   ```

1. In Variables, set:

   ```json
   {
     "in": { "message": "Hello via GraphiQL!" }
   }
   ```

1. Click ▶️ to start streaming messages from `greetStream`.

<span style="display:block; height:1rem;"></span>

4. Subscribe as Admin

1. In the same Subscriptions pane, enter:

   ```graphql
   subscription AdminSubscribe($in: GreetInput!) {
     greetStreamAdmin(input: $in) {
       greeting
       timestamp
     }
   }
   ```

1. Use the same Variables panel.
1. Click ▶️. Only tokens with `ROLE_ADMIN` receive data; others see an authorization error.

---

## 🏁 Conclusion

This setup delivers a robust, production-ready Spring Boot GraphQL JWE Authentication solution in Spring Boot, combining best practices, clear structure, and practical examples you can adapt to your own project.
