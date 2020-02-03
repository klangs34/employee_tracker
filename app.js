require("dotenv").config();
const inquirer = require("inquirer");
const mysql = require("mysql");

const connection = mysql.createConnection({
    host: "localhost",
    port: "3306",
    user: "root",
    password: process.env.PSWD,
    database: "employee_tracker"
});

connection.connect(function(err){
    if(err) throw err;
    console.log(`connected as id ${connection.threadId} \n`);
    startTracker();
})

function startTracker() {
    inquirer.prompt(
        {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: [
            "View All Employees",
            "View Employees By Department",
            "View All Employees By Manager",
            "Add Employee",
            "Remove Employee",
            "Update Employee Role",
            "Update Employee Manager"
        ]
        }
    )
    .then(result => {
        //console.log(result.action);
        switch (result.action) {
            case 'View All Employees':
                viewAllEmployees();
                break;
            case 'View Employees By Department':
                viewByDepartment();
                break;
            case 'View All Employees By Manager':
                viewByManager();
                break;
            case 'Add Employee':
                addEmployee();
                break;
            case 'Remove Employee':
                removeEmployee();
                break;
            case 'Update Employee Role':
                updateRole();
                break;
            case 'Update Employee Manager':
                updateManager();
                break;
            default: 
                console.log("Sorry, your response was not registered!");
        }
    })
}

function viewAllEmployees() {
    const query = "SELECT * FROM employee"
    connection.query(query, (err, results) => {
        if (err) throw err;
        console.table(results);
        connection.end();
    })
}

function viewByDepartment() {
    const query = "SELECT name FROM department";
    connection.query(query, (err, results) => {
        if(err) throw err;
        inquirer.prompt(
            {
                type: "list",
                name: "department",
                message: "Choose the department: ",
                choices: ()=> results
            }
        )
        .then(results => {
            //query db to get the department id
            const query = "SELECT id FROM department Where ?";
            //const query = "SELECT * FROM employee e INNER JOIN role r on e.role_id = ?";
            connection.query(query, { name: results.department }, (err, data) => {
                if(err) throw err;
                const departmentId = data[0].id;
                const newQuery = "SELECT * FROM employee e INNER JOIN role r on e.role_id = r.department_id Where e.role_id = ?";
                connection.query(newQuery, [departmentId], (err, response) => {
                    if(err) throw err;
                    console.table(response);
                });
                connection.end();
            });
        })
    })
}

function viewByManager() {
    const query = "SELECT concat(first_name, ' ', last_name) as name FROM employee";
    connection.query(query, (err, results) => {
        if(err) throw err;
        inquirer.prompt(
            {
                type: "list",
                name: "manager",
                message: "Choose the manager: ",
                choices: ()=> results
            }
        )
        .then(response => {
            console.log(response);
            connection.end();
        })
    });
}