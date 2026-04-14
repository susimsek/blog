---
marp: true
paginate: true
theme: default
title: 'Codex ve GitHub Copilot ile Skill Tabanlı Çalışma'
description: "Sunum deck'i"
---

# Codex ve GitHub Copilot ile Skill Tabanlı Çalışma

## AI'a Uzmanlık Öğretmenin Pratik Yolu

**Sunum odağı**

- Codex'te skill nasıl kurulur?
- GitHub Copilot'ta skill nasıl kurgulanır?
- Ekip içinde tekrar kullanılabilir AI standardı nasıl oluşur?

---

# Neden Bu Konu?

- Her görevde aynı bağlamı yeniden yazıyoruz
- AI bazen repo kurallarını unutuyor
- Kod kalitesi oturumdan oturuma değişiyor
- Aynı mimari ve güvenlik hataları tekrarlanıyor

**Sorun:** iyi prompt yetmiyor  
**İhtiyaç:** kalıcı uzmanlık katmanı

---

# Skill Nedir?

Skill, AI için yazılmış tekrar kullanılabilir uzmanlık paketidir.

Bir skill şunu söyler:

- ne zaman devreye girmeli
- neye dikkat etmeli
- hangi kararları önceliklendirmeli
- hangi hataları flag etmeli
- hangi doğrulamaları istemeli

**Kısa tanım:**  
Skill = "bu işi böyle yap" rehberi

---

# Skill Ne Değildir?

Skill şunlardan biri değildir:

- tek seferlik prompt
- rastgele notlar
- sadece teknoloji etiketi
- uzun ama belirsiz metin

Kötü örnek:

```md
name: java
description: Java ile ilgili şeyler
```

Bu, uzmanlık vermez. Sadece gürültü üretir.

---

# Referans Repo Bize Ne Öğretiyor?

Referans: [piomin/claude-ai-spring-boot](https://github.com/piomin/claude-ai-spring-boot/tree/main)

Bu repo bize şunu gösteriyor:

- genel kurallar ayrı tutulmalı
- uzmanlık küçük dosyalara bölünmeli
- örnek kod ve checklist eklenmeli
- doğrulama zorunlu olmalı

Yani başarı, tek prompt değil; **çalışma sistemi** kurmaktan geliyor.

---

# Codex'te Skill Modeli

Codex tarafında en kullanışlı yapı:

- `AGENTS.md`
- `.agents/skills/<skill>/SKILL.md`
- prompt içinde açık skill çağrısı

**Mantık:**

- `AGENTS.md` genel repo kuralları
- `SKILL.md` belirli uzmanlık

---

# Codex Dosya Yapısı

```text
AGENTS.md
.agents/
  skills/
    spring-boot-backend/
      SKILL.md
    api-security/
      SKILL.md
    jpa-review/
      SKILL.md
```

Bu yapı küçük ekipler için yeterli, büyük ekipler için ölçeklenebilir.

---

# `AGENTS.md` Rolü

`AGENTS.md`, Codex için repo düzeyinde çalışma sözleşmesidir.

Buraya genelde şunlar yazılır:

- mimari kurallar
- test ve lint komutları
- yasaklı pattern'ler
- review beklentisi
- commit ve PR standardı
- hangi skill'in ne zaman zorunlu olduğu

**Özet:**  
`AGENTS.md` = oyunun kuralları

---

# Codex Skill Örneği

```md
---
name: spring-boot-backend
description: Spring Boot servislerinde katmanlı mimari,
validation, transaction sınırları ve test kontrollerini uygula.
---

# Spring Boot Backend

- Controller -> service -> repository katmanını koru
- JPA entity'yi doğrudan controller'dan döndürme
- Request DTO'larında validation zorunlu
- Multi-step write işlemlerinde transaction kontrolü yap
- Yeni endpointlerde pozitif ve negatif test iste
```

---

# Codex'te Skill Nasıl Kullanılır?

Örnek prompt:

```text
Person CRUD servisini ekle.
$spring-boot-backend ve $api-security kullan.
Katmanlı mimariyi koru ve testleri ekle.
```

Review örneği:

```text
Bu PR'ı incele.
$jpa-review ve $code-quality kullan.
Önce kritik riskleri listele.
```

---

# Codex'te İyi Skill Yazma Kuralları

- Bir skill, bir ana işi çözmeli
- Ne zaman kullanılacağı açık olmalı
- Karar kuralları net olmalı
- Gerçek örnek içermeli
- Doğrulama adımı taşımalı
- Gereksiz teori değil, uygulanabilir talimat vermeli

**Kural:** skill düşünmeyi uzatmamalı, yönlendirmeli

---

# GitHub Copilot'ta Skill Modeli

Copilot tarafında yapı biraz farklıdır.

Ana katmanlar:

- `.github/copilot-instructions.md`
- `.github/instructions/*.instructions.md`
- agent skill dosyaları

Burada ayrım şudur:

- instruction = genel davranış
- skill = özel uzmanlık

---

# Copilot'ta Ana Dosyalar

```text
.github/
  copilot-instructions.md
  instructions/
    backend.instructions.md
    security.instructions.md
skills/
  jpa-review/
    SKILL.md
  api-security/
    SKILL.md
```

Not: Ekip tercihine göre skill klasörü yapısı değişebilir. Mantık değişmez.

---

# `copilot-instructions.md` Rolü

Bu dosya Copilot'a sürekli hatırlatmak istediğiniz kuralları taşır:

- katmanlı mimari
- test zorunluluğu
- naming convention
- security beklentileri
- forbidden patterns
- build ve lint akışı

**Özet:**  
Copilot için kalıcı repo bağlamı burada yaşar.

---

# Copilot İçin Genel Talimat Örneği

```md
# Repository Instructions

- Use layered architecture: controller -> service -> repository.
- Never expose JPA entities directly from controllers.
- Add positive and negative tests for each new endpoint.
- Use constructor injection only.
- Validate all request DTOs.
- Prefer pagination for list endpoints.
```

Bu dosya, her promptta tekrar yazmak istemediğiniz kuralları taşır.

---

# Copilot Skill Örneği

```md
---
name: jpa-review
description: Review Hibernate mappings, fetch strategies,
transaction boundaries and N+1 query risks.
---

# JPA Review

- Check for N+1 queries
- Check lazy loading boundaries
- Flag missing pagination
- Prefer DTO projection for read models
- Flag missing transaction boundaries
```

---

# Copilot'ta Skill Nasıl Kullanılır?

Örnek prompt:

```text
Review this Spring Boot PR for JPA risks.
Apply the JPA review skill and follow repository instructions.
```

Kod üretim örneği:

```text
Implement Person CRUD with JWT security.
Follow repository instructions and apply the API security skill.
Add tests for valid and invalid cases.
```

---

# Codex ve Copilot Karşılaştırması

| Konu               | Codex                   | Copilot                       |
| ------------------ | ----------------------- | ----------------------------- |
| Genel repo bağlamı | `AGENTS.md`             | `copilot-instructions.md`     |
| Uzmanlık katmanı   | `.agents/skills/`       | skill + instruction dosyaları |
| Kullanım şekli     | repo kuralları + prompt | repo kuralları + IDE/chat     |
| Güçlü taraf        | derin ajan akışı        | IDE içinde yaygın kullanım    |

Sonuç: ikisi de skill mantığını destekler, entegrasyon şekli farklıdır.

---

# Aynı Senaryo, İki Araç

## Senaryo

JWT ile korunan `Person CRUD` servisi üretmek

## Codex

- `AGENTS.md` mimariyi korur
- `spring-boot-backend` skill'i üretimi yönlendirir
- `api-security` skill'i güvenliği zorlar

## Copilot

- `copilot-instructions.md` genel standardı uygular
- `api-security` skill veya instruction dosyası devreye girer

---

# Ne Zaman Skill Yazmalıyım?

Şu işler tekrar ediyorsa skill yazın:

- her PR'da aynı review yapılıyorsa
- aynı güvenlik hataları çıkıyorsa
- aynı mimari ihlaller görülüyorsa
- release öncesi aynı checklist uygulanıyorsa
- onboarding'de aynı açıklamalar tekrar ediliyorsa

**Skill = tekrar eden uzman kararını otomatikleştirme aracı**

---

# Ekip İçin Minimum Başlangıç Seti

## Codex

- `AGENTS.md`
- `spring-boot-backend`
- `jpa-review`
- `api-security`
- `code-quality`

## Copilot

- `copilot-instructions.md`
- `backend.instructions.md`
- `security.instructions.md`
- `jpa-review`
- `api-security`

---

# En Kritik Tasarım İlkesi

Skill adını teknolojiye göre değil, işe göre verin.

Zayıf:

- `java`
- `spring`
- `backend`

Güçlü:

- `spring-boot-backend`
- `jpa-review`
- `api-security`
- `release-checks`
- `code-quality`

---

# Kapanış

Skill tabanlı çalışma modeli araçtan bağımsızdır.

En pratik özet:

- Codex'te: `AGENTS.md` + `.agents/skills/`
- Copilot'ta: `copilot-instructions` + instruction + skill

Mesele model seçmek değil, uzmanlığı tekrar kullanılabilir hale getirmektir.

---

# Kaynaklar

- Referans repo: [piomin/claude-ai-spring-boot](https://github.com/piomin/claude-ai-spring-boot/tree/main)
- OpenAI: [Introducing the Codex app](https://openai.com/index/introducing-the-codex-app)
- OpenAI: [How OpenAI uses Codex](https://openai.com/business/guides-and-resources/how-openai-uses-codex/)
- GitHub Docs: [Adding repository custom instructions for GitHub Copilot](https://docs.github.com/en/copilot/how-tos/custom-instructions/adding-repository-custom-instructions-for-github-copilot)
- GitHub Docs: [Creating agent skills for GitHub Copilot](https://docs.github.com/pt/copilot/how-tos/use-copilot-agents/coding-agent/create-skills)
