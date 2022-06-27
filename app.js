if (process.env.NODE_ENV != "production") {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const cluster = require("cluster");
const totalCPUs = require("os").cpus().length;
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const path = require('path')
const cookieParser = require('cookie-parser');
const ExpressError = require('./utils/ExpressError');
const catchAsync = require('./utils/catchAsync');

const User = require('./models/user');
const userRoutes = require('./routes/users');
const dbUrl = process.env.DB_URL;

mongoose.connect(dbUrl);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
    console.log("Database Connected!");
});

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({
    extended: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

const secret = process.env.SESSION_SECRET || 'dr@#!h@!y137125%4#@ktvkhIA#$@JHjhgJg4Nkv2&hw423%Sn6f56466t7a6#4b78AN78554434#%#'

const store = new MongoStore({
    url: dbUrl,
    secret,
    touchAfter: 24 * 3600
});

store.on('error', () => {
    console.log("Session Store Error.")
});

const sessionConfig = {
    store,
    secret,
    name: 'sessionId',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(cookieParser());
app.use(session(sessionConfig));
app.use(flash());

app.use(async (req, res, next) => {
    const user = await User.findById(req.session.user);
    res.locals.loggedUser = user;
    if (!['/home', '/login', '/signup', '/logout'].includes(req.originalUrl) && req.originalMethod === "GET") {
        res.cookie('returnTo', req.originalUrl, {
            maxAge: 900000,
            httpOnly: true
        });
    }
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.warning = req.flash('warning');
    res.locals.info = req.flash('info');
    next();
});

app.use('/', userRoutes);

app.get('/', async (req, res) => {
    const {
        name
    } = req.query
    let users = {};
    if (name) {
        let nameArr = [];
        if (name.indexOf(" ") >= 0) {
            nameArr = name.split(" ");
        } else {
            nameArr.push(name);
        }
        if(req.session.user) {
            const user = await User.findById(req.session.user);
            users = await User.find({
                $or: [{
                    firstName: {
                        $in: nameArr
                    }
                }, {
                    lastName: {
                        $in: nameArr
                    }
                }, {
                    prefName: {
                        $in: nameArr
                    }
                }, {
                    email: {
                        $in: nameArr
                    }
                }],
                'account.approved': true,
                $or: [
                    {'account.private': false},
                    {$and: [{'account.private': true}, {pals: `${user.email.split("@")[0]}`}]}
                ]
            });
        } else {
            users = await User.find({
                $or: [{
                    firstName: {
                        $in: nameArr
                    }
                }, {
                    lastName: {
                        $in: nameArr
                    }
                }, {
                    prefName: {
                        $in: nameArr
                    }
                }, {
                    email: {
                        $in: nameArr
                    }
                }],
                'account.approved': true,
                'account.private': false
            });
        }
    }
    const message = process.env.MESSAGE;
    const submessage = process.env.SUB_MESSAGE;
    res.render('user/home', {
        users, message, submessage
    });
});

app.all('*', (req, res, next) => {
    next(new ExpressError("Page Not Found", 400));
});

app.use((err, req, res, next) => {
    const {
        statusCode = 500, message = "Something went wrong"
    } = err;
    if (!err.message) err.message = 'Something went wrong';
    res.status(statusCode).render('error', {
        err
    });
});

if (cluster.isMaster) {
    console.log(`Number of CPUs is ${totalCPUs}`);
    console.log(`Master ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < totalCPUs; i++) {
        cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
        console.log("Let's fork another worker!");
        cluster.fork();
    });
} else {
    console.log(`Worker ${process.pid} started`);
}
const port = process.env.PORT
app.listen(port, () => {
    console.log(`Serving on port ${port}.`);
});