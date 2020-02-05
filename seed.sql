use employee_tracker;

INSERT INTO department (name)
    VALUES ("Technical Support"),
     ("Sales"),
     ("Development"),
     ("QA");

INSERT INTO role (title, salary, department_id)
    VALUES ("Tech Support", "32000", '1'),
     ("Support Manager", "60000", '1'),
     ("Sales Specialist", "52000", '2'),
     ("Product Manager", "75000", '3'),
     ("Scrum Master", "62000", '4');
     
INSERT INTO employee (first_name, last_name, role_id, manager_id)
    VALUES ("John", "Smith", "1", NULL), 
     ("Joey", "Baker", "2", NULL), 
     ("Nick", "Bosa", "3", NULL), 
     ("Patrick", "Mahomes", "4", NULL);