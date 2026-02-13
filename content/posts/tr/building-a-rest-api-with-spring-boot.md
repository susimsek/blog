---
title: 'Spring Boot ile REST API Geliştirme'
date: '2024-12-10'
summary: 'Spring Boot kullanarak REST API nasıl geliştirilir? HTTP metodları, JSON veri işleme, Lombok entegrasyonu ve curl ile test etme.'
thumbnail: '/images/spring-boot-rest-api-thumbnail.webp'
readingTime: '3 dk okuma'
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
  - id: 'rest-api'
    name: 'REST API'
    color: 'orange'
  - id: 'programming'
    name: 'Programlama'
    color: 'blue'
---

Spring Boot, RESTful web servislerini hızlı ve kolay bir şekilde geliştirmek için mükemmel bir araçtır. Bu yazıda, Spring Boot kullanarak bir REST API'nin nasıl oluşturulacağını adım adım göreceğiz.

---

## 🌟 REST API Nedir?

REST (Representational State Transfer), web servisleri tasarlamak için kullanılan bir mimari stilidir. İstemciler ile sunucular arasındaki iletişimde standart HTTP yöntemlerini kullanır.

### HTTP Yöntemleri

Bu alt bölümde HTTP Yöntemleri için, sonraki örneği doğru okumayı kolaylaştıran kısa bir bağlam veriyoruz.

| Yöntem | Açıklama                          | Örnek Endpoint |
| ------ | --------------------------------- | -------------- |
| GET    | Bir kaynağı alır.                 | `/api/todos`   |
| POST   | Yeni bir kaynak oluşturur.        | `/api/todos`   |
| PUT    | Kaynağı günceller veya oluşturur. | `/api/todos/1` |
| DELETE | Kaynağı siler.                    | `/api/todos/1` |

---

## 📋 Gereksinimler

Başlamadan önce aşağıdakilerin hazır olduğundan emin olun:

- Java 17+
- Maven veya Gradle
- Bir IDE (IntelliJ IDEA, Eclipse, VS Code)
- HTTP metodları ve JSON payload yapısı hakkında temel bilgi

---

## 🛠️ Adım 1: Proje Oluşturma

Spring Boot projesini [Spring Initializr](https://start.spring.io/) kullanarak oluşturabilirsiniz. Aşağıdaki ayarları seçin:

- Proje: Maven
- Dil: Java veya Kotlin
- Spring Boot Sürümü: 3.0.0+
- Bağımlılıklar: Spring Web, Spring Boot DevTools, Lombok

Projeyi indirin, IDE'nizde açın ve çalıştırmaya hazırlanın.

---

## 🛠️ Adım 2: Model Sınıfı Oluşturma

`Todo` nesnesi için bir model sınıfı oluşturun:

:::tabs
@tab Java [icon=java]

```java filename="Todo.java"
package com.example.demo.model;

import lombok.Data;

@Data
public class Todo {
    private Long id;
    private String title;
    private boolean completed;
}
```

@tab Kotlin [icon=kotlin]

```kotlin filename="Todo.kt"
package com.example.demo.model

data class Todo(
    var id: Long,
    var title: String,
    var completed: Boolean
)
```

:::

---

## 🛠️ Adım 3: Controller Sınıfı Oluşturma

CRUD işlemlerini tanımlayan bir `TodoController` sınıfı ekleyin:

:::tabs
@tab Java [icon=java]

```java filename="TodoController.java"
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

@tab Kotlin [icon=kotlin]

```kotlin filename="TodoController.kt"
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

## 🧪 Adım 4: API'yi Test Etme

API'nizi test etmek için `curl` komutlarını kullanın:

- GET Tüm Todos:

```bash
curl -X GET http://localhost:8080/api/todos
```

- POST Yeni Todo:

```bash
curl -X POST http://localhost:8080/api/todos -H "Content-Type: application/json" -d '{"title": "New Todo", "completed": false}'
```

- PUT Todo Güncelleme:

```bash
curl -X PUT http://localhost:8080/api/todos/1 -H "Content-Type: application/json" -d '{"title": "Updated Todo", "completed": true}'
```

- DELETE Todo Silme:

```bash
curl -X DELETE http://localhost:8080/api/todos/1
```

---

## 🏁 Sonuç

Artık REST API Geliştirme için üretim odaklı bir Spring Boot temeliniz var. Sonraki adımda ayarları kendi domainine uyarlayıp test ve gözlemlenebilirlik katmanını ekleyerek gerçek trafik altında doğrulayın.
