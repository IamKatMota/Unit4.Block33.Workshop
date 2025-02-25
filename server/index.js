const express = require('express');
const pg = require('pg');
const app = express();
const path = require('path');

app.use(express.json());

// db client
const client = new pg.Client("postgres://kat:KatMiaTy2018@localhost:5432/acme_hr_db")

//error handling 
app.use((error,req,res,next) => {
    res.status(error.status || 500).send({error: error.message})
})
//routes
app.get('/api/employees', async (req,res,next) => {
    try {
        const SQL = `
            SELECT * FROM employees
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error)
    }
})
app.get('/api/departments', async (req,res,next) => {
    try {
        const SQL = `
            SELECT * FROM departments
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error)
    }
})
app.post('/api/employees', async (req,res,next) => {
    const {name, department_name} = req.body
    try {
        const SQL = `
            INSERT INTO employees(name, department_id) VALUES($1,  (SELECT id from departments WHERE name = $2))
            RETURNING * ;
        `
        const response = await client.query(SQL, [name, department_name]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
})

app.delete('/api/employees/:id', async(req,res,next)=> {
    const {id} = req.params;
    try {
        const SQL = `
            DELETE from employees
            WHERE id = $1
        ;
        `
        const response = await client.query(SQL, [id]);
        res.sendStatus(204) 
    } catch (error) {
        next(error);
    }
})

app.put('/api/employees/:id', async (req,res,next) => {
    const {id} = req.params;
    const {name} = req.body;
    try {
        const SQL = `
            UPDATE employees
            SET name = $1
            WHERE id = $2
            RETURNING * ;
        `
        const response = await client.query(SQL, [name, id]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
})



//init function

const init = async () => {
    await client.connect();
    const SQL = `
        DROP TABLE IF EXISTS employees;
        DROP TABLE IF EXISTS departments;

        CREATE TABLE departments(
            id SERIAL PRIMARY KEY,
            name VARCHAR(50)
        );
        
        CREATE TABLE employees(
            id SERIAL PRIMARY KEY,
            name VARCHAR(50),
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now(),
            department_id INTEGER REFERENCES departments(id) NOT NULL
        );

        INSERT INTO departments(name) VALUES('accounting'), ('creative'), ('it'), ('hr');
        INSERT INTO employees(name, department_id) VALUES ('Donna', (SELECT id from departments WHERE name = 'accounting')),('Kat', (SELECT id from departments WHERE name = 'creative')),('Mia', (SELECT id from departments WHERE name = 'it')), ('Ty', (SELECT id from departments WHERE name = 'hr')) ;
    `

    await client.query(SQL)
    app.listen(3000, ()=> console.log('listening on port 3000'))
}

init();