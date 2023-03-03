require("dotenv").config();
const Person = require("./models/contacts");
const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT;

app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :body")
);
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(express.json());

app.use(cors());
app.use(express.static("build"));

app.get("/api/persons", async (request, response) => {
  await Person.find({}).then((people) => {
    response.json(people);
  });
});

app.get("/api/persons/:id", async (request, response, next) => {
  await Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error));
});

app.delete("/api/persons/:id", async (request, response, next) => {
  await Person.findByIdAndRemove(request.params.id)
    .then((result) => {
      response.status(204).end();
    })
    .catch((error) => next(error));
});

app.put("/api/persons/:id", (request, response, next) => {
    Person.findByIdAndUpdate({ _id: request.params.id }, request.body,{new:true})
    .then((result) => {
      response.json(result);
    })
    .catch((error) => next(error));
});

app.post("/api/persons", async(request, response, next) => {
  const body = request.body;
  const person = new Person({
    name: body.name,
    number: body.number,
    email: body.email,
    image: body.image,
  })

  await person
    .save()
    .then((savedPerson) => {
      response.json(savedPerson);
    })
    .catch((error) => next(error));
});

morgan.token("body", (req) => JSON.stringify(req.body.content));

const errorHandler = (error, request, response, next) => {
  console.error(error.message);
  if (error.name === "CastError") {
    return response.status(404).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  }
  next(error);
};
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
