const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
let db = null;
app.use(express.json());
const format = require("date-fns/format");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Server running successfully"));
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// object
const convertDBToResponseObj = (dbObj) => {
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    priority: dbObj.priority,
    status: dbObj.status,
    category: dbObj.category,
    dueDate: dbObj.due_date,
  };
};

const hasPriorityProperty = (priority) => {
  return priority !== undefined;
};

const hasStatusProperty = (status) => {
  return status !== undefined;
};

const hasPriorityAndStatusProperties = (status, priority) => {
  return priority !== undefined && status !== undefined;
};

const hasCategoryAndStatusProperty = (category, status) => {
  return category !== undefined && status !== undefined;
};

const hasCategoryProperty = (category) => {
  return category !== undefined;
};

const hasCategoryAndPriorityProperty = (category, priority) => {
  return category !== undefined && priority !== undefined;
};

const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
const priorityArray = ["HIGH", "MEDIUM", "LOW"];
const categoryArray = ["HOME", "LEARNING", "WORK"];

// API 1
app.get("/todos/", async (request, response) => {
  let { search_q = " ", priority, status, category } = request.query;
  let getTodosQuery = `
        SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
  `;
  if (hasPriorityAndStatusProperties(status, priority) === true) {
    if (statusArray.includes(status) && priorityArray.includes(priority)) {
      getTodosQuery = `
           SELECT
            * 
           FROM 
              todo 
           WHERE 
               todo LIKE '%${search_q}%'
                AND status = '${status}'
                AND priority = '${priority}';
      `;
      const todos = await db.all(getTodosQuery);
      response.send(todos.map((each) => convertDBToResponseObj(each)));
    } else if (
      statusArray.includes(status) &&
      !priorityArray.includes(priority)
    ) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (
      !statusArray.includes(status) &&
      priorityArray.includes(priority)
    ) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      response.send("Invalid Status and Priority");
    }
  } else if (hasCategoryAndStatusProperty(category, status) === true) {
    if (categoryArray.includes(category) && statusArray.includes(status)) {
      getTodosQuery = `
                SELECT
                    *
                FROM
                    todo
                WHERE todo  LIKE '%${search_q}%'
                AND status = '${status}'
                AND category = '${category}';
          `;
      const todos = await db.all(getTodosQuery);
      response.send(todos.map((each) => convertDBToResponseObj(each)));
    } else if (
      statusArray.includes(status) &&
      !categoryArray.includes(category)
    ) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else if (
      !statusArray.includes(status) &&
      categoryArray.includes(category)
    ) {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (hasCategoryAndPriorityProperty(category, priority) === true) {
    if (categoryArray.includes(category) && priorityArray.includes(priority)) {
      getTodosQuery = `
           SELECT
            * 
           FROM 
              todo 
           WHERE 
               todo LIKE '%${search_q}%'
                AND category = '${category}'
                AND priority = '${priority}';
      `;
      const todos = await db.all(getTodosQuery);
      response.send(todos.map((each) => convertDBToResponseObj(each)));
    } else if (
      categoryArray.includes(category) &&
      !priorityArray.includes(priority)
    ) {
      response.status(400);
      Response.send("Invalid Todo Priority");
    } else if (
      !categoryArray.includes(category) &&
      priorityArray.includes(priority)
    ) {
      response.status(400);
      Response.send("Invalid Todo Category");
    }
  } else if (hasStatusProperty(status) === true) {
    if (statusArray.includes(status)) {
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}';`;
      const todos = await db.all(getTodosQuery);
      response.send(todos.map((each) => convertDBToResponseObj(each)));
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (hasPriorityProperty(priority) === true) {
    if (priorityArray.includes(priority)) {
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}';`;
      const todos = await db.all(getTodosQuery);
      response.send(todos.map((each) => convertDBToResponseObj(each)));
    }
  } else if (hasCategoryProperty(category) === true) {
    if (categoryArray.includes(category)) {
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category = '${category}';`;
      const todos = await db.all(getTodosQuery);
      response.send(todos.map((each) => convertDBToResponseObj(each)));
    } else {
      response.status(400);
      response.send("Invalid Status Todo");
    }
  } else {
    const todos = await db.all(getTodosQuery);
    response.send(todos.map((each) => convertDBToResponseObj(each)));
  }
});

// API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodosQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const todos = await db.get(getTodosQuery);
  response.send(convertDBToResponseObj(todos));
});

// API 3
app.get("/agenda/", async (request, response) => {
  try {
    const { date } = request.query;

    if (date !== undefined) {
      const newDate = new Date(date);
      const formattedDate = format(newDate, "yyyy-MM-dd");
      const getDueDateTodo = `
         SELECT
         *
         FROM
        todo
        WHERE due_date = '${formattedDate}';
    `;
      const todos = await db.all(getDueDateTodo);
      response.send(todos.map((todo) => convertObject(todo)));
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  } catch (e) {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  try {
    if (!statusArray.includes(status)) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (!priorityArray.includes(priority)) {
      response.status(400);
      response.send("Invalid Todo priority");
    } else if (!categoryArray.includes(category)) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else if (dueDate === undefined) {
      response.status(400);
      response.send("Invalid Todo Due Date");
    } else if (dueDate !== undefined) {
      const newDate = new Date(dueDate);
      const formattedDate = format(newDate, "yyyy-MM-dd");
      const getTodosQuery = `
                INSERT INTO todo(id,todo,priority,status,category,due_date)
                VALUES(${id}, '${todo}', '${priority}', '${status}','${category}','${formattedDate}');`;
      await db.run(getTodosQuery);
      response.send("Todo Successfully ");
    }
  } catch (e) {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn;
  const requestBody = request.body;

  switch (true) {
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.status !== undefined:
      if (!statusArray.includes(requestBody.status)) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        updateColumn = "Status";
      }
      break;
    case requestBody.priority !== undefined:
      if (!priorityArray.includes(requestBody.priority)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        updateColumn = "Priority";
      }
      break;
    case requestBody.category !== undefined:
      if (!categoryArray.includes(requestBody.category)) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        updateColumn = "Category";
      }
      break;
    case requestBody.dueDate !== undefined:
      try {
        const newDate = new Date(requestBody.dueDate);
        const formattedDate = format(newDate, "yyyy-MM-dd");
        if (requestBody.dueDate !== formattedDate) {
          response.status(400);
          response.send("Invalid Due Date");
        } else {
          updateColumn = "Due Date";
        }
      } catch (e) {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }

  if (updateColumn !== undefined) {
    const previousTodoQuery = `
            SELECT
                *
            FROM
                todo
            WHERE id = ${todoId};
            `;
    const previousTodo = await db.get(previousTodoQuery);
    const {
      todo = previousTodo.todo,
      status = previousTodo.status,
      priority = previousTodo.priority,
      category = previousTodo.category,
      dueDate = previousTodo.due_date,
    } = request.body;

    const updateTodoQuery = `
            UPDATE
                todo
            SET 
                todo = '${todo}',
                status = '${status}',
                priority = '${priority}',
                category = '${category}',
                due_date = '${dueDate}'
            `;
    await db.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
  }
});

// API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});
