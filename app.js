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
            //get employee id
            const firstNameArr = response.manager.split(" ");
            const lastNameIndex = response.manager.indexOf(" ");
            const firstName = firstNameArr[0];
            const lastName = response.manager.substring(lastNameIndex + 1, response.manager.length);
            const queryEmployeeId  = "SELECT id FROM employee Where first_name = ? AND last_name = ?";
            connection.query(queryEmployeeId, [firstName, lastName], (err, results) => {
                if(err) throw err;
                const queryManager = "SELECT * FROM employee WHERE manager_id = ?";
                const managerId = results[0].id;
                console.log(managerId)
                connection.query(queryManager, [managerId], (err, data) => {
                    if(err) throw err;
                    console.table(data);
                })
                connection.end();
            })
        });
    });
}

function addEmployee() {
    const employeeQuery = "SELECT * FROM employee";
    const roleQuery = "SELECT * FROM role";
    connection.query(employeeQuery, (err, employee) => {
        if (err) throw err;
        //console.table(results);
        connection.query(roleQuery, (err, role) => {
            if(err) throw err;
            inquirer.prompt([
                {
                    type: "input",
                    name: "fname",
                    message: "Enter employee first name:"
                },
                {
                    type: "input",
                    name: "lname",
                    message: "Enter employee last name:"
                },
                {
                    type: "list",
                    name: "role",
                    message: "Choose employee role:",
                    choices: () => role.map(val => val.title)
                },
                {
                    type: "confirm",
                    name: "hasManager",
                    message: "Does employee have a manager?"
                },
                {
                    type: "list",
                    name: "manager",
                    message: "Choose employee manager:",
                    when: (answer) => answer.hasManager,
                    choices:  () => employee.map(val => val.first_name + " " + val.last_name)
                }
            ])
            .then(response => {
                //insert data into employee table
                const roleQuery = "SELECT id FROM role WHERE ?";
                connection.query(roleQuery, { title: response.role}, (err, role) => {
                    if(err) throw err;
                    const roleId = role[0].id;
                    const managerQuery = "SELECT id FROM employee WHERE ? AND ?";
                    const firstName = response.manager.slice(0, response.manager.indexOf(" "));
                    const lastName = response.manager.slice(response.manager.indexOf(" ") + 1, response.manager.length);
                    connection.query(managerQuery, [{ first_name: firstName }, { last_name: lastName }], 
                        (err, result) => {
                            if(err) throw err;
                            const employeeId = result[0].id;
                            const query = "INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)";
                            connection.query(query, [response.fname, response.lname, roleId, employeeId], (err, result) => {
                                if(err) throw err;
                                connection.end();
                            })
                        })
                    });
                });
        })
    })
}

function removeEmployee() {
    const query = "SELECT * FROM employee";
    connection.query(query, (err, results) => {
        if(err) throw err;
        inquirer.prompt(
            {
                type: "list",
                name: "remove",
                message: "Which employee would you like to remove?",
                choices: ()=> {
                    return results.map(val => val.first_name + " " + val.last_name);
                }
            }
        )
        .then(response => {
            //console.log(response)
            const query = "DELETE FROM employee WHERE ? and ?";
            const firstName = response.remove.slice(0, response.remove.indexOf(" "));
            const lastName = response.remove.slice(response.remove.indexOf(" ") + 1, response.remove.length);
            connection.query(query, [{ first_name: firstName }, { last_name: lastName }], (err, data) => {
                if(err) throw err;
                console.log("Record deleted successfully");
                connection.end();
            });
        });
    });
}

function updateRole() {
    const query = "SELECT * FROM employee";
    connection.query(query, (err, results) => {
        if(err) throw err;
        const roleQuery = "SELECT * FROM role";
        connection.query(roleQuery, (err, data) => {
            if(err) throw err;
            inquirer.prompt([
                {
                    type: "list",
                    name: "update",
                    message: "Which employee role would you like to update?",
                    choices: ()=> {
                        return results.map(val => val.first_name + " " + val.last_name);
                    }
                },
                {
                    type: "list",
                    name: "role",
                    message: "Choose new role for employee:",
                    choices: ()=> data.map(val => val.title)
                }
            ])
            .then(response => {
                //console.log(response);
                const firstName = response.update.slice(0, response.update.indexOf(" "));
                const lastName = response.update.slice(response.update.indexOf(" ") + 1, response.update.length);
                const roleQuery = "SELECT id from role WHERE ?"
                connection.query(roleQuery, { title: response.role }, (err, result) => {
                    if(err) throw err;
                    const updateQuery = "UPDATE employee SET ? WHERE ? AND ?";
                    connection.query(updateQuery, [{ role_id: result[0].id }, { first_name: firstName }, { last_name: lastName }],
                        (err, result) => {
                            if(err) throw err;
                            console.log("Employee role updated successfully!");
                            connection.end();
                        })
                })
            });
        });
    })
}

function updateManager() {
    const query = "SELECT * FROM employee";
    connection.query(query, (err, data) => {
        if(err) throw err;
        inquirer.prompt([
            {
                type: "list",
                name: "updateMgr",
                message: "Which employee manager would you like to update?",
                choices: ()=> {
                    return data.map(val => val.first_name + " " + val.last_name);
                }
            },
            {
                type: "list",
                name: "manager",
                message: "Choose new manager for employee:", 
                choices: (answers)=> data.filter(val => `${val.first_name} ${val.last_name}` !== answers.updateMgr).map(val => `${val.first_name} ${val.last_name}`)
            }
        ])
        .then(response => {
            const firstNameQuery = response.updateMgr.slice(0, response.updateMgr.indexOf(" "));
            const lastNameQuery = response.updateMgr.slice(response.updateMgr.indexOf(" ") + 1, response.updateMgr.length);
            const selectQuery = "SELECT id from employee WHERE ? AND ?"
            connection.query(selectQuery, [{ first_name: firstNameQuery }, { last_name: lastNameQuery }], (err, employee) => {
                if(err) throw err;
                const mgrFirstName = response.manager.slice(0, response.manager.indexOf(" "));
                const mgrLastName = response.manager.slice(response.manager.indexOf(" ") + 1, response.manager.length);
                const mgrId = "SELECT id FROM employee WHERE ? AND ?";
                connection.query(mgrId, [{ first_name: mgrFirstName }, { last_name: mgrLastName }], (err, manager) => {
                
                const updateQuery = "UPDATE employee SET ? WHERE ?";
                connection.query(updateQuery, [{ manager_id: manager[0].id }, { id: employee[0].id }],
                    (err, result) => {
                        if(err) throw err;
                        console.log("Employee manager updated successfully!");
                        connection.end();
                    })
                })
            })
        });
 
    })
}