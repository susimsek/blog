---
title: 'Spring Boot ile REST API Geliştirme'
date: '2024-12-10'
summary: 'Spring Boot kullanarak REST API nasıl geliştirilir? HTTP metodları, JSON veri işleme, Lombok entegrasyonu ve curl ile test etme.'
thumbnail: '/images/spring-boot-rest-api-thumbnail.jpg'
topics:
  - id: 'spring-boot'
    name: 'Spring Boot'
    color: 'green'
  - id: 'rest-api'
    name: 'REST API'
    color: 'blue'
  - id: 'programming'
    name: 'Programlama'
    color: 'orange'
---

Spring Boot, RESTful web servislerini hızlı ve kolay bir şekilde geliştirmek için mükemmel bir araçtır. Bu yazıda, Spring Boot kullanarak bir REST API'nin nasıl oluşturulacağını adım adım göreceğiz.

---

## **REST API Nedir?**

REST (Representational State Transfer), web servislerini tasarlamak için kullanılan bir mimari stildir. Temel HTTP metodlarını kullanarak istemcilerle sunucular arasında veri alışverişi yapılır.

### **HTTP Metodları**

| **Metot**  | **Açıklama**                                   | **Örnek Endpoint** |
| ---------- | ---------------------------------------------- | ------------------ |
| **GET**    | Kaynağı alır.                                  | `/api/todos`       |
| **POST**   | Yeni bir kaynak oluşturur.                     | `/api/todos`       |
| **PUT**    | Var olan bir kaynağı günceller veya oluşturur. | `/api/todos/1`     |
| **DELETE** | Bir kaynağı siler.                             | `/api/todos/1`     |

---

## **Adım 1: Proje Oluşturma**

Spring Boot projesi oluşturmak için [Spring Initializr](https://start.spring.io/) kullanabilirsiniz. Aşağıdaki ayarları seçin:

- **Project:** Maven
- **Language:** Java
- **Spring Boot Version:** 3.0.0+
- **Dependencies:** Spring Web, Spring Boot DevTools, Lombok

Projeyi indirin, IDE'nizde açın ve çalıştırmaya hazır olun.

---

## **Adım 2: Model Sınıfı Oluşturma**

`Todo` nesnesi için bir model sınıfı oluşturun:

:::tabs
@tab Java

```java
package com.example.demo.model;

import lombok.Data;

@Data
public class Todo {
    private Long id;
    private String title;
    private boolean completed;
}
```

@tab Kotlin

```kotlin
package com.example.demo.model

data class Todo(
    var id: Long,
    var title: String,
    var completed: Boolean
)
```

:::

---

## **Adım 3: Controller Sınıfı Oluşturma**

`TodoController` adında bir controller sınıfı ekleyerek CRUD işlemleri için REST endpoint'leri tanımlayın:

:::tabs
@tab Java

```java
package com.example.demo.controller;

import com.example.demo.model.Todo;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private List<Todo> todos = new ArrayList<>();

    @GetMapping
    public List<Todo> getAllTodos() {
        return todos;
    }

    @PostMapping
    public Todo createTodo(@RequestBody Todo todo) {
        todo.setId((long) (todos.size() + 1));
        todos.add(todo);
        return todo;
    }

    @PutMapping("/{id}")
    public Todo updateTodo(@PathVariable Long id, @RequestBody Todo updatedTodo) {
        Todo todo = todos.stream().filter(t -> t.getId().equals(id)).findFirst().orElse(null);
        if (todo != null) {
            todo.setTitle(updatedTodo.getTitle());
            todo.setCompleted(updatedTodo.isCompleted());
        }
        return todo;
    }

    @DeleteMapping("/{id}")
    public void deleteTodo(@PathVariable Long id) {
        todos.removeIf(todo -> todo.getId().equals(id));
    }
}
```

@tab Kotlin

```kotlin
package com.example.demo.controller

import com.example.demo.model.Todo
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/todos")
class TodoController {

    private val todos = mutableListOf<Todo>()

    @GetMapping
    fun getAllTodos(): List<Todo> = todos

    @PostMapping
    fun createTodo(@RequestBody todo: Todo): Todo {
        todo.id = (todos.size + 1).toLong()
        todos.add(todo)
        return todo
    }

    @PutMapping("/{id}")
    fun updateTodo(@PathVariable id: Long, @RequestBody updatedTodo: Todo): Todo? {
        val todo = todos.find { it.id == id }
        todo?.apply {
            title = updatedTodo.title
            completed = updatedTodo.completed
        }
        return todo
    }

    @DeleteMapping("/{id}")
    fun deleteTodo(@PathVariable id: Long) {
        todos.removeIf { it.id == id }
    }
}
```

:::

---

## **Adım 4: API'yi Test Etme**

API'nizi `curl` komutlarıyla test edebilirsiniz:

- **GET Tüm Görevler:**

```bash
curl -X GET http://localhost:8080/api/todos
```

- **POST Yeni Görev:**

```bash
curl -X POST http://localhost:8080/api/todos -H "Content-Type: application/json" -d '{"title": "Yeni Görev", "completed": false}'
```

- **PUT Görev Güncelleme:**

```bash
curl -X PUT http://localhost:8080/api/todos/1 -H "Content-Type: application/json" -d '{"title": "Güncellenmiş Görev", "completed": true}'
```

- **DELETE Görev Silme:**

```bash
curl -X DELETE http://localhost:8080/api/todos/1
```

---

Bu adımları izleyerek Spring Boot ile REST API geliştirmiş oldunuz.
