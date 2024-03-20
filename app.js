const express = require('express')
const app = express()

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

app.use(express.json())
const path = require('path')
let db = null

const dbPath = path.join(__dirname, 'userData.db')

const intializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3004, () => {
      console.log('Server Running at http://localhost:3004/')
    })
  } catch (e) {
    console.log(`DB Error : ${e.message}`)
  }
}

intializeDbAndServer()

//User API

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)

  const selectUserQuery = `
    SELECT * FROM user WHERE username = '${username}'`

  const dbUser = await db.get(selectUserQuery)

  if (dbUser === undefined) {
    const postUserQuery = `
        INSERT INTO user(username, name, password, gender, location)
        VALUES('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}')`
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const newUserDetails = await db.run(postUserQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//Login User API

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `
    SELECT * FROM user WHERE username = '${username}'`

  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

//change Password

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body

  const selectUserQuery = `
    SELECT * FROM user WHERE username = '${username}'`

  const dbUser = await db.get(selectUserQuery)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid password')
  } else {
    const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password)
    if (isValidPassword === true) {
      const lengthOfTheNewPassword = newPassword.length
      if (lengthOfTheNewPassword < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10)
        const updatePasswordQuery = `
        UPDATE user SET password = '${encryptedPassword}' WHERE username = '${username}';`

        db.run(updatePasswordQuery)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
