---
title: 'Gin - First Application'
date: '2024-12-14'
summary: 'A beginner-friendly guide to creating your first Golang Gin application from scratch. Learn the basics and start your journey with Gin.'
thumbnail: '/images/golang-gin-first-app-thumbnail.webp'
readingTime: '1 min read'
topics:
  - id: 'go'
    name: 'Go'
    color: 'brown'
  - id: 'gin'
    name: 'Gin'
    color: 'green'
  - id: 'beginner-guide'
    name: 'Beginner Guide'
    color: 'orange'
  - id: 'programming'
    name: 'Programming'
    color: 'blue'
---

Gin simplifies the process of building high-performance web applications with Golang. In this guide, we’ll walk through creating your first Gin application step by step.

---

## 📋 Prerequisites

📋 Before starting, ensure you have the following:

- 🔧 Golang 1.17+ installed
- 🗍 A text editor or IDE (e.g., Visual Studio Code, GoLand, or Vim)

---

## 🛠️ Step 1: Set Up Your Gin Project

You can set up your first Gin project by following these steps:

1. Initialize a Go Module

```bash
mkdir gin-first-app
cd gin-first-app
go mod init gin-first-app
```

2. Install Gin

```bash
go get -u github.com/gin-gonic/gin
```

---

## 🛠️ Step 2: Writing Your First Endpoint

Let’s write a simple endpoint to say hello:

Create a file named `main.go` with the following content:

```go
package main

import (
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.GET("/hello", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Hello, Gin!",
		})
	})

	r.Run() // Listen and serve on 0.0.0.0:8080
}
```

---

## ▶️ Step 3: Run the Application

1. Open a terminal in the project folder.
2. Execute the following command to run your application:

```bash
go run main.go
```

3. Access the endpoint at:
   ```
   http://localhost:8080/hello
   ```

Response:

```json
{
  "message": "Hello, Gin!"
}
```

---

## 🏁 Conclusion

This setup delivers a robust, production-ready guide to Gin - First Application, combining best practices, clear structure, and practical examples you can adapt to your own project.
