const { MongoClient, ObjectId } = require("mongodb");

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Falta configurar la variable de entorno MONGODB_URI en Netlify.");
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("learnova_db");

  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("courses");

    // 1. OBTENER TODOS LOS CURSOS (GET)
    if (event.httpMethod === "GET") {
      const courses = await collection.find({}).sort({ createdAt: -1 }).toArray();
      const formatted = courses.map((c) => ({
        id: c._id.toString(),
        title: c.title,
        author: c.author,
        category: c.category,
        description: c.description || "",
        createdAt: c.createdAt
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(formatted)
      };
    }

    // 2. CREAR UN NUEVO CURSO (POST)
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body || "{}");
      const title = (data.title || "").trim();
      const author = (data.author || "").trim();
      const category = (data.category || "").trim();
      const description = (data.description || "").trim();

      if (!title || !author || !category) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Título, creador y categoría son obligatorios." })
        };
      }

      const newCourse = {
        title,
        author,
        category,
        description,
        createdAt: new Date().toISOString()
      };

      const result = await collection.insertOne(newCourse);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          id: result.insertedId.toString(),
          ...newCourse
        })
      };
    }

    // 3. ELIMINAR UN CURSO POR ID (DELETE)
    if (event.httpMethod === "DELETE") {
      const params = event.queryStringParameters || {};
      let id = params.id;

      if (!id && event.body) {
        const parsed = JSON.parse(event.body);
        id = parsed.id;
      }

      if (!id || !ObjectId.isValid(id)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "ID de curso inválido." })
        };
      }

      const deleteResult = await collection.deleteOne({ _id: new ObjectId(id) });

      if (deleteResult.deletedCount === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Curso no encontrado." })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "Curso eliminado correctamente.", id })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Método no permitido." })
    };
  } catch (error) {
    console.error("Error en función courses:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Error interno del servidor al conectar con la base de datos." })
    };
  }
};