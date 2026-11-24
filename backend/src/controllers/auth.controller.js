import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { db } from "../db/connectToDB.js";

//Register User
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const [rows] = await db.execute(
      "SELECT * FROM users WHERE email = ? OR name = ? LIMIT 1",
      [email, name]
    );

    const isUserAlreadyExists = rows[0];

    if (isUserAlreadyExists) {
      return res.status(409).json({
        message: "Username or email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      "INSERT INTO users (name,email,password_hash) VALUES (?,?,?)",
      [name, email, hashedPassword]
    );

    const userId = result.insertId;
    const token = jwt.sign(
      {
        id: userId,
        role: "user",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "User Registered Successfully",
      user: {
        id: userId,
        name: name,
        email: email,
        role: "user",
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}

//Login User
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and Password are Required",
      });
    }

    const [rows] = await db.execute(
      "SELECT * From users WHERE email = ? LIMIT 1",
      [email]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        message: "Invalid Email or Password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid Email or Password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "User Logged In Successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}

//Logout User
export async function logout(req, res) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(400).json({
      message: "User is Already Logged Out",
    });
  }

  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  res.status(200).json({
    message: "User Logged Out Successfully",
  });
}

//Get Logged in User
export async function getMe(req, res) {
  try {
    const userId = req.user.id;
    const [rows] = await db.execute(
      "SELECT * From users WHERE id = ? LIMIT 1",
      [userId]
    );

    const user = rows[0];

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User detail fetch successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}

//get Users
export async function getAllUsers(req, res) {
  try {
    const [users] = await db.execute(
      "SELECT id,name,email,phone,role created_at From users ORDER BY created_at DESC"
    );

    return res.status(200).json({
      message: "Users fetched Successfully",
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}
