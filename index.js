import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs-extra';
import cors from 'cors';
import multer from 'multer';
import User from './models/User.js';
import Blog from './models/Blog.js';
import Comment from './models/Comment.js';
import { sendEmail } from './service.js';

const app = express();
const PORT = 2000;

app.use(bodyParser.json());
app.use(cors());

const DATA_PATH = './data';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

const readData = async (file) => {
    console.log('readData', file);
    try {
        const data = await fs.readFile(`${DATA_PATH}/${file}`, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading ${file}:`, err);
        return [];
    }
};

const writeData = async (file, data) => {
    console.log('writeData');
    try {
        await fs.writeFile(`${DATA_PATH}/${file}`, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error(`Error writing ${file}:`, err);
    }
};

// Register a new user
app.post('/register', async (req, res) => {
    console.log('register', req.body);
    const newUser = new User(req.body);
    const users = await readData('users.json');
    const existingUser = users.find(user => user.username === newUser.username);

    if (existingUser) {
        console.error('Username already exists')
        res.status(400).json({ error: 'Username already exists' });
    } else {
        newUser.id = parseInt( users.length ? parseInt(users[users.length - 1].id) + 1 : 1);
        users.push(newUser);
        await writeData('users.json', users);
        console.log(newUser);

        // send email for verification 
        sendEmail({ to: 'recipient-email', subject: 'Test Email', text: 'Test mail' })
            .then(r => console.log(r))
            .catch(e => console.log(e));
        // up to here  
            

        res.status(201).json(newUser);
    }
});

// Login
app.post('/login', async (req, res) => {
    console.log('login', req.body);
    const { username, password } = req.body;
    const users = await readData('users.json');
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        res.json(user);
    } else {
        console.error('Invalid username or password');
        res.status(401).json({ error: 'Invalid username or password' });
    }
});

// Get all blogs
app.get('/blogs', async (req, res) => {
    console.log('blogs', req.body);
    const blogs = await readData('blogs.json');
    res.json(blogs);
});

// Get blog by ID
app.get('/blogs/:id', async (req, res) => {
    console.log('blogs', req.params);
    const blogId = parseInt(req.params.id);
    const blogs = await readData('blogs.json');
    const blog = blogs.find(b => b.id === blogId);

    if (blog) {
        res.json(blog);
    } else {
        console.error('Blog not found');
        res.status(404).json({ error: 'Blog not found' });
    }
});

// get writer by id 
app.get('/writers/:id', async (req, res) => {
    console.log('writers', req.params);
    const userId = parseInt(req.params.id);
    const users = await readData('users.json');
    const user = users.find(u => u.id === userId);
    if (user) {
        res.json(user);
    } else {
        console.log('User not found');
        res.status(404).json({ error: 'User not found' });
    }
});

// Write a new blog
app.post('/blogs', async (req, res) => {
    console.log('blogs', req.body);
    const newBlog = new Blog(req.body);
    const blogs = await readData('blogs.json');
    newBlog.id = blogs.length ? blogs[blogs.length - 1].id + 1 : 1;
    blogs.push(newBlog);
    await writeData('blogs.json', blogs);
    res.status(201).json(newBlog);
});

// Get comments by blog ID
app.get('/blogs/:id/comments', async (req, res) => {
    console.log('blogs', req.params);
    const blogId = parseInt(req.params.id);
    const comments = await readData('comments.json');
    const blogComments = comments.filter(comment => comment.blogId === blogId);
    console.log(blogComments.length);
    res.json(blogComments);
});

// Write a new comment
app.post('/comments', async (req, res) => {
    console.log('comments', req.body);
    try {
        const comments = await readData('comments.json');
        const newComment = {
            id: comments.length > 0 ? comments[comments.length - 1].id + 1 : 1,
            ...req.body,
        };

        comments.push(newComment);
        await writeData('comments.json', comments);

        res.status(201).json(newComment);
    } catch (error) {
        console.error('Error writing comment:', error);
        res.status(500).json({ error: 'Failed to write comment' });
    }
});

// Update user profile by ID
app.put('/users/:id', upload.fields([{ name: 'avatar' }, { name: 'cv' }]), async (req, res) => {
    const userId = parseInt(req.params.id);
    const updatedUserData = req.body;
    console.log(userId);
    console.log(updatedUserData);

    if (req.files) {
        if (req.files.avatar) {
            updatedUserData.avatar = req.files.avatar[0].path;
        }
        if (req.files.cv) {
            updatedUserData.cv = req.files.cv[0].path;
        }
    }
    try {
        const users = await readData('users.json');
        users.forEach(element => {
            console.log(element.id);
        });
        const index = users.findIndex(u => parseInt(u.id) === userId);

        if (index === -1) {
            throw new Error('User not found');
        }

        users[index] = { ...users[index], ...updatedUserData };

        await writeData('users.json', users);

        res.json(users[index]);
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Failed to update user profile' });
    }
});

// Forgot password 
app.post('/forgot', async (req, res) => {
    console.log('blogs', req.body);

    const newBlog = new Blog(req.body);
    const blogs = await readData('blogs.json');
    newBlog.id = blogs.length ? blogs[blogs.length - 1].id + 1 : 1;
    blogs.push(newBlog);
    await writeData('blogs.json', blogs);
    res.status(201).json(newBlog);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// import express from 'express';
// import bodyParser from 'body-parser';
// import fs from 'fs-extra';
// import cors from 'cors';
// import multer from 'multer';
// import User from './models/User.js';
// import Blog from './models/Blog.js';
// import Comment from './models/Comment.js';
// import { sendEmail } from './service.js';

// const app = express();
// const PORT = 2000;

// app.use(bodyParser.json());
// app.use(cors());

// const DATA_PATH = './data';

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/');
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + '-' + file.originalname);
//     }
// });

// const upload = multer({ storage });

// const readData = async (file) => {
//     console.log('readData', file);
//     try {
//         const data = await fs.readFile(`${DATA_PATH}/${file}`, 'utf-8');
//         return JSON.parse(data);
//     } catch (err) {
//         console.error(`Error reading ${file}:`, err);
//         return [];
//     }
// };

// const writeData = async (file, data) => {
//     console.log('writeData');
//     try {
//         await fs.writeFile(`${DATA_PATH}/${file}`, JSON.stringify(data, null, 2));
//     } catch (err) {
//         console.error(`Error writing ${file}:`, err);
//     }
// };

// // Register a new user
// app.post('/register', async (req, res) => {
//     console.log('register', req.body);
//     const newUser = new User(req.body);
//     const users = await readData('users.json');
//     const existingUser = users.find(user => user.username === newUser.username);

//     if (existingUser) {
//         console.error('Username already exists')
//         res.status(400).json({ error: 'Username already exists' });
//     } else {
//         newUser.id = users.length ? users[users.length - 1].id + 1 : 1;
//         users.push(newUser);
//         await writeData('users.json', users);
//         console.log(newUser);

//         // send email for verification 
//         sendEmail({ to: 'recipient-email', subject: 'Test Email', text: 'Test mail' })
//             .then(r => console.log(r))
//             .catch(e => console.log(e));
//         // up to here  
            

//         res.status(201).json(newUser);
//     }
// });

// // Login
// app.post('/login', async (req, res) => {
//     console.log('login', req.body);
//     const { username, password } = req.body;
//     const users = await readData('users.json');
//     const user = users.find(u => u.username === username && u.password === password);

//     if (user) {
//         res.json(user);
//     } else {
//         console.error('Invalid username or password');
//         res.status(401).json({ error: 'Invalid username or password' });
//     }
// });

// // Get all blogs
// app.get('/blogs', async (req, res) => {
//     console.log('blogs', req.body);
//     const blogs = await readData('blogs.json');
//     res.json(blogs);
// });

// // Get blog by ID
// app.get('/blogs/:id', async (req, res) => {
//     console.log('blogs', req.params);
//     const blogId = parseInt(req.params.id);
//     const blogs = await readData('blogs.json');
//     const blog = blogs.find(b => b.id === blogId);

//     if (blog) {
//         res.json(blog);
//     } else {
//         console.error('Blog not found');
//         res.status(404).json({ error: 'Blog not found' });
//     }
// });

// // get writer by id 
// app.get('/writers/:id', async (req, res) => {
//     console.log('writers', req.params);
//     const userId = parseInt(req.params.id);
//     const users = await readData('users.json');
//     const user = users.find(u => u.id === userId);
//     if (user) {
//         res.json(user);
//     } else {
//         console.log('User not found');
//         res.status(404).json({ error: 'User not found' });
//     }
// });

// // Write a new blog
// app.post('/blogs', async (req, res) => {
//     console.log('blogs', req.body);
//     const newBlog = new Blog(req.body);
//     const blogs = await readData('blogs.json');
//     newBlog.id = blogs.length ? blogs[blogs.length - 1].id + 1 : 1;
//     blogs.push(newBlog);
//     await writeData('blogs.json', blogs);
//     res.status(201).json(newBlog);
// });

// // Get comments by blog ID
// app.get('/blogs/:id/comments', async (req, res) => {
//     console.log('blogs', req.params);
//     const blogId = parseInt(req.params.id);
//     const comments = await readData('comments.json');
//     const blogComments = comments.filter(comment => comment.blogId === blogId);
//     console.log(blogComments.length);
//     res.json(blogComments);
// });

// // Write a new comment
// app.post('/comments', async (req, res) => {
//     console.log('comments', req.body);
//     try {
//         const comments = await readData('comments.json');
//         const newComment = {
//             id: comments.length > 0 ? comments[comments.length - 1].id + 1 : 1,
//             ...req.body,
//         };

//         comments.push(newComment);
//         await writeData('comments.json', comments);

//         res.status(201).json(newComment);
//     } catch (error) {
//         console.error('Error writing comment:', error);
//         res.status(500).json({ error: 'Failed to write comment' });
//     }
// });

// // Update user profile by ID
// app.put('/users/:id', upload.fields([{ name: 'avatar' }, { name: 'cv' }]), async (req, res) => {
//     const userId = parseInt(req.params.id);
//     const updatedUserData = req.body;
//     console.log(userId);
//     console.log(updatedUserData);

//     if (req.files) {
//         if (req.files.avatar) {
//             updatedUserData.avatar = req.files.avatar[0].path;
//         }
//         if (req.files.cv) {
//             updatedUserData.cv = req.files.cv[0].path;
//         }
//     }

//     try {
//         const users = await readData('users.json');
//         users.forEach(element => {
//             console.log(element.id);
//         });
//         const index = users.findIndex(u => parseInt(u.id) === userId);

//         if (index === -1) {
//             throw new Error('User not found');
//         }

//         users[index] = { ...users[index], ...updatedUserData };

//         await writeData('users.json', users);

//         res.json(users[index]);
//     } catch (error) {
//         console.error('Error updating user profile:', error);
//         res.status(500).json({ error: 'Failed to update user profile' });
//     }
// });


// // Start the server
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });


// import express from 'express';
// import bodyParser from 'body-parser';
// import fs from 'fs-extra';
// import cors from 'cors';
// import User from './models/User.js';
// import Blog from './models/Blog.js';
// import Comment from './models/Comment.js';

// const app = express();
// const PORT = 2000;

// app.use(bodyParser.json());
// app.use(cors());

// const DATA_PATH = './data';

// const readData = async (file) => {
//     console.log('readData', file);
//     try {
//         const data = await fs.readFile(`${DATA_PATH}/${file}`, 'utf-8');
//         return JSON.parse(data);
//     } catch (err) {
//         console.error(`Error reading ${file}:`, err);
//         return [];
//     }
// };

// const writeData = async (file, data) => {
//     console.log('writeData');
//     try {
//         await fs.writeFile(`${DATA_PATH}/${file}`, JSON.stringify(data, null, 2));
//     } catch (err) {
//         console.error(`Error writing ${file}:`, err);
//     }
// };

// // Register a new user
// app.post('/register', async (req, res) => {
//     console.log('register', req.body);
//     const newUser = new User(req.body);
//     const users = await readData('users.json');
//     const existingUser = users.find(user => user.username === newUser.username);

//     if (existingUser) {
//         console.error('Username already exists')
//         res.status(400).json({ error: 'Username already exists' });
//     } else {
//         newUser.id = users.length ? users[users.length - 1].id + 1 : 1;
//         users.push(newUser);
//         await writeData('users.json', users);
//         console.log(newUser);
//         res.status(201).json(newUser);
//     }
// });

// // Login
// app.post('/login', async (req, res) => {
//     console.log('login', req.body);
//     const { username, password } = req.body;
//     const users = await readData('users.json');
//     const user = users.find(u => u.username === username && u.password === password);

//     if (user) {
//         res.json(user);
//     } else {
//         console.error('Invalid username or password');
//         res.status(401).json({ error: 'Invalid username or password' });
//     }
// });

// // Get all blogs
// app.get('/blogs', async (req, res) => {
//     console.log('blogs', req.body);
//     const blogs = await readData('blogs.json');
//     res.json(blogs);
// });

// // Get blog by ID
// app.get('/blogs/:id', async (req, res) => {
//     console.log('blogs', req.params);
//     const blogId = parseInt(req.params.id);
//     const blogs = await readData('blogs.json');
//     const blog = blogs.find(b => b.id === blogId);

//     if (blog) {
//         res.json(blog);
//     } else {
//         console.error('Blog not found');
//         res.status(404).json({ error: 'Blog not found' });
//     }
// });

// // get writer by id
// app.get('/writers/:id', async (req, res) => {
//     console.log('writers', req.params);
//     const userId = parseInt(req.params.id);
//     const users = await readData('users.json');
//     const user = users.find(u => u.id === userId);
//     if (user) {
//         res.json(user);
//     } else {
//         console.log('User not found');
//         res.status(404).json({ error: 'User not found' });
//     }
// });

// // Write a new blog
// app.post('/blogs', async (req, res) => {
//     console.log('blogs', req.body);
//     const newBlog = new Blog(req.body);
//     const blogs = await readData('blogs.json');
//     newBlog.id = blogs.length ? blogs[blogs.length - 1].id + 1 : 1;
//     blogs.push(newBlog);
//     await writeData('blogs.json', blogs);
//     res.status(201).json(newBlog);
// });

// // Get comments by blog ID
// app.get('/blogs/:id/comments', async (req, res) => {
//     console.log('blogs', req.params);
//     const blogId = parseInt(req.params.id);
//     const comments = await readData('comments.json');
//     const blogComments = comments.filter(comment => comment.blogId === blogId);
//     console.log(blogComments.length);
//     res.json(blogComments);
// });

// // Write a new comment
// app.post('/comments', async (req, res) => {
//     console.log('comments', req.body);
//     try {
//         const comments = await readData('comments.json');
//         const newComment = {
//             id: comments.length > 0 ? comments[comments.length - 1].id + 1 : 1,
//             ...req.body,
//         };

//         comments.push(newComment);
//         await writeData('comments.json', comments);

//         res.status(201).json(newComment);
//     } catch (error) {
//         console.error('Error writing comment:', error);
//         res.status(500).json({ error: 'Failed to write comment' });
//     }
// });


// // Update user profile by ID
// app.put('/users/:id', async (req, res) => {
//     const userId = parseInt(req.params.id);
//     const updatedUserData = req.body;
//     try {
//         const users = await readData('users.json');
//         const index = users.findIndex(u => u.id === userId);

//         if (index === -1) {
//             throw new Error('User not found');
//         }

//         users[index] = { ...users[index], ...updatedUserData };

//         await writeData('users.json', users);

//         res.json(users[index]);
//     } catch (error) {
//         console.error('Error updating user profile:', error);
//         res.status(500).json({ error: 'Failed to update user profile' });
//     }
// });


// // Start the server
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });

