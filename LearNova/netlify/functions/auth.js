const crypto = require("crypto");
const { MongoClient } = require("mongodb");

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Falta configurar MONGODB_URI en Netlify.");
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("learnova_db");

  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, originalHash] = (storedHash || "").split(":");
  if (!salt || !originalHash) return false;
  const derivedHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(originalHash, "hex"),
    Buffer.from(derivedHash, "hex")
  );
}

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Método no permitido." })
    };
  }

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection("users");

    const body = JSON.parse(event.body || "{}");
    const action = body.action; // "register" o "login"
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Correo y contraseña obligatorios." })
      };
    }

    if (action === "register") {
      const name = (body.name || "").trim();
      if (!name) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "El nombre es obligatorio para registrarte." })
        };
      }

      const existing = await usersCollection.findOne({ email });
      if (existing) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ error: "Ya existe una cuenta con ese correo." })
        };
      }

      const newUser = {
        name,
        email,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString()
      };

      const result = await usersCollection.insertOne(newUser);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          user: {
            id: result.insertedId.toString(),
            name: newUser.name,
            email: newUser.email
          }
        })
      };
    }

    if (action === "login") {
      const user = await usersCollection.findOne({ email });
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: "Correo o contraseña incorrectos." })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email
          }
        })
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Acción no válida." })
    };
  } catch (error) {
    console.error("Error en función auth:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Error interno del servidor en autenticación." })
    };
  }
};