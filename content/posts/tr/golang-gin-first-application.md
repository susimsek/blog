---
title: 'Gin - İlk Uygulama'
date: '2024-12-14'
summary: 'Sıfırdan ilk Golang Gin uygulamanızı oluşturmanıza yardımcı olacak, yeni başlayanlar için rehber. Temelleri öğrenin ve Gin ile yolculuğunuza başlayın.'
thumbnail: '/images/golang-gin-first-app-thumbnail.webp'
readingTime: '1 dk okuma'
topics:
  - id: 'go'
    name: 'Go'
    color: 'brown'
  - id: 'gin'
    name: 'Gin'
    color: 'green'
  - id: 'beginner-guide'
    name: 'Başlangıç Rehberi'
    color: 'orange'
  - id: 'programming'
    name: 'Programlama'
    color: 'blue'
---

Gin, Golang ile yüksek performanslı web uygulamaları oluşturma sürecini basitleştirir. Bu rehberde, adım adım ilk Gin uygulamanızı nasıl oluşturacağınızı göstereceğiz.

---

## 🌟 Gereksinimler

📋 Başlamadan önce aşağıdaki gereksinimlere sahip olduğunuzdan emin olun:

- 🔧 **Golang** 1.17+ kurulu
- 🗍 **Bir metin editörü veya IDE** (ör. Visual Studio Code, GoLand veya Vim)

---

## 🛠️ Adım 1: Gin Projenizi Oluşturma

İlk Gin projenizi aşağıdaki adımları izleyerek ayarlayabilirsiniz:

1. **Bir Go Modülü Başlatın**

```bash
mkdir gin-first-app
cd gin-first-app
go mod init gin-first-app
```

2. **Gin Kurulumu**

```bash
go get -u github.com/gin-gonic/gin
```

---

## 🛠️ Adım 2: İlk Endpoint’inizi Yazma

Basit bir "hello" mesajı gönderen bir endpoint yazalım:

`main.go` adında bir dosya oluşturun ve aşağıdaki içeriği ekleyin:

```go
package main

import (
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.GET("/hello", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Merhaba, Gin!",
		})
	})

	r.Run() // 0.0.0.0:8080 üzerinde dinler ve hizmet verir
}
```

---

## ▶️ Adım 3: Uygulamayı Çalıştırma

1. Proje klasörünüzde bir terminal açın.
2. Uygulamanızı çalıştırmak için aşağıdaki komutu çalıştırın:

```bash
go run main.go
```

3. Endpoint'e şu adresten erişin:
   ```
   http://localhost:8080/hello
   ```

**Yanıt:**

```json
{
  "message": "Merhaba, Gin!"
}
```

---

Bu gönderi, bir Gin projesi oluşturmanın, bir endpoint yazmanın ve başarılı bir şekilde çalıştırmanın temel bilgilerini kapsar.
