import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new mock interview
export const create = mutation({
    args: {
        title: v.string(),
        questions: v.array(
            v.object({
                question: v.string(),
                options: v.array(v.string()),
                correctAnswer: v.string(),
                explanation: v.string(),
            })
        ),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        return await ctx.db.insert("mockInterviews", {
            userId: user.clerkId,
            title: args.title,
            createdAt: Date.now(),
            questions: args.questions,
            status: "in_progress",
            category: args.category,
        });
    },
});

// Get a list of mock interviews for the current user
export const getAll = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        return await ctx.db
            .query("mockInterviews")
            .withIndex("by_user_id", (q) => q.eq("userId", user.clerkId))
            .order("desc")
            .collect();
    },
});

// Get in-progress interviews for the current user
export const getInProgress = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        return await ctx.db
            .query("mockInterviews")
            .withIndex("by_user_id", (q) => q.eq("userId", user.clerkId))
            .filter((q) => q.eq(q.field("status"), "in_progress"))
            .order("desc")
            .collect();
    },
});

// Get a specific mock interview by ID
export const getById = query({
    args: { id: v.id("mockInterviews") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        const interview = await ctx.db.get(args.id);
        if (!interview) throw new Error("Interview not found");

        // Make sure the user owns this interview
        if (interview.userId !== user.clerkId) throw new Error("Unauthorized");

        return interview;
    },
});

// Submit an answer to a question in a mock interview
export const submitAnswer = mutation({
    args: {
        interviewId: v.id("mockInterviews"),
        questionIndex: v.number(),
        answer: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        const interview = await ctx.db.get(args.interviewId);
        if (!interview) throw new Error("Interview not found");

        // Make sure the user owns this interview
        if (interview.userId !== user.clerkId) throw new Error("Unauthorized");

        // Clone the questions array
        const updatedQuestions = [...interview.questions];
        if (args.questionIndex >= updatedQuestions.length) {
            throw new Error("Question index out of bounds");
        }

        // Update the answer for this question
        updatedQuestions[args.questionIndex] = {
            ...updatedQuestions[args.questionIndex],
            userAnswer: args.answer,
        };

        // Update the interview
        return await ctx.db.patch(args.interviewId, {
            questions: updatedQuestions,
        });
    },
});

// Complete a mock interview and calculate the score
export const complete = mutation({
    args: {
        interviewId: v.id("mockInterviews"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        const interview = await ctx.db.get(args.interviewId);
        if (!interview) throw new Error("Interview not found");

        // Make sure the user owns this interview
        if (interview.userId !== user.clerkId) throw new Error("Unauthorized");

        // Calculate the score based on correct answers
        let correctCount = 0;
        let answeredCount = 0;

        interview.questions.forEach((q) => {
            if (q.userAnswer) {
                answeredCount++;
                if (q.userAnswer === q.correctAnswer) {
                    correctCount++;
                }
            }
        });

        const score = answeredCount > 0 ? (correctCount / answeredCount) * 100 : 0;

        // Generate feedback based on the score
        let feedback = "";
        if (score >= 90) {
            feedback = "Excellent job! You have a strong understanding of these concepts.";
        } else if (score >= 70) {
            feedback = "Good work! You have a solid foundation, but there's room for improvement in certain areas.";
        } else if (score >= 50) {
            feedback = "You're making progress, but consider reviewing the concepts you missed in this interview.";
        } else {
            feedback = "This seems to be a challenging area for you. Consider focusing more study time on these concepts.";
        }

        // Update the interview
        return await ctx.db.patch(args.interviewId, {
            status: "completed",
            completedAt: Date.now(),
            score,
            feedback,
        });
    },
});

// Generate a new mock interview with questions from OpenAI (placeholder for now)
export const generateMockInterview = mutation({
    args: {
        category: v.optional(v.string()),
        difficultyLevel: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
        numberOfQuestions: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        // Try to get the user's skills profile
        const userProfile = await ctx.db
            .query("userSkillsProfile")
            .withIndex("by_user_id", (q) => q.eq("userId", user.clerkId))
            .first();

        console.log("User profile for mock interview:", userProfile);

        // Set default questions - these will be used if no user skills are found
        let mockQuestions = [
            {
                question: "What is a closure in JavaScript?",
                options: [
                    "A function that has access to variables in its outer scope",
                    "A method to close browser windows",
                    "A way to protect code from external access",
                    "A design pattern for asynchronous code"
                ],
                correctAnswer: "A function that has access to variables in its outer scope",
                explanation: "A closure is a function that has access to variables in its parent scope, even after the parent function has closed."
            },
            {
                question: "What is the difference between let and var in JavaScript?",
                options: [
                    "var is block-scoped, let is function-scoped",
                    "let is block-scoped, var is function-scoped",
                    "They are identical in modern JavaScript",
                    "var cannot be reassigned, let can be"
                ],
                correctAnswer: "let is block-scoped, var is function-scoped",
                explanation: "Variables declared with let are block-scoped, meaning they're only accessible within the block they're defined in. Variables declared with var are function-scoped."
            }
        ];

        // Generate questions based on user skills if available
        if (userProfile && userProfile.skills && userProfile.skills.length > 0) {
            // Normalize user skills: convert to lowercase and trim whitespace
            const userSkills = userProfile.skills.map(skill => skill.toLowerCase().trim());
            console.log("User skills detected (normalized):", userSkills);

            // Add questions based on the user's skills
            if (userSkills.includes("react")) {
                console.log("Adding React questions");
                // React questions
                mockQuestions.push({
                    question: "What is the purpose of React's useEffect hook?",
                    options: [
                        "To fetch data from APIs only",
                        "To perform side effects in function components",
                        "To create new state variables",
                        "To replace class components entirely"
                    ],
                    correctAnswer: "To perform side effects in function components",
                    explanation: "useEffect is used to perform side effects in function components. Side effects can include data fetching, DOM manipulation, setting up subscriptions, and more."
                });

                mockQuestions.push({
                    question: "In React, what is the purpose of keys when rendering lists?",
                    options: [
                        "Keys are optional and only improve performance",
                        "Keys help React identify which items have changed, been added, or removed",
                        "Keys are required for all elements, not just lists",
                        "Keys replace the need for state management"
                    ],
                    correctAnswer: "Keys help React identify which items have changed, been added, or removed",
                    explanation: "Keys give elements a stable identity and help React identify which items have changed, been added, or removed. They should be unique among siblings in a list."
                });

                mockQuestions.push({
                    question: "What is the difference between state and props in React?",
                    options: [
                        "State is immutable, props are mutable",
                        "Props are for functional components, state is for class components",
                        "State is managed within the component, props are passed from parent components",
                        "Props are private, state is public"
                    ],
                    correctAnswer: "State is managed within the component, props are passed from parent components",
                    explanation: "State is managed within a component and can be updated with setState (or state updater functions in hooks). Props are passed down from parent components and are read-only within the component that receives them."
                });

                mockQuestions.push({
                    question: "What is React's Virtual DOM?",
                    options: [
                        "A browser feature that React uses for faster rendering",
                        "A lightweight copy of the real DOM that React uses for performance optimization",
                        "A database that stores component state",
                        "A component that virtualizes list rendering"
                    ],
                    correctAnswer: "A lightweight copy of the real DOM that React uses for performance optimization",
                    explanation: "The Virtual DOM is a lightweight JavaScript representation of the real DOM. React uses it to compare changes before updating the actual DOM, which improves performance by minimizing expensive DOM operations."
                });

                mockQuestions.push({
                    question: "What is the purpose of React Context?",
                    options: [
                        "To store global CSS variables",
                        "To bypass the single-direction data flow and avoid prop drilling",
                        "To connect React to backend services",
                        "To store component-level state"
                    ],
                    correctAnswer: "To bypass the single-direction data flow and avoid prop drilling",
                    explanation: "React Context provides a way to share values between components without explicitly passing props through every level of the component tree, avoiding the problem known as 'prop drilling'."
                });
            }

            if (userSkills.includes("python")) {
                console.log("Adding Python questions");
                // Python questions
                mockQuestions.push({
                    question: "What is a Python generator?",
                    options: [
                        "A type of function that returns multiple values using the yield keyword",
                        "A class that generates random numbers",
                        "A tool that automatically generates Python code",
                        "A module for creating Python packages"
                    ],
                    correctAnswer: "A type of function that returns multiple values using the yield keyword",
                    explanation: "A generator is a special type of function that returns an iterator. It uses the yield keyword instead of return and can pause and resume its execution state."
                });

                mockQuestions.push({
                    question: "What does the __init__ method do in Python?",
                    options: [
                        "Initializes a module when imported",
                        "Initializes a class instance and sets initial attributes",
                        "Initializes the Python interpreter",
                        "Creates a constructor function"
                    ],
                    correctAnswer: "Initializes a class instance and sets initial attributes",
                    explanation: "The __init__ method is a special method (constructor) in Python classes that is automatically called when a new instance of a class is created. It's used to initialize the object's attributes."
                });

                mockQuestions.push({
                    question: "What is the difference between a list and a tuple in Python?",
                    options: [
                        "Lists are ordered, tuples are not",
                        "Tuples are immutable, lists are mutable",
                        "Lists can only contain numbers, tuples can contain any data type",
                        "Tuples are faster than lists for all operations"
                    ],
                    correctAnswer: "Tuples are immutable, lists are mutable",
                    explanation: "The main difference is that lists are mutable (can be changed after creation) while tuples are immutable (cannot be modified after creation). Both are ordered collections that can hold mixed data types."
                });

                mockQuestions.push({
                    question: "What are Python decorators?",
                    options: [
                        "Functions that add layout elements to a GUI",
                        "Design patterns for object-oriented programming",
                        "Functions that take another function as an argument and extend its behavior",
                        "Special comments that document code automatically"
                    ],
                    correctAnswer: "Functions that take another function as an argument and extend its behavior",
                    explanation: "Decorators are a powerful and expressive feature in Python that allow you to modify or extend the behavior of functions or methods without changing their source code. They are implemented as functions that take another function as an argument and return a new function."
                });

                mockQuestions.push({
                    question: "What is a context manager in Python?",
                    options: [
                        "A tool for managing memory allocation",
                        "A feature that allows specific execution contexts for functions",
                        "A protocol for resource management using with statements",
                        "A type of global variable scope"
                    ],
                    correctAnswer: "A protocol for resource management using with statements",
                    explanation: "Context managers in Python implement the context management protocol (__enter__ and __exit__ methods) and are used with the 'with' statement to handle resource allocation and cleanup. Common examples include file handling where files are automatically closed when the with block exits."
                });
            }

            if (userSkills.includes("sql") || userSkills.includes("database")) {
                console.log("Adding SQL/Database questions");
                // SQL and database questions
                mockQuestions.push({
                    question: "What is the difference between INNER JOIN and LEFT JOIN in SQL?",
                    options: [
                        "There is no difference; they are synonyms",
                        "INNER JOIN returns matching rows, LEFT JOIN returns all rows from the left table plus matching rows from the right table",
                        "INNER JOIN is faster than LEFT JOIN",
                        "LEFT JOIN can only be used with primary keys"
                    ],
                    correctAnswer: "INNER JOIN returns matching rows, LEFT JOIN returns all rows from the left table plus matching rows from the right table",
                    explanation: "INNER JOIN returns only rows that have matching values in both tables. LEFT JOIN returns all rows from the left table and matching rows from the right table. If there's no match, NULL values are returned for the right table columns."
                });

                mockQuestions.push({
                    question: "What is database normalization?",
                    options: [
                        "The process of optimizing database queries",
                        "Converting a database to a different SQL dialect",
                        "Organizing data to reduce redundancy and improve data integrity",
                        "Compressing database tables to save storage space"
                    ],
                    correctAnswer: "Organizing data to reduce redundancy and improve data integrity",
                    explanation: "Normalization is the process of organizing data in a database by creating tables and establishing relationships between them according to rules designed to protect data and make the database more flexible by eliminating redundancy and inconsistent dependency."
                });

                mockQuestions.push({
                    question: "What is the purpose of an index in a database?",
                    options: [
                        "To create foreign key relationships",
                        "To speed up data retrieval operations on a table",
                        "To enforce data integrity constraints",
                        "To track changes to the database over time"
                    ],
                    correctAnswer: "To speed up data retrieval operations on a table",
                    explanation: "An index is a data structure that improves the speed of data retrieval operations on a database table. Indexes can be created using one or more columns, providing a faster path to the data. However, they come with the overhead of additional writes and storage space."
                });

                mockQuestions.push({
                    question: "What is the difference between SQL's HAVING and WHERE clauses?",
                    options: [
                        "HAVING can only be used with string columns, WHERE with numeric columns",
                        "WHERE filters individual rows before grouping, HAVING filters groups after GROUP BY",
                        "HAVING is used for simple conditions, WHERE for complex ones",
                        "There is no difference; they are interchangeable"
                    ],
                    correctAnswer: "WHERE filters individual rows before grouping, HAVING filters groups after GROUP BY",
                    explanation: "WHERE is used to filter individual rows before they are grouped in a GROUP BY clause. HAVING is used to filter groups after the GROUP BY has been applied. HAVING can use aggregate functions (like COUNT, SUM) while WHERE cannot."
                });

                mockQuestions.push({
                    question: "What is a transaction in a database?",
                    options: [
                        "A record of user access to the database",
                        "A unit of work that is performed against a database and treated as a single logical operation",
                        "A connection between two database tables",
                        "A query that retrieves data from multiple tables"
                    ],
                    correctAnswer: "A unit of work that is performed against a database and treated as a single logical operation",
                    explanation: "A transaction is a sequence of operations performed as a single logical unit of work. A transaction has the ACID properties: Atomicity (all or nothing), Consistency (valid states only), Isolation (transactions don't interfere), and Durability (changes persist)."
                });
            }

            if (userSkills.includes("java")) {
                console.log("Adding Java questions");
                // Java questions
                mockQuestions.push({
                    question: "What is the difference between an interface and an abstract class in Java?",
                    options: [
                        "Interfaces can have method implementations, abstract classes cannot",
                        "Abstract classes can have method implementations and state, interfaces traditionally only define method signatures",
                        "Interfaces cannot be instantiated, abstract classes can",
                        "Abstract classes support multiple inheritance, interfaces don't"
                    ],
                    correctAnswer: "Abstract classes can have method implementations and state, interfaces traditionally only define method signatures",
                    explanation: "Abstract classes can have both abstract methods and concrete methods with implementations, and they can maintain state (instance variables). Interfaces traditionally only define method signatures, although in newer Java versions they can have default and static methods."
                });

                mockQuestions.push({
                    question: "What is the purpose of the 'final' keyword in Java?",
                    options: [
                        "It's used only for optimization hints to the compiler",
                        "It marks a variable that will be initialized at runtime",
                        "It indicates that a variable, method, or class cannot be changed/overridden",
                        "It forces garbage collection on an object when it goes out of scope"
                    ],
                    correctAnswer: "It indicates that a variable, method, or class cannot be changed/overridden",
                    explanation: "The 'final' keyword in Java has different meanings depending on context: final variables can't be reassigned, final methods can't be overridden, and final classes can't be extended."
                });

                mockQuestions.push({
                    question: "What is the difference between '==' and '.equals()' in Java?",
                    options: [
                        "They are identical and can be used interchangeably",
                        "'==' compares memory references, '.equals()' typically compares contents",
                        "'==' is for primitive types, '.equals()' doesn't work with primitive types",
                        "'.equals()' is faster than '=='"
                    ],
                    correctAnswer: "'==' compares memory references, '.equals()' typically compares contents",
                    explanation: "The '==' operator compares if two references point to the same object in memory. The '.equals()' method, when properly overridden, compares the actual contents or values of the objects. For strings and many objects, '.equals()' checks if the values are the same, not if they're the same object."
                });

                mockQuestions.push({
                    question: "What is the Java Collections Framework?",
                    options: [
                        "A library for collecting and organizing program dependencies",
                        "A set of classes and interfaces that implement commonly reusable data structures",
                        "A framework for connecting to various databases",
                        "A utility for gathering garbage collection statistics"
                    ],
                    correctAnswer: "A set of classes and interfaces that implement commonly reusable data structures",
                    explanation: "The Java Collections Framework provides a unified architecture for representing and manipulating collections of objects. It includes interfaces like List, Set, and Map, and implementations like ArrayList, HashSet, and HashMap, along with algorithms for searching, sorting, etc."
                });

                mockQuestions.push({
                    question: "What is the purpose of Java's Exception Handling mechanism?",
                    options: [
                        "To prevent runtime errors from occurring",
                        "To catch and handle unexpected conditions during program execution",
                        "To make code faster by avoiding error checking",
                        "To report errors to the Java Virtual Machine"
                    ],
                    correctAnswer: "To catch and handle unexpected conditions during program execution",
                    explanation: "Java's exception handling mechanism provides a way to deal with runtime errors or exceptional situations in a controlled fashion. It allows separating normal code from error-handling code, making programs more robust and readable. The try-catch-finally blocks and throw/throws keywords are central to this mechanism."
                });
            }

            if (userSkills.includes("devops") || userSkills.includes("aws") || userSkills.includes("cloud")) {
                console.log("Adding DevOps/Cloud questions");
                // DevOps and cloud questions
                mockQuestions.push({
                    question: "What is containerization in DevOps?",
                    options: [
                        "Running applications in a virtual machine",
                        "Packaging code and dependencies together for consistent deployment",
                        "Storing data in secure containers",
                        "A security measure to isolate sensitive data"
                    ],
                    correctAnswer: "Packaging code and dependencies together for consistent deployment",
                    explanation: "Containerization is the process of packaging an application along with its dependencies, configuration files, and environment variables in a container. This ensures that the application runs consistently regardless of the infrastructure, making deployment more reliable and efficient."
                });

                mockQuestions.push({
                    question: "What is the difference between Docker and Kubernetes?",
                    options: [
                        "They are competitors offering the same functionality",
                        "Docker is a containerization platform, Kubernetes is a container orchestration system",
                        "Docker is for Windows containers, Kubernetes is for Linux containers",
                        "Docker is open-source, Kubernetes is proprietary"
                    ],
                    correctAnswer: "Docker is a containerization platform, Kubernetes is a container orchestration system",
                    explanation: "Docker is a platform that allows you to create, run, and manage containers. Kubernetes is an orchestration system for automating deployment, scaling, and management of containerized applications. They often work together: Docker for creating containers, Kubernetes for orchestrating them at scale."
                });

                mockQuestions.push({
                    question: "What is Continuous Integration/Continuous Deployment (CI/CD)?",
                    options: [
                        "A software development approach where code is continuously written without breaks",
                        "A practice of merging code changes frequently and automating the delivery process",
                        "A type of Agile methodology focused on continuous client feedback",
                        "A programming paradigm that emphasizes continuously changing requirements"
                    ],
                    correctAnswer: "A practice of merging code changes frequently and automating the delivery process",
                    explanation: "CI/CD is a set of practices where developers frequently merge their code changes into a central repository where automated builds and tests run. Continuous Deployment extends this by automatically deploying all code changes to testing or production environments after the build stage."
                });

                mockQuestions.push({
                    question: "What is Infrastructure as Code (IaC)?",
                    options: [
                        "Writing code that directly modifies physical hardware",
                        "Managing and provisioning infrastructure through code instead of manual processes",
                        "A programming language specifically designed for infrastructure management",
                        "Coding practices for infrastructure teams"
                    ],
                    correctAnswer: "Managing and provisioning infrastructure through code instead of manual processes",
                    explanation: "Infrastructure as Code (IaC) is the practice of managing and provisioning computing infrastructure through machine-readable definition files, rather than physical hardware configuration or point-and-click configuration tools. Tools like Terraform, AWS CloudFormation, and Ansible are examples of IaC technologies."
                });

                mockQuestions.push({
                    question: "What is the principle of 'immutable infrastructure' in DevOps?",
                    options: [
                        "Infrastructure that cannot be physically accessed for security reasons",
                        "Systems that never require updates or patches",
                        "Infrastructure components that are never modified after deployment but replaced entirely",
                        "Using only proprietary software that cannot be modified"
                    ],
                    correctAnswer: "Infrastructure components that are never modified after deployment but replaced entirely",
                    explanation: "Immutable infrastructure is an approach where servers, once deployed, are never modified—instead, any change requires building a new server from a common image with the changes baked in. This leads to more consistent, reliable, and predictable systems by eliminating configuration drift and reducing deployment complexity."
                });
            }

            // JavaScript questions
            if (userSkills.includes("javascript") || userSkills.includes("js")) {
                console.log("Adding JavaScript questions");
                mockQuestions.push({
                    question: "What is event bubbling in JavaScript?",
                    options: [
                        "A technique to optimize event handling",
                        "When an event triggers on an element and propagates up to parent elements",
                        "A method to create multiple events simultaneously",
                        "A way to prevent default browser behavior"
                    ],
                    correctAnswer: "When an event triggers on an element and propagates up to parent elements",
                    explanation: "Event bubbling is a mechanism where an event triggered on the innermost element bubbles up through its ancestors in the DOM tree until it reaches the outermost ancestor or is explicitly stopped."
                });

                mockQuestions.push({
                    question: "What is the purpose of JavaScript Promises?",
                    options: [
                        "To guarantee code performance",
                        "To represent a future value and handle asynchronous operations",
                        "To secure JavaScript code from being modified",
                        "To enforce contractual agreements in code"
                    ],
                    correctAnswer: "To represent a future value and handle asynchronous operations",
                    explanation: "Promises are objects representing the eventual completion or failure of an asynchronous operation. They allow you to write cleaner code by chaining .then() and .catch() methods instead of nesting callbacks, helping avoid 'callback hell'."
                });

                mockQuestions.push({
                    question: "What is the JavaScript 'this' keyword?",
                    options: [
                        "A keyword that always refers to the global object",
                        "A reference to the previous function in the call stack",
                        "A reference to the object that is executing the current function",
                        "A keyword used only in class definitions"
                    ],
                    correctAnswer: "A reference to the object that is executing the current function",
                    explanation: "The 'this' keyword refers to the object that the function is a property of. The value of 'this' depends on how the function is called: in a method, 'this' refers to the object; in a simple function call, it refers to the global object (or undefined in strict mode); in an event, it refers to the element that received the event."
                });

                mockQuestions.push({
                    question: "What is the difference between '=='' and '===' operators in JavaScript?",
                    options: [
                        "They are identical in modern JavaScript",
                        "'===' checks both value and type, '==' checks only value",
                        "'==' is for strings, '===' is for numbers",
                        "'===' is deprecated in ES6+"
                    ],
                    correctAnswer: "'===' checks both value and type, '==' checks only value",
                    explanation: "The '===' (strict equality) operator checks if both the value and type are the same, without type conversion. The '==' (loose equality) operator performs type coercion before comparison, meaning it converts the operands to the same type when comparing."
                });

                mockQuestions.push({
                    question: "What is a JavaScript closure?",
                    options: [
                        "A way to close browser windows using JavaScript",
                        "A function that has access to variables from its outer lexical scope even after that scope has closed",
                        "A method to terminate running JavaScript code",
                        "A technique for hiding HTML elements"
                    ],
                    correctAnswer: "A function that has access to variables from its outer lexical scope even after that scope has closed",
                    explanation: "A closure is the combination of a function and the lexical environment within which that function was declared. This allows the function to access variables from its parent scope even after the parent function has returned, effectively 'remembering' the environment in which it was created."
                });
            }
        }

        // If category was specified, filter or add specific questions
        if (args.category) {
            if (args.category.toLowerCase() === "javascript") {
                // Add more JavaScript questions
                mockQuestions.push({
                    question: "What is event bubbling in JavaScript?",
                    options: [
                        "A technique to optimize event handling",
                        "When an event triggers on an element and propagates up to parent elements",
                        "A method to create multiple events simultaneously",
                        "A way to prevent default browser behavior"
                    ],
                    correctAnswer: "When an event triggers on an element and propagates up to parent elements",
                    explanation: "Event bubbling is a mechanism where an event triggered on the innermost element bubbles up through its ancestors in the DOM tree until it reaches the outermost ancestor or is explicitly stopped."
                });
            }
        }

        // Set title based on user profile or args
        let title = args.category ? `${args.category} Interview` : "Mock Interview";

        if (userProfile && userProfile.skills && userProfile.skills.length > 0) {
            // If we have user skills, create a more personalized title
            const primarySkill = userProfile.skills[0];
            title = `${primarySkill} Developer Interview`;
        }

        // Limit to specified number of questions if provided
        if (args.numberOfQuestions && args.numberOfQuestions > 0 && args.numberOfQuestions < mockQuestions.length) {
            // Shuffle the questions to get a random set
            mockQuestions = shuffleArray(mockQuestions).slice(0, args.numberOfQuestions);
        }

        console.log(`Returning ${mockQuestions.length} interview questions with title: ${title}`);

        return await ctx.db.insert("mockInterviews", {
            userId: user.clerkId,
            title: title,
            createdAt: Date.now(),
            questions: mockQuestions,
            status: "in_progress",
            category: args.category,
        });
    },
});

// Helper function to shuffle an array (for randomizing questions)
function shuffleArray(array: any[]) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
} 