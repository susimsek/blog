---
title: 'Building a REST API with Spring Boot'
date: '2024-12-10'
summary: 'Learn how to create a REST API using Spring Boot. Includes HTTP methods, JSON handling, Lombok integration, and curl for testing.'
thumbnail: '/images/spring-boot-rest-api-thumbnail.jpg'
topics:
  - id: 'spring-boot'
    name: 'Spring Boot'
    color: 'green'
  - id: 'rest-api'
    name: 'REST API'
    color: 'blue'
  - id: 'programming'
    name: 'Programming'
    color: 'orange'
---

Spring Boot is an excellent tool for quickly developing RESTful web services. In this article, we’ll walk through creating a REST API step by step using Spring Boot.

---

## **What is a REST API?**

REST (Representational State Transfer) is an architectural style for designing web services. It uses standard HTTP methods for communication between clients and servers.

### **HTTP Methods**

| **Method** | **Description**                | **Example Endpoint** |
| ---------- | ------------------------------ | -------------------- |
| **GET**    | Retrieves a resource.          | `/api/todos`         |
| **POST**   | Creates a new resource.        | `/api/todos`         |
| **PUT**    | Updates or creates a resource. | `/api/todos/1`       |
| **DELETE** | Deletes a resource.            | `/api/todos/1`       |

---

## **Step 1: Create a Project**

You can create a Spring Boot project using [Spring Initializr](https://start.spring.io/). Select the following settings:

- **Project:** Maven
- **Language:** Java or Kotlin
- **Spring Boot Version:** 3.0.0+
- **Dependencies:** Spring Web, Spring Boot DevTools, Lombok

Download the project, open it in your IDE, and get ready to run it.

---

## **Step 2: Create a Model Class**

Create a model class for a `Todo` object:

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

## **Step 3: Create a Controller Class**

Add a `TodoController` class to define CRUD operations as REST endpoints:

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

## **Step 4: Test the API**

Test your API using `curl` commands:

- **GET All Todos:**

```bash
curl -X GET http://localhost:8080/api/todos
```

- **POST New Todo:**

```bash
curl -X POST http://localhost:8080/api/todos -H "Content-Type: application/json" -d '{"title": "New Todo", "completed": false}'
```

- **PUT Update Todo:**

```bash
curl -X PUT http://localhost:8080/api/todos/1 -H "Content-Type: application/json" -d '{"title": "Updated Todo", "completed": true}'
```

- **DELETE Delete Todo:**

```bash
curl -X DELETE http://localhost:8080/api/todos/1
```

---

By following these steps, you’ll have built a REST API with Spring Boot.
