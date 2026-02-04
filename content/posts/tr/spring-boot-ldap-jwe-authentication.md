---
title: 'Spring Boot LDAP ve JWE Kimlik Doğrulama'
date: '2025-05-10'
summary: 'LDAP kimlik doğrulama ve JWE şifreli JWT’lerle Spring Boot API’lerinizi external directory entegrasyonu ve token gizliliği ile nasıl güvene alacağınızı öğrenin.'
thumbnail: '/images/spring-boot-ldap-jwe-auth-thumbnail.webp'
readingTime: '5 dk okuma'
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
    name: 'Güvenlik'
    color: 'blue'
  - id: 'jwt'
    name: 'JWT'
    color: 'pink'
  - id: 'jwe'
    name: 'JWE'
    color: 'orange'
  - id: 'ldap'
    name: 'LDAP'
    color: 'red'
  - id: 'programming'
    name: 'Programlama'
    color: 'brown'
---

Spring Boot, LDAP kimlik doğrulamasını JWE ile şifrelenmiş JWT’lerle birleştirerek API’larınızı hem external directory hem de token gizliliğiyle güvence altına almanızı sağlar.

---

## 🌟 Neden LDAP ve JWE?

- **Dış Directory**: LDAP ile kullanıcı yönetimini merkezi hale getirin (kurumsal veya gömülü directory).
- **Bütünlük & Gizlilik**: Token’ları imzalayın (JWS) ve şifreleyin (JWE) — güvenli taşıma.
- **Standartlara Uygun**: JOSE (JWS & JWE) ve Spring Security OAuth2 Resource Server.
- **Rol Tabanlı Erişim**: LDAP gruplarını `ROLE_USER` / `ROLE_ADMIN` rollerine otomatik eşleyin.

---

## 📋 Gereksinimler

- ☕ **Java Development Kit (JDK) 17** veya üzeri
- 📦 **Spring Boot 3.2+**
- 🗄️ **LDAP** (Embedded veya harici)
- 🔤 **IDE** (IntelliJ IDEA, Eclipse vb.)

---

## 🛠️ Adım 1: Bağımlılıkları Ekle

Bu satırları `pom.xml` veya `build.gradle` dosyanıza ekleyin.

**Maven:**

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.security</groupId>
  <artifactId>spring-security-oauth2-resource-server</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.security</groupId>
  <artifactId>spring-security-ldap</artifactId>
</dependency>
<dependency>
  <groupId>com.unboundid</groupId>
  <artifactId>unboundid-ldapsdk</artifactId>
</dependency>
<dependency>
  <groupId>org.projectlombok</groupId>
  <artifactId>lombok</artifactId>
  <optional>true</optional>
</dependency>
```

**Gradle:**

```groovy
implementation 'org.springframework.boot:spring-boot-starter-web'
implementation 'org.springframework.security:spring-security-oauth2-resource-server'
implementation 'org.springframework.security:spring-security-ldap'
implementation 'com.unboundid:unboundid-ldapsdk'
compileOnly 'org.projectlombok:lombok'
```

---

## 🛠️ Adım 2: Anahtar ve LDAP Yapılandırması

Embeded LDAP directory, kullanıcı/grup yapınızı ve RSA anahtar özelliklerinizi `application.yml` ve `schema.ldif` dosyalarında tanımlayın:

### application.yml

```yaml
spring:
  ldap:
    embedded:
      ldif: classpath:schema.ldif
      base-dn: dc=suaybsimsek,dc=com
      port: 8389
    urls: ldap://localhost:8389
    base: dc=suaybsimsek,dc=com
security:
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

### LDAP Schema (schema.ldif)

```ldif
# 1) Root DN
 dn: dc=suaybsimsek,dc=com
 objectClass: top
 objectClass: domain
 objectClass: extensibleObject
 dc: suaybsimsek

# 2) People OU
 dn: ou=people,dc=suaybsimsek,dc=com
 objectClass: top
 objectClass: organizationalUnit
 ou: people

# 3) Admin user
 dn: uid=admin,ou=people,dc=suaybsimsek,dc=com
 objectClass: top
 objectClass: person
 objectClass: inetOrgPerson
 cn: Admin User
 sn: User
 uid: admin
 userPassword: $2a$10$sva6wl8pmGKJE6NIWrxwcuJK1Jaa2I/LOI43iHVpbR4YB8KjGViiK

# 4) Normal user
 dn: uid=user,ou=people,dc=suaybsimsek,dc=com
 objectClass: top
 objectClass: person
 objectClass: inetOrgPerson
 cn: Normal User
 sn: User
 uid: user
 userPassword: $2a$10$5Py4PyteLuXEqnGpSigzfu0V55C7Hi7zX18lmh.J8Bpmft.h23voG

# 5) Groups OU
 dn: ou=groups,dc=suaybsimsek,dc=com
 objectClass: top
 objectClass: organizationalUnit
 ou: groups

# 6) USER group → maps to ROLE_USER
 dn: cn=USER,ou=groups,dc=suaybsimsek,dc=com
 objectClass: top
 objectClass: groupOfUniqueNames
 cn: USER
 uniqueMember: uid=user,ou=people,dc=suaybsimsek,dc=com
 uniqueMember: uid=admin,ou=people,dc=suaybsimsek,dc=com

# 7) ADMIN group → maps to ROLE_ADMIN
 dn: cn=ADMIN,ou=groups,dc=suaybsimsek,dc=com
 objectClass: top
 objectClass: groupOfUniqueNames
 cn: ADMIN
 uniqueMember: uid=admin,ou=people,dc=suaybsimsek,dc=com
```

Bu yapılandırma, tanımlı şema ile embedded bir LDAP sunucusunu ayağa kaldırır ve JWE imzalama ile şifreleme için RSA anahtarlarını yükler. Artık Spring Security’yi LDAP kimlik doğrulaması ve JWE tabanlı token oluşturma için yapılandırabilirsiniz.

---

## 🛠️ Adım 3: Güvenlik Yapılandırması

Bu bölümde, LDAP kimlik doğrulamasını yapılandırmak, RSA anahtarlarını ayarlamak ve JWE tabanlı kimlik doğrulama için HTTP güvenlik filtrelerini uygulamak üzere gerekli bean’leri ve özellikleri tanımlıyoruz:

- **JwtProperties**: JWT encoder/decoder için imzalama ve şifreleme anahtar çiftlerini, issuer bilgisini ve expire süresini tanımlar.
- **SecurityJwtConfig**: RSA JWK nesnelerini oluşturur, JWT encoder/decoder’ı, authentication converter ve token resolveri yapılandırır.
- **SecurityConfig**: Embedded LDAP kimlik doğrulamasını tanımlar ve stateless bir güvenlik filtresi zinciri kurarak ilgili URL’leri yetkilendirmeye tabi tutar.

<span style="display:block; height:1rem;"></span>

### SecurityJwtConfig

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootldapjwedemo.config;

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
import io.github.susimsek.springbootldapjwedemo.security.CookieBearerTokenResolver;
import io.github.susimsek.springbootldapjwedemo.security.KeyUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;

import java.util.List;

import static io.github.susimsek.springbootldapjwedemo.security.SecurityUtils.AUTHORITIES_KEY;

@Configuration
public class SecurityJwtConfig {

    private final JwtProperties props;
    public SecurityJwtConfig(JwtProperties props) { this.props = props; }

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
        JWKSet jwkSet = new JWKSet(List.of(
            signingKey,
            encryptionKey
        ));
        return (jwkSelector, context) -> jwkSelector.select(jwkSet);
    }

    @Bean
    public JwtDecoder jwtDecoder(JWKSource<SecurityContext> jwkSource) {
        DefaultJWTProcessor<SecurityContext> jwtProcessor = new DefaultJWTProcessor<>();
        JWEDecryptionKeySelector<SecurityContext> jweKeySelector =
            new JWEDecryptionKeySelector<>(
                JWEAlgorithm.RSA_OAEP_256,
                EncryptionMethod.A128GCM,
                jwkSource
            );
        jwtProcessor.setJWEKeySelector(jweKeySelector);

        JWSVerificationKeySelector<SecurityContext> jwsKeySelector =
            new JWSVerificationKeySelector<>(
                JWSAlgorithm.RS256,
                jwkSource
            );
        jwtProcessor.setJWSKeySelector(jwsKeySelector);
        jwtProcessor.setJWTClaimsSetVerifier((claims, context) -> {});

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
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootldapjwedemo.config

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
import io.github.susimsek.springbootldapjwedemo.security.CookieBearerTokenResolver
import io.github.susimsek.springbootldapjwedemo.security.KeyUtils
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.JwtEncoder
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver

@Configuration
class SecurityJwtConfig(private val props: JwtProperties) {

    @Bean
    @Throws(Exception::class)
    fun signingKey(): RSAKey =
        KeyUtils.buildRsaKey(
            props.signing.publicKey,
            props.signing.privateKey,
            props.signing.keyId,
            true
        )

    @Bean
    @Throws(Exception::class)
    fun encryptionKey(): RSAKey =
        KeyUtils.buildRsaKey(
            props.encryption.publicKey,
            props.encryption.privateKey,
            props.encryption.keyId,
            false
        )

    @Bean
    fun jwkSource(signingKey: RSAKey, encryptionKey: RSAKey): JWKSource<SecurityContext> {
        val jwkSet = JWKSet(listOf(signingKey, encryptionKey))
        return JWKSource { jwkSelector, context -> jwkSelector.select(jwkSet) }
    }

    @Bean
    fun jwtDecoder(jwkSource: JWKSource<SecurityContext>): JwtDecoder {
        val jwtProcessor = DefaultJWTProcessor<SecurityContext>()
        val jweKeySelector = JWEDecryptionKeySelector(
            JWEAlgorithm.RSA_OAEP_256,
            EncryptionMethod.A128GCM,
            jwkSource
        )
        jwtProcessor.jweKeySelector = jweKeySelector
        val jwsKeySelector = JWSVerificationKeySelector(
            JWSAlgorithm.RS256,
            jwkSource
        )
        jwtProcessor.jwsKeySelector = jwsKeySelector
        jwtProcessor.jwtClaimsSetVerifier = { _, _ -> }
        return NimbusJwtDecoder(jwtProcessor)
    }

    @Bean
    fun jwtEncoder(jwkSource: JWKSource<SecurityContext>): JwtEncoder =
        NimbusJwtEncoder(jwkSource)

    @Bean
    fun jwtAuthenticationConverter(): JwtAuthenticationConverter {
        val converter = JwtGrantedAuthoritiesConverter().apply {
            setAuthorityPrefix("")
            setAuthoritiesClaimName(AUTHORITIES_KEY)
        }
        return JwtAuthenticationConverter().apply {
            setJwtGrantedAuthoritiesConverter(converter)
        }
    }

    @Bean
    fun bearerTokenResolver(): BearerTokenResolver =
        CookieBearerTokenResolver().apply {
            setAllowUriQueryParameter(false)
            setAllowFormEncodedBodyParameter(false)
            setAllowCookie(true)
        }
}
```

:::

<span style="display:block; height:1rem;"></span>

### SecurityConfig

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootldapjwedemo.config;

import io.github.susimsek.springbootldapjwedemo.security.AuthoritiesConstants;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.ldap.core.support.BaseLdapPathContextSource;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.ldap.LdapPasswordComparisonAuthenticationManagerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.ldap.userdetails.DefaultLdapAuthoritiesPopulator;
import org.springframework.security.ldap.userdetails.LdapAuthoritiesPopulator;
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
          .requestMatchers(mvc.pattern("/api/auth/login")).permitAll()
          .requestMatchers(mvc.pattern("/api/hello/admin"))
          .hasAuthority(AuthoritiesConstants.ADMIN)
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
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public LdapAuthoritiesPopulator authorities(BaseLdapPathContextSource contextSource) {
    DefaultLdapAuthoritiesPopulator populator =
      new DefaultLdapAuthoritiesPopulator(contextSource, "ou=groups");
    populator.setGroupSearchFilter("uniqueMember={0}");
    populator.setGroupRoleAttribute("cn");
    populator.setRolePrefix("ROLE_");
    return populator;
  }

  @Bean
  public AuthenticationManager authenticationManager(
    BaseLdapPathContextSource contextSource,
    PasswordEncoder passwordEncoder,
    LdapAuthoritiesPopulator authorities
  ) {
    LdapPasswordComparisonAuthenticationManagerFactory factory =
      new LdapPasswordComparisonAuthenticationManagerFactory(contextSource, passwordEncoder);
    factory.setUserDnPatterns("uid={0},ou=people");
    factory.setPasswordAttribute("userPassword");
    factory.setLdapAuthoritiesPopulator(authorities);
    return factory.createAuthenticationManager();
  }

  @Bean
  public MvcRequestMatcher.Builder mvc(HandlerMappingIntrospector introspector) {
    return new MvcRequestMatcher.Builder(introspector);
  }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootldapjwedemo.config

import io.github.susimsek.springbootldapjwedemo.security.AuthoritiesConstants
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.ldap.core.support.BaseLdapPathContextSource
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.config.ldap.LdapPasswordComparisonAuthenticationManagerFactory
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.ldap.userdetails.DefaultLdapAuthoritiesPopulator
import org.springframework.security.ldap.userdetails.LdapAuthoritiesPopulator
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.servlet.util.matcher.MvcRequestMatcher
import org.springframework.web.servlet.handler.HandlerMappingIntrospector
import org.springframework.security.config.Customizer.withDefaults

@Configuration
@EnableMethodSecurity(securedEnabled = true)
class SecurityConfig {

  @Bean
  fun securityFilterChain(
    http: HttpSecurity,
    mvc: MvcRequestMatcher.Builder
  ): SecurityFilterChain = http
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
        .requestMatchers("/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**")
        .permitAll()
        .requestMatchers(mvc.pattern("/api/auth/login")).permitAll()
        .requestMatchers(mvc.pattern("/api/hello/admin"))
        .hasAuthority(AuthoritiesConstants.ADMIN)
        .anyRequest().authenticated()
    }
    .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
    .oauth2ResourceServer { it.jwt(withDefaults()) }
    .build()

  @Bean
  fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

  @Bean
  fun authorities(contextSource: BaseLdapPathContextSource): LdapAuthoritiesPopulator {
    return DefaultLdapAuthoritiesPopulator(contextSource, "ou=groups").apply {
      setGroupSearchFilter("uniqueMember={0}")
      setGroupRoleAttribute("cn")
      setRolePrefix("ROLE_")
    }
  }

  @Bean
  fun authenticationManager(
    contextSource: BaseLdapPathContextSource,
    passwordEncoder: PasswordEncoder,
    authorities: LdapAuthoritiesPopulator
  ): AuthenticationManager {
    return LdapPasswordComparisonAuthenticationManagerFactory(contextSource, passwordEncoder).apply {
      setUserDnPatterns("uid={0},ou=people")
      setPasswordAttribute("userPassword")
      setLdapAuthoritiesPopulator(authorities)
    }.createAuthenticationManager()
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
package io.github.susimsek.springbootldapjwedemo.config;

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
package io.github.susimsek.springbootldapjwedemo.config

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

### UserProperties

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootldapjwedemo.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "security.user")
@Data
public class UserProperties {
    private String username;
    private String password;
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootldapjwedemo.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

@Configuration
@ConfigurationProperties(prefix = "security.user")
class UserProperties {
  lateinit var username: String
  lateinit var password: String
}
```

:::

---

## 🛠️ Adım 4: Güvenli JWE Token Yardımcı Sınıfları Oluşturun

Bu bölümde, Spring Boot uygulamanızda JSON Web Encryption (JWE) tokenları oluşturmak, şifrelemek ve çözmek için gereken temel yardımcı sınıfları ve sabitleri tanımlıyoruz. Bu bileşenler şunları sağlar:

- **AuthoritiesConstants**: `ROLE_` ön ekiyle rol isimlerini merkezileştirir.
- **CookieBearerTokenResolver**: Bearer token’ları yetkilendirme başlıklarından veya HTTP çerezlerinden çözer.
- **CookieUtils**: Erişim token’ları için HTTP-only ve secure çerezler oluşturur.
- **JweUtil**: Nimbus kütüphanesi ile RSA anahtarları kullanarak JWT’leri imzalar (JWS) ve şifreler (JWE).
- **KeyUtils**: PEM formatındaki anahtar çiftinden RSA JWK’leri oluşturur.
- **SecurityUtils**: SecurityContext oturum açan kullanıcının bilgisini sunar.

Bu yardımcılar, Spring Security ile durumsuz (stateless) JWE tabanlı bir kimlik doğrulama akışının temelini oluşturur.

### AuthoritiesConstants

:::tabs
@tab Java [icon=java]

```java

package io.github.susimsek.springbootldapjwedemo.security;

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

package io.github.susimsek.springbootldapjwedemo.security

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
package io.github.susimsek.springbootldapjwedemo.security;

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
package io.github.susimsek.springbootldapjwedemo.security

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
package io.github.susimsek.springbootldapjwedemo.security;

import io.github.susimsek.springbootldapjwedemo.dto.TokenDTO;
import lombok.experimental.UtilityClass;
import org.springframework.http.ResponseCookie;

@UtilityClass
public class CookieUtils {

    private static final String COOKIE_NAME = "accessToken";

    public ResponseCookie createAccessTokenCookie(TokenDTO tokenDto) {
        return ResponseCookie.from(COOKIE_NAME, tokenDto.accessToken())
            .httpOnly(true)
            .secure(true)
            .path("/")
            .maxAge(tokenDto.accessTokenExpiresIn())
            .sameSite("Strict")
            .build();
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootldapjwedemo.security

import io.github.susimsek.springbootldapjwedemo.dto.TokenDTO
import org.springframework.http.ResponseCookie

object CookieUtils {

  private const val COOKIE_NAME = "accessToken"

  fun createAccessTokenCookie(tokenDto: TokenDTO): ResponseCookie {
    return ResponseCookie.from(COOKIE_NAME, tokenDto.accessToken())
      .httpOnly(true)
      .secure(true)
      .path("/")
      .maxAge(tokenDto.accessTokenExpiresIn())
      .sameSite("Strict")
      .build()
  }
}
```

:::

<span style="display:block; height:1rem;"></span>

### JweUtil

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootldapjwedemo.security;

import com.nimbusds.jose.EncryptionMethod;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWEAlgorithm;
import com.nimbusds.jose.JWEHeader;
import com.nimbusds.jose.JWEObject;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.RSAEncrypter;
import com.nimbusds.jose.jwk.RSAKey;
import io.github.susimsek.springbootldapjwedemo.config.JwtProperties;
import io.github.susimsek.springbootldapjwedemo.dto.TokenDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

import static io.github.susimsek.springbootldapjwedemo.security.SecurityUtils.AUTHORITIES_KEY;

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
package io.github.susimsek.springbootldapjwedemo.security

import com.nimbusds.jose.EncryptionMethod
import com.nimbusds.jose.JOSEException
import com.nimbusds.jose.JWEAlgorithm
import com.nimbusds.jose.JWEHeader
import com.nimbusds.jose.JWEObject
import com.nimbusds.jose.Payload
import com.nimbusds.jose.crypto.RSAEncrypter
import com.nimbusds.jose.jwk.RSAKey
import io.github.susimsek.springbootldapjwedemo.config.JwtProperties
import io.github.susimsek.springbootldapjwedemo.dto.TokenDTO
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
package io.github.susimsek.springbootldapjwedemo.security;

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
package io.github.susimsek.springbootldapjwedemo.security

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
package io.github.susimsek.springbootldapjwedemo.security;

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
package io.github.susimsek.springbootldapjwedemo.security

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

---

# 🔐 Adım 5: Kimlik Doğrulama ve Güvenli Endpointler

Bu bölümde, aşağıdakileri gerçekleştirmek için gerekli REST controller ve DTO’ları tanımlıyoruz:

- **AuthController**: Kullanıcıları doğrular, JWE token’ları oluşturur ve güvenli cookie ayarlar.
- **HelloController**: Kimliği doğrulanmış kullanıcılar ve yalnızca admine özel pathler için güvenli endpointler sunar.
- **LoginRequestDTO**: Login isteği payloadını (kullanıcı adı/parola) modelleyen DTO.
- **TokenDTO**: Token ve geçerlilik süresini içeren kimlik doğrulama yanıtını modelleyen DTO.

Bu bileşenler, login işlemi, token oluşturma, cookie yönetimi ve kaynak korumasını işleyerek stateless(durumsuz) kimlik doğrulama akışını tamamlar.

Bu bölümde, kullanıcı kimlik doğrulamasını, token oluşturmayı ve korunan kaynak erişimini yönetmek için REST controller ve DTO’ları oluşturuyoruz.

### AuthController

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootldapjwedemo.controller;

import io.github.susimsek.springbootldapjwedemo.dto.LoginRequestDTO;
import io.github.susimsek.springbootldapjwedemo.dto.TokenDTO;
import io.github.susimsek.springbootldapjwedemo.security.CookieUtils;
import io.github.susimsek.springbootldapjwedemo.security.JweUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JweUtil jweUtil;

    @PostMapping("/login")
    public ResponseEntity<TokenDTO> login(@RequestBody LoginRequestDTO loginRequest) throws Exception {
        // Authenticate user
        var authToken = new UsernamePasswordAuthenticationToken(
            loginRequest.username(), loginRequest.password()
        );
        Authentication auth = authenticationManager.authenticate(authToken);
        SecurityContextHolder.getContext().setAuthentication(auth);

        // Generate JWE token and cookie
        TokenDTO tokenDto = jweUtil.generateToken(auth);
        ResponseCookie cookie = CookieUtils.createAccessTokenCookie(tokenDto);

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .body(tokenDto);
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootldapjwedemo.controller

import io.github.susimsek.springbootldapjwedemo.dto.LoginRequestDTO
import io.github.susimsek.springbootldapjwedemo.dto.TokenDTO
import io.github.susimsek.springbootldapjwedemo.security.CookieUtils
import io.github.susimsek.springbootldapjwedemo.security.JweUtil
import lombok.RequiredArgsConstructor
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
class AuthController(
    private val authenticationManager: AuthenticationManager,
    private val jweUtil: JweUtil
) {

    @PostMapping("/login")
    fun login(@RequestBody loginRequest: LoginRequestDTO): ResponseEntity<TokenDTO> {
        val authToken = UsernamePasswordAuthenticationToken(
            loginRequest.username, loginRequest.password
        )
        val auth: Authentication = authenticationManager.authenticate(authToken)
        SecurityContextHolder.getContext().authentication = auth

        val tokenDto: TokenDTO = jweUtil.generateToken(auth)
        val cookie: ResponseCookie = CookieUtils.createAccessTokenCookie(tokenDto)

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .body(tokenDto)
    }
}
```

:::

<span style="display:block; height:1rem;"></span>

### HelloController

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootldapjwedemo.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import static io.github.susimsek.springbootldapjwedemo.security.SecurityUtils.AUTHORITIES_KEY;

@RestController
@RequestMapping("/api/hello")
public class HelloController {

    @GetMapping
    public String helloAll(@AuthenticationPrincipal Jwt jwt) {
        String user = jwt.getSubject();
        var roles = jwt.getClaimAsStringList(AUTHORITIES_KEY);
        return "Hello, " + user + "! Your roles: " + roles;
    }

    @GetMapping("/admin")
    public String helloAdmin(@AuthenticationPrincipal Jwt jwt) {
        return "Hello Admin, " + jwt.getSubject() + "!";
    }
}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootldapjwedemo.controller

import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.*

import io.github.susimsek.springbootldapjwedemo.security.SecurityUtils.AUTHORITIES_KEY

@RestController
@RequestMapping("/api/hello")
class HelloController {

    @GetMapping
    fun helloAll(@AuthenticationPrincipal jwt: Jwt): String {
        val user = jwt.subject
        val roles = jwt.getClaimAsStringList(AUTHORITIES_KEY)
        return "Hello, \$user! Your roles: \$roles"
    }

    @GetMapping("/admin")
    fun helloAdmin(@AuthenticationPrincipal jwt: Jwt): String {
        return "Hello Admin, \${jwt.subject}!"
    }
}
```

:::

<span style="display:block; height:1rem;"></span>

### LoginRequestDTO

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootldapjwedemo.dto;

public record LoginRequestDTO(
    String username,
    String password
) { }
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootldapjwedemo.dto

data class LoginRequestDTO(
    val username: String,
    val password: String
)
```

:::

<span style="display:block; height:1rem;"></span>

### TokenDTO

:::tabs
@tab Java [icon=java]

```java
package io.github.susimsek.springbootldapjwedemo.dto;

public record TokenDTO(
    String accessToken,
    String tokenType,
    long accessTokenExpiresIn
) {}
```

@tab Kotlin [icon=kotlin]

```kotlin
package io.github.susimsek.springbootldapjwedemo.dto

import kotlin.Long

data class TokenDTO(
    val accessToken: String,
    val tokenType: String,
    val accessTokenExpiresIn: Long
)
```

:::

---

## ▶️ Uygulamayı Çalıştır

```bash
./mvnw spring-boot:run
# or
gradle bootRun
```

---

## 🧪 Endpoint Testi

### Admin Akışı

**admin** olarak giriş yapın ve `Set-Cookie` başlığından JWE tokeni yakalayın:

```bash
curl -i -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adminpass"}'
```

- **Set-Cookie** başlığı `accessToken=<jwe-token>` içerir
- Yanıt:

```json
{
  "accessToken": "<jwe-token>",
  "tokenType": "Bearer",
  "accessTokenExpiresIn": 3600
}
```

**cookie** kullanarak `hello` endpointine erişin:

```bash
curl -b "accessToken=<jwe-token>" http://localhost:8080/api/hello
```

Veya **Authorization** başlığıyla:

```bash
curl -H "Authorization: Bearer <jwe-token>" http://localhost:8080/api/hello
```

admin-özel endpointine erişin:

```bash
curl -H "Authorization: Bearer <jwe-token>" http://localhost:8080/api/hello/admin
```

### Kullanıcı Akışı

**user** olarak giriş yapın ve **cookie**’den JWE tokeni yakalayın:

```bash
curl -i -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"userpass"}'
```

- **Set-Cookie** başlığı `accessToken=<jwe-token>` içerir

**cookie** kullanarak `hello` endpointine erişin:

```bash
curl -b "accessToken=<jwe-token>" http://localhost:8080/api/hello
```

**Authorization** başlığıyla:

```bash
curl -H "Authorization: Bearer <jwe-token>" http://localhost:8080/api/hello
```

Admin endpointini deneyince (**403 Forbidden** döner):

```bash
curl -H "Authorization: Bearer <jwe-token>" http://localhost:8080/api/hello/admin
# HTTP/1.1 403 Forbidden
```

---

## 🏁 Sonuç

Bu kurulum, Spring Boot ile Spring Boot LDAP ve JWE Kimlik Doğrulama için sağlam ve üretim‑hazır bir yaklaşım sunar; en iyi pratikleri, net bir yapı ve kendi projenize uyarlayabileceğiniz örneklerle birleştirir.
