const express = require("express");
const app = express();
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000")
    );
  } catch (error) {
    console.log(`DB error ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const hasHighPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasHighStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasStatusAndPriority = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

//API -1
app.get("/todos/", async (request, response) => {
  let data = null;
  let getRequestQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasStatusAndPriority(request.query):
      getRequestQuery = `
            SELECT * 
            FROM 
            todo 
            WHERE 
                    todo LIKE '%${search_q}%'
                    AND priority='${priority}'AND
                    status = '${status}'`;
      break;
    case hasHighStatusProperty(request.query):
      getRequestQuery = `
            SELECT * FROM todo 
            WHERE 
                    todo LIKE '%${search_q}%'AND
                    status = '${status}'`;
      break;
    case hasHighPriorityProperty(request.query):
      getRequestQuery = `
                SELECT * FROM todo 
                WHERE 
                    todo LIKE '%${search_q}%'AND
                    priority='${priority}';`;
      break;
    default:
      getRequestQuery = `
                SELECT * FROM todo 
                WHERE 
                    todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getRequestQuery);
  response.send(data);
});

//API-2 get request based on todoID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoId = `
            SELECT * 
            FROM 
            todo 
            WHERE 
                id =${todoId}`;

  const todo = await db.get(getTodoId);
  response.send(todo);
});

//API-3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postRequestQuery = `
    INSERT INTO todo (id,todo,priority,status)
    VALUES (${id},'${todo}','${priority}','${status}');`;
  await db.run(postRequestQuery);
  response.send("Todo Successfully Added");
});

// API -4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
        SELECT * FROM todo 
        WHERE 
        id=${todoId}`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
            UPDATE
            todo
            SET
            todo='${todo}',
            priority='${priority}',
            status='${status}'
            WHERE
            id = ${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
