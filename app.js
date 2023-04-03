const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

let database = null;

const dbPath = path.join(__dirname, "todoApplication.db");

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("server is running in http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const resultOFPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const resultOfPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const resultOfStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let dataList = null;
  let getSQlQueryList = "";

  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case resultOFPriorityAndStatus(request.query):
      getSQlQueryList = `
      SELECT
        *
      FROM 
        todo
      WHERE 
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case resultOfStatus(request.query):
      getSQlQueryList = `
      SELECT
        *
       FROM
        todo
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;

    case resultOfPriority(request.query):
      getSQlQueryList = `
      SELECT
        *
      FROM
        todo
      WHERE
        todo LIKE '%${search_q}%'
        AND priority ='${priority}';`;
      break;
    default:
      getSQlQueryList = `
      SELECT
        *
      FROM   
        todo
      WHERE
        todo LIKE '%${search_q}%';`;
  }
  dataList = await database.all(getSQlQueryList);
  response.send(dataList);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  getTodoFromList = `
    SELECT
       *
    FROM
      todo
    WHERE
      id = '${todoId}';`;
  const data = await database.get(getTodoFromList);
  response.send(data);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodo = `
    INSERT INTO
       todo(id, todo,priority,status)
    VALUES
        ('${id}','${todo}','${priority}','${status}');`;
  await database.run(createTodo);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updatedColumn = "";
  let requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;

    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;

    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
  }

  const changesTodoList = `
    SELECT
      *
    FROM 
      todo
    WHERE 
       id ='${todoId}';`;
  const currentTodoList = await database.get(changesTodoList);

  const {
    todo = currentTodoList.todo,
    priority = currentTodoList.priority,
    status = currentTodoList.status,
  } = request.body;

  const updateTodoList = `
  UPDATE 
    todo
  SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
  WHERE 
    id = '${todoId}';`;
  await database.run(updateTodoList);
  response.send(`${updatedColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deletedTodoList = `
    DELETE FROM
      todo
    WHERE
      id = '${todoId}';`;
  await database.run(deletedTodoList);
  response.send("Todo Deleted");
});

module.exports = app;
